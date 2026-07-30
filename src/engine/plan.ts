import type { AppData, UserProfile } from '../types'
import { addDays, daysBetween, todayISO } from '../data/date'
import { currentPhase, cycleDay } from '../data/cycle'
import { computeReadiness } from './readiness'
import { buildWorkout } from './workout'
import { buildNutrition } from './nutrition'
import { buildSafety } from './safety'
import type { Adherence, DailyPlan } from './types'

export function computeAdherence(data: AppData, today = todayISO()): Adherence {
  const weekAgo = addDays(today, -7)

  const completed = data.workoutLogs.filter((log) => log.completed)

  const completedLast7Days = completed.filter((log) => log.date >= weekAgo).length

  const mostRecent = completed
    .map((log) => log.date)
    .sort()
    .pop()

  const daysSinceLastWorkout = mostRecent ? daysBetween(mostRecent, today) : null

  return {
    completedLast7Days,
    daysSinceLastWorkout,
    // Only re-entry if they have trained before and then stopped.
    reentryMode: daysSinceLastWorkout !== null && daysSinceLastWorkout >= 3,
    mealsLoggedToday: data.mealLogs.filter((log) => log.date === today).length,
  }
}

/**
 * The whole decision layer for today, in one object.
 *
 * Order matters: readiness is computed first because the workout, the food
 * guidance and the next action all bend to it.
 */
export function buildDailyPlan(
  profile: UserProfile,
  data: AppData,
  today = todayISO(),
): DailyPlan {
  const day = cycleDay(profile, data.cycleLogs, today)
  const phase = currentPhase(profile, data.cycleLogs, today)

  const checkIn = data.checkIns.find((c) => c.date === today)
  const todaysSymptoms = data.symptomLogs.filter((log) => log.date === today)

  const readiness = computeReadiness(checkIn, todaysSymptoms, phase)

  // Today's actual free time beats the profile's usual figure.
  const minutesAvailable = checkIn?.minutesAvailable ?? profile.timeAvailable

  // Newest first, so the workout engine can rotate off the last session.
  const recentWorkouts = [...data.workoutLogs].sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  const workout = buildWorkout(
    profile,
    readiness,
    phase,
    recentWorkouts,
    minutesAvailable,
    today,
  )
  const nutrition = buildNutrition(profile, phase, readiness)
  const safety = buildSafety(profile, todaysSymptoms, day)
  const adherence = computeAdherence(data, today)

  return {
    date: today,
    cycleDay: day,
    phase,
    readiness,
    workout,
    nutrition,
    safety,
    adherence,
    nextAction: chooseNextAction(data, today, readiness, workout.title, adherence),
  }
}

/** One concrete thing to do next. Never a list. */
function chooseNextAction(
  data: AppData,
  today: string,
  readiness: { band: string },
  workoutTitle: string,
  adherence: Adherence,
): string {
  const hasCheckIn = data.checkIns.some((c) => c.date === today)
  if (!hasCheckIn) {
    return 'Do your daily check-in so today’s plan is based on real inputs.'
  }

  const trainedToday = data.workoutLogs.some((log) => log.date === today)
  if (!trainedToday) {
    if (adherence.reentryMode) {
      return `You have missed a few days. Do the ${workoutTitle} — getting back in beats making it up.`
    }
    if (readiness.band === 'low') {
      return `Do the ${workoutTitle}. Nothing more today.`
    }
    return `Do the ${workoutTitle}.`
  }

  if (adherence.mealsLoggedToday === 0) {
    return 'Workout is done. Log what you have eaten today.'
  }

  const loggedCycleToday = data.cycleLogs.some((log) => log.date === today)
  if (!loggedCycleToday) {
    return 'Log today’s cycle and symptoms — that is what sharpens tomorrow’s plan.'
  }

  return 'Everything is logged. Nothing else needed today.'
}
