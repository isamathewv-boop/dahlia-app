import type { UserProfile } from '../types'
import type { Phase } from '../data/cycle'
import type { NutritionPlan, Readiness } from './types'

/**
 * General food guidance from goal, cycle phase and conditions.
 *
 * This is deliberately qualitative. We do not collect weight, so any calorie
 * or gram target would be invented — and inventing numbers for someone
 * tracking their body is how a health app does real harm.
 */
export function buildNutrition(
  profile: UserProfile,
  phase: Phase | null,
  readiness: Readiness,
): NutritionPlan {
  const points: string[] = []

  // Goal drives the headline.
  const headline =
    profile.mainGoal === 'fat-loss'
      ? 'Protein first, then vegetables, then the rest.'
      : profile.mainGoal === 'muscle-gain'
        ? 'Eat enough. Protein at every meal.'
        : profile.mainGoal === 'energy'
          ? 'Steady meals, no long gaps.'
          : profile.mainGoal === 'hormone-support'
            ? 'Regular meals with fat, fibre and protein together.'
            : 'Balanced plates, nothing extreme.'

  points.push('Protein at every meal — it is the one thing worth being strict about.')

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
