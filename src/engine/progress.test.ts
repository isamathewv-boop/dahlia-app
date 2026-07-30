import { describe, expect, it } from 'vitest'
import {
  buildProgress,
  computeStreak,
  cyclePattern,
  weeklyBuckets,
  windowStats,
} from './progress'
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

describe('computeStreak', () => {
  it('is zero for a brand new user', () => {
    const streak = computeStreak(makeData(), TODAY)
    expect(streak).toEqual({ current: 0, longest: 0, lastActiveDate: null })
  })

  it('counts consecutive days ending today', () => {
    const data = makeData({
      checkIns: [
        checkIn('2026-07-28'),
        checkIn('2026-07-29'),
        checkIn('2026-07-30'),
      ],
    })
    expect(computeStreak(data, TODAY).current).toBe(3)
  })

  it('survives when the last log was yesterday, since today is not over', () => {
    const data = makeData({
      checkIns: [checkIn('2026-07-28'), checkIn('2026-07-29')],
    })
    expect(computeStreak(data, TODAY).current).toBe(2)
  })

  it('breaks once two days have passed', () => {
    const data = makeData({ checkIns: [checkIn('2026-07-28')] })
    expect(computeStreak(data, TODAY).current).toBe(0)
  })

  it('remembers the longest run even after it breaks', () => {
    const data = makeData({
      checkIns: [
        checkIn('2026-07-01'),
        checkIn('2026-07-02'),
        checkIn('2026-07-03'),
        checkIn('2026-07-04'),
        // gap
        checkIn('2026-07-30'),
      ],
    })
    const streak = computeStreak(data, TODAY)
    expect(streak.longest).toBe(4)
    expect(streak.current).toBe(1)
  })

  it('counts a rest day with only a meal logged', () => {
    // A streak that only counted workouts would punish prescribed recovery.
    const data = makeData({
      workoutLogs: [workoutLog('2026-07-29', { type: 'Cardio' })],
      mealLogs: [mealLog('2026-07-30')],
    })
    expect(computeStreak(data, TODAY).current).toBe(2)
  })

  it('does not double-count a day logged in several ways', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
      mealLogs: [mealLog(TODAY)],
      cycleLogs: [cycleLog(TODAY, 'none')],
    })
    expect(computeStreak(data, TODAY).current).toBe(1)
  })

  it('ignores logs dated in the future', () => {
    const data = makeData({ checkIns: [checkIn('2026-08-15')] })
    expect(computeStreak(data, TODAY).current).toBe(0)
  })
})

describe('windowStats', () => {
  const data = makeData({
    workoutLogs: [
      workoutLog(TODAY, { type: 'Cardio', durationMinutes: 30 }),
      workoutLog('2026-07-28', { type: 'Yoga', durationMinutes: 20 }),
      workoutLog('2026-07-27', { type: 'Walk', completed: false, durationMinutes: 45 }),
      workoutLog('2026-07-01', { type: 'Cardio', durationMinutes: 60 }), // outside 7d
    ],
    mealLogs: [
      mealLog(TODAY, { slot: 'breakfast' }),
      mealLog(TODAY, { slot: 'lunch' }),
      mealLog('2026-07-29', { slot: 'dinner' }),
    ],
    checkIns: [
      checkIn(TODAY, { sleepHours: 7, energy: 4 }),
      checkIn('2026-07-29', { sleepHours: 5, energy: 2 }),
    ],
  })

  it('covers the right span of days', () => {
    const stats = windowStats(data, 7, TODAY)
    expect(stats.from).toBe('2026-07-24')
    expect(stats.to).toBe(TODAY)
  })

  it('counts completed and abandoned separately', () => {
    const stats = windowStats(data, 7, TODAY)
    expect(stats.workoutsCompleted).toBe(2)
    expect(stats.workoutsAbandoned).toBe(1)
  })

  it('sums minutes from completed sessions only', () => {
    // The abandoned 45-minute walk must not count.
    expect(windowStats(data, 7, TODAY).workoutMinutes).toBe(50)
  })

  it('separates meals logged from days with meals', () => {
    const stats = windowStats(data, 7, TODAY)
    expect(stats.mealsLogged).toBe(3)
    expect(stats.daysWithMeals).toBe(2)
  })

  it('averages sleep and energy across check-ins', () => {
    const stats = windowStats(data, 7, TODAY)
    expect(stats.averageSleep).toBe(6)
    expect(stats.averageEnergy).toBe(3)
  })

  it('reports null averages rather than zero when nothing is logged', () => {
    // Zero hours of sleep is a claim; null is the truth.
    const stats = windowStats(makeData(), 7, TODAY)
    expect(stats.averageSleep).toBeNull()
    expect(stats.averageEnergy).toBeNull()
  })

  it('widens correctly to 28 days', () => {
    const stats = windowStats(data, 28, TODAY)
    expect(stats.from).toBe('2026-07-03')
    expect(stats.workoutsCompleted).toBe(2)
  })
})

