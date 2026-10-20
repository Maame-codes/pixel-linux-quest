import { useId } from 'react'

import type { QuizQuestion } from '../content/types'
import styles from './QuizCard.module.css'

type QuizCardProps = {
  question: QuizQuestion
  /** Index of the chosen option, or null if unanswered. */
  selected: number | null
  /** Once locked, the answer and explanation are shown and choices disabled. */
  locked: boolean
  onSelect: (index: number) => void
}

export function QuizCard({ question, selected, locked, onSelect }: QuizCardProps) {
  const promptId = useId()
  const correct = selected === question.correct

  function optionClass(i: number): string {
    if (locked) {
      if (i === question.correct) return `${styles.option} ${styles.correct}`
      if (i === selected) return `${styles.option} ${styles.wrong}`
      return styles.option
    }
    return i === selected ? `${styles.option} ${styles.chosen}` : styles.option
  }

  return (
    <div className={styles.card}>
      <p id={promptId} className={styles.prompt}>
        {question.prompt}
      </p>
      <div role="radiogroup" aria-labelledby={promptId} className={styles.options}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i === selected}
            disabled={locked}
            className={optionClass(i)}
            onClick={() => onSelect(i)}
          >
            <span className={styles.letter}>{String.fromCharCode(65 + i)}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>
      {locked ? (
        <div className={correct ? `${styles.explain} ${styles.explainOk}` : styles.explain}>
          <span className={styles.verdict}>{correct ? 'Correct!' : 'Not quite.'}</span>{' '}
          {question.explain}
        </div>
      ) : null}
    </div>
  )
}
