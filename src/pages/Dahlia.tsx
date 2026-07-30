import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { Intent } from '../engine/dahlia'
import { labelFor, PRESETS, respondTo } from '../engine/dahlia'
import { TONE_LABELS } from '../data/options'
import * as s from '../ui/styles'

const bubble = {
  padding: '10px 12px',
  borderRadius: '10px',
  marginBottom: '10px',
  whiteSpace: 'pre-wrap' as const,
  maxWidth: '90%',
}

const fromDahlia = {
  ...bubble,
  border: '1px solid #ddd',
  background: '#fafafa',
}

const fromUser = {
  ...bubble,
  border: '1px solid #cce',
  background: '#f4f6ff',
  marginLeft: 'auto',
}

export default function Dahlia() {
  const app = useApp()
  const { profile, coachMessages, addCoachMessage, clearCoachMessages } = app

  if (!profile) {
    return (
      <div style={s.page}>
        <h1>Dahlia</h1>
        <p>
          Dahlia has nothing to work with yet. She talks from your logs, not
          from thin air.
        </p>
        <Link to="/onboarding">Start onboarding</Link>
      </div>
    )
  }

  function ask(intent: Intent) {
    const now = new Date().toISOString()

    addCoachMessage({ sender: 'user', text: labelFor(intent), timestamp: now })
    addCoachMessage({
      sender: 'dahlia',
      text: respondTo(intent, profile!, app),
      timestamp: now,
    })
  }

  return (
    <div style={s.page}>
      <h1>Dahlia</h1>
      <p style={s.muted}>
        Tone: {TONE_LABELS[profile.coachTone]} —{' '}
        <Link to="/settings">change</Link>
      </p>

      <div style={s.card}>
        {coachMessages.length === 0 ? (
          <p style={s.muted}>
            Nothing yet. Pick something below — Dahlia answers from what you
            have actually logged, so the more you log the sharper she gets.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {coachMessages.map((message) => (
              <div
                key={message.id}
                style={message.sender === 'dahlia' ? fromDahlia : fromUser}
              >
                {message.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.card}>
        <h2>Say something</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {PRESETS.map((preset) => (
            <button
              key={preset.intent}
              type="button"
              onClick={() => ask(preset.intent)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {coachMessages.length > 0 && (
        <div style={s.card}>
          <button type="button" style={s.linkButton} onClick={clearCoachMessages}>
            Clear this conversation
          </button>
        </div>
      )}

      <p style={s.muted}>
        Dahlia follows rules, not intuition. She will not diagnose anything or
        tell you to train through pain, and she is not a substitute for a
        doctor.
      </p>
    </div>
  )
}
