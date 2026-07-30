import { describe, expect, it } from 'vitest'
import { computeReadiness } from './readiness'
import { checkIn, symptomLog } from '../test/fixtures'

const DATE = '2026-07-30'

describe('computeReadiness', () => {
  it('assumes an average day with no check-in, and says so', () => {
    const result = computeReadiness(undefined, [], null)
    expect(result.score).toBe(100)
    expect(result.band).toBe('good')
    expect(result.reasons.join(' ')).toContain('No check-in')
  })

  it('scores a genuinely good day as good', () => {
    const result = computeReadiness(
      checkIn(DATE, { sleepHours: 8, energy: 5, soreness: 1 }),
      [],
      'follicular',
    )
    expect(result.score).toBe(100)
    expect(result.band).toBe('good')
    expect(result.reasons).toEqual([])
  })

  it('subtracts the documented amounts', () => {
    // 6.5h sleep (-10), energy 2 (-20), soreness 3 (-5), menstrual (-10).
    const result = computeReadiness(
      checkIn(DATE, { sleepHours: 6.5, energy: 2, soreness: 3 }),
      [],
      'menstrual',
    )
    expect(result.score).toBe(55)
    expect(result.band).toBe('moderate')
  })

  it('never goes below zero, however bad the day', () => {
    const result = computeReadiness(
      checkIn(DATE, { sleepHours: 3, energy: 1, soreness: 5 }),
      [symptomLog(DATE, 'cramps', 5), symptomLog(DATE, 'fatigue', 5)],
      'menstrual',
    )
    expect(result.score).toBe(0)
    expect(result.band).toBe('low')
  })

  it('treats severe cramps as worse than mild cramps', () => {
    const base = checkIn(DATE, { sleepHours: 8, energy: 4, soreness: 1 })
    const mild = computeReadiness(base, [symptomLog(DATE, 'cramps', 2)], null)
    const severe = computeReadiness(base, [symptomLog(DATE, 'cramps', 5)], null)

    expect(mild.score).toBe(90)
    expect(severe.score).toBe(75)
    expect(severe.reasons.join(' ')).toContain('severe')
  })

  it('drops to the low band on a rough day', () => {
    const result = computeReadiness(
      checkIn(DATE, { sleepHours: 5, energy: 1, soreness: 4 }),
      [],
      null,
    )
    // 100 - 25 - 30 - 15 = 30
    expect(result.score).toBe(30)
    expect(result.band).toBe('low')
  })

  it('lists a reason for everything it subtracted', () => {
    const result = computeReadiness(
      checkIn(DATE, { sleepHours: 5, energy: 1, soreness: 5 }),
      [symptomLog(DATE, 'cramps', 5)],
      'menstrual',
    )
    const reasons = result.reasons.join(' ').toLowerCase()
    expect(reasons).toContain('sleep')
    expect(reasons).toContain('energy')
    expect(reasons).toContain('soreness')
    expect(reasons).toContain('cramps')
    expect(reasons).toContain('period')
  })

  it('ignores symptoms it does not score', () => {
    const base = checkIn(DATE, { sleepHours: 8, energy: 4, soreness: 1 })
    const result = computeReadiness(base, [symptomLog(DATE, 'acne', 5)], null)
    expect(result.score).toBe(100)
  })

  it('puts band boundaries at 40 and 70', () => {
    // Boundaries are inclusive at the bottom of each band.
    expect(computeReadiness(checkIn(DATE, { sleepHours: 8, energy: 4, soreness: 4 }), [], 'menstrual').score).toBe(75)
    expect(computeReadiness(checkIn(DATE, { sleepHours: 8, energy: 4, soreness: 4 }), [], 'menstrual').band).toBe('good')
    expect(computeReadiness(checkIn(DATE, { sleepHours: 5, energy: 2, soreness: 3 }), [], null).band).toBe('moderate') // 50
  })
})
