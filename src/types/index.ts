// All the shapes of data in the app live here.
// Rule: if a field can only be one of a few values, make it a union type
// (like Goal below) instead of `string`. The rule engine in Step 3 can only
// make decisions on values it can predict.

// ---------- Profile (set once during onboarding) ----------

export type Goal =
  | 'fat-loss'
  | 'muscle-gain'
  | 'maintenance'
  | 'energy'
  | 'hormone-support'

export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced'

export type Equipment = 'bodyweight' | 'bands' | 'dumbbells' | 'full-gym'

export type CoachTone = 'strict' | 'balanced' | 'gentle'

/** Minutes the user can realistically train on a normal day. */
export type TimeAvailable = 15 | 30 | 45 | 60

export interface UserProfile {
  name: string
  mainGoal: Goal
  workoutLevel: WorkoutLevel
  timeAvailable: TimeAvailable
  equipment: Equipment
  dietPreference: string
  healthConditions: string[]
  coachTone: CoachTone

  // Cycle basics
  lastPeriodDate: string // YYYY-MM-DD
  cycleLength: number // days between periods, usually 21-35
  periodLength: number // days of bleeding, usually 3-7
  irregularCycles: boolean

  createdAt: string // ISO timestamp
}

// ---------- Daily logs ----------

export type Flow = 'none' | 'spotting' | 'light' | 'medium' | 'heavy'

export interface CycleLog {
  id: string
  date: string // YYYY-MM-DD
  flow: Flow
  notes?: string
}

export type Symptom =
  | 'cramps'
  | 'headache'
  | 'bloating'
  | 'fatigue'
  | 'nausea'
  | 'back-pain'
  | 'breast-tenderness'
  | 'acne'

/** 1 = barely there, 5 = severe. */
export type Severity = 1 | 2 | 3 | 4 | 5

export interface SymptomLog {
  id: string
  date: string
  symptom: Symptom
  severity: Severity
}

export type Intensity = 'light' | 'moderate' | 'hard'

export interface WorkoutLog {
  id: string
  date: string
  type: string
  durationMinutes: number
  intensity: Intensity
  completed: boolean
  notes?: string
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealLog {
  id: string
  date: string
  slot: MealSlot
  description: string
  notes?: string
}

/** The things that change every single day and drive today's plan. */
export interface DailyCheckIn {
  id: string
  date: string
  sleepHours: number
  energy: Severity
  soreness: Severity
  minutesAvailable: TimeAvailable
}

// ---------- Coach ----------

export interface CoachMessage {
  id: string
  sender: 'user' | 'dahlia'
  text: string
  timestamp: string // ISO timestamp
}

// ---------- Reminders ----------

export interface ReminderSettings {
  enabled: boolean
  /** HH:MM local time to nudge for the morning check-in. */
  checkInTime: string
  /** HH:MM local time to nudge if the day has nothing logged. */
  eveningTime: string
  /**
   * `${date}:${kind}` keys already delivered, so a reminder fires once a day
   * rather than on every tick. Pruned to today on each write.
   */
  lastFired: string[]
}

// ---------- Everything the app stores ----------

export interface AppData {
  profile: UserProfile | null
  cycleLogs: CycleLog[]
  symptomLogs: SymptomLog[]
  workoutLogs: WorkoutLog[]
  mealLogs: MealLog[]
  checkIns: DailyCheckIn[]
  coachMessages: CoachMessage[]
  reminders: ReminderSettings
}
