import { useCallback, useState } from 'react'

const KEY = 'plq.showMap'

/** Whether the folder map is shown. Defaults to shown if storage is unavailable. */
export function loadShowMap(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'hidden'
  } catch {
    return true
  }
}

export function saveShowMap(show: boolean): void {
  try {
    localStorage.setItem(KEY, show ? 'shown' : 'hidden')
  } catch {
    // Storage may be blocked (private mode). The choice lasts for this page only.
  }
}

/** The SHOW MAP / HIDE MAP choice, remembered across visits. */
export function useShowMap(): [boolean, () => void] {
  const [show, setShow] = useState(loadShowMap)
  const toggle = useCallback(() => {
    setShow((s) => {
      saveShowMap(!s)
      return !s
    })
  }, [])
  return [show, toggle]
}
