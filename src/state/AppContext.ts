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

  // ---------- App lock ----------

  /** True when a passcode is set and has not been entered this session. */
  locked: boolean
  /** True when a passcode is set and the vault is currently open. */
  lockEnabled: boolean
  /** Resolves false for a wrong passcode. */
  unlock: (passcode: string) => Promise<boolean>
  enableLock: (passcode: string) => Promise<void>
  disableLock: () => void
  lockNow: () => void

  /** Everything logged for one date, for the dashboard. */
  symptomsOn: (date: string) => SymptomLog[]

  /** Replaces everything, for importing a previously exported file. */
  replaceAllData: (data: AppData) => void
  resetAll: () => void
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
  locked: false,
  lockEnabled: false,
  unlock: async () => false,
  enableLock: async () => {},
  disableLock: () => {},
  lockNow: () => {},
  symptomsOn: () => [],
  replaceAllData: () => {},
  resetAll: () => {},
})

/** Use this in any page: const { profile, addMealLog } = useApp() */
export function useApp(): AppState {
  return useContext(AppContext)
}
