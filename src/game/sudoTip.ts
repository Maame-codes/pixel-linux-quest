// The first time a player uses sudo in the sandbox, Pip mentions the
// password a real system would ask for. Remembered in localStorage so it
// is said once (clearing saved data brings it back).

import { tokenize } from '../shell'

const KEY = 'plq.sudoTipSeen'

export const SUDO_TIP = 'On a real system, sudo would ask for your password first.'

/** Did this line run a command with sudo (not just a bare "sudo")? */
export function usedSudo(input: string): boolean {
  const t = tokenize(input.trim())
  return t.ok && t.tokens[0]?.text === 'sudo' && t.tokens.length > 1
}

export function sudoTipSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markSudoTipSeen(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // Not remembered: Pip may say it again next visit.
  }
}

/**
 * Pip's line after a sandbox command: the usual explanation, plus the sudo
 * tip the first time sudo is used. Marks the tip as seen when it is added.
 */
export function withSudoTip(input: string, line: string | null): string | null {
  if (!usedSudo(input) || sudoTipSeen()) return line
  markSudoTipSeen()
  return line ? `${line} ${SUDO_TIP}` : SUDO_TIP
}
