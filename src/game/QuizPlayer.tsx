import { useRef, useState } from 'react'

import { Panel } from '../components/Panel'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { QuizCard } from '../components/QuizCard'
import { SpeechBubble } from '../components/SpeechBubble'
import type { QuizTest } from '../content/types'
import { LevelClear } from './LevelClear'
import { QUIZ_PASS_PERCENT, quizPassed } from './quizScore'
import styles from './QuizPlayer.module.css'

type QuizPlayerProps = {
  test: QuizTest
  xp: number
  clearMessage: string
  nextHref: string | null
  onReviewLesson: () => void
  onCompleted: () => void
}

export function QuizPlayer({
  test,
  xp,
  clearMessage,
  nextHref,
  onReviewLesson,
  onCompleted,
}: QuizPlayerProps) {
  const questions = test.questions
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null))
  const [index, setIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const completedRef = useRef(false)

  const current = questions[index]
  const selected = answers[index]
  const locked = selected !== null
  const isLast = index === questions.length - 1

  const score = answers.reduce<number>(
    (n, a, i) => (a === questions[i].correct ? n + 1 : n),
    0,
  )
  const passed = quizPassed(score, questions.length)

  function choose(option: number) {
    if (answers[index] !== null) return
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = option
      return next
    })
  }

  function advance() {
    if (isLast) {
      setShowResults(true)
      if (passed && !completedRef.current) {
        completedRef.current = true
        onCompleted()
      }
    } else {
      setIndex((i) => i + 1)
    }
  }

  function retry() {
    setAnswers(questions.map(() => null))
    setIndex(0)
    setShowResults(false)
  }

  if (showResults) {
    return (
      <div className={styles.wrap}>
        {passed ? (
          <LevelClear xp={xp} message={clearMessage} onReplay={retry} nextHref={nextHref} />
        ) : (
          <Panel tone="panel-2" className={styles.results}>
            <h2 className={styles.resultsTitle}>
              You scored {score} / {questions.length}
            </h2>
            <p className={styles.resultsText}>
              You need {QUIZ_PASS_PERCENT}% or more to clear this level. Review the lesson, then try
              again.
            </p>
            <div className={styles.actions}>
              <PixelButton variant="secondary" onClick={onReviewLesson}>
                REVIEW LESSON
              </PixelButton>
              <PixelButton onClick={retry}>TRY AGAIN</PixelButton>
            </div>
          </Panel>
        )}
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <Panel className={styles.panel}>
        <div className={styles.head}>
          <h2 className={styles.heading}>QUIZ</h2>
          <span className={styles.count}>
            Question {index + 1} / {questions.length}
          </span>
        </div>

        <QuizCard question={current} selected={selected} locked={locked} onSelect={choose} />

        <div className={styles.actions}>
          <PixelButton variant="secondary" onClick={onReviewLesson}>
            REVIEW LESSON
          </PixelButton>
          <PixelButton onClick={advance} disabled={!locked}>
            {isLast ? 'SEE RESULTS' : 'NEXT'}
          </PixelButton>
        </div>
      </Panel>

      <div className={styles.pipRow}>
        <Pip size={72} mood="think" />
        <SpeechBubble label="PIP SAYS">
          Pick the answer you think is right. I’ll tell you how it went!
        </SpeechBubble>
      </div>
    </div>
  )
}
