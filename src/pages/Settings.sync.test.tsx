// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Settings from './Settings'
import { renderPage, seed } from '../test/renderApp'
import { makeProfile } from '../test/fixtures'
import * as sync from '../data/sync'

vi.mock('../data/supabaseClient', () => ({
  supabase: {},
  syncConfigured: () => true,
}))

vi.mock('../data/sync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/sync')>()
  return {
    ...actual,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(async () => {}),
    currentSession: vi.fn(async () => null),
    pullRemote: vi.fn(async () => null),
    pushRemote: vi.fn(async () => true),
    deleteRemote: vi.fn(async () => true),
  }
})

const fakeSession = { user: { id: 'user-1', email: 'sam@example.com' } }

describe('Settings — sync (Supabase configured)', () => {
  beforeEach(() => {
    // The mount-time effect calls currentSession() on every render, so every
    // test needs a clean slate rather than inheriting the previous test's
    // "already signed in" mock state.
    vi.mocked(sync.signUp).mockReset()
    vi.mocked(sync.signIn).mockReset()
    vi.mocked(sync.signOut).mockReset().mockResolvedValue(undefined)
    vi.mocked(sync.currentSession).mockReset().mockResolvedValue(null)
    vi.mocked(sync.pullRemote).mockReset().mockResolvedValue(null)
    vi.mocked(sync.pushRemote).mockReset().mockResolvedValue(true)
    vi.mocked(sync.deleteRemote).mockReset().mockResolvedValue(true)
  })

  it('shows a sign-in form when nobody is signed in', () => {
    seed({ profile: makeProfile() })
    renderPage(<Settings />)

    expect(screen.getByRole('heading', { name: 'Sync across devices' })).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy()
  })

  it('shows the auth error returned by signIn rather than a generic failure', async () => {
    vi.mocked(sync.signIn).mockResolvedValue({ ok: false, error: 'Wrong email or password.' })
    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await user.type(screen.getByLabelText('Email'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Wrong email or password.')).toBeTruthy()
  })

  it('asks before uploading local data on a brand new account (first sync)', async () => {
    vi.mocked(sync.signUp).mockResolvedValue({ ok: true })
    vi.mocked(sync.pullRemote).mockResolvedValue(null)

    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    // Let the mount-time "am I already signed in" check resolve to null
    // before switching the mock to simulate the account this form creates —
    // otherwise the mount effect races the manual form fill below.
    await screen.findByLabelText('Email')
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)

    await user.click(screen.getByRole('button', { name: 'New here? Create an account' }))
    await user.type(screen.getByLabelText('Email'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'hunter2!')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByText(/uploads everything currently on this device/),
    ).toBeTruthy()
    expect(screen.queryByText(/Synced\./)).toBeNull()
  })

  it('uploads and shows synced once the first-sync upload is confirmed', async () => {
    vi.mocked(sync.signUp).mockResolvedValue({ ok: true })
    vi.mocked(sync.pullRemote).mockResolvedValue(null)
    vi.mocked(sync.pushRemote).mockResolvedValue(true)

    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await screen.findByLabelText('Email')
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)

    await user.click(screen.getByRole('button', { name: 'New here? Create an account' }))
    await user.type(screen.getByLabelText('Email'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'hunter2!')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await user.click(await screen.findByRole('button', { name: 'Upload and start syncing' }))

    await waitFor(() => expect(sync.pushRemote).toHaveBeenCalled())
    expect(await screen.findByText('sam@example.com')).toBeTruthy()
  })

  it('an existing account with a remote row skips the upload prompt', async () => {
    vi.mocked(sync.signIn).mockResolvedValue({ ok: true })
    vi.mocked(sync.pullRemote).mockResolvedValue({
      data: { ...seedEmptyData(), profile: makeProfile({ name: 'Remote copy' }) },
      updatedAt: '2026-08-11T00:00:00.000Z',
    })

    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await screen.findByLabelText('Email')
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)

    await user.type(screen.getByLabelText('Email'), 'sam@example.com')
    await user.type(screen.getByLabelText('Password'), 'hunter2!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('sam@example.com')).toBeTruthy()
    expect(screen.queryByText(/uploads everything currently on this device/)).toBeNull()
  })

  it('returns to the sign-in form after signing out', async () => {
    // Simulates a device that was already signed in from a previous visit —
    // the mount-time session check picks this up on its own, no form needed.
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)
    vi.mocked(sync.pullRemote).mockResolvedValue(null)

    seed({ profile: makeProfile() })
    const { user } = renderPage(<Settings />)

    await screen.findByText('sam@example.com')

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(sync.signOut).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy()
  })
})

function seedEmptyData() {
  return {
    profile: null,
    cycleLogs: [],
    symptomLogs: [],
    workoutLogs: [],
    mealLogs: [],
    checkIns: [],
    coachMessages: [],
    reminders: { enabled: false, checkInTime: '08:00', eveningTime: '20:00', lastFired: [] },
  }
}
