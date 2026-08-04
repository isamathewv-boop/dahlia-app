import type { AppData, Symptom, UserProfile } from '../types'
import { addDays, daysBetween, todayISO } from '../data/date'
import { periodSpans } from '../data/cycle'
import { proteinTarget } from './macros'
import type { ProteinTarget } from './macros'

// ---------- Streak ----------

export interface Streak {
  current: number
  longest: number
  lastActiveDate: string | null
}

/**
 * A day counts as active if anything at all was logged on it — a check-in, a
 * workout, a meal or a cycle entry.
 *
 * Deliberately generous. A streak that only counts workouts punishes rest days,
 * which is exactly the wrong incentive in an app that prescribes recovery.
 */
export function activeDates(data: AppData): string[] {
  const dates = new Set<string>()

  for (const log of data.checkIns) dates.add(log.date)
  for (const log of data.workoutLogs) dates.add(log.date)
  for (const log of data.mealLogs) dates.add(log.date)
  for (const log of data.cycleLogs) dates.add(log.date)

  return [...dates].sort()
}

export function computeStreak(data: AppData, today = todayISO()): Streak {
  const dates = activeDates(data).filter((date) => date <= today)

  if (dates.length === 0) {
    return { current: 0, longest: 0, lastActiveDate: null }
  }

  // Longest run of consecutive days anywhere in the history.
  let longest = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) {
      run += 1
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }

  const lastActiveDate = dates[dates.length - 1]

  // The current streak only survives if it reaches today or yesterday —
  // today isn't over yet, so yesterday still counts as unbroken.
  const gapToToday = daysBetween(lastActiveDate, today)
  let current = 0
  if (gapToToday <= 1) {
    current = 1
    for (let i = dates.length - 1; i > 0; i--) {
      if (daysBetween(dates[i - 1], dates[i]) === 1) current += 1
      else break
    }
  }

  return { current, longest, lastActiveDate }
}

// ---------- Windowed stats ----------

export interface WindowStats {
  from: string
  to: string
  days: number
  daysLogged: number
  workoutsCompleted: number
  workoutsAbandoned: number
  workoutMinutes: number
  mealsLogged: number
  daysWithMeals: number
  checkIns: number
  averageSleep: number | null
  averageEnergy: number | null
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  const total = values.reduce((sum, value) => sum + value, 0)
  // One decimal place is as much precision as any of this deserves.
  return Math.round((total / values.length) * 10) / 10
}

/** Stats for the `days`-day window ending today, today included. */
export function windowStats(
  data: AppData,
  days: number,
  today = todayISO(),
): WindowStats {
  const from = addDays(today, -(days - 1))
  const inWindow = (date: string) => date >= from && date <= today

  const workouts = data.workoutLogs.filter((log) => inWindow(log.date))
  const completed = workouts.filter((log) => log.completed)
  const meals = data.mealLogs.filter((log) => inWindow(log.date))
  const checkIns = data.checkIns.filter((log) => inWindow(log.date))

  return {
    from,
    to: today,
    days,
    daysLogged: activeDates(data).filter(inWindow).length,
    workoutsCompleted: completed.length,
    workoutsAbandoned: workouts.length - completed.length,
    workoutMinutes: completed.reduce((sum, log) => sum + log.durationMinutes, 0),
    mealsLogged: meals.length,
    daysWithMeals: new Set(meals.map((log) => log.date)).size,
    checkIns: checkIns.length,
    averageSleep: average(checkIns.map((log) => log.sleepHours)),
    averageEnergy: average(checkIns.map((log) => log.energy)),
  }
}

// ---------- Cycle patterns ----------

export interface SymptomPattern {
  symptom: Symptom
  count: number
  averageSeverity: number
}

export interface CyclePattern {
  /** Gaps between consecutive logged period starts, oldest first. */
  observedCycleLengths: number[]
  averageCycleLength: number | null
  shortestCycle: number | null
  longestCycle: number | null
  averagePeriodLength: number | null
  statedCycleLength: number
  topSymptoms: SymptomPattern[]
  /** How many periods the logs actually describe. */
  periodsLogged: number
  /**
   * True once there are at least two period starts — one period tells you
   * nothing about cycle length, and claiming otherwise would be a lie.
   */
  enoughForCycleLength: boolean
}

