import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { CoachTone } from '../types'
import { TONES } from '../data/options'
import { parseImport, serializeData } from '../data/storage'
import { todayISO } from '../data/date'
import {
  notificationPermission,
  notificationsSupported,
} from '../ui/useReminders'
import * as s from '../ui/styles'

export default function Settings() {
  const app = useApp()
  const { profile, saveProfile, replaceAllData, resetAll, reminders, setReminders } =
    app

  // Destructive and replacing actions both need a deliberate second click.
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [importError, setImportError] = useState('')
  const [importNotice, setImportNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  // Held in state so the copy updates the moment the browser prompt resolves.
  const [permission, setPermission] = useState(notificationPermission)

  const counts = [
    { label: 'Cycle days', value: app.cycleLogs.length },
    { label: 'Symptom entries', value: app.symptomLogs.length },
    { label: 'Workouts', value: app.workoutLogs.length },
    { label: 'Meals', value: app.mealLogs.length },
    { label: 'Check-ins', value: app.checkIns.length },
  ]

  function handleExport() {
    const json = serializeData(app)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `dahlia-export-${todayISO()}.json`
    link.click()

    // Let the browser start the download before we release the blob.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError('')
    setImportNotice('')

    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const imported = parseImport(text)

    // Reset the input so picking the same file again still fires a change.
    if (fileInput.current) fileInput.current.value = ''

    if (!imported) {
      setImportError(
        "That file isn't a Dahlia export. Nothing was changed.",
      )
      return
    }

    replaceAllData(imported)
    setImportNotice('Import done. Everything was replaced with the file.')
  }

  function handleRemindersEnabled(enabled: boolean) {
    // Clear the delivery log when switching off, so re-enabling later in the
    // same day can still nudge.
    setReminders({ ...reminders, enabled, lastFired: enabled ? reminders.lastFired : [] })
  }

  async function handleAskNotifications() {
    if (!notificationsSupported()) return
    // Must be inside a click handler — browsers reject permission requests
    // that aren't tied to a user gesture.
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  function handleToneChange(tone: CoachTone) {
    if (!profile) return
    saveProfile({ ...profile, coachTone: tone })
  }

  function handleDelete() {
    resetAll()
    setConfirmingDelete(false)
    setImportNotice('')
    setImportError('')
  }

  return (
    <div style={s.page}>
      <h1>Settings</h1>

      <div style={s.cardDanger}>
        <h2>Not medical advice</h2>
        <p>
          Dahlia is a tracker and a planner, not a doctor. Nothing here
          diagnoses anything, and nothing here replaces your doctor. Cycle
          predictions are estimates from your own averages — they are not a
          contraceptive method and not a pregnancy test.
        </p>
        <p>
          If something feels seriously wrong, stop reading apps and talk to a
          medical professional.
        </p>
      </div>

      <div style={s.card}>
        {/* The heading names the control, so the select points at it rather
            than repeating the words in a second visible label. */}
        <h2 id="coachToneHeading">Coach tone</h2>
        {profile ? (
          <>
            <p style={s.muted}>How blunt Dahlia is with you.</p>
            <select
              id="coachTone"
              aria-labelledby="coachToneHeading"
              value={profile.coachTone}
              onChange={(e) => handleToneChange(e.target.value as CoachTone)}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </>
        ) : (
          <p style={s.muted}>
            No profile yet — <Link to="/onboarding">onboard first</Link>.
          </p>
        )}
      </div>

      <div style={s.card}>
        <h2>Where your data lives</h2>
        <p>
          On this device only, in this browser's storage. It is never uploaded,
          there are no accounts, and there is no analytics watching what you
          log.
        </p>
        <p style={s.muted}>
          The flip side: clearing your browser data deletes it too. Export a
          copy if you care about keeping it.
        </p>
        <ul style={s.list}>
          {counts.map((row) => (
            <li key={row.label} style={s.listItem}>
              <span>{row.label}</span>
              <span>{row.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={s.card}>
        <h2>Export</h2>
        <p style={s.muted}>
          Downloads everything as a JSON file you own and can read.
        </p>
        <button type="button" onClick={handleExport}>
          Export my data
        </button>
      </div>

      <div style={s.card}>
        <h2>Import</h2>
        <p style={s.muted}>
          Restores a previous export — for a new device, or after clearing your
          browser. This <strong>replaces</strong> everything currently in the
          app.
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          aria-label="Choose an export file to import"
        />
        {importError && <p style={s.dangerText}>{importError}</p>}
        {importNotice && <p>{importNotice}</p>}
      </div>

      <div style={s.cardDanger}>
        <h2>Delete everything</h2>
        <p style={s.muted}>
          Wipes your profile and every log from this device. This cannot be
          undone.
        </p>
        {confirmingDelete ? (
          <>
            <p>
              <strong>Certain?</strong> Export first if you want a copy.
            </p>
            <button type="button" onClick={handleDelete}>
              Yes, delete everything
            </button>{' '}
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)}>
            Delete my data
          </button>
        )}
      </div>

      <div style={s.card}>
        <h2>Reminders</h2>
        <p style={s.muted}>
          A nudge to check in, and another in the evening if the day is still
          blank. Both disappear on their own once you have done the thing.
        </p>

        <label>
          <input
            type="checkbox"
            checked={reminders.enabled}
            onChange={(e) => handleRemindersEnabled(e.target.checked)}
          />{' '}
          Remind me
        </label>

        {reminders.enabled && (
          <>
            <div style={{ ...s.row, marginTop: '12px' }}>
              <label htmlFor="checkInTime">Morning check-in</label>
              <br />
              <input
                id="checkInTime"
                type="time"
                value={reminders.checkInTime}
                onChange={(e) =>
                  setReminders({ ...reminders, checkInTime: e.target.value })
                }
              />
            </div>

            <div style={s.row}>
              <label htmlFor="eveningTime">Evening, if nothing is logged</label>
              <br />
              <input
                id="eveningTime"
                type="time"
                value={reminders.eveningTime}
                onChange={(e) =>
                  setReminders({ ...reminders, eveningTime: e.target.value })
                }
              />
            </div>

            <p style={s.muted}>
              <strong>Reminders only appear while Dahlia is open.</strong> Your
              data never leaves this device, and a page with no server behind it
              cannot wake itself up to notify you. Delivering notifications with
              the app closed would mean sending your logs to a push service, so
              it is not built.
            </p>

            {permission === 'unsupported' ? (
              <p style={s.muted}>
                This browser has no notification support, so reminders show as a
                banner in the app.
              </p>
            ) : permission === 'granted' ? (
              <p style={s.muted}>
                System notifications are on. You will also see a banner in the
                app.
              </p>
            ) : permission === 'denied' ? (
              <p style={s.muted}>
                Notifications are blocked for this site in your browser
                settings, so reminders show as a banner in the app instead.
              </p>
            ) : (
              <>
                <p style={s.muted}>
                  Reminders currently show as a banner in the app. Allow
                  notifications and they can pop up while another tab is
                  focused.
                </p>
                <button
                  type="button"
                  data-variant="quiet"
                  onClick={handleAskNotifications}
                >
                  Allow notifications
                </button>
              </>
            )}
          </>
        )}
      </div>

      <div style={s.card}>
        <h2>Not built yet</h2>
        <ul style={s.muted}>
          <li>App lock</li>
          <li>Units — nothing in the app measures weight or height yet</li>
        </ul>
      </div>
    </div>
  )
}
