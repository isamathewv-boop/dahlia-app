import { describe, expect, it } from 'vitest'
import type { CoachTone } from '../types'
import { buildBriefing, briefingToText, PRESETS, respondTo } from './dahlia'
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
const TONES: CoachTone[] = ['strict', 'balanced', 'gentle']

describe('buildBriefing', () => {
  it('speaks in the tone the user chose', () => {
    const said = TONES.map((coachTone) =>
      buildBriefing(makeProfile({ coachTone }), makeData(), TODAY).push,
    )
    expect(new Set(said).size).toBe(3)
  })

  it('passes safety warnings through untouched by tone', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      symptomLogs: [symptomLog(TODAY, 'cramps', 5)],
    })

    for (const coachTone of TONES) {
      const briefing = buildBriefing(makeProfile({ coachTone }), data, TODAY)
      expect(briefing.warnings.length).toBeGreaterThan(0)
      expect(briefing.warnings.join(' ').toLowerCase()).toContain('doctor')
    }
  })

  it('gives at most one correction, never a list', () => {
    // Several things wrong at once: no check-in, long gap, no food logs.
    const data = makeData({
      workoutLogs: [workoutLog('2026-07-20', { type: 'Cardio' })],
      mealLogs: [mealLog('2026-07-20')],
    })
    const briefing = buildBriefing(makeProfile(), data, TODAY)
    expect(typeof briefing.correction).toBe('string')
  })

  it('has no correction when nothing needs correcting', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
      mealLogs: [mealLog(TODAY)],
      cycleLogs: [cycleLog(TODAY, 'none')],
    })
    expect(buildBriefing(makeProfile(), data, TODAY).correction).toBeUndefined()
  })

  it('prioritises sleep debt over the workout gap', () => {
    const data = makeData({
      checkIns: [
        checkIn('2026-07-28', { sleepHours: 5 }),
        checkIn('2026-07-29', { sleepHours: 5 }),
        checkIn(TODAY, { sleepHours: 4 }),
      ],
      workoutLogs: [workoutLog('2026-07-10', { type: 'Cardio' })],
    })
    expect(buildBriefing(makeProfile(), data, TODAY).correction).toContain('Sleep')
  })

  it('reads abandoned sessions as a plan that is too long, not laziness', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [
        workoutLog(TODAY, { type: 'Cardio' }),
        workoutLog('2026-07-29', { type: 'Yoga', completed: false }),
        workoutLog('2026-07-28', { type: 'Walk', completed: false }),
      ],
    })
    const correction = buildBriefing(makeProfile(), data, TODAY).correction ?? ''
    expect(correction).toContain('too long')
    expect(correction.toLowerCase()).not.toContain('lazy')
  })

  it('asks for a check-in when the plan is guessing', () => {
    const briefing = buildBriefing(makeProfile(), makeData(), TODAY)
    expect(briefing.correction).toContain('check-in')
  })
})

describe('strict tone stays safe, not reckless', () => {
  it('never tells her to push on a low-readiness day', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY, { sleepHours: 4, energy: 1, soreness: 5 })],
    })
    const briefing = buildBriefing(makeProfile({ coachTone: 'strict' }), data, TODAY)

    expect(briefing.push.toLowerCase()).toContain('recovery')
    expect(briefing.push.toLowerCase()).not.toContain('push')
  })

  it('still gives the recovery session in every tone', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY, { sleepHours: 4, energy: 1, soreness: 5 })],
    })
    for (const coachTone of TONES) {
      const briefing = buildBriefing(makeProfile({ coachTone }), data, TODAY)
      expect(briefing.workoutLine.toLowerCase()).toContain('recovery')
    }
  })
})

describe('briefingToText', () => {
  it('includes the push and the next action', () => {
    const briefing = buildBriefing(makeProfile(), makeData(), TODAY)
    const text = briefingToText(briefing)
    expect(text).toContain(briefing.push)
    expect(text).toContain(briefing.nextAction)
  })

  it('marks warnings so they cannot be skimmed past', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      symptomLogs: [symptomLog(TODAY, 'headache', 5)],
    })
    const text = briefingToText(buildBriefing(makeProfile(), data, TODAY))
    expect(text).toContain('⚠')
  })
})

describe('respondTo — I only have 15 minutes', () => {
  it('returns a shorter session than the usual one', () => {
    const profile = makeProfile({ timeAvailable: 60 })
    const reply = respondTo('short-on-time', profile, makeData(), TODAY)
    expect(reply).toContain('15-minute')
    expect(reply).not.toContain('60-minute')
  })

  it('lists actual exercises with prescriptions', () => {
    const reply = respondTo('short-on-time', makeProfile(), makeData(), TODAY)
    expect(reply).toContain('•')
  })

  it('still respects low readiness', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY, { sleepHours: 4, energy: 1, soreness: 5 })],
    })
    const reply = respondTo('short-on-time', makeProfile(), data, TODAY)
    expect(reply.toLowerCase()).toContain('recovery')
  })
})

