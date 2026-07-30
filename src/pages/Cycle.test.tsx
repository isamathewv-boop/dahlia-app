// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import Cycle from './Cycle'
import { renderPage, seed, stored } from '../test/renderApp'
import { cycleLog, makeProfile, symptomLog } from '../test/fixtures'
import { todayISO } from '../data/date'

const today = todayISO()

describe('Cycle page — logging', () => {
  it('saves flow for today', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Cycle />)

    await user.selectOptions(screen.getByLabelText('Bleeding'), 'heavy')
    await user.click(screen.getByRole('button', { name: 'Save day' }))

    expect(stored().cycleLogs).toHaveLength(1)
    expect(stored().cycleLogs[0].flow).toBe('heavy')
    expect(screen.getByText('Saved.')).toBeTruthy()
  })

  it('only shows a severity control once a symptom is ticked', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Cycle />)

    expect(screen.queryByLabelText('Cramps severity')).toBeNull()
    await user.click(screen.getByLabelText('Cramps'))
    expect(screen.getByLabelText('Cramps severity')).toBeTruthy()
  })

  it('saves symptoms with their severities', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Cycle />)

    await user.click(screen.getByLabelText('Cramps'))
    await user.selectOptions(screen.getByLabelText('Cramps severity'), '5')
    await user.click(screen.getByLabelText('Fatigue'))
    await user.click(screen.getByRole('button', { name: 'Save day' }))

    const symptoms = stored().symptomLogs
    expect(symptoms).toHaveLength(2)
    expect(symptoms.find((s) => s.symptom === 'cramps')!.severity).toBe(5)
    // Ticking without choosing defaults to the middle of the scale.
    expect(symptoms.find((s) => s.symptom === 'fatigue')!.severity).toBe(3)
  })

  it('unticking a symptom drops it from the save', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Cycle />)

    await user.click(screen.getByLabelText('Cramps'))
    await user.click(screen.getByLabelText('Cramps'))
    await user.click(screen.getByRole('button', { name: 'Save day' }))

    expect(stored().symptomLogs).toHaveLength(0)
  })

  it('replaces the entry rather than duplicating when saving twice', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Cycle />)

    await user.selectOptions(screen.getByLabelText('Bleeding'), 'light')
    await user.click(screen.getByRole('button', { name: 'Save day' }))
    await user.selectOptions(screen.getByLabelText('Bleeding'), 'heavy')
    await user.click(screen.getByRole('button', { name: 'Save day' }))

    expect(stored().cycleLogs).toHaveLength(1)
    expect(stored().cycleLogs[0].flow).toBe('heavy')
  })
})

describe('Cycle page — editing history', () => {
  it('loads a logged day back into the form', async () => {
    seed({
      profile: makeProfile(),
      cycleLogs: [{ id: 'c1', date: today, flow: 'heavy', notes: 'rough day' }],
      symptomLogs: [symptomLog(today, 'cramps', 4)],
    })
    const { user } = renderPage(<Cycle />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect((screen.getByLabelText('Bleeding') as HTMLSelectElement).value).toBe('heavy')
    expect((screen.getByLabelText('Notes') as HTMLInputElement).value).toBe('rough day')
    expect((screen.getByLabelText('Cramps') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Cramps severity') as HTMLSelectElement).value).toBe('4')
  })

  it('deletes a day and its symptoms together', async () => {
    seed({
      profile: makeProfile(),
      cycleLogs: [cycleLog(today, 'medium')],
      symptomLogs: [symptomLog(today, 'cramps', 3)],
    })
    const { user } = renderPage(<Cycle />)

    const history = screen.getByRole('heading', { name: 'History' }).parentElement!
    await user.click(within(history).getByRole('button', { name: 'Delete' }))

    expect(stored().cycleLogs).toHaveLength(0)
    // Orphaned symptoms would quietly skew the Progress patterns.
    expect(stored().symptomLogs).toHaveLength(0)
  })
})

describe('Cycle page — predictions', () => {
  it('shows the cycle day when a profile exists', () => {
    seed({ profile: makeProfile({ lastPeriodDate: today }) })
    renderPage(<Cycle />)

    expect(screen.getByText('Cycle day 1')).toBeTruthy()
  })

  it('adds the irregular-cycle caveat only when it applies', () => {
    seed({ profile: makeProfile({ lastPeriodDate: today, irregularCycles: true }) })
    renderPage(<Cycle />)

    expect(screen.getByText(/especially with irregular cycles/)).toBeTruthy()
  })

  it('says nothing about cycle day without a profile', () => {
    seed({})
    renderPage(<Cycle />)

    expect(screen.queryByText(/Cycle day/)).toBeNull()
  })
})
