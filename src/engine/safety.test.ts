import { describe, expect, it } from 'vitest'
import { buildSafety } from './safety'
import { makeProfile, symptomLog } from '../test/fixtures'

const DATE = '2026-07-30'
const joined = (notes: string[]) => notes.join(' ').toLowerCase()

describe('buildSafety', () => {
  it('says nothing when there is nothing to say', () => {
    expect(buildSafety(makeProfile(), [], 10)).toEqual([])
  })

  it('escalates severity-5 symptoms toward a doctor', () => {
    const notes = buildSafety(makeProfile(), [symptomLog(DATE, 'cramps', 5)], 3)
    expect(notes).toHaveLength(1)
    expect(joined(notes)).toContain('doctor')
    expect(joined(notes)).toContain('cramps')
  })

  it('does not escalate symptoms below severity 5', () => {
    expect(buildSafety(makeProfile(), [symptomLog(DATE, 'cramps', 4)], 3)).toEqual([])
  })

  it('flags a period more than a week late', () => {
    const profile = makeProfile({ cycleLength: 28 })
    // Day 36 is 8 days past the expected 28.
    const notes = buildSafety(profile, [], 36)
    expect(joined(notes)).toContain('later than')
  })

  it('does not flag a period only slightly late', () => {
    const profile = makeProfile({ cycleLength: 28 })
    expect(buildSafety(profile, [], 33)).toEqual([])
  })

  it('names conditions that make the advice conservative', () => {
    const profile = makeProfile({ healthConditions: ['PCOS', 'Anemia'] })
    const notes = buildSafety(profile, [], 10)
    expect(joined(notes)).toContain('pcos')
    expect(joined(notes)).toContain('anemia')
    expect(joined(notes)).toContain('doctor')
  })

  it('adds a separate note about injuries', () => {
    const profile = makeProfile({ healthConditions: ['Injury'] })
    const notes = buildSafety(profile, [], 10)
    expect(joined(notes)).toContain('high-impact')
  })

  it('stacks every applicable note', () => {
    const profile = makeProfile({
      cycleLength: 28,
      healthConditions: ['PCOS', 'Injury'],
    })
    const notes = buildSafety(profile, [symptomLog(DATE, 'headache', 5)], 40)
    // Severe symptom, late period, condition boundary, injury.
    expect(notes).toHaveLength(4)
  })

  it('handles a null cycle day without inventing a late-period warning', () => {
    const notes = buildSafety(makeProfile(), [], null)
    expect(joined(notes)).not.toContain('later than')
  })

  it('acknowledges a custom "Other" condition instead of silently dropping it', () => {
    const profile = makeProfile({ healthConditions: ['asthma'] })
    const notes = buildSafety(profile, [], 10)
    expect(joined(notes)).toContain('asthma')
  })

  it('never mistakes a listed condition for a custom one', () => {
    // PCOS already gets its own note; it must not also trigger the generic
    // "no specific rule" fallback meant for free-text entries.
    const profile = makeProfile({ healthConditions: ['PCOS'] })
    const notes = buildSafety(profile, [], 10)
    expect(joined(notes)).not.toContain('no specific rule')
  })

  it('lists every custom condition, not just the first', () => {
    const profile = makeProfile({ healthConditions: ['asthma', 'migraines'] })
    const notes = buildSafety(profile, [], 10)
    expect(joined(notes)).toContain('asthma')
    expect(joined(notes)).toContain('migraines')
  })
})
