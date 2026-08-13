import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  AppData,
  CoachMessage,
  DailyCheckIn,
  MealLog,
  ReminderSettings,
  SymptomLog,
  UserProfile,
  WorkoutLog,
} from '../types'
import { clearData, createEmptyData, loadData, saveData } from '../data/storage'
import { newId } from '../data/date'
import { syncConfigured as isSyncConfigured } from '../data/supabaseClient'
import {
  currentSession,
  decideMerge,
  deleteRemote,
  getLocalUpdatedAt,
  pullRemote,
  pushRemote,
  requestPasswordReset as syncRequestPasswordReset,
  signIn as syncSignIn,
  signOut as syncSignOut,
  signUp as syncSignUp,
  touchLocalUpdatedAt,
  updatePassword as syncUpdatePassword,
} from '../data/sync'
import { AppContext } from './AppContext'
import type { AuthResult, CycleEntryInput, SyncStatus } from './AppContext'

/** How long to wait after the last edit before pushing to the sync server. */
const PUSH_DEBOUNCE_MS = 2000

export default function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)

  const [session, setSession] = useState<{ userId: string; email: string } | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('signed-out')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Every log helper goes through here. */
  function update(change: (current: AppData) => AppData) {
    setData((current) => change(current))
  }

  // Persist locally on every change — this stays the fast, always-available
  // source of truth regardless of sync state.
  useEffect(() => {
    saveData(data)
    touchLocalUpdatedAt()
  }, [data])

  // Once signed in and settled, mirror local changes to the sync server,
  // debounced so a burst of edits (typing in a form) doesn't fire a request
  // per keystroke.
  useEffect(() => {
    if (!session || syncStatus !== 'synced') return

    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      const ok = await pushRemote(session.userId, data)
      setLastSyncedAt(ok ? new Date().toISOString() : lastSyncedAt)
      if (!ok) setSyncError('Could not reach the sync server. Your changes are saved on this device.')
    }, PUSH_DEBOUNCE_MS)

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, session, syncStatus])

  // Pick up an existing session (already signed in on this device from a
  // previous visit) and pull whatever the other device last saved.
  useEffect(() => {
    if (!isSyncConfigured()) return
    currentSession()
      .then((existing) => {
        if (existing?.user.email) {
          runMergeCheck(existing.user.id, existing.user.email)
        }
      })
      .catch(() => {
        // Unreachable or misconfigured — the app carries on local-only.
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runMergeCheck(userId: string, email: string) {
    setSyncStatus('checking')
    setSyncError(null)
    setSession({ userId, email })

    const remote = await pullRemote(userId)
    const decision = decideMerge(remote, getLocalUpdatedAt())

    if (decision.action === 'first-sync') {
      setSyncStatus('awaiting-first-sync-confirmation')
      return
    }

    if (decision.action === 'use-remote') {
      setData(decision.data)
      touchLocalUpdatedAt()
    } else {
      await pushRemote(userId, data)
    }
    setSyncStatus('synced')
    setLastSyncedAt(new Date().toISOString())
  }

  async function signUp(email: string, password: string): Promise<AuthResult> {
    const result = await syncSignUp(email, password)
    if (!result.ok) return result

    const opened = await currentSession()
    // Supabase may require email confirmation before a session exists — if
    // so there is nothing to sync yet, and Settings tells the user why.
    if (!opened) return { ok: true, needsConfirmation: true }

    await runMergeCheck(opened.user.id, opened.user.email ?? email)
    return result
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const result = await syncSignIn(email, password)
    if (result.ok) {
      const opened = await currentSession()
      if (opened) await runMergeCheck(opened.user.id, opened.user.email ?? email)
    }
    return result
  }

  async function signOut() {
    await syncSignOut()
    setSession(null)
    setSyncStatus('signed-out')
    setSyncError(null)
    setLastSyncedAt(null)
  }

  async function confirmFirstSync() {
    if (!session) return
    setSyncStatus('syncing')
    const ok = await pushRemote(session.userId, data)
    touchLocalUpdatedAt()
    setSyncStatus(ok ? 'synced' : 'error')
    if (ok) setLastSyncedAt(new Date().toISOString())
    else setSyncError('Could not reach the sync server. Try again from Settings.')
  }

  async function requestPasswordReset(email: string): Promise<AuthResult> {
    return syncRequestPasswordReset(email)
  }

  async function updatePassword(newPassword: string): Promise<AuthResult> {
    const result = await syncUpdatePassword(newPassword)
    if (result.ok) {
      // Clicking the reset link opens a recovery session — treat it like a
      // fresh sign-in so this device merges/syncs the same as any other.
      const opened = await currentSession()
      if (opened?.user.email) await runMergeCheck(opened.user.id, opened.user.email)
    }
    return result
  }

  function saveProfile(profile: UserProfile) {
    update((current) => ({ ...current, profile }))
  }

  function saveCycleEntry(entry: CycleEntryInput) {
    update((current) => ({
      ...current,
      // Drop anything already logged for this date, then add the new version.
      cycleLogs: [
        ...current.cycleLogs.filter((log) => log.date !== entry.date),
        {
          id: newId(),
          date: entry.date,
          flow: entry.flow,
          notes: entry.notes?.trim() || undefined,
        },
      ],
      symptomLogs: [
        ...current.symptomLogs.filter((log) => log.date !== entry.date),
        ...entry.symptoms.map(
          (s): SymptomLog => ({
            id: newId(),
            date: entry.date,
            symptom: s.symptom,
            severity: s.severity,
          }),
        ),
      ],
    }))
  }

  function deleteCycleEntry(date: string) {
    update((current) => ({
      ...current,
      cycleLogs: current.cycleLogs.filter((log) => log.date !== date),
      symptomLogs: current.symptomLogs.filter((log) => log.date !== date),
    }))
  }

  function saveCheckIn(checkIn: Omit<DailyCheckIn, 'id'>) {
    update((current) => ({
      ...current,
      checkIns: [
        ...current.checkIns.filter((c) => c.date !== checkIn.date),
        { ...checkIn, id: newId() },
      ],
    }))
  }

  function addWorkoutLog(log: Omit<WorkoutLog, 'id'>) {
    update((current) => ({
      ...current,
      workoutLogs: [...current.workoutLogs, { ...log, id: newId() }],
    }))
  }

  function addMealLog(log: Omit<MealLog, 'id'>) {
    update((current) => ({
      ...current,
      mealLogs: [...current.mealLogs, { ...log, id: newId() }],
    }))
  }

  function deleteWorkoutLog(id: string) {
    update((current) => ({
      ...current,
      workoutLogs: current.workoutLogs.filter((log) => log.id !== id),
    }))
  }

  function deleteMealLog(id: string) {
    update((current) => ({
      ...current,
      mealLogs: current.mealLogs.filter((log) => log.id !== id),
    }))
  }

  function addCoachMessage(message: Omit<CoachMessage, 'id'>) {
    update((current) => ({
      ...current,
      coachMessages: [...current.coachMessages, { ...message, id: newId() }],
    }))
  }

  function clearCoachMessages() {
    update((current) => ({ ...current, coachMessages: [] }))
  }

  function setReminders(reminders: ReminderSettings) {
    update((current) => ({ ...current, reminders }))
  }

  function symptomsOn(date: string) {
    return data.symptomLogs.filter((log) => log.date === date)
  }

  function replaceAllData(imported: AppData) {
    update(() => imported)
  }

  function resetAll() {
    clearData()
    setData(createEmptyData())
    if (session) deleteRemote(session.userId)
  }

  return (
    <AppContext.Provider
      value={{
        ...data,
        saveProfile,
        saveCycleEntry,
        saveCheckIn,
        addWorkoutLog,
        addMealLog,
        deleteWorkoutLog,
        deleteMealLog,
        deleteCycleEntry,
        addCoachMessage,
        clearCoachMessages,
        setReminders,
        symptomsOn,
        replaceAllData,
        resetAll,
        syncConfigured: isSyncConfigured(),
        session,
        syncStatus,
        syncError,
        lastSyncedAt,
        signUp,
        signIn,
        signOut,
        confirmFirstSync,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
