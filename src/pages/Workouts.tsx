import { useState } from 'react'
import { useApp } from '../state/AppContext'
import type { Intensity } from '../types'
import { INTENSITIES, INTENSITY_LABELS, WORKOUT_TYPES } from '../data/options'
import { addDays, formatDate, todayISO } from '../data/date'
import { buildDailyPlan } from '../engine/plan'
import { typeFromFocus } from '../engine/workout'
import * as s from '../ui/styles'
import { Pictogram } from '../ui/pictograms'

export default function Workouts() {
  const app = useApp()
  const { profile, workoutLogs, addWorkoutLog, deleteWorkoutLog } = app

  // Today's assigned session, so the form starts pre-filled with it.
  const plan = profile ? buildDailyPlan(profile, app) : null

  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState(
    plan ? typeFromFocus(plan.workout.focus) : WORKOUT_TYPES[0],
  )
  const [durationMinutes, setDurationMinutes] = useState(
    String(plan?.workout.durationMinutes ?? 30),
  )
  const [intensity, setIntensity] = useState<Intensity>(
    plan?.workout.intensity ?? 'moderate',
  )
  const [completed, setCompleted] = useState(true)
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addWorkoutLog({
      date,
      type,
      durationMinutes: Number(durationMinutes) || 0,
      intensity,
      completed,
      notes: notes.trim() || undefined,
    })
    // Clear the parts that change per entry, keep the date.
    setNotes('')
  }

  // Newest first.
  const recent = [...workoutLogs].sort((a, b) => b.date.localeCompare(a.date))

  const weekAgo = addDays(todayISO(), -7)
  const thisWeek = recent.filter(
    (log) => log.completed && log.date >= weekAgo,
  ).length

  return (
    <div style={s.page}>
      <h1>Workouts</h1>

      {plan && (
        <div style={s.card}>
          <h2>Today's session</h2>
          <p>
            <strong>{plan.workout.title}</strong>
            <br />
            <span style={s.muted}>
              {INTENSITY_LABELS[plan.workout.intensity]} intensity ·{' '}
              {plan.workout.note}
            </span>
          </p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {plan.workout.exercises.map((exercise) => (
              <li
                key={exercise.name}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}
              >
                <Pictogram kind={exercise.visual} size={44} />
                <span>
                  {exercise.name} — {exercise.prescription}
                  <br />
                  <span style={s.muted}>{exercise.cue}</span>
                </span>
              </li>
            ))}
          </ul>
          <p style={s.muted}>
            The form below is already filled in for this session.
          </p>
        </div>
      )}

      <div style={s.card}>
        <h2>This week</h2>
        <p>
          {thisWeek} session{thisWeek === 1 ? '' : 's'} completed in the last 7
          days.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={s.card}>
        <h2>Log a session</h2>

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
          <label htmlFor="type">What you did</label>
          <br />
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {WORKOUT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div style={s.row}>
          <label htmlFor="duration">Minutes</label>
          <br />
          <input
            id="duration"
            type="number"
            min="0"
            max="300"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>

        <div style={s.row}>
          <label htmlFor="intensity">How hard it felt</label>
          <br />
          <select
            id="intensity"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as Intensity)}
          >
            {INTENSITIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        <div style={s.row}>
          <label>
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
            />{' '}
            I finished it
          </label>
        </div>

        <div style={s.row}>
          <label htmlFor="notes">Notes</label>
          <br />
          <input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={s.input}
          />
        </div>

        <button type="submit">Add session</button>
      </form>

      <div style={s.card}>
        <h2>History</h2>
        {recent.length === 0 ? (
          <p style={s.muted}>No sessions logged yet.</p>
        ) : (
          <ul style={s.list}>
            {recent.map((log) => (
              <li key={log.id} style={s.listItem}>
                <span>
                  <strong>{formatDate(log.date)}</strong> — {log.type}
                  <br />
                  <span style={s.muted}>
                    {log.durationMinutes} min ·{' '}
                    {INTENSITY_LABELS[log.intensity]}
                    {log.completed ? '' : ' · not finished'}
                    {log.notes ? ` · ${log.notes}` : ''}
                  </span>
                </span>
                <button
                  type="button"
                  data-variant="link"
                      data-tone="danger"
                  onClick={() => deleteWorkoutLog(log.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
