import type { DailyCheckIn, SymptomLog } from '../types'
import type { Phase } from '../data/cycle'
import type { Readiness, ReadinessBand } from './types'

function bandFor(score: number): ReadinessBand {
  if (score < 40) return 'low'
  if (score < 70) return 'moderate'
  return 'good'
}

/**
 * Turns today's inputs into a single readiness score.
 *
 * Deliberately simple and readable: start at 100, subtract for everything
 * working against the body today. The `reasons` list matters as much as the
 * number — it is what makes the plan explainable instead of magic.
 */
export function computeReadiness(
  checkIn: DailyCheckIn | undefined,
  symptoms: SymptomLog[],
  phase: Phase | null,
): Readiness {
  let score = 100
  const reasons: string[] = []

  if (!checkIn) {
    reasons.push('No check-in yet today, so this assumes an average day.')
  } else {
    if (checkIn.sleepHours < 6) {
      score -= 25
      reasons.push(`Only ${checkIn.sleepHours}h of sleep.`)
    } else if (checkIn.sleepHours < 7) {
      score -= 10
      reasons.push(`${checkIn.sleepHours}h of sleep is a little short.`)
    }

    if (checkIn.energy <= 1) {
      score -= 30
      reasons.push('Energy is at rock bottom.')
    } else if (checkIn.energy === 2) {
      score -= 20
      reasons.push('Energy is low.')
    } else if (checkIn.energy === 3) {
      score -= 5
    }

    if (checkIn.soreness >= 5) {
      score -= 25
      reasons.push('Severe soreness.')
    } else if (checkIn.soreness === 4) {
      score -= 15
      reasons.push('Noticeable soreness.')
    } else if (checkIn.soreness === 3) {
      score -= 5
    }
  }

  const cramps = symptoms.find((s) => s.symptom === 'cramps')
  if (cramps) {
    if (cramps.severity >= 4) {
      score -= 25
      reasons.push('Cramps are severe.')
    } else {
      score -= 10
      reasons.push('Cramps logged.')
    }
  }

  const fatigue = symptoms.find((s) => s.symptom === 'fatigue')
  if (fatigue && fatigue.severity >= 3) {
    score -= 10
    reasons.push('Fatigue logged.')
  }

  const headache = symptoms.find((s) => s.symptom === 'headache')
  if (headache && headache.severity >= 4) {
    score -= 10
    reasons.push('Bad headache.')
  }

  if (phase === 'menstrual') {
    score -= 10
    reasons.push('You are on your period.')
  }

  score = Math.max(0, Math.min(100, score))

  return { score, band: bandFor(score), reasons }
}
