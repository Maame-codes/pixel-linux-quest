import { getSettings } from './settings'
import type { GameEvent } from './types'

// Simple 8-bit beeps with the Web Audio API: one square-wave note per event.
// Nothing plays unless sound is switched on in settings.

type Note = { freq: number; ms: number; slideTo?: number }

const NOTES: Record<GameEvent, Note> = {
  score: { freq: 660, ms: 70 },
  bonus: { freq: 880, ms: 140, slideTo: 1320 },
  hit: { freq: 330, ms: 50 },
  bounce: { freq: 440, ms: 30 },
  lose: { freq: 300, ms: 260, slideTo: 120 },
  level: { freq: 520, ms: 220, slideTo: 1040 },
  over: { freq: 260, ms: 420, slideTo: 80 },
  oops: { freq: 180, ms: 160 },
}

let audio: AudioContext | null = null

function context(): AudioContext | null {
  try {
    if (!audio) {
      const Ctor = window.AudioContext
      if (!Ctor) return null
      audio = new Ctor()
    }
    if (audio.state === 'suspended') void audio.resume()
    return audio
  } catch {
    return null
  }
}

export function playEvent(event: GameEvent): void {
  if (!getSettings().sound) return
  const ctx = context()
  if (!ctx) return
  const note = NOTES[event]
  const now = ctx.currentTime
  const end = now + note.ms / 1000
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(note.freq, now)
  if (note.slideTo) osc.frequency.linearRampToValueAtTime(note.slideTo, end)
  gain.gain.setValueAtTime(0.06, now)
  gain.gain.linearRampToValueAtTime(0, end)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(end)
}
