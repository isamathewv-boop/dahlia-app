import { describe, expect, it } from 'vitest'
import { buildProgress, proteinTrend } from './progress'
import { buildBriefing } from './dahlia'
import { checkIn, makeData, makeProfile, mealLog, workoutLog } from '../test/fixtures'

const TODAY = '2026-07-30'

/** A meal carrying protein, on a given date. */
const meal = (date: string, protein: number, slot: 'breakfast' | 'lunch' | 'dinner' = 'lunch') =>
  mealLog(date, { slot, macros: { protein } })

/** 60kg on fat loss ⇒ a 110–130g target. */
const profile = makeProfile({ weightKg: 60, goals: ['fat-loss'] })

describe('proteinTrend', () => {
  it('reports no target without a weight', () => {
    const trend = proteinTrend(makeProfile(), makeData(), 7, TODAY)
    expect(trend.target).toBeNull()
    expect(trend.daysOnTarget).toBe(0)
  })

  it('is empty when nothing has macros', () => {
    const data = makeData({ mealLogs: [mealLog(TODAY)] })
    const trend = proteinTrend(profile, data, 7, TODAY)

    expect(trend.daysLogged).toBe(0)
    expect(trend.averageProtein).toBeNull()
  })

  it('sums several meals into one day', () => {
    const data = makeData({
      mealLogs: [meal(TODAY, 40, 'breakfast'), meal(TODAY, 45, 'lunch'), meal(TODAY, 30, 'dinner')],
    })
    const trend = proteinTrend(profile, data, 7, TODAY)

    expect(trend.daysLogged).toBe(1)
    expect(trend.averageProtein).toBe(115)
    expect(trend.daysOnTarget).toBe(1)
  })

  it('counts a day as on target only at the lower bound or above', () => {
    const data = makeData({
      mealLogs: [meal('2026-07-29', 109), meal(TODAY, 110)],
    })
    const trend = proteinTrend(profile, data, 7, TODAY)

    expect(trend.daysLogged).toBe(2)
    expect(trend.daysOnTarget).toBe(1)
  })

  it('averages only over logged days, not the whole window', () => {
    // The trap: dividing 120g by seven days would report 17g and invent a
    // shortfall that is really four days of not logging.
    const data = makeData({ mealLogs: [meal(TODAY, 120)] })
    const trend = proteinTrend(profile, data, 7, TODAY)

    expect(trend.averageProtein).toBe(120)
    expect(trend.daysLogged).toBe(1)
  })

  it('ignores days outside the window', () => {
    const data = makeData({ mealLogs: [meal(TODAY, 120), meal('2026-06-01', 200)] })
    expect(proteinTrend(profile, data, 7, TODAY).daysLogged).toBe(1)
  })
})

describe('Progress takeaway uses protein', () => {
  const trainingWeek = [
    workoutLog(TODAY, { type: 'Cardio' }),
    workoutLog('2026-07-28', { type: 'Yoga' }),
  ]

  it('calls out training going well while protein misses every day', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: trainingWeek,
      mealLogs: [meal(TODAY, 60), meal('2026-07-29', 55), meal('2026-07-28', 70)],
    })
    const summary = buildProgress(profile, data, TODAY)

    expect(summary.takeaway).toContain('holding results back')
  })

  it('credits a week where both halves worked', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: trainingWeek,
      mealLogs: [meal(TODAY, 120), meal('2026-07-29', 125), meal('2026-07-28', 115)],
    })
    const summary = buildProgress(profile, data, TODAY)

    expect(summary.takeaway).toContain('Both halves are working')
  })

  it('stays quiet about protein on a single logged day', () => {
    // One day is not a pattern.
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: trainingWeek,
      mealLogs: [meal(TODAY, 20)],
    })
    expect(buildProgress(profile, data, TODAY).takeaway).not.toContain(
      'holding results back',
    )
  })
})

describe('Dahlia reads the real numbers', () => {
  it('names the shortfall when protein misses every logged day', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
      mealLogs: [meal(TODAY, 50), meal('2026-07-29', 60), meal('2026-07-28', 55)],
    })
    const correction = buildBriefing(profile, data, TODAY).correction ?? ''

    expect(correction).toContain('55g') // the average across those days
    expect(correction).toContain('110g') // the target she is missing
  })

  it('suggests where to fix it when protein is patchy', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
      mealLogs: [
        meal(TODAY, 120),
        meal('2026-07-29', 60),
        meal('2026-07-28', 55),
        meal('2026-07-27', 50),
      ],
    })
    const correction = buildBriefing(profile, data, TODAY).correction ?? ''

    expect(correction).toContain('1 of 4')
    expect(correction).toContain('breakfast')
  })

  it('says nothing about protein when it is on track', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
      mealLogs: [meal(TODAY, 120), meal('2026-07-29', 125), meal('2026-07-28', 115)],
    })
    const correction = buildBriefing(profile, data, TODAY).correction ?? ''
    expect(correction.toLowerCase()).not.toContain('protein')
  })

  it('puts the remaining grams in the food line', () => {
    const data = makeData({ checkIns: [checkIn(TODAY)], mealLogs: [meal(TODAY, 40)] })
    const briefing = buildBriefing(profile, data, TODAY)

    expect(briefing.foodLine).toContain('70g short')
  })

  it('leaves the food line generic when there is no weight on file', () => {
    const data = makeData({ checkIns: [checkIn(TODAY)], mealLogs: [meal(TODAY, 40)] })
    const briefing = buildBriefing(makeProfile(), data, TODAY)

    expect(briefing.foodLine).not.toContain('short')
  })

  it('still puts sleep debt ahead of protein', () => {
    const data = makeData({
      checkIns: [
        checkIn('2026-07-28', { sleepHours: 5 }),
        checkIn('2026-07-29', { sleepHours: 5 }),
        checkIn(TODAY, { sleepHours: 4 }),
      ],
      mealLogs: [meal(TODAY, 50), meal('2026-07-29', 50), meal('2026-07-28', 50)],
    })
    expect(buildBriefing(profile, data, TODAY).correction).toContain('Sleep')
  })
})
