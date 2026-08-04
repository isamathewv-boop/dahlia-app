/*
 * The user's own Anthropic API key.
 *
 * Stored under its own localStorage key, deliberately NOT inside AppData.
 * AppData is what `Export my data` writes to a plain JSON file — a key living
 * there would be copied into every export and shared with whoever sees it.
 *
 * The trade-off of keeping it out: app lock does not encrypt it, and delete-
 * everything has to clear it separately. Both are handled explicitly.
 */

const KEY_STORAGE = 'dahlia.anthropicKey'

export function loadApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function saveApiKey(key: string): void {
  try {
    const trimmed = key.trim()
    if (trimmed) localStorage.setItem(KEY_STORAGE, trimmed)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // Storage blocked. Nothing useful to do.
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(KEY_STORAGE)
  } catch {
    // ignore
  }
}

export function hasApiKey(): boolean {
  return loadApiKey().length > 0
}

/** Never render a key in full — only enough to recognise which one it is. */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return '••••'
  return `${key.slice(0, 7)}…${key.slice(-4)}`
}
