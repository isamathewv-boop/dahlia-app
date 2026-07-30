import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import type { AppData } from '../types'
import AppProvider from '../state/AppProvider'
import { createEmptyData } from '../data/storage'

const STORAGE_KEY = 'dahlia.v1'

/**
 * Seeds storage before mounting, because AppProvider reads it once on init.
 * Calling this after render would do nothing.
 */
export function seed(data: Partial<AppData>) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...createEmptyData(), ...data }),
  )
}

/** Whatever the app has persisted right now. */
export function stored(): AppData {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
}

/**
 * Renders a page inside the real provider and a router, so tests exercise the
 * actual state plumbing rather than a mock of it.
 */
export function renderPage(ui: ReactElement, route = '/') {
  const user = userEvent.setup()

  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>,
  )

  return { user, ...result }
}
