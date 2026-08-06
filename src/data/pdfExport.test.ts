import { describe, expect, it } from 'vitest'
import { buildExportPdf } from './pdfExport'
import { createEmptyData } from './storage'
import { makeProfile, mealLog, workoutLog } from '../test/fixtures'

describe('buildExportPdf', () => {
  it('produces a PDF for an empty profile without throwing', () => {
    const doc = buildExportPdf({ ...createEmptyData() })
    expect(doc.output('datauristring')).toContain('data:application/pdf')
  })

  it('includes profile and log content in the output', () => {
    const data = {
      ...createEmptyData(),
      profile: makeProfile({ name: 'Riya' }),
      mealLogs: [mealLog('2026-08-01', { description: 'dal and rice' })],
      workoutLogs: [workoutLog('2026-08-01', { type: 'Cardio' })],
    }
    const raw = buildExportPdf(data).output()

    expect(raw).toContain('Riya')
    expect(raw).toContain('dal and rice')
    expect(raw).toContain('Cardio')
  })

  it('never contains the Anthropic API key, which lives outside AppData', () => {
    // The key is deliberately stored outside AppData (see data/aiKey.ts), so
    // an AppData-only export can never see it, let alone leak it.
    const secret = 'sk-ant-api03-MUSTNEVERAPPEAR'
    const data = { ...createEmptyData(), profile: makeProfile() }
    const raw = buildExportPdf(data).output()

    expect(raw).not.toContain(secret)
  })

  it('paginates rather than throwing when there are many logs', () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      mealLog(`2026-0${(i % 9) + 1}-01`, { description: `meal ${i}` }),
    )
    const data = { ...createEmptyData(), profile: makeProfile(), mealLogs: many }

    expect(buildExportPdf(data).getNumberOfPages()).toBeGreaterThan(1)
  })
})
