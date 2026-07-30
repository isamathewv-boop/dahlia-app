import { describe, expect, it } from 'vitest'
import { createEmptyData, parseImport, serializeData } from './storage'
import {
  checkIn,
  cycleLog,
  makeData,
  makeProfile,
  mealLog,
  symptomLog,
  workoutLog,
} from '../test/fixtures'

const fullData = makeData({
  profile: makeProfile({ name: 'Leanne' }),
  cycleLogs: [cycleLog('2026-07-30', 'heavy')],
  symptomLogs: [symptomLog('2026-07-30', 'cramps', 4)],
  workoutLogs: [workoutLog('2026-07-30', { type: 'Cardio' })],
  mealLogs: [mealLog('2026-07-30')],
  checkIns: [checkIn('2026-07-30')],
})

describe('serializeData', () => {
  it('round-trips every field through parseImport', () => {
    const restored = parseImport(serializeData(fullData))
    expect(restored).toEqual(fullData)
  })

  it('produces readable, indented JSON', () => {
    expect(serializeData(fullData)).toContain('\n  ')
  })

  it('labels the file so it can be recognised later', () => {
    const parsed = JSON.parse(serializeData(fullData))
    expect(parsed.format).toBe('dahlia-export')
    expect(parsed.version).toBe(1)
    expect(parsed.exportedAt).toBeTruthy()
  })

  it('handles a brand new user with nothing logged', () => {
    expect(parseImport(serializeData(createEmptyData()))).toEqual(createEmptyData())
  })
})

describe('parseImport — rejecting bad files', () => {
  it('rejects invalid JSON', () => {
    expect(parseImport('not json at all')).toBeNull()
    expect(parseImport('')).toBeNull()
  })

  it('rejects JSON that is not an object', () => {
    expect(parseImport('42')).toBeNull()
    expect(parseImport('"a string"')).toBeNull()
    expect(parseImport('null')).toBeNull()
  })

  it('rejects an unrelated JSON file', () => {
    expect(parseImport('{"name":"package","version":"1.0.0"}')).toBeNull()
  })

  it('rejects a file where a log collection is the wrong type', () => {
    expect(parseImport('{"cycleLogs":"lots"}')).toBeNull()
    expect(parseImport('{"workoutLogs":{}}')).toBeNull()
  })

  it('rejects a file where the profile is the wrong type', () => {
    expect(parseImport('{"profile":"Leanne"}')).toBeNull()
  })

  it('accepts an explicitly null profile', () => {
    const result = parseImport('{"profile":null,"cycleLogs":[]}')
    expect(result).not.toBeNull()
    expect(result!.profile).toBeNull()
  })
})

describe('parseImport — filling gaps', () => {
  it('accepts a bare AppData object as well as the wrapped export', () => {
    const bare = JSON.stringify(fullData)
    expect(parseImport(bare)).toEqual(fullData)
  })

  it('fills in collections missing from an older export', () => {
    // An export written before checkIns existed must still import cleanly.
    const older = JSON.stringify({
      format: 'dahlia-export',
      version: 1,
      data: { profile: null, cycleLogs: [cycleLog('2026-07-30', 'light')] },
    })

    const restored = parseImport(older)
    expect(restored).not.toBeNull()
    expect(restored!.checkIns).toEqual([])
    expect(restored!.mealLogs).toEqual([])
    expect(restored!.cycleLogs).toHaveLength(1)
  })

  it('gives each import its own arrays', () => {
    // These arrays come from the blank slate, not from the file. If the blank
    // slate were a shared constant, both imports would alias the same arrays
    // and a single push would corrupt every future blank state.
    const first = parseImport('{"profile":null}')!
    const second = parseImport('{"profile":null}')!

    first.cycleLogs.push(cycleLog('2026-07-30', 'light'))

    expect(second.cycleLogs).toEqual([])
    expect(createEmptyData().cycleLogs).toEqual([])
  })

  it('gives each blank slate its own arrays', () => {
    const a = createEmptyData()
    a.workoutLogs.push(workoutLog('2026-07-30'))
    expect(createEmptyData().workoutLogs).toEqual([])
  })
})
