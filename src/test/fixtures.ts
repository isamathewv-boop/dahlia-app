import type {
  AppData,
  CycleLog,
  DailyCheckIn,
  Flow,
  Intensity,
  MealLog,
  Severity,
  Symptom,
  SymptomLog,
  TimeAvailable,
  UserProfile,
  WorkoutLog,
} from '../types'
import { createEmptyData } from '../data/storage'

/** A plain, unremarkable profile. Override only what a test cares about. */
export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: 'Test',
    mainGoal: 'fat-loss',
    workoutLevel: 'intermediate',
    timeAvailable: 30,
    equipment: 'bodyweight',
    dietPreference: '',
    healthConditions: [],
    coachTone: 'strict',
    lastPeriodDate: '2026-07-01',
    cycleLength: 28,
    periodLength: 5,
    irregularCycles: false,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeData(overrides: Partial<AppData> = {}): AppData {
  return { ...createEmptyData(), ...overrides }
}

export function cycleLog(date: string, flow: Flow): CycleLog {
  return { id: `cycle-${date}`, date, flow }
}

export function symptomLog(
  date: string,
  symptom: Symptom,
  severity: Severity,
): SymptomLog {
  return { id: `sym-${date}-${symptom}`, date, symptom, severity }
}

export function workoutLog(
  date: string,
  overrides: Partial<WorkoutLog> = {},
): WorkoutLog {
  return {
    id: `workout-${date}-${overrides.type ?? 'x'}`,
    date,
    type: 'Strength — upper body',
    durationMinutes: 30,
    intensity: 'moderate' as Intensity,
    completed: true,
    ...overrides,
  }
}

export function mealLog(date: string, overrides: Partial<MealLog> = {}): MealLog {
  return {
    id: `meal-${date}-${overrides.slot ?? 'breakfast'}`,
    date,
    slot: 'breakfast',
    description: 'oats',
    ...overrides,
  }
}

/** A neutral check-in: nothing wrong, nothing special. */
export function checkIn(
  date: string,
  overrides: Partial<DailyCheckIn> = {},
): DailyCheckIn {
  return {
    id: `checkin-${date}`,
    date,
    sleepHours: 8,
    energy: 4 as Severity,
    soreness: 1 as Severity,
    minutesAvailable: 30 as TimeAvailable,
    ...overrides,
  }
}
