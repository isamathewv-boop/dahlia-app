// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import Workouts from './Workouts'
import { renderPage, seed, stored } from '../test/renderApp'
import { checkIn, makeProfile, workoutLog } from '../test/fixtures'
import { addDays, todayISO } from '../data/date'

const today = todayISO()

describe('Workouts page', () => {
  it('logs a session', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Workouts />)

    await user.selectOptions(screen.getByLabelText('What you did'), 'Yoga')
    await user.click(screen.getByRole('button', { name: 'Add session' }))

    const saved = stored().workoutLogs
    expect(saved).toHaveLength(1)
    expect(saved[0].type).toBe('Yoga')
    expect(saved[0].completed).toBe(true)
    expect(saved[0].date).toBe(today)
  })

  it('records a session that was started but not finished', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Workouts />)

    await user.click(screen.getByLabelText('I finished it'))
    await user.click(screen.getByRole('button', { name: 'Add session' }))

    expect(stored().workoutLogs[0].completed).toBe(false)
  })

  it('pre-fills the form from today’s assigned session', () => {
    seed({
      profile: makeProfile(),
      checkIns: [checkIn(today, { sleepHours: 4, energy: 1, soreness: 5 })],
    })
    renderPage(<Workouts />)

    // Low readiness means the assigned session is recovery, and the form
    // should already be set to log exactly that.
    expect((screen.getByLabelText('What you did') as HTMLSelectElement).value).toBe(
      'Mobility / stretching',
    )
    expect((screen.getByLabelText('How hard it felt') as HTMLSelectElement).value).toBe(
      'light',
    )
  })

  it('counts completed sessions in the last seven days', () => {
    seed({
      profile: makeProfile(),
      workoutLogs: [
        workoutLog(today, { type: 'Cardio' }),
        workoutLog(addDays(today, -3), { type: 'Yoga' }),
        workoutLog(addDays(today, -2), { type: 'Walk', completed: false }),
        workoutLog(addDays(today, -30), { type: 'Cardio' }),
      ],
    })
    renderPage(<Workouts />)

    expect(screen.getByText(/2 sessions completed in the last 7 days/)).toBeTruthy()
  })

  it('uses the singular for one session', () => {
    seed({ profile: makeProfile(), workoutLogs: [workoutLog(today, { type: 'Cardio' })] })
    renderPage(<Workouts />)

    expect(screen.getByText(/1 session completed/)).toBeTruthy()
  })

  it('deletes a session', async () => {
    seed({ profile: makeProfile(), workoutLogs: [workoutLog(today, { type: 'Cardio' })] })
    const { user } = renderPage(<Workouts />)

    const history = screen.getByRole('heading', { name: 'History' }).parentElement!
    await user.click(within(history).getByRole('button', { name: 'Delete' }))

    expect(stored().workoutLogs).toHaveLength(0)
    expect(screen.getByText('No sessions logged yet.')).toBeTruthy()
  })
})
