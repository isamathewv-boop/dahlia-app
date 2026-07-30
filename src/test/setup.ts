import { afterEach } from 'vitest'

/*
 * Runs for every test file, in whichever environment that file uses.
 *
 * The DOM-only work is guarded because most of the suite runs in node, where
 * importing Testing Library would blow up.
 */
if (typeof document !== 'undefined') {
  const { cleanup } = await import('@testing-library/react')

  afterEach(() => {
    cleanup()
    // Page tests persist through localStorage, so each test starts blank.
    localStorage.clear()
  })
}
