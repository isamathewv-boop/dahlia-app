import type { CycleLog, Goal, UserProfile } from '../types'
import type { Focus } from '../data/exercises'
import { addDays, todayISO } from '../data/date'
import { currentPhase } from '../data/cycle'
import { primaryGoal } from './goals'

export interface PlannedDay {
  date: string
  focus: Focus
  minutes: number
  /** Set when the cycle changed what the pattern originally asked for. */
  adjustedFor?: string
}

/**
 * A repeating weekly shape per goal. Every pattern includes at least two
 * recovery days — a plan with no rest in it is a plan nobody finishes.
 */
const PATTERNS: Record<Goal, Focus[]> = {
  'fat-loss': [
    'lower',
    'cardio',
    'upper',
    'recovery',
    'full-body',
    'cardio',
    'recovery',
  ],
  'muscle-gain': [
    'upper',
    'lower',
    'recovery',
    'upper',
    'lower',
    'core',
    'recovery',
  ],
  maintenance: [
    'full-body',
    'cardio',
    'recovery',
    'upper',
    'recovery',
    'lower',
    'recovery',
  ],
  energy: [
    'cardio',
    'recovery',
    'full-body',
    'recovery',
    'cardio',
    'core',
    'recovery',
  ],
  'hormone-support': [
    'lower',
    'recovery',
    'cardio',
    'upper',
    'recovery',
    'core',
    'recovery',
  ],
  // Consistency over intensity: gentler, more recovery, no forced heavy days.
  'overall-wellbeing': [
    'full-body',
    'recovery',
    'cardio',
    'recovery',
    'full-body',
    'recovery',
    'recovery',
  ],
}

/** Heavy loading that gets softened on period days. */
const HEAVY: Focus[] = ['lower', 'full-body']

/**
 * Recovery days are short by nature — nobody wants 45 minutes of stretching
 * on a rest day, and prescribing it makes the whole week look unserious.
 */
const RECOVERY_CAP_MINUTES = 20

function minutesFor(focus: Focus, timeAvailable: number): number {
  return focus === 'recovery'
    ? Math.min(timeAvailable, RECOVERY_CAP_MINUTES)
    : timeAvailable
}

/**
 * The next seven days, shaped by goal and softened where it collides with a
 * predicted period. This is a shape, not a promise — the daily plan still
 * overrides it based on how she actually feels that morning.
 */
export function buildWeek(
  profile: UserProfile,
  cycleLogs: CycleLog[],
  startDate = todayISO(),
): PlannedDay[] {
  return PATTERNS[primaryGoal(profile)].map((focus, index) => {
    const date = addDays(startDate, index)
    const phase = currentPhase(profile, cycleLogs, date)

    if (phase === 'menstrual' && HEAVY.includes(focus)) {
      return {
        date,
        focus: 'cardio',
        minutes: minutesFor('cardio', profile.timeAvailable),
        adjustedFor: 'period',
      }
    }

    return { date, focus, minutes: minutesFor(focus, profile.timeAvailable) }
  })
}
