import { useState } from 'react'
import { useApp } from '../state/AppContext'
import * as s from '../ui/styles'

/**
 * Shown instead of the app when a passcode is set.
 *
 * Nothing is decrypted until the right passcode arrives, so there is no
 * partially-loaded state behind this screen to leak.
 */
export default function LockScreen() {
  const { unlock } = useApp()

  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passcode) return

    setBusy(true)
    setError('')

    const opened = await unlock(passcode)

    if (!opened) {
      // Deliberately vague: distinguishing "wrong passcode" from "corrupt
      // data" would tell an attacker they had the right vault.
      setError('That passcode did not work.')
      setPasscode('')
    }
    setBusy(false)
  }

  return (
    <div style={{ ...s.page, maxWidth: '360px', margin: '0 auto' }}>
      <h1>Dahlia is locked</h1>

      <form onSubmit={handleSubmit} style={s.card}>
        <div style={s.row}>
          <label htmlFor="passcode">Passcode</label>
          <br />
          <input
            id="passcode"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            style={s.input}
          />
        </div>

        {error && <p style={s.dangerText}>{error}</p>}

        <button type="submit" disabled={busy || !passcode}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>

      <p style={s.muted}>
        Your logs are encrypted with this passcode on this device. There is no
        reset — no server holds a copy, which is the same reason nobody else can
        read them.
      </p>
    </div>
  )
}
