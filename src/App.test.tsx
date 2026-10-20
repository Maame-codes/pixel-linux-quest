import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { App } from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('shows the title screen with tagline and start button at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'PIXEL LINUX QUEST' })).toBeInTheDocument()
    expect(screen.getByText('A cool, brief introduction to Linux')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /press start/i })).toBeInTheDocument()
  })

  it('renders the world map placeholder at /map', () => {
    renderAt('/map')
    expect(screen.getByRole('heading', { name: 'WORLD MAP' })).toBeInTheDocument()
  })

  it('resolves a deep-linked level and shows its id', () => {
    renderAt('/level/w2-l4-dig-a-folder')
    expect(screen.getByText('w2-l4-dig-a-folder')).toBeInTheDocument()
  })

  it('redirects unknown routes back to the title screen', () => {
    renderAt('/nope/not/a/page')
    expect(screen.getByRole('heading', { name: 'PIXEL LINUX QUEST' })).toBeInTheDocument()
  })
})
