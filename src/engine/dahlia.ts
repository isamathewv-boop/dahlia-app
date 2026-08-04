import type { AppData, CoachTone, UserProfile } from '../types'
import { FOCUS_LABELS } from '../data/exercises'
import { addDays, formatDate, todayISO } from '../data/date'
import { buildDailyPlan } from './plan'
import { buildWorkout } from './workout'
import { computeReadiness } from './readiness'
import { currentPhase } from '../data/cycle'
import { buildWeek } from './week'
import { proteinProgress } from './macros'
import { proteinTrend } from './progress'
import type { DailyPlan, ReadinessBand } from './types'

/**
 * Dahlia is the TONE layer and nothing else.
 *
 * Every decision here already came from the engine. This file only chooses
 * words. That separation is what stops "strict" from turning into "unsafe":
 * a blunt coach still gives the recovery session, she just says it flatly.
 */

// ---------- Tone tables ----------

/**
 * The push line. Note that no tone tells her to train hard on a low-readiness
 * day — strict means blunt, not reckless.
 */
const PUSH: Record<CoachTone, Record<ReadinessBand, string>> = {
  strict: {
    low: 'Low readiness is data, not an excuse. Recovery today — and skipping recovery still counts as skipping.',
    moderate:
      "Middling day. Do the work anyway. You don't need to feel good to be consistent.",
    good: 'No reason to coast today. Show up and make it count.',
  },
  balanced: {
    low: "Today is a recovery day. That's the plan working, not you failing.",
    moderate: 'Decent day. Do what is on the list and leave it there.',
    good: 'Good day to push. Take it.',
  },
  gentle: {
    low: 'Your body is asking for a lighter day. Give it one.',
    moderate: 'You have enough in the tank for the session as written.',
    good: 'You are in good shape today. Enjoy the harder session.',
  },
}

const OPENERS: Record<CoachTone, string> = {
  strict: 'Here is today.',
  balanced: "Here's where you're at today.",
  gentle: 'Here is today, no pressure.',
}

// ---------- Corrections ----------

/**
 * One correction, or none. Never a list — a coach who lists six problems
 * gets ignored. Ordered by what actually blocks progress most.
 */
