import styles from './QuestList.module.css'

export type QuestItem = {
  id: string
  label: string
  done: boolean
}

type QuestListProps = {
  items: QuestItem[]
  /** Index of the objective to highlight as "up next". */
  activeIndex: number
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 7 7" aria-hidden="true" className={styles.check}>
      <rect x="0" y="3" width="1" height="1" />
      <rect x="1" y="4" width="1" height="1" />
      <rect x="2" y="5" width="1" height="1" />
      <rect x="3" y="4" width="1" height="1" />
      <rect x="4" y="3" width="1" height="1" />
      <rect x="5" y="2" width="1" height="1" />
      <rect x="6" y="1" width="1" height="1" />
    </svg>
  )
}

export function QuestList({ items, activeIndex }: QuestListProps) {
  return (
    <ul className={styles.list}>
      {items.map((item, i) => {
        const box = item.done ? styles.boxDone : i === activeIndex ? styles.boxNext : styles.boxTodo
        return (
          <li key={item.id} className={styles.item}>
            <span className={`${styles.box} ${box}`}>{item.done ? <Check /> : null}</span>
            <span className={item.done ? styles.labelDone : styles.label}>{item.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
