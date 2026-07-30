import type { AppData } from '../types'

/*
 * Passcode-based encryption for the local store.
 *
 * The passcode never leaves the device and is never stored — only a random
 * salt is. That means there is genuinely no recovery path if it is forgotten,
 * which is the honest cost of the data being unreadable to anyone else.
 */

/** OWASP's floor for PBKDF2-SHA256. Slow on purpose. */
export const PBKDF2_ITERATIONS = 310_000

export interface EncryptedEnvelope {
  format: 'dahlia-encrypted'
  version: 1
  salt: string
  iv: string
  iterations: number
  ciphertext: string
}

export function cryptoAvailable(): boolean {
  return (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.subtle !== 'undefined'
  )
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Stretches a passcode into an AES key.
 *
 * Deliberately expensive — this is the only thing standing between a stolen
 * device and the contents, so a brute-force attempt should cost real time.
 */
export async function deriveKey(
  passcode: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** A fresh salt, for first-time setup or a passcode change. */
export function newSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

export async function encryptWithKey(
  key: CryptoKey,
  salt: Uint8Array,
  data: AppData,
  iterations = PBKDF2_ITERATIONS,
): Promise<EncryptedEnvelope> {
  // A fresh IV per write. Reusing one with AES-GCM would leak plaintext.
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  )

  return {
    format: 'dahlia-encrypted',
    version: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    iterations,
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  }
}

/**
 * Returns null for a wrong passcode or tampered data — AES-GCM authenticates,
 * so both fail the same way and neither is distinguishable from the other.
 */
export async function decryptWithKey(
  key: CryptoKey,
  envelope: EncryptedEnvelope,
): Promise<AppData | null> {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) as BufferSource },
      key,
      fromBase64(envelope.ciphertext) as BufferSource,
    )
    return JSON.parse(new TextDecoder().decode(plain)) as AppData
  } catch {
    return null
  }
}

/** Convenience for the unlock screen: derive from the envelope's own salt. */
export async function unlockEnvelope(
  envelope: EncryptedEnvelope,
  passcode: string,
): Promise<{ data: AppData; key: CryptoKey; salt: Uint8Array } | null> {
  const salt = fromBase64(envelope.salt)
  const key = await deriveKey(passcode, salt, envelope.iterations)
  const data = await decryptWithKey(key, envelope)

  return data ? { data, key, salt } : null
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<EncryptedEnvelope>
  return (
    candidate.format === 'dahlia-encrypted' &&
    typeof candidate.salt === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.ciphertext === 'string' &&
    typeof candidate.iterations === 'number'
  )
}

export { toBase64, fromBase64 }
