import { createClient } from '@supabase/supabase-js'

/*
 * Sync is opt-in and entirely additive — the app must keep working exactly as
 * before for anyone who never sets this up. Until VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY exist (set at build time), this stays null and every
 * caller in data/sync.ts treats that as "sync isn't configured" rather than
 * throwing.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null

export function syncConfigured(): boolean {
  return supabase !== null
}
