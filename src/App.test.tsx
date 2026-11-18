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

  it('resolves a deep-linked level and opens its lesson', () => {
    renderAt('/level/w2-l4-dig-a-folder')
    expect(screen.getByRole('heading', { name: 'THE LESSON' })).toBeInTheDocument()
    expect(screen.getByText(/LEVEL 4: DIG A FOLDER/)).toBeInTheDocument()
  })

  it('shows a not-found message for an unknown level', () => {
    renderAt('/level/does-not-exist')
    expect(screen.getByRole('heading', { name: 'LEVEL NOT FOUND' })).toBeInTheDocument()
  })

  it('shows a pixel 404 page for unknown routes, with links to the map and title screen', () => {
    renderAt('/nope/not/a/page')
    expect(screen.getByRole('heading', { name: 'This folder does not exist' })).toBeInTheDocument()
    expect(screen.getByText(/bash: cd: \/nope\/not\/a\/page: No such file or directory/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'GO TO THE MAP' })).toHaveAttribute('href', '/map')
    expect(screen.getByRole('link', { name: 'TITLE SCREEN' })).toHaveAttribute('href', '/')
  })

  it('links to the issue picker from the footer', () => {
    renderAt('/map')
    expect(screen.getByRole('link', { name: /suggest an idea \/ report a bug/i })).toHaveAttribute(
      'href',
      'https://github.com/Maame-codes/pixel-linux-quest/issues/new/choose',
    )
  })
})
