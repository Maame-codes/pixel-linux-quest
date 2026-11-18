import { describe, expect, it } from 'vitest'

import { quizPassed } from './quizScore'

describe('quizPassed', () => {
  it('passes at exactly 80%', () => {
    expect(quizPassed(4, 5)).toBe(true)
    expect(quizPassed(8, 10)).toBe(true)
  })

  it('passes above 80%', () => {
    expect(quizPassed(5, 5)).toBe(true)
    expect(quizPassed(9, 10)).toBe(true)
  })

  it('fails below 80%', () => {
    expect(quizPassed(3, 4)).toBe(false)
    expect(quizPassed(3, 5)).toBe(false)
    expect(quizPassed(7, 10)).toBe(false)
  })

  it('never passes an empty quiz', () => {
    expect(quizPassed(0, 0)).toBe(false)
  })
})
