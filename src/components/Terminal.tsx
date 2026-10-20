import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import type { TerminalLine } from '../game/useShellSession'
import styles from './Terminal.module.css'

type TerminalProps = {
  lines: TerminalLine[]
  /** Prompt label for the live input row, e.g. "pip@island:~$". */
  prompt: string
  /** Title shown in the window bar, e.g. "pip@island: ~". */
  title: string
  /** Past command lines, oldest first, for up/down recall. */
  history: string[]
  onSubmit: (input: string) => void
  disabled?: boolean
}

const toneClass: Record<TerminalLine['tone'], string> = {
  in: '',
  out: styles.out,
  err: styles.err,
  info: styles.info,
}

export function Terminal({ lines, prompt, title, history, onSubmit, disabled }: TerminalProps) {
  const [input, setInput] = useState('')
  // null = editing a fresh line; otherwise an index into history.
  const [histPos, setHistPos] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  function run() {
    const value = input
    if (value.trim() === '') {
      setInput('')
      return
    }
    onSubmit(value)
    setInput('')
    setHistPos(null)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      run()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      const pos = histPos === null ? history.length - 1 : Math.max(0, histPos - 1)
      setHistPos(pos)
      setInput(history[pos])
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histPos === null) return
      const pos = histPos + 1
      if (pos >= history.length) {
        setHistPos(null)
        setInput('')
      } else {
        setHistPos(pos)
        setInput(history[pos])
      }
    }
  }

  return (
    <section className={styles.terminal} aria-label="Terminal">
      <div className={styles.bar}>
        <span className={`${styles.dot} ${styles.dotRed}`} aria-hidden="true" />
        <span className={`${styles.dot} ${styles.dotYellow}`} aria-hidden="true" />
        <span className={`${styles.dot} ${styles.dotGreen}`} aria-hidden="true" />
        <span className={styles.barTitle}>{title}</span>
      </div>

      <div className={styles.screen} ref={scrollRef}>
        {lines.map((line) => (
          <div key={line.id} className={`${styles.line} ${toneClass[line.tone]}`}>
            {line.text === '' ? ' ' : line.text}
          </div>
        ))}

        <div className={styles.inputRow}>
          <label htmlFor="terminal-input" className={styles.promptLabel}>
            {prompt}
          </label>
          <input
            id="terminal-input"
            ref={inputRef}
            className={styles.input}
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={input}
            disabled={disabled}
            placeholder="type a command"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="button" className={styles.run} onClick={run} disabled={disabled}>
            RUN
          </button>
        </div>
      </div>
    </section>
  )
}
