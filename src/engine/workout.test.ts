import { describe, expect, it } from 'vitest'
import { buildWorkout, focusFromType, typeFromFocus } from './workout'
import type { Readiness } from './types'
import { makeProfile, workoutLog } from '../test/fixtures'

const DATE = '2026-07-30'

const good: Readiness = { score: 95, band: 'good', reasons: [] }
const moderate: Readiness = { score: 55, band: 'moderate', reasons: [] }
const low: Readiness = { score: 20, band: 'low', reasons: [] }

const names = (plan: { exercises: { name: string }[] }) =>
  plan.exercises.map((e) => e.name)

describe('buildWorkout — readiness overrides everything', () => {
  it('forces recovery and light intensity when readiness is low', () => {
    const plan = buildWorkout(makeProfile(), low, 'follicular', [], 30, DATE)
    expect(plan.focus).toBe('recovery')
    expect(plan.intensity).toBe('light')
    expect(plan.note.toLowerCase()).toContain('recovery')
  })

  it('does not force recovery when readiness is good', () => {
    const plan = buildWorkout(makeProfile(), good, 'follicular', [], 30, DATE)
    expect(plan.focus).not.toBe('recovery')
    expect(plan.intensity).toBe('hard')
  })

  it('keeps period week to cardio when readiness is not good', () => {
    const plan = buildWorkout(makeProfile(), moderate, 'menstrual', [], 30, DATE)
    expect(plan.focus).toBe('cardio')
    expect(plan.note.toLowerCase()).toContain('period')
  })

  it('still allows strength on your period if readiness is good', () => {
    const plan = buildWorkout(makeProfile(), good, 'menstrual', [], 30, DATE)
    expect(plan.focus).not.toBe('cardio')
  })
})

describe('buildWorkout — time available', () => {
  it('scales the number of exercises to the time', () => {
    const profile = makeProfile()
    expect(buildWorkout(profile, good, 'follicular', [], 15, DATE).exercises).toHaveLength(3)
    expect(buildWorkout(profile, good, 'follicular', [], 30, DATE).exercises).toHaveLength(4)
    expect(buildWorkout(profile, good, 'follicular', [], 45, DATE).exercises).toHaveLength(5)
    expect(buildWorkout(profile, good, 'follicular', [], 60, DATE).exercises).toHaveLength(6)
  })

  it('uses today’s free time, not the usual figure, to pick the focus', () => {
    // Usually 45 minutes, but only 15 today — that should mean full body.
    const profile = makeProfile({ timeAvailable: 45 })
    const plan = buildWorkout(profile, good, 'follicular', [], 15, DATE)
    expect(plan.focus).toBe('full-body')
    expect(plan.title).toContain('15-minute')
  })

  it('gives cardio as one activity, not a list', () => {
    const plan = buildWorkout(makeProfile(), moderate, 'menstrual', [], 30, DATE)
    expect(plan.focus).toBe('cardio')
    expect(plan.exercises).toHaveLength(1)
    expect(plan.exercises[0].prescription).toContain('30 minutes')
  })
})

describe('buildWorkout — equipment', () => {
  it('uses the best equipment the user owns', () => {
    const profile = makeProfile({ equipment: 'dumbbells' })
    const plan = buildWorkout(profile, good, 'follicular', [], 45, DATE)
    expect(names(plan).some((n) => n.toLowerCase().includes('dumbbell'))).toBe(true)
  })

  it('never suggests equipment the user does not have', () => {
    const profile = makeProfile({ equipment: 'bodyweight' })
    const plan = buildWorkout(profile, good, 'follicular', [], 60, DATE)
    const forbidden = ['dumbbell', 'band', 'cable', 'lat pulldown', 'leg press']
    for (const name of names(plan)) {
      for (const word of forbidden) {
        expect(name.toLowerCase()).not.toContain(word)
      }
    }
  })

  it('falls back to lower tiers to fill the session', () => {
    // Only 4 dumbbell upper-body moves exist, so a 6-slot session must borrow.
    const profile = makeProfile({ equipment: 'dumbbells' })
    const plan = buildWorkout(profile, good, 'follicular', [], 60, DATE)
    expect(plan.exercises).toHaveLength(6)
  })
})

describe('buildWorkout — safety', () => {
  it('excludes high-impact moves when an injury is on file', () => {
    const profile = makeProfile({
      equipment: 'bodyweight',
      healthConditions: ['Injury'],
      timeAvailable: 15,
    })
    const plan = buildWorkout(profile, good, 'follicular', [], 15, DATE)
    expect(names(plan)).not.toContain('Burpee')
    expect(names(plan)).not.toContain('Jump squat')
  })

  it('excludes high-impact moves whenever readiness is not good', () => {
    const plan = buildWorkout(makeProfile(), moderate, 'follicular', [], 15, DATE)
    expect(names(plan)).not.toContain('Burpee')
  })
})

