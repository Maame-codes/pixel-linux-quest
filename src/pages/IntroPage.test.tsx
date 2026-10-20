import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { App } from '../App'
import { INTRO_SCENES } from '../content/intro'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('Intro cutscene', () => {
  it('opens on the first scene', () => {
    renderAt('/intro')
    expect(screen.getByText(INTRO_SCENES[0].text)).toBeInTheDocument()
  })

  it('advances to the next scene with NEXT', () => {
    renderAt('/intro')
    fireEvent.click(screen.getByRole('button', { name: 'NEXT' }))
    expect(screen.getByText(INTRO_SCENES[1].text)).toBeInTheDocument()
  })

  it('SKIP jumps to the world map', () => {
    renderAt('/intro')
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(screen.getByRole('heading', { name: 'WORLD MAP' })).toBeInTheDocument()
  })
})
