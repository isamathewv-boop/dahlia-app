import type { AppData } from '../types'
import { supabase } from './supabaseClient'

const TABLE = 'user_data'
/** Kept outside AppData, same reasoning as data/aiKey.ts — this is sync
 * bookkeeping, not something that belongs in an export or an import. */
const LOCAL_UPDATED_KEY = 'dahlia.localUpdatedAt'

export interface AuthResult {
  ok: boolean
  error?: string
}

export interface RemoteRow {
  data: AppData
  updatedAt: string
}

/** Not signed in, or sync was never configured for this deployment — same UI treatment either way. */
export const NOT_CONFIGURED = 'Sync is not set up for this deployment yet.'

function describeAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Wrong email or password.'
  if (lower.includes('already registered')) return 'An account already exists for that email — sign in instead.'
  if (lower.includes('password')) return message
  if (lower.includes('email')) return message
  return 'Could not reach the sync server. Check your connection and try again.'
}

/**
 * Where Supabase should send the user back to after clicking an emailed
 * link. Built from the page actually running rather than a dashboard
 * setting, so it's correct on localhost, a preview deploy, or production
 * without relying on the Supabase "Site URL" being configured right. Still
 * needs to be added to Authentication -> URL Configuration -> Redirect URLs
 * in the Supabase dashboard, or Supabase rejects it and falls back to the
 * Site URL anyway.
 */
function redirectUrl(hashRoute: string): string {
  return `${window.location.origin}${window.location.pathname}#${hashRoute}`
}

/*
 * Every function below returns a typed result rather than throwing — a
 * dropped connection or a misconfigured project must degrade to "sync
 * didn't happen," never to a crashed page. Local data is always the fallback.
 */

export async function signUp(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl('/settings') },
    })
    return error ? { ok: false, error: describeAuthError(error.message) } : { ok: true }
  } catch {
    return { ok: false, error: 'Could not reach the sync server. Check your connection and try again.' }
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { ok: false, error: describeAuthError(error.message) } : { ok: true }
  } catch {
    return { ok: false, error: 'Could not reach the sync server. Check your connection and try again.' }
  }
}

/**
 * Sends a reset link to the given email if an account exists for it.
 * Deliberately doesn't reveal whether the email is registered — Supabase
 * itself returns success either way, so the UI copy should stay generic.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl('/reset-password'),
    })
    return error ? { ok: false, error: describeAuthError(error.message) } : { ok: true }
  } catch {
    return { ok: false, error: 'Could not reach the sync server. Check your connection and try again.' }
  }
}

/** Only works while the recovery session from a reset-link click is active — see pages/ResetPassword.tsx. */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: NOT_CONFIGURED }
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return error ? { ok: false, error: describeAuthError(error.message) } : { ok: true }
  } catch {
    return { ok: false, error: 'Could not reach the sync server. Check your connection and try again.' }
  }
}

/**
 * Fires when the client finishes processing a reset-link click. Supabase
 * may process the link's token before this page has even mounted, so
 * callers should also check currentSession() directly rather than relying
 * on this alone — see ResetPassword.tsx.
 */
export function onPasswordRecovery(callback: () => void): () => void {
  if (!supabase) return () => {}
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') callback()
  })
  return () => subscription.unsubscribe()
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  try {
    await supabase.auth.signOut()
  } catch {
    // Nothing useful to do with a failed sign-out; local state clears regardless.
  }
}

/** Null when signed out, sync isn't configured, or the server is unreachable. */
export async function currentSession() {
  if (!supabase) return null
  try {
    const { data } = await supabase.auth.getSession()
    return data.session
  } catch {
    return null
  }
}

/** Null means "no row yet" (first sync) as well as "sync unavailable" — callers branch on syncConfigured() first. */
export async function pullRemote(userId: string): Promise<RemoteRow | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    return { data: data.data as AppData, updatedAt: data.updated_at as string }
  } catch {
    return null
  }
}

export async function pushRemote(userId: string, appData: AppData): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ user_id: userId, data: appData, updated_at: new Date().toISOString() })
    return !error
  } catch {
    return false
  }
}

export async function deleteRemote(userId: string): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from(TABLE).delete().eq('user_id', userId)
    return !error
  } catch {
    return false
  }
}

// ---------- Merge ----------

export function touchLocalUpdatedAt(): void {
  try {
    localStorage.setItem(LOCAL_UPDATED_KEY, new Date().toISOString())
  } catch {
    // Storage blocked. Worst case a later merge favours remote unnecessarily.
  }
}

export function getLocalUpdatedAt(): string | null {
  try {
    return localStorage.getItem(LOCAL_UPDATED_KEY)
  } catch {
    return null
  }
}

export type MergeDecision =
  | { action: 'first-sync' }
  | { action: 'use-remote'; data: AppData }
  | { action: 'use-local' }

/**
 * Last-write-wins by timestamp. This is the whole conflict-resolution
 * strategy — deliberately simple, because this data belongs to one person
 * syncing their own devices, not multiple people editing together. The real
 * trade-off: editing the same day's log on two devices while both are
 * offline means the later sync wins and the earlier device's edits in that
 * window are lost. Acceptable here; would not be for shared data.
 */
export function decideMerge(remote: RemoteRow | null, localUpdatedAt: string | null): MergeDecision {
  if (!remote) return { action: 'first-sync' }
  if (!localUpdatedAt) return { action: 'use-remote', data: remote.data }
  return remote.updatedAt > localUpdatedAt
    ? { action: 'use-remote', data: remote.data }
    : { action: 'use-local' }
}
