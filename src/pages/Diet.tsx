import { useState } from 'react'
import { useApp } from '../state/AppContext'
import type { MealSlot } from '../types'
import { MEAL_SLOTS, SLOT_LABELS } from '../data/options'
import { formatDate, todayISO } from '../data/date'
import * as s from '../ui/styles'

export default function Diet() {
  const { profile, mealLogs, addMealLog, deleteMealLog } = useApp()

  const [date, setDate] = useState(todayISO())
  const [slot, setSlot] = useState<MealSlot>('breakfast')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return

    addMealLog({
      date,
      slot,
      description: description.trim(),
      notes: notes.trim() || undefined,
    })
    setDescription('')
    setNotes('')
  }

  const today = todayISO()
  const todaysMeals = mealLogs.filter((log) => log.date === today)

  // Group the history by date, newest date first.
  const byDate = new Map<string, typeof mealLogs>()
  for (const log of [...mealLogs].sort((a, b) => b.date.localeCompare(a.date))) {
    const existing = byDate.get(log.date) ?? []
    byDate.set(log.date, [...existing, log])
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
                      {SLOT_LABELS[log.slot]}: {log.description}
                      {log.notes && (
                        <>
                          <br />
                          <span style={s.muted}>{log.notes}</span>
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      style={s.linkButton}
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
