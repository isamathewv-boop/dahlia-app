import { describe, expect, it } from 'vitest'
import { buildDailyPlan, computeAdherence } from './plan'
import {
  checkIn,
  cycleLog,
  makeData,
  makeProfile,
  mealLog,
  symptomLog,
  workoutLog,
} from '../test/fixtures'

const TODAY = '2026-07-30'

describe('computeAdherence', () => {
  it('reports nothing when nothing has been logged', () => {
    const adherence = computeAdherence(makeData(), TODAY)
    expect(adherence.completedLast7Days).toBe(0)
    expect(adherence.daysSinceLastWorkout).toBeNull()
    expect(adherence.reentryMode).toBe(false)
  })

  it('does not accuse a brand new user of missing workouts', () => {
    // Re-entry mode is for people who stopped, not people who never started.
    expect(computeAdherence(makeData(), TODAY).reentryMode).toBe(false)
  })

  it('counts only completed sessions inside the last 7 days', () => {
    const data = makeData({
      workoutLogs: [
        workoutLog('2026-07-30', { type: 'Cardio' }),
        workoutLog('2026-07-26', { type: 'Yoga' }),
        workoutLog('2026-07-29', { type: 'Walk', completed: false }), // abandoned
        workoutLog('2026-07-10', { type: 'Cardio' }), // too old
      ],
    })
    expect(computeAdherence(data, TODAY).completedLast7Days).toBe(2)
  })

  it('measures days since the last completed workout', () => {
    const data = makeData({
      workoutLogs: [workoutLog('2026-07-28', { type: 'Cardio' })],
    })
    expect(computeAdherence(data, TODAY).daysSinceLastWorkout).toBe(2)
  })

  it('ignores abandoned sessions when measuring the gap', () => {
    const data = makeData({
      workoutLogs: [
        workoutLog('2026-07-20', { type: 'Cardio' }),
        workoutLog('2026-07-29', { type: 'Walk', completed: false }),
      ],
    })
    expect(computeAdherence(data, TODAY).daysSinceLastWorkout).toBe(10)
  })

  it('enters re-entry mode after three days off', () => {
    const twoDays = makeData({
      workoutLogs: [workoutLog('2026-07-28', { type: 'Cardio' })],
    })
    const threeDays = makeData({
      workoutLogs: [workoutLog('2026-07-27', { type: 'Cardio' })],
    })
    expect(computeAdherence(twoDays, TODAY).reentryMode).toBe(false)
    expect(computeAdherence(threeDays, TODAY).reentryMode).toBe(true)
  })

  it('counts today’s meals only', () => {
    const data = makeData({
      mealLogs: [
        mealLog(TODAY, { slot: 'breakfast' }),
        mealLog(TODAY, { slot: 'lunch' }),
        mealLog('2026-07-29', { slot: 'dinner' }),
      ],
    })
    expect(computeAdherence(data, TODAY).mealsLoggedToday).toBe(2)
  })
})

describe('buildDailyPlan', () => {
  it('asks for a check-in first when none exists', () => {
    const plan = buildDailyPlan(makeProfile(), makeData(), TODAY)
    expect(plan.nextAction.toLowerCase()).toContain('check-in')
  })

  it('points at the workout once the check-in is done', () => {
    const data = makeData({ checkIns: [checkIn(TODAY)] })
    const plan = buildDailyPlan(makeProfile(), data, TODAY)
    expect(plan.nextAction).toContain(plan.workout.title)
  })

  it('asks for meals once the workout is logged', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
    })
    const plan = buildDailyPlan(makeProfile(), data, TODAY)
    expect(plan.nextAction.toLowerCase()).toContain('eaten')
  })

  it('asks for the cycle log once meals are in', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
      mealLogs: [mealLog(TODAY)],
    })
    const plan = buildDailyPlan(makeProfile(), data, TODAY)
    expect(plan.nextAction.toLowerCase()).toContain('cycle')
  })

  it('stops asking for anything once the day is fully logged', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
      mealLogs: [mealLog(TODAY)],
      cycleLogs: [cycleLog(TODAY, 'none')],
    })
    const plan = buildDailyPlan(makeProfile(), data, TODAY)
    expect(plan.nextAction.toLowerCase()).toContain('nothing else')
  })

  it('reframes rather than scolds after missed days', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog('2026-07-25', { type: 'Cardio' })],
    })
    const plan = buildDailyPlan(makeProfile(), data, TODAY)
    expect(plan.adherence.reentryMode).toBe(true)
    expect(plan.nextAction.toLowerCase()).toContain('getting back in')
  })

  it('uses today’s available minutes over the profile default', () => {
    const profile = makeProfile({ timeAvailable: 60 })
    const data = makeData({
      checkIns: [checkIn(TODAY, { minutesAvailable: 15 })],
    })
    const plan = buildDailyPlan(profile, data, TODAY)
    expect(plan.workout.durationMinutes).toBe(15)
  })

  it('falls back to the profile default with no check-in', () => {
    const profile = makeProfile({ timeAvailable: 45 })
    const plan = buildDailyPlan(profile, makeData(), TODAY)
    expect(plan.workout.durationMinutes).toBe(45)
  })

  it('carries safety notes through to the plan', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      symptomLogs: [symptomLog(TODAY, 'cramps', 5)],
    })
    const plan = buildDailyPlan(makeProfile(), data, TODAY)
    expect(plan.safety.length).toBeGreaterThan(0)
    expect(plan.safety.join(' ').toLowerCase()).toContain('doctor')
  })

  it('lets today’s symptoms drag readiness down into recovery', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY, { sleepHours: 5, energy: 1, soreness: 5 })],
      symptomLogs: [symptomLog(TODAY, 'cramps', 5)],
    })
    const plan = buildDailyPlan(makeProfile(), data, TODAY)
    expect(plan.readiness.band).toBe('low')
    expect(plan.workout.focus).toBe('recovery')
  })

  it('ignores symptoms logged on other days', () => {
    // Mid-cycle on purpose, so the period penalty doesn't muddy the assertion.
    const profile = makeProfile({ lastPeriodDate: '2026-07-18' })
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      symptomLogs: [symptomLog('2026-07-29', 'cramps', 5)],
    })
    const plan = buildDailyPlan(profile, data, TODAY)
    expect(plan.readiness.score).toBe(100)
    expect(plan.readiness.reasons.join(' ').toLowerCase()).not.toContain('cramps')
    expect(plan.safety).toEqual([])
  })

  it('tells the user to eat enough on a low-readiness day', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY, { sleepHours: 4, energy: 1, soreness: 5 })],
    })
    const plan = buildDailyPlan(makeProfile(), data, TODAY)
    expect(plan.nutrition.points.join(' ').toLowerCase()).toContain('do not cut food')
  })

  it('adds iron guidance during the period', () => {
    const profile = makeProfile({ lastPeriodDate: TODAY })
    const plan = buildDailyPlan(profile, makeData(), TODAY)
    expect(plan.phase).toBe('menstrual')
    expect(plan.nutrition.points.join(' ').toLowerCase()).toContain('iron')
  })

  it('never invents calorie or gram targets', () => {
    const plan = buildDailyPlan(makeProfile(), makeData(), TODAY)
    const text = [plan.nutrition.headline, ...plan.nutrition.points].join(' ')
    expect(text).not.toMatch(/\d+\s*(kcal|calories|g\b|grams)/i)
  })
})
