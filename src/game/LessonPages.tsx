import { useState } from 'react'

import { Markdown } from '../components/Markdown'
import { Panel } from '../components/Panel'
import { Pip } from '../components/Pip'
import { PixelButton } from '../components/PixelButton'
import { SpeechBubble } from '../components/SpeechBubble'
import styles from './LessonPages.module.css'

type LessonPagesProps = {
  pages: string[]
  /** Label of the button on the final page, e.g. "START QUEST". */
  finishLabel: string
  onFinish: () => void
}

const PIP_LINES = [
  'One idea at a time. You’ve got this!',
  'Still with me? Let’s keep going.',
  'Almost ready for the quest!',
]

export function LessonPages({ pages, finishLabel, onFinish }: LessonPagesProps) {
  const [page, setPage] = useState(0)
  const isLast = page === pages.length - 1

  return (
    <div className={styles.wrap}>
      <Panel className={styles.panel}>
        <div className={styles.head}>
          <h2 className={styles.heading}>THE LESSON</h2>
          <span className={styles.count}>
            {page + 1} / {pages.length}
          </span>
        </div>

        <Markdown source={pages[page]} />

        <div className={styles.dots} aria-hidden="true">
          {pages.map((_, i) => (
            <span key={i} className={i === page ? styles.dotOn : styles.dot} />
          ))}
        </div>

        <div className={styles.actions}>
          <PixelButton
            variant="secondary"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            BACK
          </PixelButton>
          {isLast ? (
            <PixelButton onClick={onFinish}>{finishLabel}</PixelButton>
          ) : (
            <PixelButton onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}>
              NEXT
            </PixelButton>
          )}
        </div>
      </Panel>

      <div className={styles.pipRow}>
        <Pip size={72} mood="happy" />
        <SpeechBubble label="PIP SAYS">{PIP_LINES[Math.min(page, PIP_LINES.length - 1)]}</SpeechBubble>
      </div>
    </div>
  )
}
