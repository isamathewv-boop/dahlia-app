// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import Progress from './Progress'
import { renderPage, seed } from '../test/renderApp'
import { checkIn, makeProfile, mealLog, workoutLog } from '../test/fixtures'
import { todayISO } from '../data/date'

const today = todayISO()

describe('Progress page', () => {
  it('sends a profile-less visitor to onboarding instead of showing empty charts', () => {
    seed({})
    renderPage(<Progress />)

    expect(screen.getByText('Nothing to measure yet.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start onboarding' })).toBeTruthy()
  })

  it('skips the streak gauge rather than dividing by a zero-day longest streak', () => {
    seed({ profile: makeProfile() })
    renderPage(<Progress />)

    // No logs at all means longest streak is 0 — nothing to show a ratio against.
    expect(screen.queryByText('days, current streak')).toBeNull()
  })

  it('shows the streak gauge once there is a real streak to measure against', () => {
    seed({
      profile: makeProfile(),
      checkIns: [checkIn(today)],
      workoutLogs: [workoutLog(today)],
    })
    renderPage(<Progress />)

    expect(screen.getByText('days, current streak')).toBeTruthy()
  })

  it('shows the 7-day adherence gauges', () => {
    seed({
      profile: makeProfile(),
      checkIns: [checkIn(today)],
      mealLogs: [mealLog(today)],
    })
    renderPage(<Progress />)

    // "days logged" labels both the 7-day and 28-day gauges; "check-ins" labels
    // both the gauge and the existing stat tile.
    expect(screen.getAllByText('days logged').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('check-ins').length).toBeGreaterThanOrEqual(1)
  })

  it('skips the protein gauge when there is no weight on file to derive a target', () => {
    seed({ profile: makeProfile({ weightKg: undefined }), mealLogs: [mealLog(today)] })
    renderPage(<Progress />)

    expect(screen.queryByText('days on target')).toBeNull()
  })

  it('shows the protein gauge once there is a target and logged days', () => {
    seed({
      profile: makeProfile({ weightKg: 60, goals: ['fat-loss'] }),
      mealLogs: [mealLog(today, { macros: { protein: 120 } })],
    })
    renderPage(<Progress />)

    expect(screen.getByText('days on target')).toBeTruthy()
  })

  it('shows the 28-day gauges alongside the 7-day ones', () => {
    seed({ profile: makeProfile(), checkIns: [checkIn(today)] })
    renderPage(<Progress />)

    expect(screen.getByText('days with food')).toBeTruthy()
  })
})
