import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProgressProvider } from '../game/ProgressContext'
import { SandboxPage } from './SandboxPage'

function type(command: string) {
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: command } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia
}

function renderPage() {
  render(
    <MemoryRouter>
      <ProgressProvider>
        <SandboxPage />
      </ProgressProvider>
    </MemoryRouter>,
  )
}

describe('SandboxPage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('has a realistic filesystem and every command', () => {
    setReducedMotion(true)
    renderPage()
    type('ls /')
    expect(screen.getByText(/^bin\s+boot\s+dev\s+etc\s+home\s+lib\s+root\s+sbin\s+tmp\s+usr\s+var$/)).toBeInTheDocument()
    type('cat /etc/hostname')
    expect(screen.getByText('island')).toBeInTheDocument()
  })

  it('rm -rf / is refused with the GNU message, and Pip explains', () => {
    setReducedMotion(true)
    renderPage()
    type('rm -rf /')
    expect(screen.getByText("rm: it is dangerous to operate recursively on '/'")).toBeInTheDocument()
    expect(screen.getByText('rm: use --no-preserve-root to override this failsafe')).toBeInTheDocument()
    expect(screen.getByText(/safety check built in/)).toBeInTheDocument()
  })

  it('rm -rf /* destroys the system, earns Chaos Penguin, and RESET restores it', () => {
    setReducedMotion(true)
    renderPage()
    type('sudo rm -rf /*')
    expect(screen.getByRole('heading', { name: 'SYSTEM DESTROYED' })).toBeInTheDocument()
    expect(screen.getByText('SECRET BADGE: CHAOS PENGUIN')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('plq.progress') ?? '{}').secrets).toEqual({ 'chaos-penguin': true })

    fireEvent.click(screen.getByRole('button', { name: 'RESET' }))
    type('ls /')
    expect(screen.getByText(/^bin\s+boot/)).toBeInTheDocument()
  })

  it('SHARE copies the brag text with the command and shows Copied!', async () => {
    setReducedMotion(true)
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderPage()
    type('sudo rm -rf /*')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'SHARE' }))
    })
    expect(writeText).toHaveBeenCalledWith(
      expect.stringMatching(
        /^I just destroyed Linux with sudo rm -rf \/\* in Pixel Linux Quest\. Can you break it too\? https:\/\//,
      ),
    )
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('plays the collapse first when motion is allowed', () => {
    vi.useFakeTimers()
    setReducedMotion(false)
    renderPage()
    type('sudo rm -rf --no-preserve-root /')
    expect(screen.queryByRole('heading', { name: 'SYSTEM DESTROYED' })).not.toBeInTheDocument()
    expect(screen.getByText('Uh oh. Uh oh! UH OH!')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByRole('heading', { name: 'SYSTEM DESTROYED' })).toBeInTheDocument()
  })

  it.each(['rm -rf --no-preserve-root /', 'rm -rf /*'])(
    'without sudo, %s only wipes the home folder: Linux survives, no badge',
    (line) => {
      setReducedMotion(true)
      renderPage()
      type(line)
      expect(screen.getByRole('heading', { name: 'HOME FOLDER WIPED' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'SYSTEM DESTROYED' })).not.toBeInTheDocument()
      expect(screen.getByText(/system files protected by permissions/)).toBeInTheDocument()
      expect(screen.getByText(/That is what makes this command destroy everything/)).toBeInTheDocument()
      expect(screen.queryByText('SECRET BADGE: CHAOS PENGUIN')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'SHARE' })).not.toBeInTheDocument()
      expect(JSON.parse(localStorage.getItem('plq.progress') ?? '{}').secrets ?? {}).toEqual({})

      fireEvent.click(screen.getByRole('button', { name: 'RESET' }))
      type('cat notes.txt')
      expect(screen.getByText('Things to try in the sandbox:')).toBeInTheDocument()
    },
  )

  it('without sudo, the real Permission denied lines show before the HOME FOLDER WIPED screen', () => {
    vi.useFakeTimers()
    setReducedMotion(false)
    renderPage()
    type('rm -rf /*')
    expect(screen.getByText("rm: cannot remove '/bin/bash': Permission denied")).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'HOME FOLDER WIPED' })).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByRole('heading', { name: 'HOME FOLDER WIPED' })).toBeInTheDocument()
  })

  it('the fork bomb freezes the system', () => {
    setReducedMotion(true)
    renderPage()
    type(':(){ :|:& };:')
    expect(screen.getByRole('heading', { name: 'SYSTEM FROZEN' })).toBeInTheDocument()
  })

  it('the first sudo gets a note about the password a real system would ask for, once', () => {
    renderPage()
    type('sudo whoami')
    expect(screen.getByText('root')).toBeInTheDocument()
    expect(screen.getByText('On a real system, sudo would ask for your password first.')).toBeInTheDocument()
    type('sudo cat /etc/shadow')
    expect(screen.queryByText(/sudo would ask for your password/)).not.toBeInTheDocument()
  })

  it('without sudo, pip cannot read root-only files, as on real Linux', () => {
    renderPage()
    type('cat /etc/shadow')
    expect(screen.getByText('cat: /etc/shadow: Permission denied')).toBeInTheDocument()
    expect(screen.getByText(/has no r \(read\) permission/)).toBeInTheDocument()
  })
})
