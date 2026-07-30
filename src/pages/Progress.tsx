import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { buildProgress } from '../engine/progress'
import { SYMPTOM_LABELS } from '../data/options'
import { formatDate } from '../data/date'
import BarChart from '../components/BarChart'
import type { Bar } from '../components/BarChart'
import * as s from '../ui/styles'

/** A number worth reading on its own, with its meaning underneath. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ fontSize: '28px', lineHeight: 1.1 }}>{value}</div>
      <div style={s.muted}>{label}</div>
    </div>
  )
}

const statRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
  gap: '16px',
}

/** "Jul 30" — the weekday is noise once a range is being shown. */
function shortDate(iso: string): string {
  return formatDate(iso).replace(/^\w+,\s*/, '')
}

/** "Jul 3–9", or "Jun 28 – Jul 4" when the week straddles two months. */
function weekLabel(from: string, to: string): string {
  const start = shortDate(from)
  const end = shortDate(to)
  const sameMonth = from.slice(0, 7) === to.slice(0, 7)
  return sameMonth ? `${start}–${end.split(' ').pop()}` : `${start} – ${end}`
}

export default function Progress() {
  const app = useApp()
  const { profile } = app

  if (!profile) {
    return (
      <div style={s.page}>
        <h1>Progress</h1>
        <p>Nothing to measure yet.</p>
        <Link to="/onboarding">Start onboarding</Link>
      </div>
    )
  }

  const { streak, last7, last28, weeks, cycle, takeaway } = buildProgress(
    profile,
    app,
  )

  const weekBars: Bar[] = weeks.map((week) => ({
    label: weekLabel(week.from, week.to),
    value: week.workoutsCompleted,
    hint: `${shortDate(week.from)} to ${shortDate(week.to)}: ${week.workoutsCompleted} sessions, ${week.workoutMinutes} minutes`,
  }))

  const minuteBars: Bar[] = weeks.map((week) => ({
    label: weekLabel(week.from, week.to),
    value: week.workoutMinutes,
    hint: `${shortDate(week.from)} to ${shortDate(week.to)}: ${week.workoutMinutes} minutes`,
  }))

  const symptomBars: Bar[] = cycle.topSymptoms.map((pattern) => ({
    label: SYMPTOM_LABELS[pattern.symptom],
    value: pattern.count,
    hint: `${SYMPTOM_LABELS[pattern.symptom]}: logged ${pattern.count} times, average severity ${pattern.averageSeverity} of 5`,
  }))

  return (
    <div style={s.page}>
      <h1>Progress</h1>

      <div style={{ ...s.card, borderWidth: '2px' }}>
        <h2>This week</h2>
        <p>{takeaway}</p>
      </div>

      <div style={s.card}>
        <h2>Streak</h2>
        <div style={statRow}>
          <Stat value={String(streak.current)} label="days unbroken" />
          <Stat value={String(streak.longest)} label="longest ever" />
        </div>
        <p style={{ ...s.muted, marginTop: '12px' }}>
          Any log counts — a check-in, a meal, a workout or a cycle entry. Rest
          days do not break it, because rest days are part of the plan.
        </p>
      </div>

      <div style={s.card}>
        <h2>Last 7 days</h2>
        <div style={statRow}>
          <Stat value={`${last7.daysLogged}/7`} label="days logged" />
          <Stat value={String(last7.workoutsCompleted)} label="sessions done" />
          <Stat value={String(last7.workoutMinutes)} label="minutes trained" />
          <Stat value={`${last7.daysWithMeals}/7`} label="days with food logged" />
        </div>
        <div style={{ ...statRow, marginTop: '16px' }}>
          <Stat
            value={last7.averageSleep === null ? '—' : `${last7.averageSleep}h`}
            label="average sleep"
          />
          <Stat
            value={
              last7.averageEnergy === null ? '—' : `${last7.averageEnergy}/5`
            }
            label="average energy"
          />
          <Stat value={`${last7.checkIns}/7`} label="check-ins" />
          <Stat value={String(last7.workoutsAbandoned)} label="not finished" />
        </div>
        {last7.checkIns === 0 && (
          <p style={{ ...s.muted, marginTop: '12px' }}>
            A dash means nothing was logged, not zero.
          </p>
        )}
      </div>

      <div style={s.card}>
        <h2>Sessions completed, by week</h2>
        <BarChart
          bars={weekBars}
          emptyNote="No completed sessions in the last four weeks."
        />
      </div>

      <div style={s.card}>
        <h2>Minutes trained, by week</h2>
        <BarChart
          bars={minuteBars}
          unit="min"
          emptyNote="No training minutes logged in the last four weeks."
        />
      </div>

      <div style={s.card}>
        <h2>Last 28 days</h2>
        <div style={statRow}>
          <Stat value={`${last28.daysLogged}/28`} label="days logged" />
          <Stat value={String(last28.workoutsCompleted)} label="sessions done" />
          <Stat
            value={`${last28.daysWithMeals}/28`}
            label="days with food logged"
          />
          <Stat
            value={
              last28.averageSleep === null ? '—' : `${last28.averageSleep}h`
            }
            label="average sleep"
          />
        </div>
      </div>

      <div style={s.card}>
        <h2>Your cycle, as logged</h2>
        {cycle.periodsLogged === 0 ? (
          <p style={s.muted}>
            No periods logged yet. <Link to="/cycle">Log one</Link> and this
            fills in.
          </p>
        ) : !cycle.enoughForCycleLength ? (
          <>
            <p>
              One period on record. That is not enough to measure your cycle
              length — it takes two periods to see the gap between them.
            </p>
            <p style={s.muted}>
              Until then the app uses the {cycle.statedCycleLength} days you
              entered during onboarding.
            </p>
          </>
        ) : (
          <>
            <div style={statRow}>
              <Stat
                value={`${cycle.averageCycleLength}`}
                label="average cycle, days"
              />
              <Stat
                value={
                  cycle.shortestCycle === cycle.longestCycle
                    ? `${cycle.shortestCycle}`
                    : `${cycle.shortestCycle}–${cycle.longestCycle}`
                }
                label="range, days"
              />
              <Stat
                value={
                  cycle.averagePeriodLength === null
                    ? '—'
                    : `${cycle.averagePeriodLength}`
                }
                label="average period, days"
              />
              <Stat value={String(cycle.periodsLogged)} label="periods logged" />
            </div>
            <p style={{ ...s.muted, marginTop: '12px' }}>
              You entered {cycle.statedCycleLength} days at onboarding;{' '}
              {cycle.observedCycleLengths.length === 1
                ? 'one observed cycle so far'
                : `${cycle.observedCycleLengths.length} observed cycles`}{' '}
              average {cycle.averageCycleLength}. Predictions still use your
              entered figure — update it in{' '}
              <Link to="/onboarding">onboarding</Link> if the observed number
              looks more like you.
            </p>
          </>
        )}
      </div>

      <div style={s.card}>
        <h2>Most logged symptoms</h2>
        <BarChart
          bars={symptomBars}
          emptyNote="No symptoms logged yet. Log a few cycles and patterns show up here."
        />
        {cycle.topSymptoms.length > 0 && (
          <p style={{ ...s.muted, marginTop: '12px' }}>
            Counts, not severity. Hover a bar for its average severity.
          </p>
        )}
      </div>

      <p style={s.muted}>
        These are your own logs summarised back to you — not a diagnosis, and
        not a medical assessment of your cycle.
      </p>
    </div>
  )
}
