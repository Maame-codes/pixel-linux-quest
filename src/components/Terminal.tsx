import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'

import type { TerminalLine, TerminalTone } from '../game/useShellSession'
import type { Completion } from '../shell'
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
  /** Sandbox collapse: the text tumbles off the screen. */
  collapsing?: boolean
  /** Tab completion for the text before the cursor. */
  onComplete?: (before: string) => Completion
  /** Add lines to the scrollback (Ctrl+C, the list of Tab matches). */
  onPrint?: (texts: string[], tone: TerminalTone) => void
  /** Ctrl+L. */
  onClearScreen?: () => void
}

const toneClass: Record<TerminalLine['tone'], string> = {
  in: '',
  out: styles.out,
  err: styles.err,
  info: styles.info,
}

export function Terminal({
  lines,
  prompt,
  title,
  history,
  onSubmit,
  disabled,
  collapsing = false,
  onComplete,
  onPrint,
  onClearScreen,
}: TerminalProps) {
  const [input, setInput] = useState('')
  // null = editing a fresh line; otherwise an index into history.
  const [histPos, setHistPos] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // The line as it was after a Tab that found several matches: one more Tab lists them.
  const listOnNextTab = useRef<string | null>(null)
  // Where to put the caret after a completion changes the line.
  const caretRef = useRef<number | null>(null)

  useEffect(() => {
    const el = inputRef.current
    if (el && caretRef.current !== null) {
      el.setSelectionRange(caretRef.current, caretRef.current)
      caretRef.current = null
    }
  }, [input])

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

  /** Tab: finish the word when one thing fits; a second Tab lists them when several do. */
  function tab() {
    if (!onComplete) return
    const cursor = inputRef.current?.selectionStart ?? input.length
    const before = input.slice(0, cursor)
    const after = input.slice(cursor)
    const { insert, matches } = onComplete(before)
    if (insert) {
      const next = before + insert + after
      caretRef.current = cursor + insert.length
      setInput(next)
      listOnNextTab.current = matches.length > 1 ? next : null
      return
    }
    if (matches.length < 2) return
    if (listOnNextTab.current === input) {
      onPrint?.([`${prompt} ${input}`], 'in')
      onPrint?.([matches.join('  ')], 'out')
      listOnNextTab.current = null
    } else {
      listOnNextTab.current = input
    }
  }

  /** Ctrl+C: drop the line, like bash, unless text is selected (then it copies as usual). */
  function cancelLine(e: KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget
    if (el.selectionStart !== el.selectionEnd) return
    e.preventDefault()
    onPrint?.([`${prompt} ${input}^C`], 'in')
    setInput('')
    setHistPos(null)
    listOnNextTab.current = null
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const ctrlOnly = e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey
    if (ctrlOnly && e.key.toLowerCase() === 'c') {
      cancelLine(e)
      return
    }
    if (ctrlOnly && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      onClearScreen?.()
      return
    }
    // Tab completes only when there is something typed, so an empty line still lets
    // keyboard users Tab out of the terminal. Shift+Tab always moves focus.
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && input !== '' && onComplete) {
      e.preventDefault()
      tab()
      return
    }
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

      <div className={`${styles.screen} ${collapsing ? styles.collapsing : ''}`} ref={scrollRef}>
        {lines.map((line, i) => (
          <div
            key={line.id}
            className={`${styles.line} ${toneClass[line.tone]}`}
            style={collapsing ? ({ '--i': lines.length - i } as CSSProperties) : undefined}
          >
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
          {onComplete ? (
            <button
              type="button"
              className={styles.tab}
              aria-label="Tab, complete the name"
              disabled={disabled}
              // Keep the keyboard focus (and caret) in the input.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                tab()
                inputRef.current?.focus()
              }}
            >
              TAB
            </button>
          ) : null}
          <button type="button" className={styles.run} onClick={run} disabled={disabled}>
            RUN
          </button>
        </div>
      </div>
    </section>
  )
}
