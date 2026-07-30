import { describe, expect, it } from 'vitest'
import {
  cryptoAvailable,
  decryptWithKey,
  deriveKey,
  encryptWithKey,
  isEncryptedEnvelope,
  newSalt,
  unlockEnvelope,
} from './crypto'
import { createEmptyData } from './storage'
import { checkIn, makeProfile, mealLog } from '../test/fixtures'

// Fewer rounds so the suite stays fast; the algorithm is identical.
const ITERATIONS = 1_000

const data = {
  ...createEmptyData(),
  profile: makeProfile({ name: 'Sam' }),
  mealLogs: [mealLog('2026-07-30')],
  checkIns: [checkIn('2026-07-30')],
}

async function seal(passcode: string) {
  const salt = newSalt()
  const key = await deriveKey(passcode, salt, ITERATIONS)
  return encryptWithKey(key, salt, data, ITERATIONS)
}

describe('crypto availability', () => {
  it('has WebCrypto in this environment', () => {
    expect(cryptoAvailable()).toBe(true)
  })
})

describe('round trip', () => {
  it('decrypts back to exactly what went in', async () => {
    const envelope = await seal('correct horse')
    const opened = await unlockEnvelope(envelope, 'correct horse')

    expect(opened).not.toBeNull()
    expect(opened!.data).toEqual(data)
  })

  it('survives a passcode with spaces, unicode and emoji', async () => {
    const passcode = 'a b ç 🔒 パス'
    const envelope = await seal(passcode)
    const opened = await unlockEnvelope(envelope, passcode)

    expect(opened!.data.profile!.name).toBe('Sam')
  })
})

describe('a wrong passcode', () => {
  it('returns null rather than throwing', async () => {
    const envelope = await seal('correct horse')
    expect(await unlockEnvelope(envelope, 'wrong horse')).toBeNull()
  })

  it('rejects an empty passcode when one was set', async () => {
    const envelope = await seal('correct horse')
    expect(await unlockEnvelope(envelope, '')).toBeNull()
  })

  it('is case sensitive', async () => {
    const envelope = await seal('Passcode')
    expect(await unlockEnvelope(envelope, 'passcode')).toBeNull()
  })
})

describe('the ciphertext itself', () => {
  it('leaks none of the plaintext', async () => {
    const envelope = await seal('correct horse')
    const blob = JSON.stringify(envelope)

    // The whole point: someone reading storage learns nothing.
    expect(blob).not.toContain('Sam')
    expect(blob).not.toContain('fat-loss')
    expect(blob).not.toContain('oats')
    expect(blob).not.toContain('profile')
  })

  it('never stores the passcode or a salt-free hash of it', async () => {
    const blob = JSON.stringify(await seal('correct horse'))
    expect(blob).not.toContain('correct horse')
  })

  it('uses a fresh IV each write, so identical data encrypts differently', async () => {
    const salt = newSalt()
    const key = await deriveKey('same passcode', salt, ITERATIONS)

    const first = await encryptWithKey(key, salt, data, ITERATIONS)
    const second = await encryptWithKey(key, salt, data, ITERATIONS)

    expect(first.iv).not.toBe(second.iv)
    expect(first.ciphertext).not.toBe(second.ciphertext)
    // Both still open.
    expect(await decryptWithKey(key, first)).toEqual(data)
    expect(await decryptWithKey(key, second)).toEqual(data)
  })

  it('detects tampering', async () => {
    const envelope = await seal('correct horse')
    const flipped = envelope.ciphertext.startsWith('A') ? 'B' : 'A'
    const tampered = {
      ...envelope,
      ciphertext: flipped + envelope.ciphertext.slice(1),
    }

    expect(await unlockEnvelope(tampered, 'correct horse')).toBeNull()
  })
})

describe('salts', () => {
  it('differ between setups, so identical passcodes give different keys', async () => {
    const a = await seal('same passcode')
    const b = await seal('same passcode')
    expect(a.salt).not.toBe(b.salt)
  })

  it('cannot open an envelope with a key derived from the wrong salt', async () => {
    const envelope = await seal('same passcode')
    const wrongKey = await deriveKey('same passcode', newSalt(), ITERATIONS)
    expect(await decryptWithKey(wrongKey, envelope)).toBeNull()
  })
})

describe('isEncryptedEnvelope', () => {
  it('recognises a real envelope', async () => {
    expect(isEncryptedEnvelope(await seal('x'))).toBe(true)
  })

  it('rejects plain app data and junk', () => {
    expect(isEncryptedEnvelope(createEmptyData())).toBe(false)
    expect(isEncryptedEnvelope(null)).toBe(false)
    expect(isEncryptedEnvelope('a string')).toBe(false)
    expect(isEncryptedEnvelope({ format: 'dahlia-encrypted' })).toBe(false)
  })
})
