// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import ResetPassword from './ResetPassword'
import { renderPage, seed } from '../test/renderApp'
import * as sync from '../data/sync'

vi.mock('../data/supabaseClient', () => ({
  supabase: {},
  syncConfigured: () => true,
}))

vi.mock('../data/sync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/sync')>()
  return {
    ...actual,
    currentSession: vi.fn(async () => null),
    onPasswordRecovery: vi.fn(() => () => {}),
    updatePassword: vi.fn(),
    pullRemote: vi.fn(async () => null),
    pushRemote: vi.fn(async () => true),
  }
})

const fakeSession = { user: { id: 'user-1', email: 'sam@example.com' } }

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.mocked(sync.currentSession).mockReset().mockResolvedValue(null)
    vi.mocked(sync.onPasswordRecovery)
      .mockReset()
      .mockImplementation(() => () => {})
    vi.mocked(sync.updatePassword).mockReset()
    vi.mocked(sync.pullRemote).mockReset().mockResolvedValue(null)
  })

  it('shows a waiting message until a recovery session is confirmed', async () => {
    seed({})
    renderPage(<ResetPassword />)

    expect(
      await screen.findByText(/Waiting to confirm the link from your email/),
    ).toBeTruthy()
    expect(screen.queryByLabelText(/New password/)).toBeNull()
  })

  it('shows the new-password form once a recovery session exists', async () => {
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)
    seed({})
    renderPage(<ResetPassword />)

    expect(await screen.findByLabelText(/New password/)).toBeTruthy()
  })

  it('rejects a password under six characters', async () => {
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)
    seed({})
    const { user } = renderPage(<ResetPassword />)

    await user.type(await screen.findByLabelText(/New password/), 'abc')
    await user.type(screen.getByLabelText('Type it again'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Save new password' }))

    expect(screen.getByText('Use at least 6 characters.')).toBeTruthy()
    expect(sync.updatePassword).not.toHaveBeenCalled()
  })

  it('rejects mismatched passwords', async () => {
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)
    seed({})
    const { user } = renderPage(<ResetPassword />)

    await user.type(await screen.findByLabelText(/New password/), 'longenough1')
    await user.type(screen.getByLabelText('Type it again'), 'longenough2')
    await user.click(screen.getByRole('button', { name: 'Save new password' }))

    expect(screen.getByText('The two passwords do not match.')).toBeTruthy()
    expect(sync.updatePassword).not.toHaveBeenCalled()
  })

  it('confirms once the password is updated', async () => {
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)
    vi.mocked(sync.updatePassword).mockResolvedValue({ ok: true })
    seed({})
    const { user } = renderPage(<ResetPassword />)

    await user.type(await screen.findByLabelText(/New password/), 'longenough1')
    await user.type(screen.getByLabelText('Type it again'), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Save new password' }))

    expect(await screen.findByText(/Password updated/)).toBeTruthy()
    expect(sync.updatePassword).toHaveBeenCalledWith('longenough1')
  })

  it('shows the error when the update fails', async () => {
    vi.mocked(sync.currentSession).mockResolvedValue(fakeSession as never)
    vi.mocked(sync.updatePassword).mockResolvedValue({ ok: false, error: 'Link expired.' })
    seed({})
    const { user } = renderPage(<ResetPassword />)

    await user.type(await screen.findByLabelText(/New password/), 'longenough1')
    await user.type(screen.getByLabelText('Type it again'), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Save new password' }))

    expect(await screen.findByText('Link expired.')).toBeTruthy()
  })
})
