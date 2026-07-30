import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysBetween,
  formatDate,
  fromISODate,
  toISODate,
} from './date'

describe('toISODate', () => {
  it('uses local calendar date, not UTC', () => {
    // Just after local midnight. A UTC-based conversion would report the
    // previous day in any timezone ahead of UTC.
    expect(toISODate(new Date(2026, 6, 30, 0, 30))).toBe('2026-07-30')
    // Just before local midnight — the mirror-image failure for timezones
    // behind UTC.
    expect(toISODate(new Date(2026, 6, 30, 23, 30))).toBe('2026-07-30')
  })

  it('pads single-digit months and days', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('fromISODate', () => {
  it('round-trips with toISODate', () => {
    expect(toISODate(fromISODate('2026-02-29'))).toBe('2026-03-01') // 2026 isn't a leap year
    expect(toISODate(fromISODate('2026-12-31'))).toBe('2026-12-31')
  })

  it('returns local midnight', () => {
    const date = fromISODate('2026-07-30')
    expect(date.getHours()).toBe(0)
    expect(date.getDate()).toBe(30)
  })
})

describe('daysBetween', () => {
  it('counts whole days forward', () => {
    expect(daysBetween('2026-07-27', '2026-07-30')).toBe(3)
  })

  it('is zero for the same day', () => {
    expect(daysBetween('2026-07-30', '2026-07-30')).toBe(0)
  })

  it('is negative going backwards', () => {
    expect(daysBetween('2026-07-30', '2026-07-27')).toBe(-3)
  })

  it('crosses month and year boundaries', () => {
    expect(daysBetween('2026-07-30', '2026-08-02')).toBe(3)
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3)
  })
})

describe('addDays', () => {
  it('adds and subtracts across boundaries', () => {
    expect(addDays('2026-07-30', 3)).toBe('2026-08-02')
    expect(addDays('2026-08-02', -3)).toBe('2026-07-30')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('adds a full cycle', () => {
    expect(addDays('2026-07-27', 28)).toBe('2026-08-24')
  })
})

describe('formatDate', () => {
  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })

  it('includes the day number', () => {
    expect(formatDate('2026-07-30')).toContain('30')
  })
})
