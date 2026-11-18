import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { getHighScore, recordScore } from './highScores'
import { controlForKey, isPauseKey, swipeDirection } from './input'
import { newSeed, randomInt } from './random'
import { useSetting } from './settings'
import { playEvent } from './sound'
import type { Control, GameDef, Point } from './types'
import styles from './GameFrame.module.css'

type Phase = 'ready' | 'playing' | 'paused' | 'over'

export type GameFrameProps<S> = {
  game: GameDef<S>
  /** Called once when a round ends, with its score. */
  onRoundEnd?: (score: number) => void
  /** Called when a round starts. */
  onRoundStart?: () => void
  /** Shown instead of PLAY AGAIN after a round (the break is over). */
  afterRound?: ReactNode
  onClose: () => void
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Keys that would scroll the page or click a focused button. */
const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'BUTTON' || t.tagName === 'A' || t.tagName === 'INPUT')

/**
 * Runs one game: the canvas and requestAnimationFrame loop, keyboard and
 * touch input, pause (P / Esc, or when the tab is hidden), sound, the HUD,
 * high scores and the game over screen with Pip's tip.
 */
export function GameFrame<S>({ game, onRoundEnd, onRoundStart, afterRound, onClose }: GameFrameProps<S>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<S>(game.create(newSeed()))
  const held = useRef(new Set<Control>())
  const pressed = useRef(new Set<Control>())
  const taps = useRef<Point[]>([])
  const phaseRef = useRef<Phase>('ready')
  const startedAt = useRef(0)
  const shake = useRef(0)
  const hudText = useRef('')
  const reduced = useRef(prefersReducedMotion())

  const [phase, setPhaseState] = useState<Phase>('ready')
  const [hud, setHud] = useState(() => game.hud(stateRef.current))
  const [result, setResult] = useState<{ score: number; best: number; isNew: boolean; tip: string } | null>(null)
  const [sound, setSound] = useSetting('sound')

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])

  const start = useCallback(() => {
    stateRef.current = game.create(newSeed())
    held.current.clear()
    pressed.current.clear()
    taps.current = []
    setResult(null)
    setHud(game.hud(stateRef.current))
    setPhase('playing')
    onRoundStart?.()
    canvasRef.current?.focus()
  }, [game, onRoundStart, setPhase])

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'playing') setPhase('paused')
    else if (phaseRef.current === 'paused') setPhase('playing')
  }, [setPhase])

  // The animation loop.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.imageSmoothingEnabled = false
    let raf = 0
    let last = performance.now()
    startedAt.current = last

    const frame = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      if (phaseRef.current === 'playing') {
        const input = { held: new Set(held.current), pressed: new Set(pressed.current), taps: taps.current }
        pressed.current.clear()
        taps.current = []
        const next = game.update(stateRef.current, input, dt)
        stateRef.current = next
        const events = game.events(next)
        for (const e of events) {
          playEvent(e)
          if ((e === 'lose' || e === 'over' || e === 'oops') && !reduced.current) shake.current = 220
        }
        // Refresh the HUD only when what it shows changes (a timer ticks once a second).
        const hudNow = game.hud(next)
        const text = JSON.stringify(hudNow)
        if (text !== hudText.current) {
          hudText.current = text
          setHud(hudNow)
        }
        if (game.isOver(next)) {
          const score = game.score(next)
          const isNew = recordScore(game.id, score)
          const [i] = randomInt(newSeed(), game.tips.length)
          setResult({ score, best: getHighScore(game.id), isNew, tip: game.tips[i] })
          setHud(game.hud(next))
          setPhase('over')
          onRoundEnd?.(score)
        }
      }
      shake.current = Math.max(0, shake.current - dt)
      ctx.save()
      ctx.imageSmoothingEnabled = false
      if (shake.current > 0) {
        const s = Math.ceil(shake.current / 110)
        ctx.translate(Math.round(Math.sin(now / 16) * s), Math.round(Math.cos(now / 21) * s))
      }
      game.draw(ctx, stateRef.current, { time: now - startedAt.current, reducedMotion: reduced.current })
      ctx.restore()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [game, onRoundEnd, setPhase])

  // Keyboard, and pausing when the tab is hidden.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isPauseKey(e.key)) {
        if (phaseRef.current === 'playing' || phaseRef.current === 'paused') {
          e.preventDefault()
          togglePause()
        }
        return
      }
      const control = controlForKey(e.key)
      if (!control) return
      if (phaseRef.current !== 'playing') return
      if (control === 'action' && isTypingTarget(e.target) && e.target !== canvasRef.current) return
      e.preventDefault()
      if (!held.current.has(control)) pressed.current.add(control)
      held.current.add(control)
    }
    const up = (e: KeyboardEvent) => {
      const control = controlForKey(e.key)
      if (control) held.current.delete(control)
    }
    const hidden = () => {
      if (document.hidden && phaseRef.current === 'playing') setPhase('paused')
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      document.removeEventListener('visibilitychange', hidden)
    }
  }, [togglePause, setPhase])

  // Taps and swipes on the canvas, in game pixels.
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    swipeStart.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const startPt = swipeStart.current
    swipeStart.current = null
    if (phaseRef.current !== 'playing' || !startPt) return
    const dir = game.swipe ? swipeDirection(e.clientX - startPt.x, e.clientY - startPt.y) : null
    if (dir) {
      pressed.current.add(dir)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    taps.current.push({
      x: ((e.clientX - rect.left) / rect.width) * game.width,
      y: ((e.clientY - rect.top) / rect.height) * game.height,
    })
  }

  const press = (control: Control) => {
    if (phaseRef.current !== 'playing') return
    pressed.current.add(control)
    held.current.add(control)
  }
  const release = (control: Control) => held.current.delete(control)

  return (
    <section className={styles.frame} aria-label={game.name}>
      <div className={styles.top}>
        <h2 className={styles.name}>{game.name.toUpperCase()}</h2>
        <div className={styles.topButtons}>
          <button
            type="button"
            className={styles.small}
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
          >
            SOUND {sound ? 'ON' : 'OFF'}
          </button>
          {phase === 'playing' || phase === 'paused' ? (
            <button type="button" className={styles.small} onClick={togglePause}>
              {phase === 'paused' ? 'RESUME' : 'PAUSE'}
            </button>
          ) : null}
          <button type="button" className={styles.small} onClick={onClose}>
            EXIT
          </button>
        </div>
      </div>

      <dl className={styles.hud}>
        {hud.map((item) => (
          <div key={item.label} className={styles.hudItem}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
        <div className={styles.hudItem}>
          <dt>BEST</dt>
          <dd>{Math.max(getHighScore(game.id), result?.score ?? 0)}</dd>
        </div>
      </dl>

      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={game.width}
          height={game.height}
          style={{ aspectRatio: `${game.width} / ${game.height}` }}
          tabIndex={0}
          aria-label={`${game.name} game screen`}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        />

        {phase === 'ready' ? (
          <div className={styles.overlay}>
            <p className={styles.howTo}>{game.howTo}</p>
            <p className={styles.keys}>P or Esc pauses.</p>
            <PixelButton onClick={start}>START</PixelButton>
          </div>
        ) : null}

        {phase === 'paused' ? (
          <div className={styles.overlay}>
            <p className={styles.big}>PAUSED</p>
            <PixelButton onClick={togglePause}>RESUME</PixelButton>
          </div>
        ) : null}

        {phase === 'over' && result ? (
          <div className={`${styles.overlay} ${styles.over}`} role="status">
            <p className={styles.big}>GAME OVER</p>
            <p className={styles.scoreLine}>
              SCORE {result.score} · BEST {result.best}
            </p>
            {result.isNew && result.score > 0 ? <p className={styles.newBest}>NEW HIGH SCORE!</p> : null}
            <div className={styles.tip}>
              <Pip size={40} />
              <p>
                <span className={styles.tipLabel}>PIP&apos;S TIP</span>
                {result.tip}
              </p>
            </div>
            {afterRound ?? <PixelButton onClick={start}>PLAY AGAIN</PixelButton>}
          </div>
        ) : null}
      </div>

      {game.touch.length > 0 ? (
        <div className={styles.touch} aria-label="Touch controls">
          {game.touch.map((row, i) => (
            <div key={i} className={styles.touchRow}>
              {row.map((b) => (
                <button
                  key={b.control}
                  type="button"
                  className={styles.touchBtn}
                  aria-label={b.ariaLabel}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    press(b.control)
                  }}
                  onPointerUp={() => release(b.control)}
                  onPointerLeave={() => release(b.control)}
                  onPointerCancel={() => release(b.control)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      press(b.control)
                      window.setTimeout(() => release(b.control), 120)
                    }
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
