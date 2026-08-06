// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import Diet from './Diet'
import { renderPage, seed, stored } from '../test/renderApp'
import { makeProfile, mealLog } from '../test/fixtures'
import { todayISO } from '../data/date'

describe('Diet page', () => {
  it('saves a meal and shows it in history', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Diet />)

    await user.type(screen.getByLabelText('What you ate'), 'dal and rice')
    await user.click(screen.getByRole('button', { name: 'Add meal' }))

    expect(screen.getByText(/dal and rice/)).toBeTruthy()

    const saved = stored().mealLogs
    expect(saved).toHaveLength(1)
    expect(saved[0].description).toBe('dal and rice')
    expect(saved[0].date).toBe(todayISO())
  })

  it('clears the inputs after saving, ready for the next meal', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Diet />)

    const description = screen.getByLabelText('What you ate') as HTMLInputElement
    const notes = screen.getByLabelText(/Notes/) as HTMLInputElement

    await user.type(description, 'oats')
    await user.type(notes, 'still hungry')
    await user.click(screen.getByRole('button', { name: 'Add meal' }))

    expect(description.value).toBe('')
    expect(notes.value).toBe('')
  })

  it('refuses to save a meal with no description', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Diet />)

    await user.click(screen.getByRole('button', { name: 'Add meal' }))

    expect(stored().mealLogs ?? []).toHaveLength(0)
  })

  it('records the chosen meal slot', async () => {
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Diet />)

    await user.selectOptions(screen.getByLabelText('Meal'), 'dinner')
    await user.type(screen.getByLabelText('What you ate'), 'soup')
    await user.click(screen.getByRole('button', { name: 'Add meal' }))

    expect(stored().mealLogs[0].slot).toBe('dinner')
  })

  it('counts only today’s meals in the summary', () => {
    seed({
      profile: makeProfile(),
      mealLogs: [
        mealLog(todayISO(), { slot: 'breakfast' }),
        mealLog('2020-01-01', { slot: 'lunch' }),
      ],
    })
    renderPage(<Diet />)

    expect(screen.getByText('1 meal logged.')).toBeTruthy()
  })

  it('deletes a meal and forgets it', async () => {
    seed({ profile: makeProfile(), mealLogs: [mealLog(todayISO())] })
    const { user } = renderPage(<Diet />)

    const history = screen.getByRole('heading', { name: 'History' }).parentElement!
    await user.click(within(history).getByRole('button', { name: 'Delete' }))

    expect(stored().mealLogs).toHaveLength(0)
    expect(screen.getByText('No meals logged yet.')).toBeTruthy()
  })

  it('shows the diet preference from the profile', () => {
    seed({ profile: makeProfile({ dietPreference: 'vegetarian' }) })
    renderPage(<Diet />)

    expect(screen.getByText(/vegetarian/)).toBeTruthy()
  })

  describe('photo entry points', () => {
    it('offers both a camera capture and a library picker', () => {
      seed({ profile: makeProfile() })
      renderPage(<Diet />)

      expect(screen.getByRole('button', { name: 'Take photo' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Choose from library' })).toBeTruthy()
    })

    it('wires the camera button to a capture-only file input', () => {
      seed({ profile: makeProfile() })
      renderPage(<Diet />)

      const input = screen.getByLabelText('Take photo') as HTMLInputElement
      expect(input.getAttribute('capture')).toBe('environment')
    })

    it('wires the library button to a file input with no capture forced', () => {
      seed({ profile: makeProfile() })
      renderPage(<Diet />)

      const input = screen.getByLabelText('Choose from photo library') as HTMLInputElement
      expect(input.getAttribute('capture')).toBeNull()
    })

    it('clicking Take photo opens the camera input, not the library one', async () => {
      seed({ profile: makeProfile() })
      const { user } = renderPage(<Diet />)

      const cameraInput = screen.getByLabelText('Take photo') as HTMLInputElement
      const libraryInput = screen.getByLabelText('Choose from photo library') as HTMLInputElement
      const cameraClick = vi.spyOn(cameraInput, 'click')
      const libraryClick = vi.spyOn(libraryInput, 'click')

      await user.click(screen.getByRole('button', { name: 'Take photo' }))

      expect(cameraClick).toHaveBeenCalledTimes(1)
      expect(libraryClick).not.toHaveBeenCalled()
    })

    it('clicking Choose from library opens the library input, not the camera one', async () => {
      seed({ profile: makeProfile() })
      const { user } = renderPage(<Diet />)

      const cameraInput = screen.getByLabelText('Take photo') as HTMLInputElement
      const libraryInput = screen.getByLabelText('Choose from photo library') as HTMLInputElement
      const cameraClick = vi.spyOn(cameraInput, 'click')
      const libraryClick = vi.spyOn(libraryInput, 'click')

      await user.click(screen.getByRole('button', { name: 'Choose from library' }))

      expect(libraryClick).toHaveBeenCalledTimes(1)
      expect(cameraClick).not.toHaveBeenCalled()
    })
  })
})
