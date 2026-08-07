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
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        /*
         * A home-screen PWA is usually resumed from the OS's suspended state,
         * not freshly navigated to — and a browser only checks sw.js for
         * changes on navigation. Without this, someone who never fully closes
         * the app can be stuck on a build from weeks ago. Checking on load and
         * every time the tab regains visibility catches that case.
         */
        registration.update()
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update()
        })
      })
      .catch(() => {
        // Offline support is a bonus; failing to register must not break the app.
      })

    // Once a new service worker takes over, its cache is already the fresh
    // one — reload so the page actually uses the new build instead of the
    // JS that happened to already be running in memory.
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
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
