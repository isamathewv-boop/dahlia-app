import type { Goal, UserProfile } from '../types'
import type { Phase } from '../data/cycle'
import { primaryGoal } from './goals'
import type { NutritionPlan, Readiness } from './types'

const HEADLINE_BY_GOAL: Record<Goal, string> = {
  'fat-loss': 'Protein first, then vegetables, then the rest.',
  'muscle-gain': 'Eat enough. Protein at every meal.',
  energy: 'Steady meals, no long gaps.',
  'hormone-support': 'Regular meals with fat, fibre and protein together.',
  maintenance: 'Balanced plates, nothing extreme.',
  'overall-wellbeing': 'Consistent, varied meals — this is about how you feel, not a number.',
}

/** One extra line per secondary goal, so ticking more than one shows through. */
const SECONDARY_TIP_BY_GOAL: Partial<Record<Goal, string>> = {
  energy: 'For steady energy, do not let more than 4 hours pass without eating something.',
  'hormone-support': 'Pair carbs with fat or protein rather than eating them alone — it steadies the swings.',
  'overall-wellbeing': 'Food is one input among several here — sleep and stress matter as much as what is on the plate.',
}

/**
 * General food guidance from goal, cycle phase and conditions.
 *
 * This is deliberately qualitative. We do not use weight for anything beyond
 * a protein target, so any calorie target would be invented — and inventing
 * numbers for someone tracking their body is how a health app does real harm.
 */
export function buildNutrition(
  profile: UserProfile,
  phase: Phase | null,
  readiness: Readiness,
): NutritionPlan {
  const points: string[] = []

  // The first selected goal drives the headline; the rest can each add one
  // qualitative tip rather than being silently ignored.
  const headline = HEADLINE_BY_GOAL[primaryGoal(profile)]

  points.push('Protein at every meal — it is the one thing worth being strict about.')

  for (const goal of profile.goals.slice(1)) {
    const tip = SECONDARY_TIP_BY_GOAL[goal]
    if (tip && !points.includes(tip)) points.push(tip)
  }

  // Cycle phase.
  if (phase === 'menstrual') {
    points.push('Period week: iron-rich foods and plenty of water.')
    if (profile.healthConditions.includes('Anemia')) {
      points.push(
        'With anemia on file, pair iron foods with vitamin C and speak to your doctor about supplementing.',
      )
    }
  }
  if (phase === 'luteal') {
    points.push(
      'Luteal phase — appetite and cravings usually rise. That is normal, not failure. Eat the extra as protein and fibre.',
    )
  }

  // Conditions.
  if (profile.healthConditions.includes('PCOS')) {
    points.push(
      'PCOS: pair carbs with protein or fat rather than eating them alone.',
    )
  }
  if (profile.healthConditions.includes('Diabetes')) {
    points.push(
      'Diabetes: follow the plan your doctor set. Nothing here replaces it.',
    )
  }
  if (profile.healthConditions.includes('Digestive issues')) {
    points.push('Keep portions moderate and eat slowly.')
  }

  // Recovery.
  if (readiness.band === 'low') {
    points.push('Low readiness: do not cut food today. Under-eating makes this worse.')
  }

  if (profile.dietPreference) {
    points.push(`Kept to your preference: ${profile.dietPreference}.`)
  }

  return { headline, points }
}
