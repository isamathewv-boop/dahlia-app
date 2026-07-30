import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AppProvider from './state/AppProvider.tsx'

/*
 * Register the offline worker in production only — in dev it would serve a
 * stale bundle and make edits look like they had not applied.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Relative path, so the scope matches wherever the app is deployed.
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is a bonus; failing to register must not break the app.
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Hash routing so a static host needs no SPA rewrite rule: reloading on
        /#/cycle always serves index.html, which plain file hosts do anyway. */}
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </StrictMode>,
)
