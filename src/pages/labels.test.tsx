// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import AppProvider from '../state/AppProvider'
import Home from './Home'
import Cycle from './Cycle'
import Workouts from './Workouts'
import Diet from './Diet'
import Settings from './Settings'
import Onboarding from './Onboarding'
import Dahlia from './Dahlia'
import Progress from './Progress'
import { seed } from '../test/renderApp'
import { makeProfile } from '../test/fixtures'

/**
 * Every form control needs an accessible name. This caught a real one: the
 * coach-tone select was named only by a nearby heading, so a screen reader
 * announced it as an unlabelled combobox.
 */
function unnamedControls(container: HTMLElement): string[] {
  const controls = container.querySelectorAll('input, select, textarea')
  const unnamed: string[] = []

  for (const el of controls) {
    const id = el.getAttribute('id')
    const hasLabelFor = id
      ? !!container.querySelector(`label[for="${id}"]`)
      : false
    const wrappedInLabel = !!el.closest('label')
    const hasAriaLabel = !!el.getAttribute('aria-label')
    const hasAriaLabelledBy = !!el.getAttribute('aria-labelledby')

    if (!hasLabelFor && !wrappedInLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      unnamed.push(
        `${el.tagName.toLowerCase()}${id ? `#${id}` : ''}[type=${el.getAttribute('type') ?? 'n/a'}]`,
      )
    }
  }
  return unnamed
}

function mount(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>,
  )
}

const PAGES: [string, ReactElement][] = [
  ['Home', <Home />],
  ['Cycle', <Cycle />],
  ['Workouts', <Workouts />],
  ['Diet', <Diet />],
  ['Settings', <Settings />],
  ['Onboarding', <Onboarding />],
  ['Dahlia', <Dahlia />],
  ['Progress', <Progress />],
]

describe('every form control has an accessible name', () => {
  for (const [name, element] of PAGES) {
    it(name, () => {
      seed({ profile: makeProfile(), reminders: {
        enabled: true, checkInTime: '08:00', eveningTime: '20:00', lastFired: [],
      } })
      const { container } = mount(element)
      expect(unnamedControls(container)).toEqual([])
    })
  }
})
