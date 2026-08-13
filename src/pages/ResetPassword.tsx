import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { currentSession, onPasswordRecovery } from '../data/sync'
import * as s from '../ui/styles'

/**
 * Landed on by clicking the link from a "forgot password" email. Supabase
 * opens a short-lived recovery session tied to this tab — updatePassword()
 * only works while that's active, which is why this isn't just a field on
 * the regular Settings sign-in form.
 */
export default function ResetPassword() {
  const { updatePassword } = useApp()

  // Supabase may finish processing the link's token before this component
  // even mounts, so check for an existing session directly as well as
  // listening for the event — whichever happens first wins.
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    currentSession().then((session) => {
      if (!cancelled && session) setReady(true)
    })
    const unsubscribe = onPasswordRecovery(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Use at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.')
      return
    }

    setBusy(true)
    const result = await updatePassword(password)
    setBusy(false)

    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.')
    } else {
      setDone(true)
    }
  }

  return (
    <div style={{ ...s.page, maxWidth: '360px', margin: '0 auto' }}>
      <h1>Reset your password</h1>

      {done ? (
        <div style={s.card}>
          <p>Password updated. You're signed in on this device.</p>
          <Link to="/settings">Go to Settings</Link>
        </div>
      ) : !ready ? (
        <div style={s.card}>
          <p style={s.muted}>
            Waiting to confirm the link from your email… if this sits here,
            the link may have expired — request a new one from Settings.
          </p>
          <Link to="/settings">Back to Settings</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={s.card}>
          <div style={s.row}>
            <label htmlFor="newPassword">New password (at least 6)</label>
            <br />
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={s.input}
            />
          </div>
          <div style={s.row}>
            <label htmlFor="confirmNewPassword">Type it again</label>
            <br />
            <input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={s.input}
            />
          </div>
          {error && <p style={s.dangerText}>{error}</p>}
          <button type="submit" disabled={busy || !password || !confirmPassword}>
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}
    </div>
  )
}
