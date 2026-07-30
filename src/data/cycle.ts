import type { CycleLog, UserProfile } from '../types'
import { addDays, daysBetween, todayISO } from './date'

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export const PHASE_LABELS: Record<Phase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation window',
  luteal: 'Luteal',
}

/**
 * The first day of the most recent period.
 *
 * Bleeding days that fall close together belong to the SAME period, so we group
 * them and take the earliest day of the latest group. Without this, logging
 * bleeding on day 4 of your period would look like a brand new period starting.
 *
 * The onboarding date counts as a bleeding day too — the user typed it because
 * their period started then.
 */
export function lastPeriodStart(
  profile: UserProfile,
  cycleLogs: CycleLog[],
): string | null {
  const bleedingDates = new Set<string>()

  if (profile.lastPeriodDate) bleedingDates.add(profile.lastPeriodDate)
  for (const log of cycleLogs) {
    if (log.flow !== 'none' && log.flow !== 'spotting') {
      bleedingDates.add(log.date)
    }
  }

  const dates = [...bleedingDates].sort()
  if (dates.length === 0) return null

  // Two bleeding days less than one period-length apart are the same period.
  // Minimum of 2 gives a little slack for days the user forgot to log.
  const samePeriodWindow = Math.max(profile.periodLength, 2)

  let start = dates[dates.length - 1]
  for (let i = dates.length - 2; i >= 0; i--) {
    if (daysBetween(dates[i], start) < samePeriodWindow) {
      start = dates[i]
    } else {
      break
    }
  }

  return start
}

/** Which day of the cycle today is. Day 1 = first day of the period. */
export function cycleDay(
  profile: UserProfile,
  cycleLogs: CycleLog[],
  today = todayISO(),
): number | null {
  const start = lastPeriodStart(profile, cycleLogs)
  if (!start) return null

  const elapsed = daysBetween(start, today)
  if (elapsed < 0) return null

  // Wrap around if more than one cycle has passed since the last logged start.
  return (elapsed % profile.cycleLength) + 1
}

/** Predicted first day of the next period. */
export function nextPeriodDate(
  profile: UserProfile,
  cycleLogs: CycleLog[],
  today = todayISO(),
): string | null {
  const start = lastPeriodStart(profile, cycleLogs)
  if (!start) return null

  let next = start
  // Step forward a cycle at a time until we're past today. Using `<=` rather
  // than `<` stops us telling someone whose period started today that their
  // next period is also today.
  while (next <= today) {
    next = addDays(next, profile.cycleLength)
  }
  return next
}

/**
 * Rough phase for today. Ovulation is estimated at ~14 days before the next
 * period, which is the usual simplification. This is an estimate, not a fact —
 * never present it as certainty, especially on irregular cycles.
 */
export function currentPhase(
  profile: UserProfile,
  cycleLogs: CycleLog[],
  today = todayISO(),
): Phase | null {
  const day = cycleDay(profile, cycleLogs, today)
  if (day === null) return null

  if (day <= profile.periodLength) return 'menstrual'

  const ovulationDay = profile.cycleLength - 14
  if (day >= ovulationDay - 1 && day <= ovulationDay + 1) return 'ovulation'
  if (day < ovulationDay) return 'follicular'
  return 'luteal'
}
