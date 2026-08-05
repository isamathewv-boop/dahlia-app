import type { Goal, UserProfile } from '../types'

/**
 * The goal that drives numeric decisions — protein ratio, rep range, weekly
 * pattern — when an engine needs exactly one. Goals are ordered by priority
 * during onboarding, so the first one wins rather than averaging, which would
 * produce numbers nobody actually chose.
 *
 * `goals` should never be empty in practice (onboarding enforces at least
 * one), but a maintenance fallback keeps every engine total regardless.
 */
export function primaryGoal(profile: UserProfile): Goal {
  return profile.goals[0] ?? 'maintenance'
}

export function hasGoal(profile: UserProfile, goal: Goal): boolean {
  return profile.goals.includes(goal)
}
