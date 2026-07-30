import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { Severity, TimeAvailable } from '../types'
import {
  ENERGY_LABELS,
  EQUIPMENT_LABELS,
  FLOW_LABELS,
  GOAL_LABELS,
  LEVEL_LABELS,
  SCALE,
  SEVERITY_LABELS,
  TIMES,
} from '../data/options'
import { formatDate, todayISO } from '../data/date'
import {
  currentPhase,
  cycleDay,
  nextPeriodDate,
  PHASE_LABELS,
} from '../data/cycle'
import * as s from '../ui/styles'

export default function Home() {
  const {
    profile,
    cycleLogs,
    workoutLogs,
    mealLogs,
    checkIns,
    saveCheckIn,
    symptomsOn,
  } = useApp()

  const today = todayISO()
  const existingCheckIn = checkIns.find((c) => c.date === today)

  const [sleepHours, setSleepHours] = useState(
    String(existingCheckIn?.sleepHours ?? 7),
  )
  const [energy, setEnergy] = useState<Severity>(existingCheckIn?.energy ?? 3)
  const [soreness, setSoreness] = useState<Severity>(
    existingCheckIn?.soreness ?? 2,
  )
  const [minutesAvailable, setMinutesAvailable] = useState(
    String(existingCheckIn?.minutesAvailable ?? profile?.timeAvailable ?? 30),
  )

  if (!profile) {
    return (
      <div style={s.page}>
        <h1>Home</h1>
        <p>No profile yet. Dahlia can't plan anything until she knows you.</p>
        <Link to="/onboarding">Start onboarding</Link>
      </div>
    )
  }

  function handleCheckIn(e: React.FormEvent) {
    e.preventDefault()
    saveCheckIn({
      date: today,
      sleepHours: Number(sleepHours) || 0,
      energy,
      soreness,
      minutesAvailable: Number(minutesAvailable) as TimeAvailable,
    })
  }

  const day = cycleDay(profile, cycleLogs)
  const phase = currentPhase(profile, cycleLogs)
  const nextPeriod = nextPeriodDate(profile, cycleLogs)

  const todaysCycle = cycleLogs.find((log) => log.date === today)
  const todaysSymptoms = symptomsOn(today)
  const todaysWorkouts = workoutLogs.filter((log) => log.date === today)
  const todaysMeals = mealLogs.filter((log) => log.date === today)

  return (
    <div style={s.page}>
      <h1>Hi {profile.name}</h1>

      <div style={s.card}>
        <h2>Today — {formatDate(today)}</h2>
        {day !== null ? (
          <p>
            Cycle day {day}
            {phase ? ` · ${PHASE_LABELS[phase]}` : ''}
            {nextPeriod ? ` · next period around ${formatDate(nextPeriod)}` : ''}
          </p>
        ) : (
          <p style={s.muted}>
            Add your last period date in <Link to="/onboarding">onboarding</Link>{' '}
            to see your cycle day.
          </p>
        )}
      </div>

      <form onSubmit={handleCheckIn} style={s.card}>
        <h2>Daily check-in</h2>
        <p style={s.muted}>
          This is what today's plan will be built from once the rule engine
          exists.
        </p>

        <div style={s.row}>
          <label htmlFor="sleep">Hours of sleep</label>
          <br />
          <input
            id="sleep"
            type="number"
            min="0"
            max="16"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
          />
        </div>

        <div style={s.row}>
          <label htmlFor="energy">Energy</label>
          <br />
          <select
            id="energy"
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value) as Severity)}
          >
            {SCALE.map((n) => (
              <option key={n} value={n}>
                {ENERGY_LABELS[n]}
              </option>
            ))}
          </select>
        </div>

        <div style={s.row}>
          <label htmlFor="soreness">Soreness</label>
          <br />
          <select
            id="soreness"
            value={soreness}
            onChange={(e) => setSoreness(Number(e.target.value) as Severity)}
          >
            {SCALE.map((n) => (
              <option key={n} value={n}>
                {SEVERITY_LABELS[n]}
              </option>
            ))}
          </select>
        </div>

        <div style={s.row}>
          <label htmlFor="minutes">Minutes you actually have today</label>
          <br />
          <select
            id="minutes"
            value={minutesAvailable}
            onChange={(e) => setMinutesAvailable(e.target.value)}
          >
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {t} minutes
              </option>
            ))}
          </select>
        </div>

        <button type="submit">
          {existingCheckIn ? 'Update check-in' : 'Save check-in'}
        </button>
        {existingCheckIn && (
          <span style={{ ...s.muted, marginLeft: '8px' }}>
            Checked in today.
          </span>
        )}
      </form>

      <div style={s.card}>
        <h2>Logged today</h2>
        <ul>
          <li>
            Cycle:{' '}
            {todaysCycle ? (
              <>
                {FLOW_LABELS[todaysCycle.flow]}
                {todaysSymptoms.length > 0 &&
                  ` · ${todaysSymptoms.length} symptom${todaysSymptoms.length === 1 ? '' : 's'}`}
              </>
            ) : (
              'nothing'
            )}{' '}
            — <Link to="/cycle">log</Link>
          </li>
          <li>
            Workouts: {todaysWorkouts.length} —{' '}
            <Link to="/workouts">log</Link>
          </li>
          <li>
            Meals: {todaysMeals.length} — <Link to="/diet">log</Link>
          </li>
        </ul>
      </div>

      <div style={s.card}>
        <h2>Today's plan</h2>
        <p style={s.muted}>Coming in Step 3 — the rule engine.</p>
      </div>

      <div style={s.card}>
        <h2>Dahlia says</h2>
        <p style={s.muted}>Coming in Step 4.</p>
      </div>

      <div style={s.card}>
        <h2>Your setup</h2>
        <ul>
          <li>Goal: {GOAL_LABELS[profile.mainGoal]}</li>
          <li>Level: {LEVEL_LABELS[profile.workoutLevel]}</li>
          <li>Usual time: {profile.timeAvailable} minutes</li>
          <li>Equipment: {EQUIPMENT_LABELS[profile.equipment]}</li>
          <li>Diet: {profile.dietPreference || 'not set'}</li>
          <li>
            Conditions:{' '}
            {profile.healthConditions.length
              ? profile.healthConditions.join(', ')
              : 'none'}
          </li>
          <li>Coach tone: {profile.coachTone}</li>
        </ul>
        <Link to="/onboarding">Edit</Link>
      </div>
    </div>
  )
}
