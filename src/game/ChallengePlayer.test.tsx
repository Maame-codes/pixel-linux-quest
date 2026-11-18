import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { ChallengeTest } from '../content/types'
import { digAFolder } from '../content/levels/w2l4-dig-a-folder'
import { ChallengePlayer } from './ChallengePlayer'

if (digAFolder.test.kind !== 'challenge') throw new Error('expected a challenge test')
const challenge: ChallengeTest = digAFolder.test

function type(command: string) {
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: command } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('ChallengePlayer', () => {
  it('shows LEVEL CLEAR after the objectives are completed', () => {
    const onCompleted = vi.fn()
    render(
      <MemoryRouter>
        <ChallengePlayer
          test={challenge}
          xp={50}
          clearMessage="Nice work."
          nextHref={null}
          onReviewLesson={() => {}}
          onCompleted={onCompleted}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/LEVEL CLEAR/)).not.toBeInTheDocument()

    type('ls')
    type('mkdir treasure')
    type('cd treasure')
    type('touch map.txt')

    expect(screen.getByText(/LEVEL CLEAR/)).toBeInTheDocument()
    expect(onCompleted).toHaveBeenCalledTimes(1)
  })

  it('shows a live folder map that follows Pip and can be hidden', () => {
    localStorage.clear()
    render(
      <MemoryRouter>
        <ChallengePlayer
          test={challenge}
          xp={50}
          clearMessage="Nice work."
          nextHref={null}
          onReviewLesson={() => {}}
          onCompleted={() => {}}
        />
      </MemoryRouter>,
    )
    const map = screen.getByRole('region', { name: 'MAP' })
    expect(map).toHaveTextContent('/home/pip, folder (you are here)')

    type('mkdir treasure')
    type('cd treasure')
    expect(map).toHaveTextContent('treasure, folder, in /home/pip (you are here)')
    expect(screen.getByText('You are in /home/pip/treasure')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'HIDE MAP' }))
    expect(screen.queryByRole('region', { name: 'MAP' })).not.toBeInTheDocument()
    expect(localStorage.getItem('plq.showMap')).toBe('hidden')
    fireEvent.click(screen.getByRole('button', { name: 'SHOW MAP' }))
    expect(screen.getByRole('region', { name: 'MAP' })).toBeInTheDocument()
  })
})
