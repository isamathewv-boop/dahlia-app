import { useEffect, useState } from 'react'
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
import {
  clearData,
  createEmptyData,
  loadData,
  readRawStorage,
  saveData,
  saveEnvelope,
} from '../data/storage'
import {
  deriveKey,
  encryptWithKey,
  isEncryptedEnvelope,
  newSalt,
  unlockEnvelope,
} from '../data/crypto'
import { newId } from '../data/date'
import { AppContext } from './AppContext'
import type { CycleEntryInput } from './AppContext'

/**
 * Everything about the store's lock state, held together so transitions are
 * atomic. Splitting it across several useState calls risked the save effect
 * firing mid-transition and writing empty data over the encrypted store.
 */
interface Vault {
  status: 'locked' | 'unlocked'
  data: AppData
  /** Present only when app lock is on. Never persisted. */
  key: CryptoKey | null
  salt: Uint8Array | null
}

function initialVault(): Vault {
  const raw = readRawStorage()

  // An envelope means we cannot read anything until a passcode arrives.
  if (isEncryptedEnvelope(raw)) {
    return { status: 'locked', data: createEmptyData(), key: null, salt: null }
  }

  return { status: 'unlocked', data: loadData(), key: null, salt: null }
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [vault, setVault] = useState(initialVault)
  const { data } = vault

  /** Every log helper goes through here, so none of them can drop the key. */
  function update(change: (current: AppData) => AppData) {
    setVault((current) => ({ ...current, data: change(current.data) }))
  }

  // Persist on change — encrypted when locked-enabled, plain otherwise.
  useEffect(() => {
    if (vault.status === 'locked') return // nothing decrypted to write

    if (!vault.key || !vault.salt) {
      saveData(vault.data)
      return
    }

    // An older encryption finishing late must not overwrite a newer one.
    let cancelled = false
    encryptWithKey(vault.key, vault.salt, vault.data).then((envelope) => {
      if (!cancelled) saveEnvelope(envelope)
    })
    return () => {
      cancelled = true
    }
  }, [vault])

  // ---------- Lock control ----------

  async function unlock(passcode: string): Promise<boolean> {
    const raw = readRawStorage()
    if (!isEncryptedEnvelope(raw)) return false

    const opened = await unlockEnvelope(raw, passcode)
    if (!opened) return false

    setVault({
      status: 'unlocked',
      // Merge over a blank slate, so a vault sealed by an older version still
      // gains any fields added since.
      data: { ...createEmptyData(), ...opened.data },
      key: opened.key,
      salt: opened.salt,
    })
    return true
  }

  async function enableLock(passcode: string): Promise<void> {
    const salt = newSalt()
    const key = await deriveKey(passcode, salt)
    setVault((current) => ({ ...current, key, salt }))
  }

  function disableLock(): void {
    // Dropping the key makes the save effect write plain data again.
    setVault((current) => ({ ...current, key: null, salt: null }))
  }

  function lockNow(): void {
    setVault((current) =>
      current.key
        ? { status: 'locked', data: createEmptyData(), key: null, salt: null }
        : current,
    )
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
    // Keeps the current key, so importing into a locked vault stays encrypted.
    update(() => imported)
  }

  function resetAll() {
    clearData()
    // Deleting everything also removes the lock — there is nothing left to
    // protect, and leaving a passcode on an empty vault only confuses.
    setVault({
      status: 'unlocked',
      data: createEmptyData(),
      key: null,
      salt: null,
    })
  }

  return (
    <AppContext.Provider
      value={{
        ...data,
        locked: vault.status === 'locked',
        lockEnabled: vault.key !== null,
        unlock,
        enableLock,
        disableLock,
        lockNow,
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
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
