import type { AppData } from '../types'

// Local-first storage. Health data never leaves this device.
// Bump the version in the key if the shape of AppData ever changes in a way
// that would break old saved data.
const STORAGE_KEY = 'dahlia.v1'

/**
 * A fresh blank slate, every call.
 *
 * This is deliberately a factory and not a shared constant: the blank arrays
 * get spread into loaded and imported data to fill missing keys, and a shared
 * constant would hand out references to its own arrays. One `push` anywhere
 * would then corrupt the blank state for the rest of the session.
 */
export function createEmptyData(): AppData {
  return {
    profile: null,
    cycleLogs: [],
    symptomLogs: [],
    workoutLogs: [],
    mealLogs: [],
    checkIns: [],
    coachMessages: [],
  }
}

/** Read everything back from the browser. Never throws. */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyData()
    // Blank slate first, so any field added in a later version isn't undefined.
    return { ...createEmptyData(), ...JSON.parse(raw) }
  } catch {
    return createEmptyData()
  }
}

/** Write everything to the browser. Never throws. */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or blocked (private mode). Nothing useful to do here.
  }
}

/** Wipe every trace of the user's data from this device. */
export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** The collections that must be arrays for imported data to be usable. */
const LOG_KEYS = [
  'cycleLogs',
  'symptomLogs',
  'workoutLogs',
  'mealLogs',
  'checkIns',
  'coachMessages',
] as const

/** Everything the user has, as a readable JSON file they own. */
export function serializeData(data: AppData): string {
  return JSON.stringify(
    { format: 'dahlia-export', version: 1, exportedAt: new Date().toISOString(), data },
    null,
    2,
  )
}

/**
 * Reads an exported file back. Returns null rather than throwing if the file
 * is not ours — an import replaces everything, so we validate before trusting.
 */
export function parseImport(raw: string): AppData | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object') return null

  // Accept both the wrapped export format and a bare AppData object.
  const wrapper = parsed as { data?: unknown }
  const candidate = (
    wrapper.data && typeof wrapper.data === 'object' ? wrapper.data : parsed
  ) as Record<string, unknown>

  for (const key of LOG_KEYS) {
    if (candidate[key] !== undefined && !Array.isArray(candidate[key])) {
      return null
    }
  }

  const profile = candidate.profile
  if (profile !== undefined && profile !== null && typeof profile !== 'object') {
    return null
  }

  // A file with none of our fields at all is not an export of ours.
  const hasAnyField =
    profile !== undefined || LOG_KEYS.some((key) => candidate[key] !== undefined)
  if (!hasAnyField) return null

  return { ...createEmptyData(), ...candidate } as AppData
}
