import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from '../App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('World map', () => {
  beforeEach(() => localStorage.clear())

  it('shows the world map with World 1 in progress and later worlds locked', () => {
    renderAt('/map')
    expect(screen.getByRole('heading', { name: 'WORLD MAP' })).toBeInTheDocument()
    expect(screen.getByText('Penguin Island')).toBeInTheDocument()
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
    expect(screen.getAllByText('LOCKED').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'CONTINUE' })).toBeInTheDocument()
  })
})
