// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AppProvider from '../state/AppProvider'
import App from '../App'
import Settings from './Settings'
import { seed } from '../test/renderApp'
import { makeProfile, mealLog } from '../test/fixtures'
import { isEncryptedEnvelope } from '../data/crypto'
import { readRawStorage } from '../data/storage'
import { todayISO } from '../data/date'

const PASSCODE = 'hunter2!'

function mount(route = '/settings') {
  const user = userEvent.setup()
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>,
  )
  return { user, ...result }
}

function mountSettingsOnly() {
  const user = userEvent.setup()
  const result = render(
    <MemoryRouter>
      <AppProvider>
        <Settings />
      </AppProvider>
    </MemoryRouter>,
  )
  return { user, ...result }
}

async function turnOnLock(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Passcode \(at least 6\)/), PASSCODE)
  await user.type(screen.getByLabelText('Type it again'), PASSCODE)
  await user.click(screen.getByLabelText(/I understand my data is gone/))
  await user.click(screen.getByRole('button', { name: 'Turn on app lock' }))
}

describe('turning app lock on', () => {
  it('encrypts storage so the plaintext is no longer readable', async () => {
    seed({ profile: makeProfile({ name: 'Leanne' }), mealLogs: [mealLog(todayISO())] })
    const { user } = mountSettingsOnly()

    await turnOnLock(user)

    await waitFor(() => expect(isEncryptedEnvelope(readRawStorage())).toBe(true))

    // The thing this whole feature exists for.
    const onDisk = localStorage.getItem('dahlia.v1')!
    expect(onDisk).not.toContain('Leanne')
    expect(onDisk).not.toContain('oats')
    expect(onDisk).not.toContain(PASSCODE)
  })

  it('refuses a passcode under six characters', async () => {
    seed({ profile: makeProfile() })
    const { user } = mountSettingsOnly()

    await user.type(screen.getByLabelText(/Passcode \(at least 6\)/), 'abc')
    await user.type(screen.getByLabelText('Type it again'), 'abc')
    await user.click(screen.getByLabelText(/I understand my data is gone/))
    await user.click(screen.getByRole('button', { name: 'Turn on app lock' }))

    expect(screen.getByText('Use at least 6 characters.')).toBeTruthy()
    expect(isEncryptedEnvelope(readRawStorage())).toBe(false)
  })

  it('refuses when the two passcodes differ', async () => {
    seed({ profile: makeProfile() })
    const { user } = mountSettingsOnly()

    await user.type(screen.getByLabelText(/Passcode \(at least 6\)/), PASSCODE)
    await user.type(screen.getByLabelText('Type it again'), 'different')
    await user.click(screen.getByLabelText(/I understand my data is gone/))
    await user.click(screen.getByRole('button', { name: 'Turn on app lock' }))

    expect(screen.getByText('The two passcodes do not match.')).toBeTruthy()
    expect(isEncryptedEnvelope(readRawStorage())).toBe(false)
  })

  it('will not proceed until the loss warning is acknowledged', async () => {
    seed({ profile: makeProfile() })
    const { user } = mountSettingsOnly()

    await user.type(screen.getByLabelText(/Passcode \(at least 6\)/), PASSCODE)
    await user.type(screen.getByLabelText('Type it again'), PASSCODE)
    await user.click(screen.getByRole('button', { name: 'Turn on app lock' }))

    expect(screen.getByText(/Tick the box/)).toBeTruthy()
    expect(isEncryptedEnvelope(readRawStorage())).toBe(false)
  })

  it('does not leave the passcode sitting in the form', async () => {
    seed({ profile: makeProfile() })
    const { user } = mountSettingsOnly()
    await turnOnLock(user)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Lock now' })).toBeTruthy(),
    )
    expect(screen.queryByLabelText(/Passcode \(at least 6\)/)).toBeNull()
  })
})

describe('the lock screen', () => {
  it('hides the whole app when a vault is sealed', async () => {
    seed({ profile: makeProfile() })
    const { user, unmount } = mountSettingsOnly()
    await turnOnLock(user)
    await waitFor(() => expect(isEncryptedEnvelope(readRawStorage())).toBe(true))
    unmount()

    // A fresh start with only the sealed vault on disk.
    mount()

    expect(screen.getByRole('heading', { name: 'Dahlia is locked' })).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()
  })

  it('rejects the wrong passcode without revealing anything', async () => {
    seed({ profile: makeProfile({ name: 'Leanne' }) })
    const first = mountSettingsOnly()
    await turnOnLock(first.user)
    await waitFor(() => expect(isEncryptedEnvelope(readRawStorage())).toBe(true))
    first.unmount()

    const { user } = mount()
    await user.type(screen.getByLabelText('Passcode'), 'not-the-passcode')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() =>
      expect(screen.getByText('That passcode did not work.')).toBeTruthy(),
    )
    expect(screen.getByRole('heading', { name: 'Dahlia is locked' })).toBeTruthy()
    expect(screen.queryByText('Leanne')).toBeNull()
  })

  it('opens the app again with the right passcode', async () => {
    seed({ profile: makeProfile({ name: 'Leanne' }), mealLogs: [mealLog(todayISO())] })
    const first = mountSettingsOnly()
    await turnOnLock(first.user)
    await waitFor(() => expect(isEncryptedEnvelope(readRawStorage())).toBe(true))
    first.unmount()

    const { user } = mount('/')
    await user.type(screen.getByLabelText('Passcode'), PASSCODE)
    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Hi Leanne' })).toBeTruthy(),
    )
    // And the logs survived the round trip.
    expect(screen.getByText(/Meals: 1/)).toBeTruthy()
  })
})

describe('turning app lock off', () => {
  it('writes readable data back', async () => {
    seed({ profile: makeProfile({ name: 'Leanne' }) })
    const { user } = mountSettingsOnly()

    await turnOnLock(user)
    await waitFor(() => expect(isEncryptedEnvelope(readRawStorage())).toBe(true))

    await user.click(screen.getByRole('button', { name: 'Turn off app lock' }))

    await waitFor(() => expect(isEncryptedEnvelope(readRawStorage())).toBe(false))
    expect(localStorage.getItem('dahlia.v1')).toContain('Leanne')
  })
})

describe('locking mid-session', () => {
  it('seals the app again without losing anything', async () => {
    seed({ profile: makeProfile({ name: 'Leanne' }) })
    const { user } = mount('/settings')

    await turnOnLock(user)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Lock now' })).toBeTruthy(),
    )

    await user.click(screen.getByRole('button', { name: 'Lock now' }))

    expect(screen.getByRole('heading', { name: 'Dahlia is locked' })).toBeTruthy()
    expect(isEncryptedEnvelope(readRawStorage())).toBe(true)

    // Still openable, so locking did not overwrite the vault with blank data.
    await user.type(screen.getByLabelText('Passcode'), PASSCODE)
    await user.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy(),
    )
  })
})
