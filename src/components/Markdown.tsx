import { Fragment, type ReactNode } from 'react'

import styles from './Markdown.module.css'

// A deliberately tiny markdown renderer for the short lesson text we author:
// blank-line-separated paragraphs, "- " bullet lists, `inline code` and **bold**.
// No third-party dependency; we control the syntax used in lessons.

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Split on code spans first so ** inside code is left literal.
  const codeParts = text.split(/(`[^`]+`)/g)
  codeParts.forEach((part, ci) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      nodes.push(
        <code key={`${keyBase}-c${ci}`} className={styles.code}>
          {part.slice(1, -1)}
        </code>,
      )
      return
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
    boldParts.forEach((bp, bi) => {
      if (bp.startsWith('**') && bp.endsWith('**') && bp.length >= 4) {
        nodes.push(<strong key={`${keyBase}-c${ci}-b${bi}`}>{bp.slice(2, -2)}</strong>)
      } else if (bp) {
        nodes.push(<Fragment key={`${keyBase}-c${ci}-t${bi}`}>{bp}</Fragment>)
      }
    })
  })
  return nodes
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = source.split(/\n\s*\n/)
  const cls = [styles.md, className].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n')
        const isList = lines.every((l) => l.trim().startsWith('- '))
        if (isList) {
          return (
            <ul key={bi} className={styles.list}>
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.trim().slice(2), `b${bi}-l${li}`)}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={bi} className={styles.p}>
            {renderInline(block, `b${bi}`)}
          </p>
        )
      })}
    </div>
  )
}
