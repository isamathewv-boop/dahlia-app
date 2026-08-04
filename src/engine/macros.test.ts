import { describe, expect, it } from 'vitest'
import { proteinProgress, proteinTarget, totalMacros } from './macros'
import { makeData, makeProfile, mealLog } from '../test/fixtures'
import { todayISO } from '../data/date'

const today = todayISO()

const withMacros = (protein: number, carbs = 0, fat = 0, slot = 'lunch' as const) =>
  mealLog(today, { slot, macros: { protein, carbs, fat } })

describe('proteinTarget', () => {
  it('is null without a weight, rather than guessing one', () => {
    expect(proteinTarget(makeProfile())).toBeNull()
  })

  it('is null for a nonsense weight', () => {
    expect(proteinTarget(makeProfile({ weightKg: 0 }))).toBeNull()
    expect(proteinTarget(makeProfile({ weightKg: -5 }))).toBeNull()
  })

  it('scales with bodyweight', () => {
    const light = proteinTarget(makeProfile({ weightKg: 50, mainGoal: 'fat-loss' }))!
    const heavy = proteinTarget(makeProfile({ weightKg: 80, mainGoal: 'fat-loss' }))!
    expect(heavy.low).toBeGreaterThan(light.low)
  })

  it('uses the documented ranges per goal', () => {
    // 60kg on fat loss: 1.8-2.2 g/kg = 108-132, rounded to the nearest 5.
    const fatLoss = proteinTarget(makeProfile({ weightKg: 60, mainGoal: 'fat-loss' }))!
    expect(fatLoss.low).toBe(110)
    expect(fatLoss.high).toBe(130)

    // Maintenance is a lower ask: 1.2-1.6 g/kg = 72-96.
    const maintain = proteinTarget(makeProfile({ weightKg: 60, mainGoal: 'maintenance' }))!
    expect(maintain.low).toBe(70)
    expect(maintain.high).toBe(95)
  })

  it('asks more of a deficit than of maintenance', () => {
    const weightKg = 65
    const fatLoss = proteinTarget(makeProfile({ weightKg, mainGoal: 'fat-loss' }))!
    const maintain = proteinTarget(makeProfile({ weightKg, mainGoal: 'maintenance' }))!
    expect(fatLoss.low).toBeGreaterThan(maintain.low)
  })

  it('explains where the number came from', () => {
    const target = proteinTarget(makeProfile({ weightKg: 60, mainGoal: 'fat-loss' }))!
    expect(target.basis).toContain('per kg')
  })

  it('covers every goal', () => {
    const goals = ['fat-loss', 'muscle-gain', 'maintenance', 'energy', 'hormone-support'] as const
    for (const mainGoal of goals) {
      const target = proteinTarget(makeProfile({ weightKg: 60, mainGoal }))!
      expect(target.low).toBeGreaterThan(0)
      expect(target.high).toBeGreaterThanOrEqual(target.low)
    }
  })
})

describe('totalMacros', () => {
  it('is zero for no meals', () => {
    expect(totalMacros([])).toEqual({ protein: 0, carbs: 0, fat: 0 })
  })

  it('adds up across meals', () => {
    const total = totalMacros([withMacros(30, 40, 10), withMacros(25, 20, 15)])
    expect(total).toEqual({ protein: 55, carbs: 60, fat: 25 })
  })

  it('treats meals logged without macros as zero, not as missing', () => {
    const total = totalMacros([withMacros(30, 40, 10), mealLog(today)])
    expect(total.protein).toBe(30)
  })

  it('handles a partial macro record', () => {
    const partial = mealLog(today, { macros: { protein: 20 } })
    expect(totalMacros([partial])).toEqual({ protein: 20, carbs: 0, fat: 0 })
  })
})

describe('proteinProgress', () => {
  it('asks for a weight instead of inventing a target', () => {
    const result = proteinProgress(makeProfile(), makeData(), today)
    expect(result.verdict).toBe('no-target')
    expect(result.message).toContain('weight')
    expect(result.target).toBeNull()
  })

  it('states the target when nothing is logged yet', () => {
    const profile = makeProfile({ weightKg: 60, mainGoal: 'fat-loss' })
    const result = proteinProgress(profile, makeData(), today)

    expect(result.verdict).toBe('nothing-logged')
    expect(result.remaining).toBe(110)
    expect(result.message).toContain('110–130g')
  })

  it('counts only today', () => {
    const profile = makeProfile({ weightKg: 60 })
    const data = makeData({
      mealLogs: [
        withMacros(40),
        mealLog('2020-01-01', { macros: { protein: 100 } }),
      ],
    })
    expect(proteinProgress(profile, data, today).eaten.protein).toBe(40)
  })

  it('says how far short she is', () => {
    const profile = makeProfile({ weightKg: 60, mainGoal: 'fat-loss' })
    const data = makeData({ mealLogs: [withMacros(60)] })
    const result = proteinProgress(profile, data, today)

    expect(result.verdict).toBe('under')
    expect(result.remaining).toBe(50)
  })

  it('recognises being in range', () => {
    const profile = makeProfile({ weightKg: 60, mainGoal: 'fat-loss' })
    const data = makeData({ mealLogs: [withMacros(120)] })
    expect(proteinProgress(profile, data, today).verdict).toBe('in-range')
  })

  it('never treats going over on protein as a failure', () => {
    const profile = makeProfile({ weightKg: 60, mainGoal: 'fat-loss' })
    const data = makeData({ mealLogs: [withMacros(200)] })
    const result = proteinProgress(profile, data, today)

    expect(result.verdict).toBe('over')
    expect(result.remaining).toBe(0)
    const message = result.message.toLowerCase()
    expect(message).toContain('no issue')
    for (const word of ['too much', 'cut', 'reduce', 'excess']) {
      expect(message).not.toContain(word)
    }
  })

  it('never produces a calorie target anywhere', () => {
    // The deliberate omission. If this ever fails, someone added a deficit.
    const profile = makeProfile({ weightKg: 60, mainGoal: 'fat-loss' })
    const data = makeData({ mealLogs: [withMacros(60, 100, 40)] })
    const result = proteinProgress(profile, data, today)

    const text = JSON.stringify(result).toLowerCase()
    expect(text).not.toContain('calorie')
    expect(text).not.toContain('kcal')
    expect(text).not.toContain('deficit')
  })

  it('does not count a meal with no protein as macro-logged', () => {
    const profile = makeProfile({ weightKg: 60 })
    const data = makeData({ mealLogs: [mealLog(today)] })
    expect(proteinProgress(profile, data, today).verdict).toBe('nothing-logged')
  })
})