describe('respondTo — I have cramps', () => {
  it('downgrades intensity rather than refusing to help', () => {
    const reply = respondTo('cramps', makeProfile(), makeData(), TODAY)
    expect(reply.toLowerCase()).toMatch(/intensity|easy|gentle/)
  })

  it('tells her to log it when she has not', () => {
    const reply = respondTo('cramps', makeProfile(), makeData(), TODAY)
    expect(reply).toContain('Cycle page')
  })

  it('does not tell her to log it again when she already has', () => {
    const data = makeData({ symptomLogs: [symptomLog(TODAY, 'cramps', 3)] })
    const reply = respondTo('cramps', makeProfile(), data, TODAY)
    expect(reply).toContain('already accounts for it')
  })

  it('escalates to a doctor at severity 5, in every tone', () => {
    const data = makeData({ symptomLogs: [symptomLog(TODAY, 'cramps', 5)] })
    for (const coachTone of TONES) {
      const reply = respondTo('cramps', makeProfile({ coachTone }), data, TODAY)
      expect(reply.toLowerCase()).toContain('doctor')
      expect(reply.toLowerCase()).toContain('rest')
    }
  })

  it('never suggests training through severe pain', () => {
    const data = makeData({ symptomLogs: [symptomLog(TODAY, 'cramps', 5)] })
    const reply = respondTo('cramps', makeProfile({ coachTone: 'strict' }), data, TODAY)
    expect(reply.toLowerCase()).not.toContain('push through')
  })
})

describe('respondTo — I ate way too much', () => {
  // This is the most safety-sensitive reply in the app. Framing food as a debt
  // to work off is the pattern that turns tracking into disordered eating.
  it('never prescribes exercise as compensation, in any tone', () => {
    for (const coachTone of TONES) {
      const reply = respondTo('binged', makeProfile({ coachTone }), makeData(), TODAY)
      expect(reply).toContain('make up for it')
      expect(reply.toLowerCase()).toContain('what not to do')
    }
  })

  it('never tells her to skip a meal or cut tomorrow', () => {
    const reply = respondTo('binged', makeProfile(), makeData(), TODAY)
    expect(reply).toContain('eat your next meal normally')
  })

  it('does not shame, even on the strict setting', () => {
    const reply = respondTo('binged', makeProfile({ coachTone: 'strict' }), makeData(), TODAY)
    const shaming = ['lazy', 'greedy', 'disgrace', 'failure', 'weak', 'no excuse']
    for (const word of shaming) {
      expect(reply.toLowerCase()).not.toContain(word)
    }
  })

  it('points toward real help when it is a pattern', () => {
    const reply = respondTo('binged', makeProfile(), makeData(), TODAY)
    expect(reply.toLowerCase()).toContain('professional')
    expect(reply.toLowerCase()).toContain('not a discipline problem')
  })

  it('gives no calorie arithmetic', () => {
    const reply = respondTo('binged', makeProfile(), makeData(), TODAY)
    expect(reply).not.toMatch(/\d+\s*(kcal|calories)/i)
  })
})

describe('respondTo — I have skipped a few days', () => {
  it('names the gap without moralising', () => {
    const data = makeData({
      workoutLogs: [workoutLog('2026-07-25', { type: 'Cardio' })],
    })
    const reply = respondTo('skipped', makeProfile(), data, TODAY)
    expect(reply).toContain('5 days')
    expect(reply.toLowerCase()).toContain('re-entry')
  })

  it('handles someone who has never logged a workout', () => {
    const reply = respondTo('skipped', makeProfile(), makeData(), TODAY)
    expect(reply.toLowerCase()).toContain('no streak to rescue')
  })

  it('suggests coming back shorter, not doubling up', () => {
    const profile = makeProfile({ timeAvailable: 60 })
    const data = makeData({
      workoutLogs: [workoutLog('2026-07-20', { type: 'Cardio' })],
    })
    const reply = respondTo('skipped', profile, data, TODAY)
    expect(reply).toContain('30 minutes')
    expect(reply.toLowerCase()).toContain('nothing to catch up on')
  })
})

describe('respondTo — plan my week', () => {
  it('returns seven days', () => {
    const reply = respondTo('plan-week', makeProfile(), makeData(), TODAY)
    expect(reply.split('•')).toHaveLength(8) // 7 bullets plus the text before
  })

  it('includes recovery days', () => {
    const reply = respondTo('plan-week', makeProfile(), makeData(), TODAY)
    expect(reply).toContain('Recovery')
  })

  it('softens heavy days that collide with a predicted period', () => {
    // Period starts in two days, so the week runs into it.
    const profile = makeProfile({
      lastPeriodDate: '2026-07-04',
      cycleLength: 28,
      periodLength: 5,
      mainGoal: 'fat-loss',
    })
    const reply = respondTo('plan-week', profile, makeData(), TODAY)
    expect(reply).toContain('period expected')
  })

  it('says the week is a shape, not a promise', () => {
    const reply = respondTo('plan-week', makeProfile(), makeData(), TODAY)
    expect(reply.toLowerCase()).toContain('overrides')
  })
})

describe('presets', () => {
  it('every preset produces a non-empty reply for a brand new user', () => {
    for (const preset of PRESETS) {
      const reply = respondTo(preset.intent, makeProfile(), makeData(), TODAY)
      expect(reply.length).toBeGreaterThan(20)
    }
  })

  it('every preset works in every tone', () => {
    for (const preset of PRESETS) {
      for (const coachTone of TONES) {
        const reply = respondTo(
          preset.intent,
          makeProfile({ coachTone }),
          makeData(),
          TODAY,
        )
        expect(reply).toBeTruthy()
      }
    }
  })
})
