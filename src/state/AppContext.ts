import { createContext, useContext } from 'react'
import type {
  AppData,
  CoachMessage,
  DailyCheckIn,
  Flow,
  MealLog,
  ReminderSettings,
  Severity,
  Symptom,
  SymptomLog,
  UserProfile,
  WorkoutLog,
} from '../types'
import { createEmptyData } from '../data/storage'

/** What the Cycle page sends when the user saves one day. */
export interface CycleEntryInput {
  date: string
  flow: Flow
  notes?: string
  symptoms: { symptom: Symptom; severity: Severity }[]
}

export type SyncStatus =
  | 'signed-out'
  | 'checking'
  | 'awaiting-first-sync-confirmation'
  | 'syncing'
  | 'synced'
  | 'error'

export interface AuthResult {
  ok: boolean
  error?: string
  /** Sign-up succeeded but Supabase is holding the session until the user confirms their email. */
  needsConfirmation?: boolean
}

/**
 * `Omit<WorkoutLog, 'id'>` means "a WorkoutLog without the id field" — the
 * store generates ids so pages never have to.
 */
export interface AppState extends AppData {
  saveProfile: (profile: UserProfile) => void

  /** Replaces whatever was logged for that date. One entry per day. */
  saveCycleEntry: (entry: CycleEntryInput) => void
  /** Replaces the check-in for that date. One per day. */
  saveCheckIn: (checkIn: Omit<DailyCheckIn, 'id'>) => void

  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => void
  addMealLog: (log: Omit<MealLog, 'id'>) => void

  deleteWorkoutLog: (id: string) => void
  deleteMealLog: (id: string) => void
  deleteCycleEntry: (date: string) => void

  addCoachMessage: (message: Omit<CoachMessage, 'id'>) => void
  clearCoachMessages: () => void

  setReminders: (settings: ReminderSettings) => void

  /** Everything logged for one date, for the dashboard. */
  symptomsOn: (date: string) => SymptomLog[]

  /** Replaces everything, for importing a previously exported file. */
  replaceAllData: (data: AppData) => void
  resetAll: () => void

  // ---------- Sync (opt-in, see data/sync.ts) ----------

  /** False when this deployment has no Supabase project wired up at all. */
  syncConfigured: boolean
  session: { userId: string; email: string } | null
  syncStatus: SyncStatus
  syncError: string | null
  lastSyncedAt: string | null
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  /** First sync only: uploads this device's current data after the user explicitly agrees to it. */
  confirmFirstSync: () => Promise<void>
}

export const AppContext = createContext<AppState>({
  ...createEmptyData(),
  saveProfile: () => {},
  saveCycleEntry: () => {},
  saveCheckIn: () => {},
  addWorkoutLog: () => {},
  addMealLog: () => {},
  deleteWorkoutLog: () => {},
  deleteMealLog: () => {},
  deleteCycleEntry: () => {},
  addCoachMessage: () => {},
  clearCoachMessages: () => {},
  setReminders: () => {},
  symptomsOn: () => [],
  replaceAllData: () => {},
  resetAll: () => {},
  syncConfigured: false,
  session: null,
  syncStatus: 'signed-out',
  syncError: null,
  lastSyncedAt: null,
  signUp: async () => ({ ok: false, error: 'Not available.' }),
  signIn: async () => ({ ok: false, error: 'Not available.' }),
  signOut: async () => {},
  confirmFirstSync: async () => {},
})

/** Use this in any page: const { profile, addMealLog } = useApp() */
export function useApp(): AppState {
  return useContext(AppContext)
}
