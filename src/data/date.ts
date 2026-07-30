/** Today as YYYY-MM-DD, in the user's own timezone. */
export function todayISO(): string {
  return toISODate(new Date())
}

/**
 * Format a Date as YYYY-MM-DD using local time.
 * We do NOT use toISOString() directly — that converts to UTC first, which
 * makes late-evening logs land on the wrong day.
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Turn YYYY-MM-DD back into a Date at local midnight. */
export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Whole days from `from` to `to`. Negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const ms = fromISODate(to).getTime() - fromISODate(from).getTime()
  return Math.round(ms / 86400000)
}

/** Add days to a YYYY-MM-DD date and return YYYY-MM-DD. */
export function addDays(iso: string, days: number): string {
  const date = fromISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** Human-friendly date, e.g. "Wed 29 Jul". */
export function formatDate(iso: string): string {
  if (!iso) return ''
  return fromISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** A fresh unique id for a log entry. */
export function newId(): string {
  return crypto.randomUUID()
}
