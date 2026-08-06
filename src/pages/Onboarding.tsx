import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type {
  CoachTone,
  Equipment,
  Goal,
  TimeAvailable,
  UserProfile,
  WeightGoal,
  WorkoutLevel,
} from '../types'
import {
  CONDITIONS,
  EQUIPMENT,
  GOALS,
  LEVELS,
  TIMES,
  TONES,
  WEIGHT_GOALS,
} from '../data/options'
import { dangerText, muted, row, section } from '../ui/styles'

/** Conditions the user already had that aren't one of the fixed checkboxes. */
function customConditions(saved: string[]): string {
  return saved.filter((c) => !CONDITIONS.includes(c)).join(', ')
}

export default function Onboarding() {
  const { profile, saveProfile } = useApp()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)

  // One state object for the whole form. Values are strings because that is
  // what <input> and <select> give us; we convert them on submit.
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    workoutLevel: (profile?.workoutLevel ?? 'beginner') as WorkoutLevel,
    timeAvailable: String(profile?.timeAvailable ?? 30),
    equipment: (profile?.equipment ?? 'bodyweight') as Equipment,
    dietPreference: profile?.dietPreference ?? '',
    weightKg: profile?.weightKg ? String(profile.weightKg) : '',
    weightGoal: (profile?.weightGoal ?? '') as WeightGoal | '',
    targetWeightKg: profile?.targetWeightKg ? String(profile.targetWeightKg) : '',
    coachTone: (profile?.coachTone ?? 'strict') as CoachTone,
    lastPeriodDate: profile?.lastPeriodDate ?? '',
    cycleLength: String(profile?.cycleLength ?? 28),
    periodLength: String(profile?.periodLength ?? 5),
    irregularCycles: profile?.irregularCycles ?? false,
  })

  const [conditions, setConditions] = useState<string[]>(
    profile?.healthConditions.filter((c) => CONDITIONS.includes(c)) ?? [],
  )
  const [otherCondition, setOtherCondition] = useState(
    customConditions(profile?.healthConditions ?? []),
  )

  // A checklist, not a single choice — order is priority order: the first
  // one ticked is what drives the protein ratio, rep range and weekly shape,
  // the rest still shape the food guidance and Dahlia's notes.
  const [goals, setGoals] = useState<Goal[]>(profile?.goals ?? [])
  const [goalsTouched, setGoalsTouched] = useState(false)

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

  function toggleGoal(goal: Goal) {
    setGoalsTouched(true)
    setGoals((current) =>
      current.includes(goal)
        ? current.filter((g) => g !== goal)
        : [...current, goal],
    )
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault()
    if (goals.length === 0) {
      setGoalsTouched(true)
      return
    }
    setStep(2)
    window.scrollTo(0, 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const extraConditions = otherCondition
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    const newProfile: UserProfile = {
      name: form.name.trim() || 'You',
      goals,
      workoutLevel: form.workoutLevel,
      timeAvailable: Number(form.timeAvailable) as TimeAvailable,
      equipment: form.equipment,
      dietPreference: form.dietPreference.trim(),
      // Left undefined rather than 0, so "no weight given" stays distinct
      // from a real value and no target is invented.
      weightKg: Number(form.weightKg) > 0 ? Number(form.weightKg) : undefined,
      weightGoal: form.weightGoal || undefined,
      targetWeightKg:
        form.weightGoal && form.weightGoal !== 'maintain' && Number(form.targetWeightKg) > 0
          ? Number(form.targetWeightKg)
          : undefined,
      healthConditions: [...conditions, ...extraConditions],
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
      <p style={muted}>Step {step} of 2</p>

      {step === 1 && (
        <form onSubmit={goToStep2}>
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
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ padding: 0 }}>
                Goals — pick as many as apply, in the order they matter most
              </legend>
              {GOALS.map((g) => (
                <label key={g.value} style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={goals.includes(g.value)}
                    onChange={() => toggleGoal(g.value)}
                  />{' '}
                  {g.label}
                  {goals[0] === g.value && (
                    <span style={{ ...muted, fontSize: '13px' }}> — primary</span>
                  )}
                </label>
              ))}
              {goalsTouched && goals.length === 0 && (
                <p style={{ ...dangerText, fontSize: '13px' }}>
                  Pick at least one goal — everything else is built from it.
                </p>
              )}
            </fieldset>
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

          <button type="submit">Next</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
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
            <div style={row}>
              <label htmlFor="weightKg">Current weight in kg (optional)</label>
              <br />
              <input
                id="weightKg"
                type="number"
                min="20"
                max="300"
                step="0.5"
                inputMode="decimal"
                value={form.weightKg}
                onChange={(e) => set('weightKg', e.target.value)}
              />
              <br />
              <span style={{ fontSize: '13px', opacity: 0.7 }}>
                Only used to work out a protein target. Never a calorie limit,
                and the app works fine without it.
              </span>
            </div>

            <div style={row}>
              <label htmlFor="weightGoal">Weight goals</label>
              <br />
              <select
                id="weightGoal"
                value={form.weightGoal}
                onChange={(e) => set('weightGoal', e.target.value as WeightGoal | '')}
              >
                <option value="">Prefer not to say</option>
                {WEIGHT_GOALS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {(form.weightGoal === 'lose' || form.weightGoal === 'gain') && (
              <div style={row}>
                <label htmlFor="targetWeightKg">Target weight in kg</label>
                <br />
                <input
                  id="targetWeightKg"
                  type="number"
                  min="20"
                  max="300"
                  step="0.5"
                  inputMode="decimal"
                  value={form.targetWeightKg}
                  onChange={(e) => set('targetWeightKg', e.target.value)}
                />
                <br />
                <span style={{ fontSize: '13px', opacity: 0.7 }}>
                  Only shown back to you as a plain distance to go. Never turned
                  into a calorie target or a deadline.
                </span>
              </div>
            )}

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
              <div style={{ marginTop: '8px' }}>
                <label htmlFor="otherCondition">Other (comma-separated)</label>
                <br />
                <input
                  id="otherCondition"
                  value={otherCondition}
                  onChange={(e) => setOtherCondition(e.target.value)}
                  placeholder="e.g. asthma"
                />
              </div>
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

          <button
            type="button"
            onClick={() => {
              setStep(1)
              window.scrollTo(0, 0)
            }}
          >
            Back
          </button>{' '}
          <button type="submit">Save</button>
        </form>
      )}

      <p style={{ marginTop: '24px', fontSize: '13px', opacity: 0.7 }}>
        Saved only on this device. Dahlia is not a doctor and this is not
        medical advice.
      </p>
    </div>
  )
}