function chooseCorrection(
  profile: UserProfile,
  data: AppData,
  plan: DailyPlan,
  today: string,
): string | undefined {
  // Sleep caps everything else, so it comes first.
  const recentCheckIns = data.checkIns
    .filter((c) => c.date > addDays(today, -4) && c.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const shortSleep = recentCheckIns.filter((c) => c.sleepHours < 6)
  if (shortSleep.length >= 3) {
    return `Sleep has been under 6 hours on ${shortSleep.length} of your last ${recentCheckIns.length} check-ins. That caps everything else you're doing.`
  }

  if (plan.adherence.reentryMode && plan.adherence.daysSinceLastWorkout !== null) {
    return `${plan.adherence.daysSinceLastWorkout} days since your last session. Not a disaster, but the gap is the problem to solve.`
  }

  // Abandoned sessions suggest the plan is mis-sized, not that she is lazy.
  const abandoned = data.workoutLogs.filter(
    (log) => !log.completed && log.date > addDays(today, -8),
  )
  if (abandoned.length >= 2) {
    return `You have started and dropped ${abandoned.length} sessions this week. That usually means the sessions are too long, not that you are weak — drop your daily minutes and finish them instead.`
  }

  const loggedFoodDays = new Set(
    data.mealLogs
      .filter((log) => log.date > addDays(today, -4) && log.date <= today)
      .map((log) => log.date),
  )
  if (loggedFoodDays.size === 0 && data.mealLogs.length > 0) {
    return "You've stopped logging food. The plan can't work around what it can't see."
  }

  // Reads what was actually eaten, not what the plan asked for. Needs a few
  // days before it counts as a pattern rather than one light day.
  const protein = proteinTrend(profile, data, 7, today)
  if (protein.target && protein.daysLogged >= 3) {
    if (protein.daysOnTarget === 0) {
      return `Protein has missed ${protein.target.low}g on all ${protein.daysLogged} days you logged it, averaging ${protein.averageProtein}g. That gap costs you more than any training tweak.`
    }
    if (protein.daysOnTarget < protein.daysLogged / 2) {
      return `Protein hit target on ${protein.daysOnTarget} of ${protein.daysLogged} logged days. Front-load it at breakfast — that is usually the meal doing the least work.`
    }
  }

  if (!data.checkIns.some((c) => c.date === today)) {
    return 'No check-in today, so this plan is guessing. Thirty seconds fixes that.'
  }

  return undefined
}

// ---------- The daily briefing ----------

export interface Briefing {
  opener: string
  /** Workout and food in one line each. */
  workoutLine: string
  foodLine: string
  correction?: string
  push: string
  nextAction: string
  /** Straight from the safety engine, never reworded by tone. */
  warnings: string[]
}

export function buildBriefing(
  profile: UserProfile,
  data: AppData,
  today = todayISO(),
): Briefing {
  const plan = buildDailyPlan(profile, data, today)
  const tone = profile.coachTone

  // Name the actual number when one exists — "protein first" is advice, but
  // "78g to go" is something she can act on before dinner.
  const progress = proteinProgress(profile, data, today)
  const foodLine =
    progress.verdict === 'no-target'
      ? plan.nutrition.headline
      : `${plan.nutrition.headline} ${progress.message}`

  return {
    opener: OPENERS[tone],
    workoutLine: `${plan.workout.title} — ${plan.workout.note}`,
    foodLine,
    correction: chooseCorrection(profile, data, plan, today),
    push: PUSH[tone][plan.readiness.band],
    nextAction: plan.nextAction,
    warnings: plan.safety,
  }
}

/** The briefing as the paragraph Dahlia actually says in chat. */
export function briefingToText(briefing: Briefing): string {
  const parts = [
    briefing.opener,
    `Training: ${briefing.workoutLine}`,
    `Food: ${briefing.foodLine}`,
  ]
  if (briefing.correction) parts.push(`One thing: ${briefing.correction}`)
  parts.push(briefing.push)
  parts.push(`Next: ${briefing.nextAction}`)
  for (const warning of briefing.warnings) parts.push(`⚠ ${warning}`)
  return parts.join('\n\n')
}

// ---------- Chat intents ----------

export type Intent =
  | 'briefing'
  | 'short-on-time'
  | 'cramps'
  | 'binged'
  | 'skipped'
  | 'plan-week'

export const PRESETS: { intent: Intent; label: string }[] = [
  { intent: 'briefing', label: 'What should I do today?' },
  { intent: 'short-on-time', label: 'I only have 15 minutes' },
  { intent: 'cramps', label: 'I have cramps' },
  { intent: 'binged', label: 'I ate way too much' },
  { intent: 'skipped', label: "I've skipped a few days" },
  { intent: 'plan-week', label: 'Plan my week' },
]

export function labelFor(intent: Intent): string {
  return PRESETS.find((p) => p.intent === intent)?.label ?? intent
}

function shortOnTime(profile: UserProfile, data: AppData, today: string): string {
  const phase = currentPhase(profile, data.cycleLogs, today)
  const checkIn = data.checkIns.find((c) => c.date === today)
  const readiness = computeReadiness(
    checkIn,
    data.symptomLogs.filter((log) => log.date === today),
    phase,
  )
  const recent = [...data.workoutLogs].sort((a, b) => b.date.localeCompare(a.date))

  // Rebuild the session against 15 minutes instead of her usual figure.
  const express = buildWorkout(profile, readiness, phase, recent, 15, today)

  const lines = express.exercises
    .map((e) => `• ${e.name} — ${e.prescription}`)
    .join('\n')

  const framing: Record<CoachTone, string> = {
    strict: "Fifteen minutes is enough. It's not the session you wanted, it's the session you have.",
    balanced: 'Fifteen minutes is a real session. Here it is.',
    gentle: 'Fifteen minutes counts. Here is a short one.',
  }

  return `${framing[profile.coachTone]}\n\n${express.title}\n${lines}\n\nLog it when you're done so the week still counts it.`
}

function cramps(profile: UserProfile, data: AppData, today: string): string {
  const logged = data.symptomLogs.find(
    (log) => log.date === today && log.symptom === 'cramps',
  )

  const severe = logged && logged.severity >= 5

  if (severe) {
    return "You've logged cramps at a 5. Training is not the question here — pain that stops you functioning is worth a doctor's opinion. Today is rest, and I mean actual rest.\n\nIf this is normal for you every cycle, that is still worth raising with a doctor rather than working around forever."
  }

  const framing: Record<CoachTone, string> = {
    strict:
      'Cramps change the session, not whether you show up. Intensity comes down, movement stays.',
    balanced: 'Cramps mean we downgrade the session. Movement still helps.',
    gentle: 'Cramps are a good reason to go easy today. Gentle movement, nothing more.',
  }

  const instruction = logged
    ? 'Your plan already accounts for it.'
    : 'Log it on the Cycle page and today\'s plan will drop the intensity for you.'

  return `${framing[profile.coachTone]}\n\n${instruction}\n\nWalking, mobility and heat help more than pushing through a heavy session does.`
}

/**
 * Deliberately never shames, and never prescribes exercise as punishment or
 * compensation — in any tone, including strict. Framing overeating as a debt
 * to work off is exactly the pattern that turns tracking into disordered
 * eating, so the strict voice here is matter-of-fact rather than harsh.
 */
function binged(profile: UserProfile): string {
  const framing: Record<CoachTone, string> = {
    strict:
      'It happened. It is one day of eating and it does not undo anything.',
    balanced: 'That happens, and it matters far less than it feels like right now.',
    gentle: 'That is okay. One heavy meal is not a problem to solve.',
  }

  return `${framing[profile.coachTone]}\n\nWhat not to do: skip your next meal, cut tomorrow's food, or add a workout to "make up for it". Compensating is what turns one big meal into a cycle.\n\nWhat to do: eat your next meal normally, with protein. Drink water. Keep tomorrow's plan exactly as it is.\n\nIf losing control around food is happening often, or it is frightening, that is worth talking to a professional about — it is not a discipline problem and I am not the right tool for it.`
}

function skipped(profile: UserProfile, data: AppData, today: string): string {
  const plan = buildDailyPlan(profile, data, today)
  const days = plan.adherence.daysSinceLastWorkout

  const framing: Record<CoachTone, string> = {
    strict:
      'Fine. The gap is the gap. What matters is that the next session happens today, not that you feel bad about the last ones.',
    balanced: 'Gaps happen. The only useful move is the next session.',
    gentle: 'Missing days is normal. Starting again is the whole skill.',
  }

  const gap =
    days === null
      ? 'Nothing logged yet, so there is no streak to rescue — just a first session to do.'
      : `${days} days since the last one.`

  return `${framing[profile.coachTone]}\n\n${gap}\n\nCome back at ${Math.min(profile.timeAvailable, 30)} minutes rather than your usual, and make it ${plan.workout.title.toLowerCase()}. Re-entry beats catching up — there is nothing to catch up on.`
}

function planWeek(profile: UserProfile, data: AppData, today: string): string {
  const week = buildWeek(profile, data.cycleLogs, today)

  const lines = week
    .map((day) => {
      const label = `${formatDate(day.date)}: ${FOCUS_LABELS[day.focus]}, ${day.minutes} min`
      return day.adjustedFor
        ? `• ${label} (softened — period expected)`
        : `• ${label}`
    })
    .join('\n')

  const framing: Record<CoachTone, string> = {
    strict: 'Your week. Recovery days are part of it, not optional extras you skip.',
    balanced: 'Here is the shape of your week.',
    gentle: 'Here is a gentle shape for your week.',
  }

  return `${framing[profile.coachTone]}\n\n${lines}\n\nThis is a shape, not a contract. Each morning's check-in still overrides it — if readiness is low, that day becomes recovery whatever this says.`
}

export function respondTo(
  intent: Intent,
  profile: UserProfile,
  data: AppData,
  today = todayISO(),
): string {
  switch (intent) {
    case 'briefing':
      return briefingToText(buildBriefing(profile, data, today))
    case 'short-on-time':
      return shortOnTime(profile, data, today)
    case 'cramps':
      return cramps(profile, data, today)
    case 'binged':
      return binged(profile)
    case 'skipped':
      return skipped(profile, data, today)
    case 'plan-week':
      return planWeek(profile, data, today)
  }
}
