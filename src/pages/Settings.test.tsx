// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import Settings from './Settings'
import { renderPage, seed, stored } from '../test/renderApp'
import { checkIn, makeProfile, mealLog } from '../test/fixtures'
import { serializeData } from '../data/storage'
import { createEmptyData } from '../data/storage'
import { todayISO } from '../data/date'

const today = todayISO()

describe('Settings — deleting everything', () => {
  it('does not delete on the first click', async () => {
    seed({ profile: makeProfile(), mealLogs: [mealLog(today)] })
    const { user } = renderPage(<Settings />)

    await user.click(screen.getByRole('button', { name: 'Delete my data' }))

    // A single misclick must never wipe a health diary.
    expect(stored().profile).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Yes, delete everything' })).toBeTruthy()
  })

  it('deletes once confirmed', async () => {
    seed({ profile: makeProfile(), mealLogs: [mealLog(today)] })
    const { user } = renderPage(<Settings />)

    await user.click(screen.getByRole('button', { name: 'Delete my data' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete everything' }))

    expect(stored().profile).toBeNull()
    expect(stored().mealLogs).toHaveLength(0)
  })

  it('backs out safely on cancel', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await user.click(screen.getByRole('button', { name: 'Delete my data' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(stored().profile).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Delete my data' })).toBeTruthy()
  })
})

describe('Settings — importing', () => {
  const file = (contents: string) =>
    new File([contents], 'import.json', { type: 'application/json' })

  it('restores a previous export', async () => {
    const exported = serializeData({
      ...createEmptyData(),
      profile: makeProfile({ name: 'Restored' }),
      mealLogs: [mealLog(today)],
    })

    seed({ profile: makeProfile({ name: 'Current' }) })
    const { user } = renderPage(<Settings />)

    await user.upload(
      screen.getByLabelText('Choose an export file to import'),
      file(exported),
    )

    expect(stored().profile!.name).toBe('Restored')
    expect(stored().mealLogs).toHaveLength(1)
    expect(screen.getByText(/Import done/)).toBeTruthy()
  })

  it('rejects a file that is not ours and changes nothing', async () => {
    seed({ profile: makeProfile({ name: 'Current' }), checkIns: [checkIn(today)] })
    const { user } = renderPage(<Settings />)

    await user.upload(
      screen.getByLabelText('Choose an export file to import'),
      file('{"name":"some-other-app","version":"1.0.0"}'),
    )

    expect(screen.getByText(/isn't a Dahlia export/)).toBeTruthy()
    expect(stored().profile!.name).toBe('Current')
    expect(stored().checkIns).toHaveLength(1)
  })

  it('rejects malformed JSON without throwing', async () => {
    seed({ profile: makeProfile({ name: 'Current' }) })
    const { user } = renderPage(<Settings />)

    await user.upload(
      screen.getByLabelText('Choose an export file to import'),
      file('this is not json'),
    )

    expect(screen.getByText(/isn't a Dahlia export/)).toBeTruthy()
    expect(stored().profile!.name).toBe('Current')
  })
})

describe('Settings — coach tone', () => {
  it('saves a tone change immediately', async () => {
    seed({ profile: makeProfile({ coachTone: 'strict' }) })
    const { user } = renderPage(<Settings />)

    await user.selectOptions(screen.getByLabelText('Coach tone'), 'gentle')

    expect(stored().profile!.coachTone).toBe('gentle')
  })

  it('asks for onboarding first when there is no profile', () => {
    seed({})
    renderPage(<Settings />)

    expect(screen.getByRole('link', { name: 'onboard first' })).toBeTruthy()
  })
})

describe('Settings — reminders', () => {
  it('is off until switched on', () => {
    seed({ profile: makeProfile() })
    renderPage(<Settings />)

    expect((screen.getByLabelText('Remind me') as HTMLInputElement).checked).toBe(false)
    expect(screen.queryByLabelText('Morning check-in')).toBeNull()
  })

  it('reveals the times once enabled and saves them', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await user.click(screen.getByLabelText('Remind me'))

    expect(stored().reminders.enabled).toBe(true)
    expect(screen.getByLabelText('Morning check-in')).toBeTruthy()
  })

  it('is honest that reminders need the app open', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await user.click(screen.getByLabelText('Remind me'))

    expect(screen.getByText(/only appear while Dahlia is open/)).toBeTruthy()
  })
})
