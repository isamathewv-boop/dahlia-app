import type { AppData, Goal, MealLog, Macros, UserProfile } from '../types'
import { todayISO } from '../data/date'

/*
 * Protein targets, and nothing else.
 *
 * Deliberately no calorie target and no deficit maths. A daily calorie limit
 * is the single feature most associated with tracking tipping into disordered
 * eating, and this app already refuses to shame or prescribe compensation.
 * Protein is the one number where a target genuinely helps and the failure
 * mode of eating a bit more is harmless.
 */

/**
 * Grams of protein per kilogram of bodyweight.
 *
 * Ranges follow the common sports-nutrition consensus: roughly 1.6 g/kg is
 * where muscle protein synthesis plateaus for most people, and a deficit
 * warrants the higher end to protect lean mass.
 */
const PROTEIN_PER_KG: Record<Goal, { low: number; high: number }> = {
  'fat-loss': { low: 1.8, high: 2.2 },
  'muscle-gain': { low: 1.6, high: 2.2 },
  maintenance: { low: 1.2, high: 1.6 },
  energy: { low: 1.2, high: 1.6 },
  'hormone-support': { low: 1.4, high: 1.8 },
}

export interface ProteinTarget {
  low: number
  high: number
  perKgLow: number
  perKgHigh: number
  /** One line on where the number came from. */
  basis: string
}

const round5 = (value: number) => Math.round(value / 5) * 5

/**
 * Null when there is no weight on file — the app never guesses a body weight,
 * and never nags for one.
 */
export function proteinTarget(profile: UserProfile): ProteinTarget | null {
  const weight = profile.weightKg
  if (!weight || weight <= 0) return null

  const { low, high } = PROTEIN_PER_KG[profile.mainGoal]

  return {
    low: round5(weight * low),
    high: round5(weight * high),
    perKgLow: low,
    perKgHigh: high,
    basis: `${low}–${high} g per kg of bodyweight, for ${profile.mainGoal.replace('-', ' ')}.`,
  }
}

/** Adds up whatever macros were recorded. Missing values count as zero. */
export function totalMacros(meals: MealLog[]): Required<Macros> {
  return meals.reduce(
    (sum, meal) => ({
      protein: sum.protein + (meal.macros?.protein ?? 0),
      carbs: sum.carbs + (meal.macros?.carbs ?? 0),
      fat: sum.fat + (meal.macros?.fat ?? 0),
    }),
    { protein: 0, carbs: 0, fat: 0 },
  )
}

export type ProteinVerdict = 'no-target' | 'nothing-logged' | 'under' | 'in-range' | 'over'

export interface ProteinProgress {
  target: ProteinTarget | null
  eaten: Required<Macros>
  /** How many meals today carried any macro information at all. */
  mealsWithMacros: number
  verdict: ProteinVerdict
  /** Grams still to go to reach the bottom of the range. Never negative. */
  remaining: number
  message: string
}

export function proteinProgress(
  profile: UserProfile,
  data: AppData,
  today = todayISO(),
): ProteinProgress {
  const meals = data.mealLogs.filter((meal) => meal.date === today)
  const eaten = totalMacros(meals)
  const target = proteinTarget(profile)
  const mealsWithMacros = meals.filter((meal) => meal.macros?.protein).length

  if (!target) {
    return {
      target: null,
      eaten,
      mealsWithMacros,
      verdict: 'no-target',
      remaining: 0,
      message:
        'Add your weight in your profile and Dahlia can give you a protein target instead of a vague nudge.',
    }
  }

  if (mealsWithMacros === 0) {
    return {
      target,
      eaten,
      mealsWithMacros,
      verdict: 'nothing-logged',
      remaining: target.low,
      message: `Target is ${target.low}–${target.high}g of protein today. Nothing logged with macros yet.`,
    }
  }

  const remaining = Math.max(0, target.low - eaten.protein)

  if (eaten.protein < target.low) {
    return {
      target,
      eaten,
      mealsWithMacros,
      verdict: 'under',
      remaining,
      message: `${eaten.protein}g so far — ${remaining}g short of ${target.low}g. Protein is the one thing worth chasing.`,
    }
  }

  if (eaten.protein > target.high) {
    return {
      target,
      eaten,
      mealsWithMacros,
      verdict: 'over',
      remaining: 0,
      // Deliberately not framed as a problem. Going over on protein is fine.
      message: `${eaten.protein}g — comfortably above target. No issue, protein is hard to overdo.`,
    }
  }

  return {
    target,
    eaten,
    mealsWithMacros,
    verdict: 'in-range',
    remaining: 0,
    message: `${eaten.protein}g — in range. That is the box ticked.`,
  }
}
