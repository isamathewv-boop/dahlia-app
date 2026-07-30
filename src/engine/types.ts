import type { Intensity } from '../types'
import type { Focus } from '../data/exercises'
import type { Phase } from '../data/cycle'

export type ReadinessBand = 'low' | 'moderate' | 'good'

/** How ready the body is today, and the reasons behind it. */
export interface Readiness {
  score: number // 0-100
  band: ReadinessBand
  /** Plain statements of what pulled the score down. Dahlia speaks from these. */
  reasons: string[]
}

export interface PlannedExercise {
  name: string
  /** e.g. "3 × 10" or "5 minutes". */
  prescription: string
}

export interface WorkoutPlan {
  focus: Focus
  title: string
  durationMinutes: number
  intensity: Intensity
  exercises: PlannedExercise[]
  /** Why this session, in one line. */
  note: string
}

export interface NutritionPlan {
  headline: string
  points: string[]
}

export interface Adherence {
  completedLast7Days: number
  /** null when nothing has ever been logged. */
  daysSinceLastWorkout: number | null
  /** True after 3+ days with no workout — switch to re-entry, not guilt. */
  reentryMode: boolean
  mealsLoggedToday: number
}

/** Everything the app decided about today. Tone comes later (Step 4). */
export interface DailyPlan {
  date: string
  cycleDay: number | null
  phase: Phase | null
  readiness: Readiness
  workout: WorkoutPlan
  nutrition: NutritionPlan
  /** Safety notes and escalations. Never overridden by motivation. */
  safety: string[]
  adherence: Adherence
  /** The single next thing to do. */
  nextAction: string
}
