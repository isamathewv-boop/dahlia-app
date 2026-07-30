import type { Equipment } from '../types'

export type Focus =
  | 'recovery'
  | 'upper'
  | 'lower'
  | 'full-body'
  | 'core'
  | 'cardio'

export const FOCUS_LABELS: Record<Focus, string> = {
  recovery: 'Recovery',
  upper: 'Upper body',
  lower: 'Lower body',
  'full-body': 'Full body',
  core: 'Core',
  cardio: 'Cardio',
}

/** Equipment is cumulative: a full gym can do everything bodyweight can. */
const EQUIPMENT_RANK: Record<Equipment, number> = {
  bodyweight: 0,
  bands: 1,
  dumbbells: 2,
  'full-gym': 3,
}

export interface Exercise {
  name: string
  focus: Focus
  /** The least equipment needed to do this at all. */
  requires: Equipment
  /** Jumping or pounding. Skipped on low-readiness days and with injuries. */
  highImpact?: boolean
  /**
   * A fixed cue, for anything where sets-and-reps makes no sense — you do not
   * do "3 × 12" of a walk.
   */
  prescription?: string
  /** Measured in seconds held rather than reps. Still scales with level. */
  isHold?: boolean
}

export const EXERCISES: Exercise[] = [
  // Recovery — always available, never high impact. Each carries its own cue.
  {
    name: 'Easy walk',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: '10-15 minutes, easy pace',
  },
  {
    name: 'Full-body stretch',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: '5 minutes, slow',
  },
  {
    name: 'Cat-cow',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: '10 slow reps',
  },
  {
    name: "Child's pose",
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: 'hold 60 seconds',
  },
  {
    name: 'Hip flexor stretch',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: 'hold 45 seconds each side',
  },
  {
    name: 'Legs up the wall',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: 'hold 3-5 minutes',
  },
  {
    name: 'Slow breathing',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: '5 minutes',
  },

  // Upper
  { name: 'Incline push-up', focus: 'upper', requires: 'bodyweight' },
  { name: 'Push-up', focus: 'upper', requires: 'bodyweight' },
  { name: 'Superman', focus: 'upper', requires: 'bodyweight', isHold: true },
  { name: 'Plank shoulder tap', focus: 'upper', requires: 'bodyweight' },
  { name: 'Band row', focus: 'upper', requires: 'bands' },
  { name: 'Band pull-apart', focus: 'upper', requires: 'bands' },
  { name: 'Band overhead press', focus: 'upper', requires: 'bands' },
  { name: 'Dumbbell shoulder press', focus: 'upper', requires: 'dumbbells' },
  { name: 'Dumbbell row', focus: 'upper', requires: 'dumbbells' },
  { name: 'Dumbbell chest press', focus: 'upper', requires: 'dumbbells' },
  { name: 'Dumbbell curl', focus: 'upper', requires: 'dumbbells' },
  { name: 'Lat pulldown', focus: 'upper', requires: 'full-gym' },
  { name: 'Cable row', focus: 'upper', requires: 'full-gym' },
  { name: 'Assisted pull-up', focus: 'upper', requires: 'full-gym' },

  // Lower
  { name: 'Bodyweight squat', focus: 'lower', requires: 'bodyweight' },
  { name: 'Glute bridge', focus: 'lower', requires: 'bodyweight' },
  { name: 'Reverse lunge', focus: 'lower', requires: 'bodyweight' },
  { name: 'Wall sit', focus: 'lower', requires: 'bodyweight', isHold: true },
  { name: 'Calf raise', focus: 'lower', requires: 'bodyweight' },
  { name: 'Step-up', focus: 'lower', requires: 'bodyweight' },
  { name: 'Jump squat', focus: 'lower', requires: 'bodyweight', highImpact: true },
  { name: 'Band lateral walk', focus: 'lower', requires: 'bands' },
  { name: 'Band squat', focus: 'lower', requires: 'bands' },
  { name: 'Goblet squat', focus: 'lower', requires: 'dumbbells' },
  { name: 'Romanian deadlift', focus: 'lower', requires: 'dumbbells' },
  { name: 'Split squat', focus: 'lower', requires: 'dumbbells' },
  { name: 'Hip thrust', focus: 'lower', requires: 'full-gym' },
  { name: 'Leg press', focus: 'lower', requires: 'full-gym' },

  // Full body
  { name: 'Squat to reach', focus: 'full-body', requires: 'bodyweight' },
  { name: 'Inchworm', focus: 'full-body', requires: 'bodyweight' },
  { name: 'Bear crawl', focus: 'full-body', requires: 'bodyweight' },
  { name: 'Mountain climber', focus: 'full-body', requires: 'bodyweight' },
  { name: 'Burpee', focus: 'full-body', requires: 'bodyweight', highImpact: true },
  { name: 'Dumbbell thruster', focus: 'full-body', requires: 'dumbbells' },
  { name: 'Dumbbell deadlift to press', focus: 'full-body', requires: 'dumbbells' },
  { name: 'Renegade row', focus: 'full-body', requires: 'dumbbells' },

  // Core
  { name: 'Dead bug', focus: 'core', requires: 'bodyweight' },
  { name: 'Plank', focus: 'core', requires: 'bodyweight', isHold: true },
  { name: 'Side plank', focus: 'core', requires: 'bodyweight', isHold: true },
  { name: 'Bird dog', focus: 'core', requires: 'bodyweight' },
  { name: 'Heel tap', focus: 'core', requires: 'bodyweight' },
  { name: 'Hollow hold', focus: 'core', requires: 'bodyweight', isHold: true },

  // Cardio
  { name: 'Brisk walk', focus: 'cardio', requires: 'bodyweight' },
  { name: 'Stair climb', focus: 'cardio', requires: 'bodyweight' },
  { name: 'Dance', focus: 'cardio', requires: 'bodyweight' },
  { name: 'Shadow boxing', focus: 'cardio', requires: 'bodyweight' },
  { name: 'Jump rope', focus: 'cardio', requires: 'bodyweight', highImpact: true },
  { name: 'Jog', focus: 'cardio', requires: 'bodyweight', highImpact: true },
  { name: 'Stationary bike', focus: 'cardio', requires: 'full-gym' },
  { name: 'Rowing machine', focus: 'cardio', requires: 'full-gym' },
]

/**
 * Exercises the user can actually do, given equipment and impact limits.
 *
 * Sorted best-equipment-first: if someone owns dumbbells, they should be
 * offered dumbbell work before push-ups, not buried under it.
 */
export function availableExercises(
  focus: Focus,
  equipment: Equipment,
  allowHighImpact: boolean,
): Exercise[] {
  return EXERCISES.filter(
    (exercise) =>
      exercise.focus === focus &&
      EQUIPMENT_RANK[exercise.requires] <= EQUIPMENT_RANK[equipment] &&
      (allowHighImpact || !exercise.highImpact),
  ).sort(
    (a, b) => EQUIPMENT_RANK[b.requires] - EQUIPMENT_RANK[a.requires],
  )
}
