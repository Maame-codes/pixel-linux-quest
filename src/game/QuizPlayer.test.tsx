import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { QuizTest } from '../content/types'
import { whatIsLinux } from '../content/levels/w1l1-what-is-linux'
import { QuizPlayer } from './QuizPlayer'

if (whatIsLinux.test.kind !== 'quiz') throw new Error('expected a quiz test')
const quiz: QuizTest = whatIsLinux.test

function renderQuiz(onCompleted = vi.fn(), test: QuizTest = quiz) {
  render(
    <MemoryRouter>
      <QuizPlayer
        test={test}
        xp={40}
        clearMessage="Done."
        nextHref={null}
        onReviewLesson={() => {}}
        onCompleted={onCompleted}
      />
    </MemoryRouter>,
  )
  return onCompleted
}

function answer(optionText: string, advanceLabel: string) {
  fireEvent.click(screen.getByText(optionText))
  fireEvent.click(screen.getByRole('button', { name: advanceLabel }))
}

describe('QuizPlayer', () => {
  it('clears the level when every answer is correct', () => {
    const onCompleted = renderQuiz()
    quiz.questions.forEach((q, i) => {
      const last = i === quiz.questions.length - 1
      answer(q.options[q.correct], last ? 'SEE RESULTS' : 'NEXT')
    })
    expect(screen.getByText(/LEVEL CLEAR/)).toBeInTheDocument()
    expect(onCompleted).toHaveBeenCalledTimes(1)
  })

  it('offers a retry when an answer is wrong', () => {
    const onCompleted = renderQuiz()
    quiz.questions.forEach((q, i) => {
      const last = i === quiz.questions.length - 1
      // Deliberately pick a wrong option on the first question.
      const pick = i === 0 ? q.options[(q.correct + 1) % q.options.length] : q.options[q.correct]
      answer(pick, last ? 'SEE RESULTS' : 'NEXT')
    })
    expect(screen.getByText(/You scored/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'TRY AGAIN' })).toBeInTheDocument()
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it('clears at 80%: four right out of five', () => {
    const five: QuizTest = {
      kind: 'quiz',
      questions: [0, 1, 2, 3, 4].map((n) => ({
        prompt: `Question ${n}`,
        options: [`right ${n}`, `wrong ${n}`],
        correct: 0,
        explain: 'Because.',
      })),
    }
    const onCompleted = renderQuiz(vi.fn(), five)
    five.questions.forEach((_, i) => {
      const last = i === five.questions.length - 1
      answer(i === 0 ? 'wrong 0' : `right ${i}`, last ? 'SEE RESULTS' : 'NEXT')
    })
    expect(screen.getByText(/LEVEL CLEAR/)).toBeInTheDocument()
    expect(onCompleted).toHaveBeenCalledTimes(1)
  })
})