describe('buildWorkout — prescriptions', () => {
  it('scales sets with experience level', () => {
    const beginner = makeProfile({ workoutLevel: 'beginner' })
    const advanced = makeProfile({ workoutLevel: 'advanced' })

    expect(
      buildWorkout(beginner, good, 'follicular', [], 30, DATE).exercises[0].prescription,
    ).toContain('2 ×')
    expect(
      buildWorkout(advanced, good, 'follicular', [], 30, DATE).exercises[0].prescription,
    ).toContain('4 ×')
  })

  it('only ever pairs light intensity with recovery work', () => {
    // This is the invariant that keeps volume from spiking on a bad day. If
    // someone later allows strength training at low readiness, this fails and
    // the set-capping in prescribe() becomes load-bearing.
    const profiles = [
      makeProfile({ workoutLevel: 'advanced', equipment: 'full-gym' }),
      makeProfile({ workoutLevel: 'beginner', equipment: 'bodyweight' }),
    ]
    const phases = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const

    for (const profile of profiles) {
      for (const phase of phases) {
        for (const minutes of [15, 30, 45, 60]) {
          const plan = buildWorkout(profile, low, phase, [], minutes, DATE)
          expect(plan.intensity).toBe('light')
          expect(plan.focus).toBe('recovery')
        }
      }
    }
  })

  it('sets rep ranges from the goal', () => {
    const fatLoss = makeProfile({ mainGoal: 'fat-loss' })
    const muscle = makeProfile({ mainGoal: 'muscle-gain' })

    expect(
      buildWorkout(fatLoss, good, 'follicular', [], 30, DATE).exercises[0].prescription,
    ).toContain('12-15')
    expect(
      buildWorkout(muscle, good, 'follicular', [], 30, DATE).exercises[0].prescription,
    ).toContain('8-12')
  })

  it('gives walks and stretches their own cues, not sets and reps', () => {
    const plan = buildWorkout(makeProfile(), low, 'follicular', [], 15, DATE)
    expect(plan.focus).toBe('recovery')
    for (const exercise of plan.exercises) {
      expect(exercise.prescription).not.toMatch(/\d+ × \d+-\d+/)
    }
    // And the cues should be real durations.
    expect(plan.exercises.map((e) => e.prescription).join(' ')).toMatch(/minute|second/)
  })
})

describe('buildWorkout — variety and stability', () => {
  it('is identical for the same day', () => {
    const profile = makeProfile({ equipment: 'bodyweight' })
    const a = buildWorkout(profile, low, 'follicular', [], 30, DATE)
    const b = buildWorkout(profile, low, 'follicular', [], 30, DATE)
    expect(names(a)).toEqual(names(b))
  })

  it('varies across days', () => {
    const profile = makeProfile({ equipment: 'bodyweight' })
    const days = ['2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02']
    const sessions = days.map((day) =>
      names(buildWorkout(profile, low, 'follicular', [], 30, day)).join(','),
    )
    expect(new Set(sessions).size).toBeGreaterThan(1)
  })
})

describe('buildWorkout — rotation between body parts', () => {
  it('follows an upper-body day with lower body', () => {
    const recent = [workoutLog('2026-07-29', { type: 'Strength — upper body' })]
    const plan = buildWorkout(makeProfile(), good, 'follicular', recent, 30, DATE)
    expect(plan.focus).toBe('lower')
  })

  it('follows a lower-body day with upper body', () => {
    const recent = [workoutLog('2026-07-29', { type: 'Strength — lower body' })]
    const plan = buildWorkout(makeProfile(), good, 'follicular', recent, 30, DATE)
    expect(plan.focus).toBe('upper')
  })

  it('ignores cardio and mobility when deciding what to rotate to', () => {
    const recent = [
      workoutLog('2026-07-29', { type: 'Cardio' }),
      workoutLog('2026-07-28', { type: 'Strength — upper body' }),
    ]
    const plan = buildWorkout(makeProfile(), good, 'follicular', recent, 30, DATE)
    expect(plan.focus).toBe('lower')
  })
})

describe('focus and type labels round-trip', () => {
  it('maps a generated focus to a loggable type and back', () => {
    expect(focusFromType(typeFromFocus('upper'))).toBe('upper')
    expect(focusFromType(typeFromFocus('lower'))).toBe('lower')
    expect(focusFromType(typeFromFocus('cardio'))).toBe('cardio')
    expect(focusFromType(typeFromFocus('recovery'))).toBe('recovery')
  })

  it('returns null for types that carry no focus', () => {
    expect(focusFromType('Rest day')).toBeNull()
  })
})
