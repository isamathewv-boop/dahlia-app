import { NavLink, Routes, Route } from 'react-router-dom'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Cycle from './pages/Cycle'
import Workouts from './pages/Workouts'
import Diet from './pages/Diet'
import Dahlia from './pages/Dahlia'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import ReminderBanner from './components/ReminderBanner'
import LockScreen from './components/LockScreen'
import { useApp } from './state/AppContext'

const PAGES = [
  { to: '/', label: 'Home' },
  { to: '/cycle', label: 'Cycle' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/diet', label: 'Diet' },
  { to: '/dahlia', label: 'Dahlia' },
  { to: '/progress', label: 'Progress' },
  { to: '/settings', label: 'Settings' },
  { to: '/onboarding', label: 'Profile' },
]

function App() {
  const { locked } = useApp()

  // Nothing else mounts while locked — no nav, no pages, no reminder banner.
  if (locked) return <LockScreen />

  return (
    <div>
      {/* NavLink sets aria-current="page" on the active route, which is what
          the highlight in index.css hangs off — so the marker is real to a
          screen reader, not just a colour. The row wraps because eight links
          overflow a phone-width viewport. */}
      <nav className="nav" aria-label="Main">
        {PAGES.map((page) => (
          <NavLink key={page.to} to={page.to} end={page.to === '/'}>
            {page.label}
          </NavLink>
        ))}
      </nav>

      <ReminderBanner />

      <main>
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
