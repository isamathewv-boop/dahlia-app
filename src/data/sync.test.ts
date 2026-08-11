import { describe, expect, it } from 'vitest'
import { decideMerge } from './sync'
import { createEmptyData } from './storage'
import { makeProfile } from '../test/fixtures'

const remoteData = { ...createEmptyData(), profile: makeProfile({ name: 'Remote' }) }

describe('decideMerge', () => {
  it('treats no remote row as a first sync', () => {
    expect(decideMerge(null, '2026-08-01T00:00:00.000Z')).toEqual({ action: 'first-sync' })
    expect(decideMerge(null, null)).toEqual({ action: 'first-sync' })
  })

  it('uses remote when local has never been touched', () => {
    const remote = { data: remoteData, updatedAt: '2026-08-01T00:00:00.000Z' }
    expect(decideMerge(remote, null)).toEqual({ action: 'use-remote', data: remoteData })
  })

  it('uses whichever side is newer', () => {
    const remote = { data: remoteData, updatedAt: '2026-08-01T12:00:00.000Z' }

    expect(decideMerge(remote, '2026-08-01T10:00:00.000Z')).toEqual({
      action: 'use-remote',
      data: remoteData,
    })
    expect(decideMerge(remote, '2026-08-01T14:00:00.000Z')).toEqual({ action: 'use-local' })
  })

  it('favours local on an exact tie, so a device never overwrites its own fresh write with itself', () => {
    const remote = { data: remoteData, updatedAt: '2026-08-01T12:00:00.000Z' }
    expect(decideMerge(remote, '2026-08-01T12:00:00.000Z')).toEqual({ action: 'use-local' })
  })
})
