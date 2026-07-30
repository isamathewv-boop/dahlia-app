import { useEffect, useState } from 'react'
import { useApp } from '../state/AppContext'
import {
  dueReminders,
  recordFired,
  undeliveredReminders,
} from '../engine/reminders'
import type { DueReminder } from '../engine/reminders'

/** How often to re-check. A minute is plenty for HH:MM reminders. */
const TICK_MS = 60_000

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

/**
 * Watches the clock and surfaces whatever still needs doing.
 *
 * Returns the outstanding reminders for the in-app banner, and separately
 * delivers a system notification the first time each one comes due.
 *
 * This only runs while the app is open. A local-first app with no server
 * genuinely cannot wake itself — that would need a push service, which would
 * mean shipping health data off the device. The Settings copy says so rather
 * than implying background delivery that will never arrive.
 */
export function useReminders(): DueReminder[] {
  const app = useApp()
  const { reminders, setReminders } = app

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const due = dueReminders(reminders, app, now)

  useEffect(() => {
    if (!reminders.enabled) return
    if (!notificationsSupported() || Notification.permission !== 'granted') return

    const pending = undeliveredReminders(reminders, app, now)
    if (pending.length === 0) return

    for (const reminder of pending) {
      try {
        new Notification(reminder.title, {
          body: reminder.body,
          tag: reminder.key, // Replaces rather than stacks duplicates.
        })
      } catch {
        // Some browsers throw unless a service worker shows the notification.
        // A failed notification must not break the app; the banner still shows.
      }
    }

    setReminders(recordFired(reminders, pending.map((r) => r.key), now))
    // `app` changes on every log, which is exactly when a reminder may become
    // satisfied — so re-running on it is intended.
  }, [now, reminders, app, setReminders])

  return due
}
