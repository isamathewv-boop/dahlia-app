import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { Severity, TimeAvailable } from '../types'
import {
  ENERGY_LABELS,
  EQUIPMENT_LABELS,
  FLOW_LABELS,
  GOAL_LABELS,
  INTENSITY_LABELS,
  LEVEL_LABELS,
  SCALE,
  SEVERITY_LABELS,
  TIMES,
} from '../data/options'
import { formatDate, todayISO } from '../data/date'
import { nextPeriodDate, PHASE_LABELS } from '../data/cycle'
import { buildDailyPlan } from '../engine/plan'
import { buildBriefing } from '../engine/dahlia'
import * as s from '../ui/styles'

export default function Home() {
  const app = useApp()
  const {
    profile,
    cycleLogs,
    workoutLogs,
    mealLogs,
    checkIns,
    saveCheckIn,
    symptomsOn,
  } = app

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

  const plan = buildDailyPlan(profile, app, today)
  const briefing = buildBriefing(profile, app, today)
  const nextPeriod = nextPeriodDate(profile, cycleLogs, today)

  const todaysCycle = cycleLogs.find((log) => log.date === today)
  const todaysSymptoms = symptomsOn(today)
  const todaysWorkouts = workoutLogs.filter((log) => log.date === today)
  const todaysMeals = mealLogs.filter((log) => log.date === today)

  return (
    <div style={s.page}>
      <h1>Hi {profile.name}</h1>

      <div style={s.card}>
        <h2>Today — {formatDate(today)}</h2>
        {plan.cycleDay !== null ? (
          <p>
            Cycle day {plan.cycleDay}
            {plan.phase ? ` · ${PHASE_LABELS[plan.phase]}` : ''}
            {nextPeriod ? ` · next period around ${formatDate(nextPeriod)}` : ''}
          </p>
        ) : (
          <p style={s.muted}>
            Add your last period date in <Link to="/onboarding">onboarding</Link>{' '}
            to see your cycle day.
          </p>
        )}
      </div>

      {plan.safety.length > 0 && (
        <div style={{ ...s.card, borderColor: '#c66', background: '#fff8f8' }}>
          <h2>Read this first</h2>
          <ul>
            {plan.safety.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ ...s.card, borderWidth: '2px' }}>
        <h2>Do this next</h2>
        <p>{plan.nextAction}</p>
      </div>

      <div style={s.card}>
        <h2>Readiness — {plan.readiness.score}/100</h2>
        <p>
          {plan.readiness.band === 'low'
            ? 'Low. Today is for recovery.'
            : plan.readiness.band === 'moderate'
              ? 'Moderate. Train, but leave something in the tank.'
              : 'Good. You can push today.'}
        </p>
        {plan.readiness.reasons.length > 0 && (
          <ul style={s.muted}>
            {plan.readiness.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={s.card}>
        <h2>Today's workout</h2>
        <p>
          <strong>{plan.workout.title}</strong>
          <br />
          <span style={s.muted}>
            {INTENSITY_LABELS[plan.workout.intensity]} intensity ·{' '}
            {plan.workout.note}
          </span>
        </p>
        <ul>
          {plan.workout.exercises.map((exercise) => (
            <li key={exercise.name}>
              {exercise.name} — {exercise.prescription}
            </li>
          ))}
        </ul>
        <Link to="/workouts">Log it</Link>
      </div>

      <div style={s.card}>
        <h2>Food focus</h2>
        <p>
          <strong>{plan.nutrition.headline}</strong>
        </p>
        <ul>
          {plan.nutrition.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <Link to="/diet">Log a meal</Link>
      </div>

      <form onSubmit={handleCheckIn} style={s.card}>
        <h2>Daily check-in</h2>
        <p style={s.muted}>
          The plan above is built from these. Change them and it changes.
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
            Workouts: {todaysWorkouts.length} — <Link to="/workouts">log</Link>
          </li>
          <li>
            Meals: {todaysMeals.length} — <Link to="/diet">log</Link>
          </li>
          <li style={s.muted}>
            {plan.adherence.completedLast7Days} session
            {plan.adherence.completedLast7Days === 1 ? '' : 's'} in the last 7
            days
            {plan.adherence.daysSinceLastWorkout !== null &&
              ` · last one ${plan.adherence.daysSinceLastWorkout} day${plan.adherence.daysSinceLastWorkout === 1 ? '' : 's'} ago`}
          </li>
        </ul>
      </div>

      <div style={s.card}>
        <h2>Dahlia says</h2>
        <p>{briefing.push}</p>
        {briefing.correction && (
          <p>
            <strong>One thing:</strong> {briefing.correction}
          </p>
        )}
        <Link to="/dahlia">Talk to Dahlia</Link>
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
