import type { AppData } from '../types'

// Local-first storage. Health data never leaves this device.
// Bump the version in the key if the shape of AppData ever changes in a way
// that would break old saved data.
const STORAGE_KEY = 'dahlia.v1'

export const emptyData: AppData = {
  profile: null,
  cycleLogs: [],
  symptomLogs: [],
  workoutLogs: [],
  mealLogs: [],
  checkIns: [],
  coachMessages: [],
}

/** Read everything back from the browser. Never throws. */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData
    // Spread emptyData first so any field added later isn't `undefined`.
    return { ...emptyData, ...JSON.parse(raw) }
  } catch {
    return emptyData
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
