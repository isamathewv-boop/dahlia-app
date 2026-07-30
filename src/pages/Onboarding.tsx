import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type {
  CoachTone,
  Equipment,
  Goal,
  TimeAvailable,
  UserProfile,
  WorkoutLevel,
} from '../types'
import {
  CONDITIONS,
  EQUIPMENT,
  GOALS,
  LEVELS,
  TIMES,
  TONES,
} from '../data/options'
import { row, section } from '../ui/styles'

export default function Onboarding() {
  const { profile, saveProfile } = useApp()
  const navigate = useNavigate()

  // One state object for the whole form. Values are strings because that is
  // what <input> and <select> give us; we convert them on submit.
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    mainGoal: (profile?.mainGoal ?? 'fat-loss') as Goal,
    workoutLevel: (profile?.workoutLevel ?? 'beginner') as WorkoutLevel,
    timeAvailable: String(profile?.timeAvailable ?? 30),
    equipment: (profile?.equipment ?? 'bodyweight') as Equipment,
    dietPreference: profile?.dietPreference ?? '',
    coachTone: (profile?.coachTone ?? 'strict') as CoachTone,
    lastPeriodDate: profile?.lastPeriodDate ?? '',
    cycleLength: String(profile?.cycleLength ?? 28),
    periodLength: String(profile?.periodLength ?? 5),
    irregularCycles: profile?.irregularCycles ?? false,
  })

  const [conditions, setConditions] = useState<string[]>(
    profile?.healthConditions ?? [],
  )

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleCondition(condition: string) {
    setConditions((current) =>
      current.includes(condition)
        ? current.filter((c) => c !== condition)
        : [...current, condition],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newProfile: UserProfile = {
      name: form.name.trim() || 'You',
      mainGoal: form.mainGoal,
      workoutLevel: form.workoutLevel,
      timeAvailable: Number(form.timeAvailable) as TimeAvailable,
      equipment: form.equipment,
      dietPreference: form.dietPreference.trim(),
      healthConditions: conditions,
      coachTone: form.coachTone,
      lastPeriodDate: form.lastPeriodDate,
      cycleLength: Number(form.cycleLength) || 28,
      periodLength: Number(form.periodLength) || 5,
      irregularCycles: form.irregularCycles,
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    }

    saveProfile(newProfile)
    navigate('/')
  }

  return (
    <div style={{ maxWidth: '420px' }}>
      <h1>{profile ? 'Edit your profile' : 'Onboarding'}</h1>

      <form onSubmit={handleSubmit}>
        <section style={section}>
          <h2>About you</h2>
          <div style={row}>
            <label htmlFor="name">Name</label>
            <br />
            <input
              id="name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div style={row}>
            <label htmlFor="mainGoal">Main goal</label>
            <br />
            <select
              id="mainGoal"
              value={form.mainGoal}
              onChange={(e) => set('mainGoal', e.target.value as Goal)}
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div style={row}>
            <label htmlFor="coachTone">How should Dahlia talk to you?</label>
            <br />
            <select
              id="coachTone"
              value={form.coachTone}
              onChange={(e) => set('coachTone', e.target.value as CoachTone)}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section style={section}>
          <h2>Training</h2>
          <div style={row}>
            <label htmlFor="workoutLevel">Experience level</label>
            <br />
            <select
              id="workoutLevel"
              value={form.workoutLevel}
              onChange={(e) =>
                set('workoutLevel', e.target.value as WorkoutLevel)
              }
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div style={row}>
            <label htmlFor="timeAvailable">
              Minutes you can realistically give, most days
            </label>
            <br />
            <select
              id="timeAvailable"
              value={form.timeAvailable}
              onChange={(e) => set('timeAvailable', e.target.value)}
            >
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t} minutes
                </option>
              ))}
            </select>
          </div>
          <div style={row}>
            <label htmlFor="equipment">Equipment</label>
            <br />
            <select
              id="equipment"
              value={form.equipment}
              onChange={(e) => set('equipment', e.target.value as Equipment)}
            >
              {EQUIPMENT.map((eq) => (
                <option key={eq.value} value={eq.value}>
                  {eq.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section style={section}>
          <h2>Food &amp; health</h2>
          <div style={row}>
            <label htmlFor="dietPreference">
              Diet preference (e.g. vegetarian, high protein, home food)
            </label>
            <br />
            <input
              id="dietPreference"
              value={form.dietPreference}
              onChange={(e) => set('dietPreference', e.target.value)}
            />
          </div>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ padding: 0 }}>
              Health conditions Dahlia must respect
            </legend>
            {CONDITIONS.map((c) => (
              <label key={c} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={conditions.includes(c)}
                  onChange={() => toggleCondition(c)}
                />{' '}
                {c}
              </label>
            ))}
          </fieldset>
        </section>

        <section style={section}>
          <h2>Cycle</h2>
          <div style={row}>
            <label htmlFor="lastPeriodDate">
              First day of your last period
            </label>
            <br />
            <input
              id="lastPeriodDate"
              type="date"
              value={form.lastPeriodDate}
              onChange={(e) => set('lastPeriodDate', e.target.value)}
            />
          </div>
          <div style={row}>
            <label htmlFor="cycleLength">Average cycle length (days)</label>
            <br />
            <input
              id="cycleLength"
              type="number"
              min="20"
              max="45"
              value={form.cycleLength}
              onChange={(e) => set('cycleLength', e.target.value)}
            />
          </div>
          <div style={row}>
            <label htmlFor="periodLength">How many days you bleed</label>
            <br />
            <input
              id="periodLength"
              type="number"
              min="1"
              max="10"
              value={form.periodLength}
              onChange={(e) => set('periodLength', e.target.value)}
            />
          </div>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={form.irregularCycles}
              onChange={(e) => set('irregularCycles', e.target.checked)}
            />{' '}
            My cycles are irregular
          </label>
        </section>

        <button type="submit">Save</button>
      </form>

      <p style={{ marginTop: '24px', fontSize: '13px', opacity: 0.7 }}>
        Saved only on this device. Dahlia is not a doctor and this is not
        medical advice.
      </p>
    </div>
  )
}
