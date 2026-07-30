import { Link, Routes, Route } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Cycle from './pages/Cycle'
import Workouts from './pages/Workouts'
import Diet from './pages/Diet'
import Dahlia from './pages/Dahlia'
import Progress from './pages/Progress'
import Settings from './pages/Settings'

function App() {
  return (
    <div>
      {/* Wraps on purpose: eight links overflow a phone-width viewport and
          would scroll the whole page sideways. */}
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px',
        }}
      >
        <Link to="/">Home</Link>
        <Link to="/onboarding">Onboarding</Link>
        <Link to="/cycle">Cycle</Link>
        <Link to="/workouts">Workouts</Link>
        <Link to="/diet">Diet</Link>
        <Link to="/dahlia">Dahlia</Link>
        <Link to="/progress">Progress</Link>
        <Link to="/settings">Settings</Link>
      </nav>

      <main style={{ padding: '12px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/cycle" element={<Cycle />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/dahlia" element={<Dahlia />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
