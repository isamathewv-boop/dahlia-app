import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import type { Goal, WorkoutLevel } from '../types'

const GOAL_LABELS: Record<Goal, string> = {
  'fat-loss': 'Fat loss',
  'muscle-gain': 'Muscle gain',
  maintenance: 'Maintenance',
  energy: 'More energy',
  'hormone-support': 'Hormone / cycle support',
}

const LEVEL_LABELS: Record<WorkoutLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const card = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '12px',
  marginBottom: '12px',
}

export default function Home() {
  const { profile } = useApp()

  if (!profile) {
    return (
      <div>
        <h1>Home</h1>
        <p>No profile yet. Dahlia can't plan anything until she knows you.</p>
        <Link to="/onboarding">Start onboarding</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <h1>Hi {profile.name}</h1>

      <div style={card}>
        <h2>Your setup</h2>
        <ul>
          <li>Goal: {GOAL_LABELS[profile.mainGoal]}</li>
          <li>Level: {LEVEL_LABELS[profile.workoutLevel]}</li>
          <li>Time per day: {profile.timeAvailable} minutes</li>
          <li>Equipment: {profile.equipment}</li>
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

      <div style={card}>
        <h2>Today's plan</h2>
        <p>Coming in Step 3 — the rule engine.</p>
      </div>

      <div style={card}>
        <h2>Quick log</h2>
        <p>Coming in Step 2 — cycle, workout and meal logging.</p>
      </div>

      <div style={card}>
        <h2>Dahlia says</h2>
        <p>Coming in Step 4.</p>
      </div>
    </div>
  )
}
