import { describe, expect, it, vi } from 'vitest'

import { SITE_URL } from '../site'
import { crashShareText, shareOrCopy, type ShareEnv } from './share'

function env(over: Partial<ShareEnv> = {}): ShareEnv {
  return {
    canNativeShare: false,
    share: vi.fn(() => Promise.resolve()),
    copy: vi.fn(() => Promise.resolve()),
    ...over,
  }
}

describe('crashShareText', () => {
  it('names the command and ends with the site URL', () => {
    expect(crashShareText('sudo rm -rf --no-preserve-root /', 'destroyed')).toBe(
      `I just destroyed Linux with sudo rm -rf --no-preserve-root / in Pixel Linux Quest. Can you break it too? ${SITE_URL}`,
    )
  })

  it('says "froze", not "destroyed", for SYSTEM FROZEN', () => {
    expect(crashShareText(':(){ :|:& };:', 'frozen')).toBe(
      `I just froze Linux with :(){ :|:& };: in Pixel Linux Quest. Can you break it too? ${SITE_URL}`,
    )
  })

  it('has no em dashes', () => {
    expect(crashShareText(':(){ :|:& };:', 'frozen')).not.toMatch(/—/)
  })
})

describe('shareOrCopy', () => {
  it('uses the share sheet on phones', async () => {
    const e = env({ canNativeShare: true })
    expect(await shareOrCopy('hi', e)).toBe('shared')
    expect(e.share).toHaveBeenCalledWith('hi')
    expect(e.copy).not.toHaveBeenCalled()
  })

  it('copies to the clipboard elsewhere', async () => {
    const e = env()
    expect(await shareOrCopy('hi', e)).toBe('copied')
    expect(e.share).not.toHaveBeenCalled()
    expect(e.copy).toHaveBeenCalledWith('hi')
  })

  it('does nothing more when the share sheet is closed', async () => {
    const e = env({ canNativeShare: true, share: () => Promise.reject(new DOMException('closed', 'AbortError')) })
    expect(await shareOrCopy('hi', e)).toBe('cancelled')
    expect(e.copy).not.toHaveBeenCalled()
  })

  it('falls back to copying when sharing fails', async () => {
    const e = env({ canNativeShare: true, share: () => Promise.reject(new Error('nope')) })
    expect(await shareOrCopy('hi', e)).toBe('copied')
  })

  it('reports a failed copy', async () => {
    expect(await shareOrCopy('hi', env({ copy: () => Promise.reject(new Error('blocked')) }))).toBe('failed')
  })
})
