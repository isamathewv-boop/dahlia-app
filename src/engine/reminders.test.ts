import { describe, expect, it } from 'vitest'
import type { ReminderSettings } from '../types'
import {
  dueReminders,
  recordFired,
  timeOfDay,
  undeliveredReminders,
} from './reminders'
import { checkIn, cycleLog, makeData, mealLog, workoutLog } from '../test/fixtures'

const TODAY = '2026-07-30'
/** 30 July 2026, local time. Month is zero-based. */
const at = (hour: number, minute = 0) => new Date(2026, 6, 30, hour, minute)

const settings = (overrides: Partial<ReminderSettings> = {}): ReminderSettings => ({
  enabled: true,
  checkInTime: '08:00',
  eveningTime: '20:00',
  lastFired: [],
  ...overrides,
})

describe('timeOfDay', () => {
  it('zero-pads so times compare correctly as strings', () => {
    expect(timeOfDay(at(9, 5))).toBe('09:05')
    expect(timeOfDay(at(20, 0))).toBe('20:00')
    // The bug this guards: '9:05' > '20:00' as a string comparison.
    expect(timeOfDay(at(9, 5)) < timeOfDay(at(20, 0))).toBe(true)
  })
})

describe('dueReminders — the check-in nudge', () => {
  it('says nothing when reminders are switched off', () => {
    expect(dueReminders(settings({ enabled: false }), makeData(), at(9))).toEqual([])
  })

  it('stays quiet before the chosen time', () => {
    expect(dueReminders(settings(), makeData(), at(7, 59))).toEqual([])
  })

  it('fires once the time has passed and there is no check-in', () => {
    const due = dueReminders(settings(), makeData(), at(8, 1))
    expect(due).toHaveLength(1)
    expect(due[0].kind).toBe('check-in')
  })

  it('goes away the moment she checks in', () => {
    // The whole point: never nag about something already done.
    const data = makeData({ checkIns: [checkIn(TODAY)] })
    expect(dueReminders(settings(), data, at(9))).toEqual([])
  })

  it('ignores a check-in from a different day', () => {
    const data = makeData({ checkIns: [checkIn('2026-07-29')] })
    const due = dueReminders(settings(), data, at(9))
    expect(due.map((r) => r.kind)).toContain('check-in')
  })

  it('respects a custom time', () => {
    const late = settings({ checkInTime: '11:30' })
    expect(dueReminders(late, makeData(), at(11, 0))).toEqual([])
    expect(dueReminders(late, makeData(), at(11, 30))).toHaveLength(1)
  })
})

describe('dueReminders — the evening nudge', () => {
  const evening = at(20, 30)

  it('fires when the day is completely blank', () => {
    const due = dueReminders(settings(), makeData(), evening)
    expect(due.map((r) => r.kind)).toContain('log-day')
  })

  it('is satisfied by a meal', () => {
    const data = makeData({ mealLogs: [mealLog(TODAY)] })
    expect(dueReminders(settings(), data, evening).map((r) => r.kind)).not.toContain(
      'log-day',
    )
  })

  it('is satisfied by a workout', () => {
    const data = makeData({ workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })] })
    expect(dueReminders(settings(), data, evening).map((r) => r.kind)).not.toContain(
      'log-day',
    )
  })

  it('is satisfied by a cycle entry', () => {
    const data = makeData({ cycleLogs: [cycleLog(TODAY, 'none')] })
    expect(dueReminders(settings(), data, evening).map((r) => r.kind)).not.toContain(
      'log-day',
    )
  })

  it('can be due at the same time as the check-in nudge', () => {
    const due = dueReminders(settings(), makeData(), evening)
    expect(due.map((r) => r.kind).sort()).toEqual(['check-in', 'log-day'])
  })

  it('leaves only the evening one when she checked in but logged nothing', () => {
    const data = makeData({ checkIns: [checkIn(TODAY)] })
    const due = dueReminders(settings(), data, evening)
    expect(due.map((r) => r.kind)).toEqual(['log-day'])
  })
})

describe('undeliveredReminders', () => {
  it('matches dueReminders when nothing has been delivered', () => {
    expect(undeliveredReminders(settings(), makeData(), at(9))).toHaveLength(1)
  })

  it('drops one already delivered today', () => {
    const fired = settings({ lastFired: [`${TODAY}:check-in`] })
    expect(undeliveredReminders(fired, makeData(), at(9))).toEqual([])
  })

  it('still delivers a different reminder on the same day', () => {
    const fired = settings({ lastFired: [`${TODAY}:check-in`] })
    const due = undeliveredReminders(fired, makeData(), at(20, 30))
    expect(due.map((r) => r.kind)).toEqual(['log-day'])
  })

  it('does not suppress today because of yesterday’s delivery', () => {
    const fired = settings({ lastFired: ['2026-07-29:check-in'] })
    expect(undeliveredReminders(fired, makeData(), at(9))).toHaveLength(1)
  })

  it('leaves the banner showing even after the notification fired', () => {
    // dueReminders ignores lastFired on purpose, so the in-app banner persists
    // while the task is still outstanding.
    const fired = settings({ lastFired: [`${TODAY}:check-in`] })
    expect(dueReminders(fired, makeData(), at(9))).toHaveLength(1)
  })
})

describe('recordFired', () => {
  it('records a delivery', () => {
    const next = recordFired(settings(), [`${TODAY}:check-in`], at(9))
    expect(next.lastFired).toEqual([`${TODAY}:check-in`])
  })

  it('does not duplicate a key', () => {
    const existing = settings({ lastFired: [`${TODAY}:check-in`] })
    const next = recordFired(existing, [`${TODAY}:check-in`], at(9))
    expect(next.lastFired).toEqual([`${TODAY}:check-in`])
  })

  it('prunes keys from previous days so storage cannot grow forever', () => {
    const stale = settings({
      lastFired: ['2026-07-01:check-in', '2026-07-29:log-day'],
    })
    const next = recordFired(stale, [`${TODAY}:check-in`], at(9))
    expect(next.lastFired).toEqual([`${TODAY}:check-in`])
  })

  it('leaves the rest of the settings alone', () => {
    const next = recordFired(settings({ checkInTime: '07:15' }), [], at(9))
    expect(next.enabled).toBe(true)
    expect(next.checkInTime).toBe('07:15')
  })
})
