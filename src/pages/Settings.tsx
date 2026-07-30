import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { CoachTone } from '../types'
import { TONES } from '../data/options'
import { parseImport, serializeData } from '../data/storage'
import { todayISO } from '../data/date'
import * as s from '../ui/styles'

export default function Settings() {
  const app = useApp()
  const { profile, saveProfile, replaceAllData, resetAll } = app

  // Destructive and replacing actions both need a deliberate second click.
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [importError, setImportError] = useState('')
  const [importNotice, setImportNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

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
        <h2>Coach tone</h2>
        {profile ? (
          <>
            <p style={s.muted}>How blunt Dahlia is with you.</p>
            <select
              id="coachTone"
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
        <h2>Not built yet</h2>
        <ul style={s.muted}>
          <li>Reminders and notifications</li>
          <li>App lock</li>
          <li>Units — nothing in the app measures weight or height yet</li>
        </ul>
      </div>
    </div>
  )
}
