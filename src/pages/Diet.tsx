import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { MealSlot } from '../types'
import { MEAL_SLOTS, SLOT_LABELS } from '../data/options'
import { formatDate, todayISO } from '../data/date'
import { dataUrlBytes, fileToThumbnail, formatBytes } from '../data/photo'
import { hasApiKey } from '../data/aiKey'
import { proteinProgress } from '../engine/macros'
import * as s from '../ui/styles'

const CONFIDENCE_LABELS = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
} as const

export default function Diet() {
  const app = useApp()
  const { profile, mealLogs, addMealLog, deleteMealLog } = app

  const [date, setDate] = useState(todayISO())
  const [slot, setSlot] = useState<MealSlot>('breakfast')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const [photo, setPhoto] = useState('')
  const [estimated, setEstimated] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [aiNote, setAiNote] = useState('')
  const [aiError, setAiError] = useState('')
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)

  function resetForm() {
    setDescription('')
    setNotes('')
    setProtein('')
    setCarbs('')
    setFat('')
    setPhoto('')
    setEstimated(false)
    setAiNote('')
    setAiError('')
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    setAiError('')
    setAiNote('')

    const file = e.target.files?.[0]
    // Reset so picking the same file again still fires a change.
    e.target.value = ''
    if (!file) return

    try {
      setPhoto(await fileToThumbnail(file))
    } catch {
      setAiError("That image couldn't be read. Try a different one.")
    }
  }

  async function handleAnalyse() {
    if (!photo) return

    setAnalysing(true)
    setAiError('')
    setAiNote('')

    // Loaded on demand, so the SDK stays out of the main bundle.
    const { analysePhoto } = await import('../engine/analysePhoto')
    const result = await analysePhoto(photo, profile)

    if (!result.ok) {
      setAiError(result.error)
    } else {
      const { analysis } = result
      if (!description.trim()) setDescription(analysis.description)
      setProtein(String(analysis.macros.protein ?? ''))
      setCarbs(String(analysis.macros.carbs ?? ''))
      setFat(String(analysis.macros.fat ?? ''))
      setEstimated(true)
      setAiNote(`${CONFIDENCE_LABELS[analysis.confidence]}. ${analysis.caveat}`)
    }
    setAnalysing(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return

    const macros = {
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
    }
    const hasMacros = Object.values(macros).some((value) => value !== undefined)

    addMealLog({
      date,
      slot,
      description: description.trim(),
      notes: notes.trim() || undefined,
      macros: hasMacros ? macros : undefined,
      photo: photo || undefined,
      macrosEstimated: hasMacros && estimated ? true : undefined,
    })
    resetForm()
  }

  const today = todayISO()
  const todaysMeals = mealLogs.filter((log) => log.date === today)
  const progress = profile ? proteinProgress(profile, app, today) : null

  const photoBytes = mealLogs.reduce(
    (sum, log) => sum + (log.photo ? dataUrlBytes(log.photo) : 0),
    0,
  )

  // Group the history by date, newest date first.
  const byDate = new Map<string, typeof mealLogs>()
  for (const log of [...mealLogs].sort((a, b) => b.date.localeCompare(a.date))) {
    byDate.set(log.date, [...(byDate.get(log.date) ?? []), log])
  }

  return (
    <div style={s.page}>
      <h1>Diet</h1>

      <div style={s.card}>
        <h2>Today</h2>
        <p>
          {todaysMeals.length} meal{todaysMeals.length === 1 ? '' : 's'} logged.
        </p>
        {profile?.dietPreference && (
          <p style={s.muted}>Your preference: {profile.dietPreference}</p>
        )}
        {progress && <p>{progress.message}</p>}
        {progress?.target && (
          <p style={s.muted}>
            Protein so far: {progress.eaten.protein}g · carbs{' '}
            {progress.eaten.carbs}g · fat {progress.eaten.fat}g
          </p>
        )}
        {progress?.verdict === 'no-target' && (
          <p style={s.muted}>
            <Link to="/onboarding">Edit your profile</Link>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} style={s.card}>
        <h2>Log a meal</h2>

        <div style={s.row}>
          <label htmlFor="date">Date</label>
          <br />
          <input
            id="date"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div style={s.row}>
          <label htmlFor="slot">Meal</label>
          <br />
          <select
            id="slot"
            value={slot}
            onChange={(e) => setSlot(e.target.value as MealSlot)}
          >
            {MEAL_SLOTS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div style={s.row}>
          <span id="photoLabel">Photo</span>
          <br />
          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            aria-label="Take photo"
            style={{ display: 'none' }}
          />
          <input
            ref={libraryInput}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            aria-label="Choose from photo library"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            data-variant="quiet"
            onClick={() => cameraInput.current?.click()}
          >
            Take photo
          </button>{' '}
          <button
            type="button"
            data-variant="quiet"
            onClick={() => libraryInput.current?.click()}
          >
            Choose from library
          </button>
        </div>

        {photo && (
          <div style={s.row}>
            <img
              src={photo}
              alt="The meal you just captured"
              style={{
                maxWidth: '180px',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
                marginBottom: '8px',
              }}
            />
            <button
              type="button"
              data-variant="quiet"
              onClick={handleAnalyse}
              disabled={analysing || !hasApiKey()}
            >
              {analysing ? 'Analysing…' : 'Estimate macros from photo'}
            </button>{' '}
            <button type="button" data-variant="link" onClick={() => setPhoto('')}>
              Remove photo
            </button>

            {!hasApiKey() && (
              <p style={s.muted}>
                Photo analysis needs your own Anthropic key —{' '}
                <Link to="/settings">add one in Settings</Link>. The photo is
                saved either way.
              </p>
            )}
          </div>
        )}

        {aiError && <p style={s.dangerText}>{aiError}</p>}
        {aiNote && <p style={s.muted}>{aiNote}</p>}

        <div style={s.row}>
          <label htmlFor="description">What you ate</label>
          <br />
          <input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={s.input}
            required
          />
        </div>

        <fieldset style={{ ...s.fieldset, ...s.row }}>
          <legend style={{ padding: 0 }}>
            Macros in grams {estimated ? '— estimated, correct anything wrong' : '(optional)'}
          </legend>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span>
              <label htmlFor="protein">Protein</label>
              <br />
              <input
                id="protein"
                type="number"
                min="0"
                inputMode="numeric"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                style={{ width: '90px' }}
              />
            </span>
            <span>
              <label htmlFor="carbs">Carbs</label>
              <br />
              <input
                id="carbs"
                type="number"
                min="0"
                inputMode="numeric"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                style={{ width: '90px' }}
              />
            </span>
            <span>
              <label htmlFor="fat">Fat</label>
              <br />
              <input
                id="fat"
                type="number"
                min="0"
                inputMode="numeric"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                style={{ width: '90px' }}
              />
            </span>
          </div>
        </fieldset>

        <div style={s.row}>
          <label htmlFor="notes">Notes (cravings, how it felt)</label>
          <br />
          <input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={s.input}
          />
        </div>

        <button type="submit">Add meal</button>
      </form>

      <div style={s.card}>
        <h2>History</h2>
        {photoBytes > 0 && (
          <p style={s.muted}>
            Photos are using {formatBytes(photoBytes)} of browser storage.
          </p>
        )}
        {byDate.size === 0 ? (
          <p style={s.muted}>No meals logged yet.</p>
        ) : (
          [...byDate.entries()].map(([logDate, meals]) => (
            <div key={logDate} style={{ marginBottom: '12px' }}>
              <strong>{formatDate(logDate)}</strong>
              <ul style={s.list}>
                {meals.map((log) => (
                  <li key={log.id} style={s.listItem}>
                    <span>
                      {log.photo && (
                        <img
                          src={log.photo}
                          alt=""
                          style={{
                            width: '52px',
                            height: '52px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            float: 'left',
                            marginRight: '10px',
                          }}
                        />
                      )}
                      {SLOT_LABELS[log.slot]}: {log.description}
                      {log.macros && (
                        <>
                          <br />
                          <span style={s.muted}>
                            {log.macros.protein ?? 0}g protein ·{' '}
                            {log.macros.carbs ?? 0}g carbs · {log.macros.fat ?? 0}g
                            fat
                            {log.macrosEstimated ? ' · estimated' : ''}
                          </span>
                        </>
                      )}
                      {log.notes && (
                        <>
                          <br />
                          <span style={s.muted}>{log.notes}</span>
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      data-variant="link"
                      data-tone="danger"
                      onClick={() => deleteMealLog(log.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
