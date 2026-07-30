import { useState } from 'react'
import { useApp } from '../state/AppContext'
import type { Flow, Severity, Symptom } from '../types'
import {
  FLOWS,
  FLOW_LABELS,
  SCALE,
  SEVERITY_LABELS,
  SYMPTOMS,
} from '../data/options'
import { formatDate, todayISO } from '../data/date'
import {
  currentPhase,
  cycleDay,
  nextPeriodDate,
  PHASE_LABELS,
} from '../data/cycle'
import * as s from '../ui/styles'

export default function Cycle() {
  const { profile, cycleLogs, saveCycleEntry, deleteCycleEntry, symptomsOn } =
    useApp()

  const [date, setDate] = useState(todayISO())
  const [flow, setFlow] = useState<Flow>('none')
  const [notes, setNotes] = useState('')
  // symptom -> severity. A symptom missing from this map just isn't logged.
  const [symptoms, setSymptoms] = useState<Partial<Record<Symptom, Severity>>>(
    {},
  )
  const [saved, setSaved] = useState(false)

  /** Pull an already-logged day back into the form so it can be edited. */
  function loadDate(nextDate: string) {
    setDate(nextDate)
    setSaved(false)

    const existing = cycleLogs.find((log) => log.date === nextDate)
    setFlow(existing?.flow ?? 'none')
    setNotes(existing?.notes ?? '')

    const existingSymptoms: Partial<Record<Symptom, Severity>> = {}
    for (const log of symptomsOn(nextDate)) {
      existingSymptoms[log.symptom] = log.severity
    }
    setSymptoms(existingSymptoms)
  }

  function toggleSymptom(symptom: Symptom) {
    setSaved(false)
    setSymptoms((current) => {
      const next = { ...current }
      if (symptom in next) {
        delete next[symptom]
      } else {
        next[symptom] = 3
      }
      return next
    })
  }

  function setSeverity(symptom: Symptom, severity: Severity) {
    setSaved(false)
    setSymptoms((current) => ({ ...current, [symptom]: severity }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveCycleEntry({
      date,
      flow,
      notes,
      symptoms: Object.entries(symptoms).map(([symptom, severity]) => ({
        symptom: symptom as Symptom,
        severity: severity as Severity,
      })),
    })
    setSaved(true)
  }

  // Newest first.
  const recent = [...cycleLogs].sort((a, b) => b.date.localeCompare(a.date))

  const day = profile ? cycleDay(profile, cycleLogs) : null
  const phase = profile ? currentPhase(profile, cycleLogs) : null
  const nextPeriod = profile ? nextPeriodDate(profile, cycleLogs) : null

  return (
    <div style={s.page}>
      <h1>Cycle</h1>

      {profile && day !== null && (
        <div style={s.card}>
          <h2>Where you are</h2>
          <ul>
            <li>Cycle day {day}</li>
            {phase && <li>Phase: {PHASE_LABELS[phase]}</li>}
            {nextPeriod && <li>Next period around {formatDate(nextPeriod)}</li>}
          </ul>
          <p style={s.muted}>
            Estimated from your average cycle length — not something to rely on
            {profile.irregularCycles
              ? ', especially with irregular cycles'
              : ''}
            .
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={s.card}>
        <h2>Log a day</h2>

        <div style={s.row}>
          <label htmlFor="date">Date</label>
          <br />
          <input
            id="date"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => loadDate(e.target.value)}
          />
        </div>

        <div style={s.row}>
          <label htmlFor="flow">Bleeding</label>
          <br />
          <select
            id="flow"
            value={flow}
            onChange={(e) => {
              setFlow(e.target.value as Flow)
              setSaved(false)
            }}
          >
            {FLOWS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset style={{ ...s.fieldset, ...s.row }}>
          <legend style={{ padding: 0 }}>Symptoms</legend>
          {SYMPTOMS.map((sym) => {
            const active = sym.value in symptoms
            return (
              <div key={sym.value} style={{ marginBottom: '4px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleSymptom(sym.value)}
                  />{' '}
                  {sym.label}
                </label>
                {active && (
                  <select
                    aria-label={`${sym.label} severity`}
                    value={symptoms[sym.value]}
                    onChange={(e) =>
                      setSeverity(sym.value, Number(e.target.value) as Severity)
                    }
                    style={{ marginLeft: '8px' }}
                  >
                    {SCALE.map((n) => (
                      <option key={n} value={n}>
                        {SEVERITY_LABELS[n]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </fieldset>

        <div style={s.row}>
          <label htmlFor="notes">Notes</label>
          <br />
          <input
            id="notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              setSaved(false)
            }}
            style={s.input}
          />
        </div>

        <button type="submit">Save day</button>
        {saved && <span style={{ marginLeft: '8px' }}>Saved.</span>}
      </form>

      <div style={s.card}>
        <h2>History</h2>
        {recent.length === 0 ? (
          <p style={s.muted}>Nothing logged yet.</p>
        ) : (
          <ul style={s.list}>
            {recent.map((log) => {
              const daySymptoms = symptomsOn(log.date)
              return (
                <li key={log.id} style={s.listItem}>
                  <span>
                    <strong>{formatDate(log.date)}</strong> —{' '}
                    {FLOW_LABELS[log.flow]}
                    {daySymptoms.length > 0 && (
                      <>
                        <br />
                        <span style={s.muted}>
                          {daySymptoms
                            .map((sym) => `${sym.symptom} (${sym.severity})`)
                            .join(', ')}
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
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      style={s.linkButton}
                      onClick={() => loadDate(log.date)}
                    >
                      Edit
                    </button>
                    {' · '}
                    <button
                      type="button"
                      style={s.linkButton}
                      onClick={() => deleteCycleEntry(log.date)}
                    >
                      Delete
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
