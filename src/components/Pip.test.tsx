import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Pip } from './Pip'

describe('Pip', () => {
  it('renders an accessible image with the given label and size', () => {
    render(<Pip size={64} title="Pip the penguin" />)
    const svg = screen.getByRole('img', { name: 'Pip the penguin' })
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
  })
})
