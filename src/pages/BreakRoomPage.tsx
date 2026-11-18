import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ARCADE_GAMES, type ArcadeGame } from '../arcade/games'
import { getHighScore } from '../arcade/highScores'
import {
  canExtend,
  extendBreak,
  formatClock,
  isBreakOver,
  newBreak,
  tickBreak,
  type BreakTimer,
} from '../arcade/breakTimer'
import { Page } from '../components/Page'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { IntroArt } from '../game/IntroArt'
import { CABINETS } from '../game/pixelArt/scenes/break-room'
import { SCENE_H, SCENE_W } from '../game/pixelArt/scene'
import { useProgress } from '../game/ProgressContext'
import { resetNudgeClock } from '../game/nudgeClock'
import { questReturnPath } from '../game/returnTo'
import styles from './BreakRoomPage.module.css'

/** A tiny pixel clock face for the break timer. */
function ClockIcon() {
  return (
    <svg className={styles.clockIcon} viewBox="0 0 9 9" width={27} height={27} aria-hidden="true">
      <path fill="#0f1020" d="M2 0h5v1H2zM1 1h1v1H1zM7 1h1v1H7zM0 2h1v5H0zM8 2h1v5H8zM1 7h1v1H1zM7 7h1v1H7zM2 8h5v1H2z" />
      <path fill="#f4f4f4" d="M2 1h5v1H2zM1 2h7v5H1zM2 7h5v1H2z" />
      <path fill="#b13e53" d="M4 2h1v3H4zM5 4h2v1H5z" />
    </svg>
  )
}

export function BreakRoomPage() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const [timer, setTimer] = useState<BreakTimer>(newBreak)
  const [open, setOpen] = useState<ArcadeGame | null>(null)
  const [roundRunning, setRoundRunning] = useState(false)
  const [, setScoresVersion] = useState(0)
  const gameRef = useRef<HTMLDivElement>(null)

  // A break resets the "you have been at it a while" clock.
  useEffect(() => {
    resetNudgeClock()
  }, [])

  // Count down once a second while the tab is visible.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) setTimer((t) => tickBreak(t, 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const timeUp = isBreakOver(timer)
  const showPrompt = timeUp && !roundRunning

  const backToQuest = useCallback(() => navigate(questReturnPath(progress)), [navigate, progress])

  function openGame(game: ArcadeGame) {
    if (!game.Play || timeUp) return
    setOpen(game)
    window.setTimeout(() => gameRef.current?.scrollIntoView?.({ block: 'start' }), 0)
  }

  const onRoundStart = useCallback(() => setRoundRunning(true), [])
  const onRoundEnd = useCallback(() => {
    setRoundRunning(false)
    setScoresVersion((v) => v + 1)
  }, [])

  const prompt = (
    <div className={styles.prompt} role="status">
      <Pip size={56} />
      <div className={styles.promptBody}>
        <p className={styles.promptText}>Ready to jump back in?</p>
        <div className={styles.promptButtons}>
          <PixelButton onClick={backToQuest}>BACK TO MY QUEST</PixelButton>
          {canExtend(timer) ? (
            <PixelButton variant="secondary" onClick={() => setTimer(extendBreak)}>
              +2 MINUTES
            </PixelButton>
          ) : null}
        </div>
      </div>
    </div>
  )

  const Play = open?.Play ?? null

  return (
    <Page>
      <div className={styles.head}>
        <h1 className={styles.title}>BREAK ROOM</h1>
        <div className={styles.headRight}>
          <div className={styles.clock} role="timer" aria-label={`Break time left: ${formatClock(timer.remainingMs)}`}>
            <ClockIcon />
            <span className={styles.clockText}>{formatClock(timer.remainingMs)}</span>
          </div>
          <PixelButton variant="secondary" onClick={backToQuest} className={styles.back}>
            BACK TO MY QUEST
          </PixelButton>
        </div>
      </div>

      <p className={styles.lead}>
        A five minute breather. Play a round or two, then hop back into your quest. Your progress is safe.
      </p>

      {showPrompt ? prompt : null}

      <div className={styles.scene}>
        <IntroArt sceneId="break-room" />
        <svg
          className={styles.hits}
          viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {CABINETS.map((c, i) => {
            const game = ARCADE_GAMES[i]
            return (
              <rect
                key={game.id}
                x={c.x - 1}
                y={c.y}
                width={c.w + 2}
                height={c.h}
                className={game.Play && !timeUp ? styles.hit : styles.hitOff}
                onClick={() => openGame(game)}
              />
            )
          })}
        </svg>
      </div>

      <ul className={styles.games} aria-label="Games">
        {ARCADE_GAMES.map((game) => (
          <li key={game.id}>
            <button
              type="button"
              className={`${styles.game} ${open?.id === game.id ? styles.gameOpen : ''}`}
              onClick={() => openGame(game)}
              disabled={!game.Play || timeUp}
            >
              <span className={styles.gameName}>{game.name.toUpperCase()}</span>
              <span className={styles.gameBlurb}>{game.blurb}</span>
              <span className={styles.gameBest}>
                {game.Play ? `HIGH SCORE ${getHighScore(game.id)}` : 'COMING SOON'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div ref={gameRef}>
        {Play && open ? (
          <Play
            key={open.id}
            onRoundStart={onRoundStart}
            onRoundEnd={onRoundEnd}
            afterRound={timeUp ? prompt : undefined}
            onClose={() => {
              setOpen(null)
              setRoundRunning(false)
            }}
          />
        ) : null}
      </div>
    </Page>
  )
}
