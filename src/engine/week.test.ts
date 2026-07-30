import { describe, expect, it } from 'vitest'
import type { Goal } from '../types'
import { buildWeek } from './week'
import { makeProfile } from '../test/fixtures'

const TODAY = '2026-07-30'
const GOALS: Goal[] = [
  'fat-loss',
  'muscle-gain',
  'maintenance',
  'energy',
  'hormone-support',
]

describe('buildWeek', () => {
  it('returns seven consecutive days starting today', () => {
    const week = buildWeek(makeProfile(), [], TODAY)
    expect(week).toHaveLength(7)
    expect(week[0].date).toBe('2026-07-30')
    expect(week[6].date).toBe('2026-08-05')
  })

  it('gives every goal a pattern', () => {
    for (const mainGoal of GOALS) {
      expect(buildWeek(makeProfile({ mainGoal }), [], TODAY)).toHaveLength(7)
    }
  })

  it('always includes at least two recovery days', () => {
    // A week with no rest in it is a week nobody finishes.
    for (const mainGoal of GOALS) {
      const week = buildWeek(makeProfile({ mainGoal }), [], TODAY)
      const recovery = week.filter((day) => day.focus === 'recovery')
      expect(recovery.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('uses the profile’s available minutes for training days', () => {
    const week = buildWeek(makeProfile({ timeAvailable: 45 }), [], TODAY)
    for (const day of week.filter((d) => d.focus !== 'recovery')) {
      expect(day.minutes).toBe(45)
    }
  })

  it('keeps recovery days short rather than inheriting the full session', () => {
    const week = buildWeek(makeProfile({ timeAvailable: 60 }), [], TODAY)
    const recovery = week.filter((day) => day.focus === 'recovery')
    expect(recovery.length).toBeGreaterThan(0)
    for (const day of recovery) {
      expect(day.minutes).toBe(20)
    }
  })

  it('never stretches a recovery day beyond the time she actually has', () => {
    const week = buildWeek(makeProfile({ timeAvailable: 15 }), [], TODAY)
    for (const day of week) {
      expect(day.minutes).toBeLessThanOrEqual(15)
    }
  })

  it('softens heavy days that land on the period', () => {
    // Period runs 30 July to 3 August.
    const profile = makeProfile({
      lastPeriodDate: TODAY,
      periodLength: 5,
      mainGoal: 'fat-loss', // pattern starts with a lower-body day
    })
    const week = buildWeek(profile, [], TODAY)

    expect(week[0].focus).toBe('cardio')
    expect(week[0].adjustedFor).toBe('period')
  })

  it('leaves days outside the period alone', () => {
    const profile = makeProfile({
      lastPeriodDate: TODAY,
      periodLength: 2,
      mainGoal: 'muscle-gain',
    })
    const week = buildWeek(profile, [], TODAY)
    const later = week.slice(3)
    expect(later.every((day) => day.adjustedFor === undefined)).toBe(true)
  })

  it('never softens a recovery day, since there is nothing to soften', () => {
    const profile = makeProfile({ lastPeriodDate: TODAY, periodLength: 7 })
    const week = buildWeek(profile, [], TODAY)
    for (const day of week) {
      if (day.adjustedFor) expect(day.focus).toBe('cardio')
    }
  })

  it('is stable for the same inputs', () => {
    const profile = makeProfile()
    expect(buildWeek(profile, [], TODAY)).toEqual(buildWeek(profile, [], TODAY))
  })
})