describe('weeklyBuckets', () => {
  it('returns the requested number of buckets, oldest first', () => {
    const buckets = weeklyBuckets(makeData(), 4, TODAY)
    expect(buckets).toHaveLength(4)
    expect(buckets[3].to).toBe(TODAY)
    expect(buckets[0].from < buckets[3].from).toBe(true)
  })

  it('does not overlap buckets', () => {
    const buckets = weeklyBuckets(makeData(), 4, TODAY)
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].from > buckets[i - 1].to).toBe(true)
    }
  })

  it('puts each workout in exactly one bucket', () => {
    const data = makeData({
      workoutLogs: [
        workoutLog(TODAY, { type: 'Cardio' }),
        workoutLog('2026-07-20', { type: 'Yoga' }),
        workoutLog('2026-07-10', { type: 'Walk' }),
      ],
    })
    const buckets = weeklyBuckets(data, 4, TODAY)
    const total = buckets.reduce((sum, b) => sum + b.workoutsCompleted, 0)
    expect(total).toBe(3)
  })
})

describe('cyclePattern', () => {
  it('admits it cannot compute cycle length from one period', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-01' })
    const pattern = cyclePattern(profile, makeData())

    expect(pattern.periodsLogged).toBe(1)
    expect(pattern.enoughForCycleLength).toBe(false)
    expect(pattern.averageCycleLength).toBeNull()
  })

  it('measures cycle length between two logged period starts', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-01', periodLength: 5 })
    const data = makeData({ cycleLogs: [cycleLog('2026-07-28', 'heavy')] })

    const pattern = cyclePattern(profile, data)
    expect(pattern.observedCycleLengths).toEqual([27])
    expect(pattern.averageCycleLength).toBe(27)
    expect(pattern.enoughForCycleLength).toBe(true)
  })

  it('reports the range across several cycles', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-05-01', periodLength: 5 })
    const data = makeData({
      cycleLogs: [
        cycleLog('2026-05-29', 'heavy'), // 28
        cycleLog('2026-06-24', 'heavy'), // 26
        cycleLog('2026-07-25', 'heavy'), // 31
      ],
    })

    const pattern = cyclePattern(profile, data)
    expect(pattern.observedCycleLengths).toEqual([28, 26, 31])
    expect(pattern.shortestCycle).toBe(26)
    expect(pattern.longestCycle).toBe(31)
    expect(pattern.averageCycleLength).toBe(28.3)
  })

  it('keeps the stated cycle length alongside the observed one', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-01', cycleLength: 30 })
    expect(cyclePattern(profile, makeData()).statedCycleLength).toBe(30)
  })

  it('measures period length only from actually logged bleeding days', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-01', periodLength: 5 })
    const data = makeData({
      cycleLogs: [
        cycleLog('2026-07-28', 'heavy'),
        cycleLog('2026-07-29', 'medium'),
        cycleLog('2026-07-30', 'light'),
      ],
    })
    // The July 1 span has no logged days, so only the 3-day span counts.
    expect(cyclePattern(profile, data).averagePeriodLength).toBe(3)
  })

  it('reports no period length when only the onboarding date exists', () => {
    const profile = makeProfile({ lastPeriodDate: '2026-07-01' })
    expect(cyclePattern(profile, makeData()).averagePeriodLength).toBeNull()
  })

  it('ranks symptoms by how often they appear', () => {
    const data = makeData({
      symptomLogs: [
        symptomLog('2026-07-28', 'cramps', 4),
        symptomLog('2026-07-29', 'cramps', 2),
        symptomLog('2026-07-30', 'cramps', 3),
        symptomLog('2026-07-29', 'bloating', 2),
      ],
    })
    const pattern = cyclePattern(makeProfile(), data)

    expect(pattern.topSymptoms[0].symptom).toBe('cramps')
    expect(pattern.topSymptoms[0].count).toBe(3)
    expect(pattern.topSymptoms[0].averageSeverity).toBe(3)
    expect(pattern.topSymptoms[1].symptom).toBe('bloating')
  })

  it('shows at most five symptoms', () => {
    const data = makeData({
      symptomLogs: [
        symptomLog('2026-07-30', 'cramps', 3),
        symptomLog('2026-07-30', 'bloating', 3),
        symptomLog('2026-07-30', 'fatigue', 3),
        symptomLog('2026-07-30', 'headache', 3),
        symptomLog('2026-07-30', 'nausea', 3),
        symptomLog('2026-07-30', 'acne', 3),
      ],
    })
    expect(cyclePattern(makeProfile(), data).topSymptoms).toHaveLength(5)
  })

  it('has nothing to say with no cycle data at all', () => {
    const profile = makeProfile({ lastPeriodDate: '' })
    const pattern = cyclePattern(profile, makeData())
    expect(pattern.periodsLogged).toBe(0)
    expect(pattern.topSymptoms).toEqual([])
  })
})

