// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import Home from './Home'
import { renderPage, seed, stored } from '../test/renderApp'
import { checkIn, makeProfile, symptomLog } from '../test/fixtures'
import { todayISO } from '../data/date'

const today = todayISO()

describe('Home page — no profile', () => {
  it('sends a brand new user to onboarding instead of showing an empty plan', () => {
    seed({})
    renderPage(<Home />)

    expect(screen.getByText(/No profile yet/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start onboarding' })).toBeTruthy()
    expect(screen.queryByText(/Readiness/)).toBeNull()
  })
})

describe('Home page — daily check-in', () => {
  it('saves the check-in', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Home />)

    await user.selectOptions(screen.getByLabelText('Energy'), '5')
    await user.click(screen.getByRole('button', { name: 'Save check-in' }))

    const saved = stored().checkIns
    expect(saved).toHaveLength(1)
    expect(saved[0].energy).toBe(5)
    expect(saved[0].date).toBe(today)
  })

  it('offers an update rather than a second check-in once one exists', () => {
    seed({ profile: makeProfile(), checkIns: [checkIn(today)] })
    renderPage(<Home />)

    expect(screen.getByRole('button', { name: 'Update check-in' })).toBeTruthy()
    expect(screen.getByText('Checked in today.')).toBeTruthy()
  })

  it('replaces rather than appends when updated', async () => {
    seed({ profile: makeProfile(), checkIns: [checkIn(today, { energy: 2 })] })
    const { user } = renderPage(<Home />)

    await user.selectOptions(screen.getByLabelText('Energy'), '5')
    await user.click(screen.getByRole('button', { name: 'Update check-in' }))

    expect(stored().checkIns).toHaveLength(1)
    expect(stored().checkIns[0].energy).toBe(5)
  })
})

describe('Home page — cycle prediction honesty', () => {
  it('shows the next-period estimate plainly for a regular cycle', () => {
    seed({ profile: makeProfile({ lastPeriodDate: today, irregularCycles: false }) })
    renderPage(<Home />)

    expect(screen.getByText(/next period around/)).toBeTruthy()
    expect(screen.queryByText(/cycles are irregular/)).toBeNull()
  })

  it('adds the irregular-cycle caveat instead of presenting the date as reliable', () => {
    seed({ profile: makeProfile({ lastPeriodDate: today, irregularCycles: true }) })
    renderPage(<Home />)

    expect(screen.getByText(/next period around/)).toBeTruthy()
    expect(screen.getByText(/cycles are irregular/)).toBeTruthy()
  })
})

describe('Home page — the plan responds to inputs', () => {
  it('prescribes recovery on a bad day', () => {
    seed({
      profile: makeProfile(),
      checkIns: [checkIn(today, { sleepHours: 4, energy: 1, soreness: 5 })],
    })
    renderPage(<Home />)

    expect(screen.getByText(/Low\. Today is for recovery\./)).toBeTruthy()
    // The phrase appears in both the workout card and the next action, which
    // is the point — they agree.
    expect(screen.getAllByText(/recovery session/).length).toBeGreaterThan(0)
  })

  it('allows pushing on a good day', () => {
    seed({
      profile: makeProfile({ lastPeriodDate: '' }),
      checkIns: [checkIn(today, { sleepHours: 8, energy: 5, soreness: 1 })],
    })
    renderPage(<Home />)

    expect(screen.getByText(/Good\. You can push today\./)).toBeTruthy()
  })

  it('changes the plan when the check-in changes', async () => {
    seed({
      profile: makeProfile({ lastPeriodDate: '' }),
      checkIns: [checkIn(today, { sleepHours: 8, energy: 5, soreness: 1 })],
    })
    const { user } = renderPage(<Home />)

    expect(screen.getByText(/Good\. You can push today\./)).toBeTruthy()

    // Energy and soreness alone only reach 45, which is still moderate —
    // short sleep is what tips it under the low threshold.
    const sleep = screen.getByLabelText('Hours of sleep')
    await user.clear(sleep)
    await user.type(sleep, '4')
    await user.selectOptions(screen.getByLabelText('Energy'), '1')
    await user.selectOptions(screen.getByLabelText('Soreness'), '5')
    await user.click(screen.getByRole('button', { name: 'Update check-in' }))

    // The whole promise of the app: the dashboard moves when the inputs do.
    expect(screen.getByText(/Low\. Today is for recovery\./)).toBeTruthy()
  })
})

describe('Home page — safety', () => {
  it('surfaces a doctor warning above the plan', () => {
    seed({
      profile: makeProfile(),
      checkIns: [checkIn(today)],
      symptomLogs: [symptomLog(today, 'cramps', 5)],
    })
    renderPage(<Home />)

    expect(screen.getByRole('heading', { name: 'Read this first' })).toBeTruthy()
    expect(screen.getByText(/doctor's opinion/)).toBeTruthy()
  })

  it('shows no warning card when there is nothing to warn about', () => {
    seed({ profile: makeProfile(), checkIns: [checkIn(today)] })
    renderPage(<Home />)

    expect(screen.queryByRole('heading', { name: 'Read this first' })).toBeNull()
  })
})
