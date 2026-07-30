import { Link } from 'react-router-dom'
import { useReminders } from '../ui/useReminders'
import * as s from '../ui/styles'

const LINK_FOR = {
  'check-in': { to: '/', label: 'Check in' },
  'log-day': { to: '/diet', label: 'Log something' },
} as const

/**
 * Outstanding reminders, shown on every page.
 *
 * This is the part that works regardless of notification permission — if she
 * has the app open, she sees it. The system notification is a bonus on top,
 * not the mechanism.
 */
export default function ReminderBanner() {
  const due = useReminders()

  if (due.length === 0) return null

  return (
    <div style={{ ...s.cardEmphasis, marginTop: '12px' }} role="status">
      {due.map((reminder) => (
        <div key={reminder.key} style={{ marginBottom: '8px' }}>
          <strong>{reminder.title}</strong>
          <br />
          <span style={s.muted}>{reminder.body}</span>{' '}
          <Link to={LINK_FOR[reminder.kind].to}>
            {LINK_FOR[reminder.kind].label}
          </Link>
        </div>
      ))}
    </div>
  )
}