describe('buildProgress takeaway', () => {
  const takeawayFor = (data: Parameters<typeof buildProgress>[1]) =>
    buildProgress(makeProfile(), data, TODAY).takeaway

  it('tells a new user to log something', () => {
    expect(takeawayFor(makeData()).toLowerCase()).toContain('nothing logged')
  })

  it('calls out logging without checking in', () => {
    const data = makeData({ mealLogs: [mealLog(TODAY)] })
    expect(takeawayFor(data).toLowerCase()).toContain('never checked in')
  })

  it('calls out a week with no sessions', () => {
    const data = makeData({ checkIns: [checkIn(TODAY)] })
    expect(takeawayFor(data).toLowerCase()).toContain('no sessions completed')
  })

  it('reads repeated abandonment as a sizing problem', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [
        workoutLog(TODAY, { type: 'Cardio' }),
        workoutLog('2026-07-29', { type: 'Yoga', completed: false }),
        workoutLog('2026-07-28', { type: 'Walk', completed: false }),
      ],
    })
    expect(takeawayFor(data).toLowerCase()).toContain('sizing problem')
  })

  it('notes when training is logged but food is not', () => {
    const data = makeData({
      checkIns: [checkIn(TODAY)],
      workoutLogs: [workoutLog(TODAY, { type: 'Cardio' })],
    })
    expect(takeawayFor(data).toLowerCase()).toContain('training is the easy half')
  })

  it('credits a genuinely consistent week', () => {
    const days = [24, 25, 26, 27, 28, 29, 30].map((d) => `2026-07-${d}`)
    const data = makeData({
      checkIns: days.map((date) => checkIn(date)),
      mealLogs: days.map((date) => mealLog(date)),
      workoutLogs: days
        .slice(0, 4)
        .map((date) => workoutLog(date, { type: 'Cardio' })),
    })
    expect(takeawayFor(data).toLowerCase()).toContain('consistent')
  })
})

describe('buildProgress', () => {
  it('assembles every section', () => {
    const summary = buildProgress(makeProfile(), makeData(), TODAY)
    expect(summary.streak).toBeDefined()
    expect(summary.last7.days).toBe(7)
    expect(summary.last28.days).toBe(28)
    expect(summary.weeks).toHaveLength(4)
    expect(summary.cycle).toBeDefined()
    expect(summary.takeaway).toBeTruthy()
  })

  it('is stable for the same inputs', () => {
    const data = makeData({ checkIns: [checkIn(TODAY)] })
    expect(buildProgress(makeProfile(), data, TODAY)).toEqual(
      buildProgress(makeProfile(), data, TODAY),
    )
  })
})
