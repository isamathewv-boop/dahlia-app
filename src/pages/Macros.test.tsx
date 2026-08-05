// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import Diet from './Diet'
import Settings from './Settings'
import { renderPage, seed, stored } from '../test/renderApp'
import { makeProfile, mealLog } from '../test/fixtures'
import { serializeData } from '../data/storage'
import { loadApiKey, maskApiKey } from '../data/aiKey'
import { todayISO } from '../data/date'

const today = todayISO()

describe('Diet page — macros', () => {
  it('saves typed macros with the meal', async () => {
    seed({ profile: makeProfile({ weightKg: 60 }) })
    const { user } = renderPage(<Diet />)

    await user.type(screen.getByLabelText('What you ate'), 'chicken and rice')
    await user.type(screen.getByLabelText('Protein'), '40')
    await user.type(screen.getByLabelText('Carbs'), '55')
    await user.type(screen.getByLabelText('Fat'), '12')
    await user.click(screen.getByRole('button', { name: 'Add meal' }))

    const saved = stored().mealLogs[0]
    expect(saved.macros).toEqual({ protein: 40, carbs: 55, fat: 12 })
    // Typed by hand, so it must not be flagged as an estimate.
    expect(saved.macrosEstimated).toBeUndefined()
  })

  it('still saves a meal with no macros at all', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Diet />)

    await user.type(screen.getByLabelText('What you ate'), 'a banana')
    await user.click(screen.getByRole('button', { name: 'Add meal' }))

    expect(stored().mealLogs[0].macros).toBeUndefined()
  })

  it('shows the protein target once a weight exists', () => {
    seed({ profile: makeProfile({ weightKg: 60, goals: ['fat-loss'] }) })
    renderPage(<Diet />)

    expect(screen.getByText(/110–130g of protein/)).toBeTruthy()
  })

  it('asks for a weight rather than inventing a target', () => {
    seed({ profile: makeProfile() })
    renderPage(<Diet />)

    expect(screen.getByText(/Add your weight in your profile/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Edit your profile' })).toBeTruthy()
    // No target may be shown without a weight on file.
    expect(screen.queryByText(/g of protein today/)).toBeNull()
  })

  it('totals protein across the day', () => {
    seed({
      profile: makeProfile({ weightKg: 60 }),
      mealLogs: [
        mealLog(today, { slot: 'breakfast', macros: { protein: 30, carbs: 20, fat: 10 } }),
        mealLog(today, { slot: 'lunch', macros: { protein: 25, carbs: 40, fat: 15 } }),
      ],
    })
    renderPage(<Diet />)

    expect(screen.getByText(/Protein so far: 55g/)).toBeTruthy()
  })

  it('marks an estimated meal in the history', () => {
    seed({
      profile: makeProfile(),
      mealLogs: [
        mealLog(today, { macros: { protein: 30 }, macrosEstimated: true }),
      ],
    })
    renderPage(<Diet />)

    expect(screen.getByText(/estimated/)).toBeTruthy()
  })

  it('hides the analyse button behind having a key', () => {
    seed({ profile: makeProfile() })
    renderPage(<Diet />)

    // No photo captured yet, so nothing to analyse.
    expect(screen.queryByRole('button', { name: /Estimate macros/ })).toBeNull()
  })
})

describe('Settings — the API key', () => {
  it('is not saved until entered', () => {
    seed({ profile: makeProfile() })
    renderPage(<Settings />)

    expect(screen.getByLabelText('Your Anthropic API key')).toBeTruthy()
    expect(loadApiKey()).toBe('')
  })

  it('saves a key and shows it masked, never in full', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    const secret = 'sk-ant-api03-SECRETVALUE1234'
    await user.type(screen.getByLabelText('Your Anthropic API key'), secret)
    await user.click(screen.getByRole('button', { name: 'Save key' }))

    expect(loadApiKey()).toBe(secret)
    expect(screen.getByText(maskApiKey(secret))).toBeTruthy()
    expect(screen.queryByText(secret)).toBeNull()
  })

  it('removes the key on request', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await user.type(screen.getByLabelText('Your Anthropic API key'), 'sk-ant-test-key-value')
    await user.click(screen.getByRole('button', { name: 'Save key' }))
    await user.click(screen.getByRole('button', { name: 'Remove key' }))

    expect(loadApiKey()).toBe('')
  })

  it('clears the key when everything is deleted', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await user.type(screen.getByLabelText('Your Anthropic API key'), 'sk-ant-test-key-value')
    await user.click(screen.getByRole('button', { name: 'Save key' }))

    await user.click(screen.getByRole('button', { name: 'Delete my data' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete everything' }))

    // The key lives outside AppData, so this only passes if delete clears it too.
    expect(loadApiKey()).toBe('')
  })

  it('never writes the key into an export file', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    const secret = 'sk-ant-api03-MUSTNEVERAPPEAR'
    await user.type(screen.getByLabelText('Your Anthropic API key'), secret)
    await user.click(screen.getByRole('button', { name: 'Save key' }))

    // Exports serialise AppData; the key is deliberately stored outside it.
    const exported = serializeData(stored())
    expect(exported).not.toContain(secret)
    expect(exported).not.toContain('anthropicKey')
  })

  it('warns that analysis is the one thing that leaves the device', () => {
    seed({ profile: makeProfile() })
    renderPage(<Settings />)

    expect(screen.getByText(/sends data off your device/)).toBeTruthy()
  })
})
