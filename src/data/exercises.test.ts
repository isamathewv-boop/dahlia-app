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
  // silently came back short. Checked at beginner level too, since that is
  // the smallest pool any user can be filtered down to.
  const sessionFocuses: Focus[] = ['recovery', 'upper', 'lower', 'full-body', 'core']

  for (const focus of sessionFocuses) {
    for (const equipment of EQUIPMENT_TIERS) {
      it(`can fill a full session: ${focus} with ${equipment}, even for a beginner`, () => {
        // Worst case is a low-readiness or injured beginner, who gets no
        // high-impact options and no exercise above their level.
        const pool = availableExercises(focus, equipment, 'beginner', false)
        expect(pool.length).toBeGreaterThanOrEqual(LONGEST_SESSION)
      })
    }
  }

  it('offers at least one cardio option with no high impact allowed', () => {
    for (const equipment of EQUIPMENT_TIERS) {
      expect(availableExercises('cardio', equipment, 'beginner', false).length).toBeGreaterThan(0)
    }
  })
})

describe('availableExercises', () => {
  it('never returns exercises needing more equipment than the user has', () => {
    const bodyweightOnly = EQUIPMENT_TIERS.flatMap(() =>
      availableExercises('upper', 'bodyweight', 'advanced', true),
    )
    for (const exercise of bodyweightOnly) {
      expect(exercise.requires).toBe('bodyweight')
    }
  })

  it('includes lower tiers for better-equipped users', () => {
    const gym = availableExercises('upper', 'full-gym', 'advanced', true)
    const tiers = new Set(gym.map((e) => e.requires))
    expect(tiers.size).toBeGreaterThan(1)
  })

  it('sorts best equipment first', () => {
    const pool = availableExercises('upper', 'full-gym', 'advanced', true)
    expect(pool[0].requires).toBe('full-gym')
    expect(pool[pool.length - 1].requires).toBe('bodyweight')
  })

  it('excludes high-impact moves when asked', () => {
    const withImpact = availableExercises('full-body', 'bodyweight', 'advanced', true)
    const without = availableExercises('full-body', 'bodyweight', 'advanced', false)
    expect(withImpact.map((e) => e.name)).toContain('Burpee')
    expect(without.map((e) => e.name)).not.toContain('Burpee')
  })

  it('filters strictly by focus', () => {
    for (const exercise of availableExercises('core', 'full-gym', 'advanced', true)) {
      expect(exercise.focus).toBe('core')
    }
  })

  it('never gives a beginner anything above beginner level', () => {
    for (const focus of ['upper', 'lower', 'full-body', 'core'] as Focus[]) {
      const pool = availableExercises(focus, 'full-gym', 'beginner', true)
      for (const exercise of pool) {
        expect(exercise.minLevel ?? 'beginner').toBe('beginner')
      }
    }
  })

  it('never gives a beginner the standard or diamond push-up', () => {
    const names = availableExercises('upper', 'bodyweight', 'beginner', true).map((e) => e.name)
    expect(names).not.toContain('Push-up')
    expect(names).not.toContain('Diamond push-up')
    expect(names).toContain('Wall push-up')
    expect(names).toContain('Knee push-up')
  })

  it('unlocks intermediate and advanced moves as level rises', () => {
    const beginner = availableExercises('upper', 'bodyweight', 'beginner', true)
    const intermediate = availableExercises('upper', 'bodyweight', 'intermediate', true)
    const advanced = availableExercises('upper', 'bodyweight', 'advanced', true)
    expect(intermediate.length).toBeGreaterThan(beginner.length)
    expect(advanced.length).toBeGreaterThan(intermediate.length)
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

  it('gives every exercise a cue and a pictogram', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.cue).toBeTruthy()
      expect(exercise.visual).toBeTruthy()
    }
  })

  it('never marks a high-impact move as beginner level', () => {
    // Jumping and pounding moves are never the right default for a beginner.
    for (const exercise of EXERCISES.filter((e) => e.highImpact)) {
      expect(exercise.minLevel ?? 'beginner').not.toBe('beginner')
    }
  })
})

