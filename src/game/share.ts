import { SITE_URL } from '../site'

/** The text shared from the SYSTEM DESTROYED and SYSTEM FROZEN screens. */
export function crashShareText(command: string): string {
  return `I just destroyed Linux with ${command.trim()} in Pixel Linux Quest. Can you break it too? ${SITE_URL}`
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

/** The browser features shareOrCopy uses, so tests can stand in for them. */
export type ShareEnv = {
  /** True on phones and tablets (a coarse pointer and the Web Share API). */
  canNativeShare: boolean
  share: (text: string) => Promise<void>
  copy: (text: string) => Promise<void>
}

/** Phones get the system share sheet; everything else copies to the clipboard. */
export async function shareOrCopy(text: string, env: ShareEnv): Promise<ShareOutcome> {
  if (env.canNativeShare) {
    try {
      await env.share(text)
      return 'shared'
    } catch (err) {
      // Closing the share sheet is not an error.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await env.copy(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** Copy with the Clipboard API, or the old textarea trick where that is missing. */
async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall through to the textarea copy.
    }
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  if (!ok) throw new Error('copy failed')
}

/** The real browser environment. */
export function browserShareEnv(): ShareEnv {
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  return {
    canNativeShare: coarse && typeof navigator.share === 'function',
    share: (text) => navigator.share({ text }),
    copy: copyText,
  }
}
