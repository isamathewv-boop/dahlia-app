import { useState } from 'react'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [mainGoal, setMainGoal] = useState('')
  const [workoutLevel, setWorkoutLevel] = useState('')
  const [timeAvailable, setTimeAvailable] = useState('')
  const [dietPreference, setDietPreference] = useState('')
  const [healthConditions, setHealthConditions] = useState('')
  const [lastPeriodDate, setLastPeriodDate] = useState('')
  const [cycleLength, setCycleLength] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [energyLevel, setEnergyLevel] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log({
      name,
      mainGoal,
      workoutLevel,
      timeAvailable,
      dietPreference,
      healthConditions,
      lastPeriodDate,
      cycleLength,
      sleepHours,
      energyLevel,
    })
  }

  return (
    <div style={{ maxWidth: '400px' }}>
      <h1>Onboarding</h1>
      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: '16px' }}>
          <h2>About You</h2>
          <div style={{ marginBottom: '8px' }}>
            <label>Name</label>
            <br />
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Main Goal</label>
            <br />
            <input
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
            />
          </div>
        </section>

        <section style={{ marginBottom: '16px' }}>
          <h2>Fitness</h2>
          <div style={{ marginBottom: '8px' }}>
            <label>Workout Level</label>
            <br />
            <input
              value={workoutLevel}
              onChange={(e) => setWorkoutLevel(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Time Available</label>
            <br />
            <input
              value={timeAvailable}
              onChange={(e) => setTimeAvailable(e.target.value)}
            />
          </div>
        </section>

        <section style={{ marginBottom: '16px' }}>
          <h2>Diet & Health</h2>
          <div style={{ marginBottom: '8px' }}>
            <label>Diet Preference</label>
            <br />
            <input
              value={dietPreference}
              onChange={(e) => setDietPreference(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Health Conditions</label>
            <br />
            <input
              value={healthConditions}
              onChange={(e) => setHealthConditions(e.target.value)}
            />
          </div>
        </section>

        <section style={{ marginBottom: '16px' }}>
          <h2>Cycle</h2>
          <div style={{ marginBottom: '8px' }}>
            <label>Last Period Date</label>
            <br />
            <input
              type="date"
              value={lastPeriodDate}
              onChange={(e) => setLastPeriodDate(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Cycle Length</label>
            <br />
            <input
              type="number"
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
            />
          </div>
        </section>

        <section style={{ marginBottom: '16px' }}>
          <h2>Wellbeing</h2>
          <div style={{ marginBottom: '8px' }}>
            <label>Sleep Hours</label>
            <br />
            <input
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>Energy Level</label>
            <br />
            <input
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
            />
          </div>
        </section>

        <button type="submit">Save</button>
      </form>
    </div>
  )
}
