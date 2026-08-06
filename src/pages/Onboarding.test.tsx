// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import Onboarding from './Onboarding'
import { renderPage, seed, stored } from '../test/renderApp'
import { makeProfile } from '../test/fixtures'

describe('Onboarding — two-step flow', () => {
  it('starts on step 1 and blocks Next until a goal is picked', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)

    expect(screen.getByText('Step 1 of 2')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(
      screen.getByText('Pick at least one goal — everything else is built from it.'),
    ).toBeTruthy()
    expect(screen.getByText('Step 1 of 2')).toBeTruthy()
  })

  it('advances to step 2 once a goal is checked, and Back returns to step 1', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)

    await user.click(screen.getByLabelText(/Fat loss/))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByText('Step 2 of 2')).toBeTruthy()
    expect(screen.getByText('Health conditions Dahlia must respect')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step 1 of 2')).toBeTruthy()
    // The goal ticked on step 1 survives the round trip.
    expect((screen.getByLabelText(/Fat loss/) as HTMLInputElement).checked).toBe(true)
  })

  it('only saves once Save on step 2 is clicked, not on Next', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)

    await user.click(screen.getByLabelText(/Fat loss/))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(stored().profile).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(stored().profile).not.toBeNull()
  })
})

describe('Onboarding — weight goal', () => {
  async function reachStep2(user: ReturnType<typeof renderPage>['user']) {
    await user.click(screen.getByLabelText(/Fat loss/))
    await user.click(screen.getByRole('button', { name: 'Next' }))
  }

  it('hides the target weight field until a lose/gain goal is chosen', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)
    await reachStep2(user)

    expect(screen.queryByLabelText('Target weight in kg')).toBeNull()

    await user.selectOptions(
      screen.getByLabelText('Weight goals'),
      'lose',
    )
    expect(screen.getByLabelText('Target weight in kg')).toBeTruthy()
  })

  it('never shows a target weight field for "maintain"', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)
    await reachStep2(user)

    await user.selectOptions(
      screen.getByLabelText('Weight goals'),
      'maintain',
    )
    expect(screen.queryByLabelText('Target weight in kg')).toBeNull()
  })

  it('saves current weight, weight goal and target weight together', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)
    await reachStep2(user)

    await user.type(screen.getByLabelText('Current weight in kg (optional)'), '70')
    await user.selectOptions(
      screen.getByLabelText('Weight goals'),
      'lose',
    )
    await user.type(screen.getByLabelText('Target weight in kg'), '62')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const profile = stored().profile!
    expect(profile.weightKg).toBe(70)
    expect(profile.weightGoal).toBe('lose')
    expect(profile.targetWeightKg).toBe(62)
  })

  it('drops the target weight if the goal is switched back to maintain', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)
    await reachStep2(user)

    await user.selectOptions(
      screen.getByLabelText('Weight goals'),
      'lose',
    )
    await user.type(screen.getByLabelText('Target weight in kg'), '62')
    await user.selectOptions(
      screen.getByLabelText('Weight goals'),
      'maintain',
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(stored().profile!.targetWeightKg).toBeUndefined()
  })

  it('leaves weightGoal unset when "Prefer not to say" is left selected', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)
    await reachStep2(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(stored().profile!.weightGoal).toBeUndefined()
  })
})

describe('Onboarding — other health condition', () => {
  it('adds a typed condition alongside the checked ones', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)

    await user.click(screen.getByLabelText(/Fat loss/))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByLabelText('PCOS'))
    await user.type(screen.getByLabelText('Other (comma-separated)'), 'asthma')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(stored().profile!.healthConditions).toEqual(['PCOS', 'asthma'])
  })

  it('splits multiple comma-separated custom conditions', async () => {
    seed({})
    const { user } = renderPage(<Onboarding />)

    await user.click(screen.getByLabelText(/Fat loss/))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.type(screen.getByLabelText('Other (comma-separated)'), 'asthma, migraines')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(stored().profile!.healthConditions).toEqual(['asthma', 'migraines'])
  })

  it('pre-fills the Other field from an existing custom condition when editing', async () => {
    seed({ profile: makeProfile({ healthConditions: ['PCOS', 'asthma'] }) })
    const { user } = renderPage(<Onboarding />)

    // Existing profile already has a goal ticked, so Next proceeds straight away.
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect((screen.getByLabelText('PCOS') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Other (comma-separated)') as HTMLInputElement).value).toBe(
      'asthma',
    )
  })
})
