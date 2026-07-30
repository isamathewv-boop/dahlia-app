import { describe, expect, it } from 'vitest'
import type { Equipment } from '../types'
import { availableExercises, EXERCISES } from './exercises'
import type { Focus } from './exercises'

const EQUIPMENT_TIERS: Equipment[] = [
  'bodyweight',
  'bands',
  'dumbbells',
  'full-gym',
]

/** The longest session the app can prescribe needs this many exercises. */
const LONGEST_SESSION = 6

describe('exercise library depth', () => {
  // This is the guard for a real gap that shipped once: the bodyweight
  // upper-body pool only had 4 moves, so a 60-minute bodyweight session
  // silently came back short.
  const sessionFocuses: Focus[] = ['recovery', 'upper', 'lower', 'full-body', 'core']

  for (const focus of sessionFocuses) {
    for (const equipment of EQUIPMENT_TIERS) {
      it(`can fill a full session: ${focus} with ${equipment}`, () => {
        // Worst case is a low-readiness or injured user, who gets no
        // high-impact options at all.
        const pool = availableExercises(focus, equipment, false)
        expect(pool.length).toBeGreaterThanOrEqual(LONGEST_SESSION)
      })
    }
  }

  it('offers at least one cardio option with no high impact allowed', () => {
    for (const equipment of EQUIPMENT_TIERS) {
      expect(availableExercises('cardio', equipment, false).length).toBeGreaterThan(0)
    }
  })
})

describe('availableExercises', () => {
  it('never returns exercises needing more equipment than the user has', () => {
    const bodyweightOnly = EQUIPMENT_TIERS.flatMap(() =>
      availableExercises('upper', 'bodyweight', true),
    )
    for (const exercise of bodyweightOnly) {
      expect(exercise.requires).toBe('bodyweight')
    }
  })

  it('includes lower tiers for better-equipped users', () => {
    const gym = availableExercises('upper', 'full-gym', true)
    const tiers = new Set(gym.map((e) => e.requires))
    expect(tiers.size).toBeGreaterThan(1)
  })

  it('sorts best equipment first', () => {
    const pool = availableExercises('upper', 'full-gym', true)
    expect(pool[0].requires).toBe('full-gym')
    expect(pool[pool.length - 1].requires).toBe('bodyweight')
  })

  it('excludes high-impact moves when asked', () => {
    const withImpact = availableExercises('full-body', 'bodyweight', true)
    const without = availableExercises('full-body', 'bodyweight', false)
    expect(withImpact.map((e) => e.name)).toContain('Burpee')
    expect(without.map((e) => e.name)).not.toContain('Burpee')
  })

  it('filters strictly by focus', () => {
    for (const exercise of availableExercises('core', 'full-gym', true)) {
      expect(exercise.focus).toBe('core')
    }
  })
})

describe('exercise definitions', () => {
  it('has no duplicate names', () => {
    const names = EXERCISES.map((e) => e.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives every recovery exercise its own cue', () => {
    // Recovery items are walks and stretches; sets-and-reps is meaningless.
    for (const exercise of EXERCISES.filter((e) => e.focus === 'recovery')) {
      expect(exercise.prescription).toBeTruthy()
    }
  })

  it('never marks a recovery exercise as high impact', () => {
    for (const exercise of EXERCISES.filter((e) => e.focus === 'recovery')) {
      expect(exercise.highImpact).toBeFalsy()
    }
  })
})
