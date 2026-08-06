import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * The router swaps page content in place without reloading, so the browser
 * keeps whatever scroll position the last page ended on. Without this, going
 * from the bottom of Settings to Cycle lands you at the bottom of Cycle.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
