import type { Equipment, Intensity, UserProfile, WorkoutLog } from '../types'
import type { Exercise, Focus } from '../data/exercises'
import { availableExercises, FOCUS_LABELS } from '../data/exercises'
import { fromISODate } from '../data/date'
import type { Phase } from '../data/cycle'
import type { PlannedExercise, Readiness, WorkoutPlan } from './types'

/** How many exercises fit in the time available. */
function exerciseCount(minutes: number, focus: Focus): number {
  // Cardio is one continuous activity, not a list of them.
  if (focus === 'cardio') return 1

  if (minutes <= 15) return 3
  if (minutes <= 30) return 4
  if (minutes <= 45) return 5
  return 6
}

/** Low readiness caps the intensity no matter what the goal says. */
function chooseIntensity(readiness: Readiness): Intensity {
  if (readiness.band === 'low') return 'light'
  if (readiness.band === 'moderate') return 'moderate'
  return 'hard'
}

/**
 * Reads the focus back off a logged workout's type label so we can rotate
 * body parts. We infer rather than store it to avoid migrating old logs.
 */
export function focusFromType(type: string): Focus | null {
  if (type.includes('upper')) return 'upper'
  if (type.includes('lower')) return 'lower'
  if (type.includes('full body')) return 'full-body'
  if (type === 'Cardio') return 'cardio'
  if (type === 'Walk') return 'cardio'
  if (type === 'Yoga' || type === 'Mobility / stretching') return 'recovery'
  return null
}

/** The WORKOUT_TYPES label to pre-fill when logging this session. */
export function typeFromFocus(focus: Focus): string {
  switch (focus) {
    case 'upper':
      return 'Strength — upper body'
    case 'lower':
      return 'Strength — lower body'
    case 'full-body':
    case 'core':
      return 'Strength — full body'
    case 'cardio':
      return 'Cardio'
    case 'recovery':
      return 'Mobility / stretching'
  }
}

function chooseFocus(
  readiness: Readiness,
  phase: Phase | null,
  recentWorkouts: WorkoutLog[],
  minutesAvailable: number,
): Focus {
  // Nothing overrides a body that isn't ready.
  if (readiness.band === 'low') return 'recovery'

  // On your period with less than full readiness, move but don't load heavy.
  if (phase === 'menstrual' && readiness.band !== 'good') return 'cardio'

  // Rotate away from whatever was trained most recently.
  const lastFocus = recentWorkouts
    .map((log) => focusFromType(log.type))
    .find((focus) => focus === 'upper' || focus === 'lower')

  if (lastFocus === 'upper') return 'lower'
  if (lastFocus === 'lower') return 'upper'

  // Short sessions get more done as full body. Uses today's actual free time,
  // not the usual figure from onboarding.
  return minutesAvailable <= 15 ? 'full-body' : 'upper'
}

/** Sets and reps from goal, level and how hard we're going today. */
function prescribe(
  profile: UserProfile,
  focus: Focus,
  intensity: Intensity,
  minutesAvailable: number,
): (exercise: Exercise) => PlannedExercise {
  if (focus === 'cardio') {
    return (exercise) => ({
      name: exercise.name,
      prescription: `${minutesAvailable} minutes at a conversational pace`,
    })
  }

  const baseSets =
    profile.workoutLevel === 'beginner'
      ? 2
      : profile.workoutLevel === 'intermediate'
        ? 3
        : 4

  // Never push volume on a light day.
  const sets = intensity === 'light' ? Math.min(baseSets, 2) : baseSets

  const reps =
    profile.mainGoal === 'muscle-gain'
      ? '8-12'
      : profile.mainGoal === 'fat-loss'
        ? '12-15'
        : '10-12'

  return (exercise) => ({
    name: exercise.name,
    // A fixed cue on the exercise wins — you don't do "3 × 12" of a walk.
    prescription: exercise.prescription
      ? exercise.prescription
      : exercise.isHold
        ? `${sets} × 30 seconds`
        : `${sets} × ${reps}`,
  })
}

/**
 * Rotates the starting point in a pool so the session varies from day to day,
 * while staying identical for any given date — a plan that reshuffled on every
 * re-render would be unusable.
 */
function pickForDay<T>(pool: T[], count: number, date: string): T[] {
  if (pool.length === 0) return []

  const dayNumber = Math.floor(fromISODate(date).getTime() / 86400000)
  const offset = ((dayNumber % pool.length) + pool.length) % pool.length

  // Walk the pool cyclically from the offset.
  return Array.from(
    { length: Math.min(count, pool.length) },
    (_, i) => pool[(offset + i) % pool.length],
  )
}

/**
 * Fills the session from the best equipment the user owns, dropping to lower
 * tiers only to make up the numbers.
 *
 * Rotating across the whole pool instead would mean a dumbbell owner getting
 * an all-push-up session on most days, which defeats the point of asking about
 * equipment at all.
 */
function selectExercises(
  focus: Focus,
  equipment: Equipment,
  allowHighImpact: boolean,
  count: number,
  date: string,
): Exercise[] {
  // Already sorted best-equipment-first.
  const all = availableExercises(focus, equipment, allowHighImpact)

  // Group into equipment tiers, keeping that descending order.
  const tiers: Exercise[][] = []
  for (const exercise of all) {
    const currentTier = tiers[tiers.length - 1]
    if (currentTier && currentTier[0].requires === exercise.requires) {
      currentTier.push(exercise)
    } else {
      tiers.push([exercise])
    }
  }

  const chosen: Exercise[] = []
  for (const tier of tiers) {
    if (chosen.length >= count) break
    chosen.push(...pickForDay(tier, count - chosen.length, date))
  }
  return chosen
}

export function buildWorkout(
  profile: UserProfile,
  readiness: Readiness,
  phase: Phase | null,
  recentWorkouts: WorkoutLog[],
  minutesAvailable: number,
  date: string,
): WorkoutPlan {
  const focus = chooseFocus(readiness, phase, recentWorkouts, minutesAvailable)
  const intensity = chooseIntensity(readiness)

  // No jumping when readiness is down or an injury is on file.
  const allowHighImpact =
    readiness.band === 'good' && !profile.healthConditions.includes('Injury')

  const count = exerciseCount(minutesAvailable, focus)
  const toPlanned = prescribe(profile, focus, intensity, minutesAvailable)

  const exercises = selectExercises(
    focus,
    profile.equipment,
    allowHighImpact,
    count,
    date,
  ).map(toPlanned)

  return {
    focus,
    title: `${minutesAvailable}-minute ${FOCUS_LABELS[focus].toLowerCase()} session`,
    durationMinutes: minutesAvailable,
    intensity,
    exercises,
    note: workoutNote(focus, readiness, phase, profile),
  }
}

function workoutNote(
  focus: Focus,
  readiness: Readiness,
  phase: Phase | null,
  profile: UserProfile,
): string {
  if (focus === 'recovery') {
    return 'Readiness is low today. This is recovery, not a workout you can fail.'
  }
  if (focus === 'cardio' && phase === 'menstrual') {
    return 'Period week. Keep moving, skip the heavy loading.'
  }
  if (readiness.band === 'moderate') {
    return 'Moderate day. Stop two reps short of failure on everything.'
  }
  if (profile.mainGoal === 'muscle-gain' && profile.equipment === 'bodyweight') {
    return 'Good day to push. Bodyweight only limits progress here — slow the tempo down to make it harder.'
  }
  return 'Good day to push. Add load or reps over last time.'
}
