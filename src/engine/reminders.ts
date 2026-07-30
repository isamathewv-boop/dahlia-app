import type { AppData, ReminderSettings } from '../types'
import { toISODate } from '../data/date'

export type ReminderKind = 'check-in' | 'log-day'

export interface DueReminder {
  kind: ReminderKind
  title: string
  body: string
  /** `${date}:${kind}` — unique per day, so a reminder delivers once. */
  key: string
}

/** Local HH:MM, comparable as a string because both sides are zero-padded. */
export function timeOfDay(now: Date): string {
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * What still needs doing right now.
 *
 * A reminder disappears the moment the thing it asks for is done — the app
 * should never nag about a check-in she already completed. This is the whole
 * reason the logic lives here rather than in a timer callback.
 */
export function dueReminders(
  settings: ReminderSettings,
  data: AppData,
  now = new Date(),
): DueReminder[] {
  if (!settings.enabled) return []

  const today = toISODate(now)
  const time = timeOfDay(now)
  const due: DueReminder[] = []

  const checkedIn = data.checkIns.some((c) => c.date === today)
  if (!checkedIn && time >= settings.checkInTime) {
    due.push({
      kind: 'check-in',
      key: `${today}:check-in`,
      title: 'Check in with Dahlia',
      body: "Sleep, energy and time. Today's plan is guessing without it.",
    })
  }

  // The evening nudge is about the day being blank, not about any one log.
  const loggedSomething =
    data.mealLogs.some((m) => m.date === today) ||
    data.workoutLogs.some((w) => w.date === today) ||
    data.cycleLogs.some((c) => c.date === today)

  if (!loggedSomething && time >= settings.eveningTime) {
    due.push({
      kind: 'log-day',
      key: `${today}:log-day`,
      title: 'Nothing logged today',
      body: 'A meal, a session or a symptom is enough to keep the picture honest.',
    })
  }

  return due
}

/**
 * Due reminders that have not been delivered yet.
 *
 * The in-app banner uses `dueReminders` and keeps showing while relevant;
 * notifications use this, so they interrupt once rather than every minute.
 */
export function undeliveredReminders(
  settings: ReminderSettings,
  data: AppData,
  now = new Date(),
): DueReminder[] {
  return dueReminders(settings, data, now).filter(
    (reminder) => !settings.lastFired.includes(reminder.key),
  )
}

/**
 * Records a delivery, dropping keys from previous days so the list cannot grow
 * without bound in storage.
 */
export function recordFired(
  settings: ReminderSettings,
  keys: string[],
  now = new Date(),
): ReminderSettings {
  const today = toISODate(now)
  const kept = [...settings.lastFired, ...keys].filter((key) =>
    key.startsWith(`${today}:`),
  )

  return { ...settings, lastFired: [...new Set(kept)] }
}