export function cyclePattern(
  profile: UserProfile,
  data: AppData,
): CyclePattern {
  const spans = periodSpans(profile, data.cycleLogs)

  const observedCycleLengths: number[] = []
  for (let i = 1; i < spans.length; i++) {
    observedCycleLengths.push(daysBetween(spans[i - 1].start, spans[i].start))
  }

  // Only spans with real logged bleeding days can tell us a period length.
  // A span built purely from the onboarding date spans one day, which would
  // drag the average down to nonsense.
  const measurableSpans = spans.filter((span) => span.loggedDays >= 2)
  const periodLengths = measurableSpans.map(
    (span) => daysBetween(span.start, span.end) + 1,
  )

  // Symptom frequency across everything ever logged.
  const bySymptom = new Map<Symptom, number[]>()
  for (const log of data.symptomLogs) {
    bySymptom.set(log.symptom, [...(bySymptom.get(log.symptom) ?? []), log.severity])
  }

  const topSymptoms: SymptomPattern[] = [...bySymptom.entries()]
    .map(([symptom, severities]) => ({
      symptom,
      count: severities.length,
      averageSeverity: average(severities) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.symptom.localeCompare(b.symptom))
    .slice(0, 5)

  return {
    observedCycleLengths,
    averageCycleLength: average(observedCycleLengths),
    shortestCycle: observedCycleLengths.length
      ? Math.min(...observedCycleLengths)
      : null,
    longestCycle: observedCycleLengths.length
      ? Math.max(...observedCycleLengths)
      : null,
    averagePeriodLength: average(periodLengths),
    statedCycleLength: profile.cycleLength,
    topSymptoms,
    periodsLogged: spans.length,
    enoughForCycleLength: observedCycleLengths.length >= 1,
  }
}

// ---------- Weekly buckets, for the trend bars ----------

export interface WeekBucket {
  from: string
  to: string
  workoutsCompleted: number
  workoutMinutes: number
  daysLogged: number
}

/**
 * The last `weeks` seven-day buckets, oldest first, ending with the week that
 * contains today.
 */
export function weeklyBuckets(
  data: AppData,
  weeks: number,
  today = todayISO(),
): WeekBucket[] {
  const active = activeDates(data)
  const buckets: WeekBucket[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const to = addDays(today, -7 * i)
    const from = addDays(to, -6)
    const inBucket = (date: string) => date >= from && date <= to

    const completed = data.workoutLogs.filter(
      (log) => log.completed && inBucket(log.date),
    )

    buckets.push({
      from,
      to,
      workoutsCompleted: completed.length,
      workoutMinutes: completed.reduce((sum, log) => sum + log.durationMinutes, 0),
      daysLogged: active.filter(inBucket).length,
    })
  }

  return buckets
}

// ---------- Protein over time ----------

export interface ProteinTrend {
  days: number
  /** Days in the window with any protein logged at all. */
  daysLogged: number
  /** Days that reached the bottom of the target range. */
  daysOnTarget: number
  /** Mean protein across the days that had some logged. Null if none did. */
  averageProtein: number | null
  /** Null when there is no weight on file, so no target exists. */
  target: ProteinTarget | null
}

/**
 * How protein has actually gone, rather than what today's plan asked for.
 *
 * Averages only over days with something logged — dividing by seven when four
 * days are blank would report a shortfall that is really a logging gap.
 */
export function proteinTrend(
  profile: UserProfile,
  data: AppData,
  days = 7,
  today = todayISO(),
): ProteinTrend {
  const from = addDays(today, -(days - 1))
  const target = proteinTarget(profile)

  const byDate = new Map<string, number>()
  for (const meal of data.mealLogs) {
    if (meal.date < from || meal.date > today) continue
    const protein = meal.macros?.protein
    if (!protein) continue
    byDate.set(meal.date, (byDate.get(meal.date) ?? 0) + protein)
  }

  const totals = [...byDate.values()]

  return {
    days,
    daysLogged: totals.length,
    daysOnTarget: target
      ? totals.filter((total) => total >= target.low).length
      : 0,
    averageProtein:
      totals.length === 0
        ? null
        : Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length),
    target,
  }
}

// ---------- The whole picture ----------

export interface ProgressSummary {
  streak: Streak
  last7: WindowStats
  last28: WindowStats
  weeks: WeekBucket[]
  cycle: CyclePattern
  protein: ProteinTrend
  /** One honest sentence about the last seven days. */
  takeaway: string
}

function buildTakeaway(
  last7: WindowStats,
  streak: Streak,
  protein: ProteinTrend,
): string {
  if (last7.daysLogged === 0) {
    return 'Nothing logged in the last seven days. The app cannot tell you anything useful until you feed it.'
  }

  if (last7.checkIns === 0) {
    return 'You logged things but never checked in, so every plan this week was guessing at your energy and time.'
  }

  if (last7.workoutsCompleted === 0) {
    return 'No sessions completed this week. One short session beats a perfect plan you did not start.'
  }

  if (last7.workoutsAbandoned >= 2) {
    return `You finished ${last7.workoutsCompleted} and abandoned ${last7.workoutsAbandoned}. That is a sizing problem — shorten the sessions.`
  }

  if (last7.daysWithMeals <= 2) {
    return `${last7.workoutsCompleted} sessions done, but food logged on only ${last7.daysWithMeals} of 7 days. Training is the easy half.`
  }

  // Only worth saying once there is enough logged protein to be a pattern
  // rather than one thin day.
  if (protein.target && protein.daysLogged >= 3 && protein.daysOnTarget === 0) {
    return `Training is happening, but protein hit ${protein.target.low}g on none of the ${protein.daysLogged} days you logged it. That is the thing holding results back.`
  }

  if (streak.current >= 7) {
    return `${streak.current} days unbroken and ${last7.workoutsCompleted} sessions completed. This is what consistent looks like.`
  }

  if (protein.target && protein.daysOnTarget >= 3) {
    return `${last7.workoutsCompleted} sessions, and protein on target ${protein.daysOnTarget} of ${protein.daysLogged} logged days. Both halves are working.`
  }

  return `${last7.workoutsCompleted} sessions and ${last7.daysLogged} days logged. Solid week.`
}

export function buildProgress(
  profile: UserProfile,
  data: AppData,
  today = todayISO(),
): ProgressSummary {
  const streak = computeStreak(data, today)
  const last7 = windowStats(data, 7, today)
  const protein = proteinTrend(profile, data, 7, today)

  return {
    streak,
    last7,
    last28: windowStats(data, 28, today),
    weeks: weeklyBuckets(data, 4, today),
    cycle: cyclePattern(profile, data),
    protein,
    takeaway: buildTakeaway(last7, streak, protein),
  }
}
