import type { CycleLog, UserProfile } from '../types'
import { addDays, daysBetween, todayISO } from './date'

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export const PHASE_LABELS: Record<Phase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation window',
  luteal: 'Luteal',
}

/** A small, decorative colour cue per phase — never the only way the phase is conveyed. */
export const PHASE_COLORS: Record<Phase, string> = {
  menstrual: 'var(--phase-menstrual)',
  follicular: 'var(--phase-follicular)',
  ovulation: 'var(--phase-ovulation)',
  luteal: 'var(--phase-luteal)',
}

/** One period, as far as the logs can tell. */
export interface PeriodSpan {
  start: string
  /** Last bleeding day logged for this period. Equals start if only one. */
  end: string
  /** How many days were actually logged, as opposed to spanned. */
  loggedDays: number
}

/**
 * Every period the logs describe, oldest first.
 *
 * Bleeding days that fall close together belong to the SAME period. Without
 * this grouping, logging bleeding on day 4 would look like a new period
 * starting. The onboarding date counts as a bleeding day too — she typed it
 * because her period started then.
 */
export function periodSpans(
  profile: UserProfile,
  cycleLogs: CycleLog[],
): PeriodSpan[] {
  const bleedingDates = new Set<string>()

  if (profile.lastPeriodDate) bleedingDates.add(profile.lastPeriodDate)
  for (const log of cycleLogs) {
    if (log.flow !== 'none' && log.flow !== 'spotting') {
      bleedingDates.add(log.date)
    }
  }

  const dates = [...bleedingDates].sort()
  if (dates.length === 0) return []

  // Two bleeding days less than one period-length apart are the same period.
  // Minimum of 2 gives a little slack for days she forgot to log.
  const samePeriodWindow = Math.max(profile.periodLength, 2)

  const spans: PeriodSpan[] = [
    { start: dates[0], end: dates[0], loggedDays: 1 },
  ]

  for (let i = 1; i < dates.length; i++) {
    const current = spans[spans.length - 1]

    if (daysBetween(dates[i - 1], dates[i]) < samePeriodWindow) {
      current.end = dates[i]
      current.loggedDays += 1
    } else {
      spans.push({ start: dates[i], end: dates[i], loggedDays: 1 })
    }
  }

  return spans
}

/** The first day of the most recent period. */
export function lastPeriodStart(
  profile: UserProfile,
  cycleLogs: CycleLog[],
): string | null {
  const spans = periodSpans(profile, cycleLogs)
  return spans.length > 0 ? spans[spans.length - 1].start : null
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
