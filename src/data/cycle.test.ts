import { describe, expect, it } from 'vitest'
import { currentPhase, cycleDay, lastPeriodStart, nextPeriodDate } from './cycle'
import { cycleLog, makeProfile } from '../test/fixtures'

describe('lastPeriodStart', () => {
  it('falls back to the onboarding date when nothing is logged', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-27' })
    expect(lastPeriodStart(profile, [])).toBe('2026-07-27')
  })

  it('returns null when there is no date and no logs', () => {
    const profile = makeProfile({ lastPeriodDate: '' })
    expect(lastPeriodStart(profile, [])).toBeNull()
  })

  // This is the regression test for a real bug: logging bleeding partway
  // through a period used to look like a brand new period starting, which
  // reset the cycle day to 1 and predicted the next period as today.
  it('treats a mid-period logged day as the same period, not a new one', () => {
    const profile = makeProfile({
      lastPeriodDate: '2026-07-27',
      periodLength: 5,
    })
    const logs = [cycleLog('2026-07-30', 'heavy')]

    expect(lastPeriodStart(profile, logs)).toBe('2026-07-27')
    expect(cycleDay(profile, logs, '2026-07-30')).toBe(4)
  })

  it('groups a run of logged bleeding days into one period', () => {
    const profile = makeProfile({ lastPeriodDate: '', periodLength: 5 })
    const logs = [
      cycleLog('2026-07-27', 'heavy'),
      cycleLog('2026-07-28', 'medium'),
      cycleLog('2026-07-29', 'light'),
    ]
    expect(lastPeriodStart(profile, logs)).toBe('2026-07-27')
  })

  it('bridges a gap where the user forgot to log', () => {
    const profile = makeProfile({ lastPeriodDate: '', periodLength: 5 })
    // Nothing logged on the 28th or 29th.
    const logs = [cycleLog('2026-07-27', 'heavy'), cycleLog('2026-07-30', 'light')]
    expect(lastPeriodStart(profile, logs)).toBe('2026-07-27')
  })

  it('detects a genuinely new period a full cycle later', () => {
    const profile = makeProfile({
      lastPeriodDate: '2026-07-27',
      periodLength: 5,
    })
    const logs = [
      cycleLog('2026-07-27', 'heavy'),
      cycleLog('2026-08-24', 'heavy'),
    ]
    expect(lastPeriodStart(profile, logs)).toBe('2026-08-24')
    expect(cycleDay(profile, logs, '2026-08-24')).toBe(1)
  })

  it('ignores spotting and no-bleeding days as period starts', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-27' })
    const logs = [
      cycleLog('2026-08-10', 'spotting'),
      cycleLog('2026-08-11', 'none'),
    ]
    expect(lastPeriodStart(profile, logs)).toBe('2026-07-27')
  })
})

describe('cycleDay', () => {
  it('counts day 1 as the first day of the period', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-30' })
    expect(cycleDay(profile, [], '2026-07-30')).toBe(1)
  })

  it('counts forward through the cycle', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-01' })
    expect(cycleDay(profile, [], '2026-07-13')).toBe(13)
  })

  it('wraps when more than one cycle has passed with nothing logged', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-01', cycleLength: 28 })
    // 30 days later is day 3 of the following cycle.
    expect(cycleDay(profile, [], '2026-07-31')).toBe(3)
  })

  it('returns null for a date before the period started', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-30' })
    expect(cycleDay(profile, [], '2026-07-29')).toBeNull()
  })

  it('returns null with no cycle information at all', () => {
    expect(cycleDay(makeProfile({ lastPeriodDate: '' }), [], '2026-07-30')).toBeNull()
  })
})

describe('nextPeriodDate', () => {
  it('is one cycle after the last start', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-27', cycleLength: 28 })
    expect(nextPeriodDate(profile, [], '2026-07-30')).toBe('2026-08-24')
  })

  it('never predicts the next period as today', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-30' })
    expect(nextPeriodDate(profile, [], '2026-07-30')).toBe('2026-08-27')
  })

  it('rolls forward past several missed cycles', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-01-01', cycleLength: 30 })
    const predicted = nextPeriodDate(profile, [], '2026-07-30')
    expect(predicted).not.toBeNull()
    expect(predicted! > '2026-07-30').toBe(true)
  })
})

describe('currentPhase', () => {
  const profile = makeProfile({
    lastPeriodDate: '2026-07-01',
    cycleLength: 28,
    periodLength: 5,
  })

  it('is menstrual during the bleeding days', () => {
    expect(currentPhase(profile, [], '2026-07-01')).toBe('menstrual') // day 1
    expect(currentPhase(profile, [], '2026-07-05')).toBe('menstrual') // day 5
  })

  it('is follicular after the period and before ovulation', () => {
    expect(currentPhase(profile, [], '2026-07-06')).toBe('follicular') // day 6
  })

  it('is the ovulation window around 14 days before the next period', () => {
    // cycleLength 28 puts ovulation at day 14, with a day either side.
    expect(currentPhase(profile, [], '2026-07-13')).toBe('ovulation') // day 13
    expect(currentPhase(profile, [], '2026-07-14')).toBe('ovulation') // day 14
    expect(currentPhase(profile, [], '2026-07-15')).toBe('ovulation') // day 15
  })

  it('is luteal after ovulation', () => {
    expect(currentPhase(profile, [], '2026-07-16')).toBe('luteal') // day 16
  })

  it('shifts the ovulation window on a longer cycle', () => {
    const longCycle = makeProfile({
      lastPeriodDate: '2026-07-01',
      cycleLength: 35,
      periodLength: 5,
    })
    // Ovulation moves to day 21.
    expect(currentPhase(longCycle, [], '2026-07-21')).toBe('ovulation')
    expect(currentPhase(longCycle, [], '2026-07-14')).toBe('follicular')
  })

  it('is null without cycle information', () => {
    const blank = makeProfile({ lastPeriodDate: '' })
    expect(currentPhase(blank, [], '2026-07-30')).toBeNull()
  })
})
