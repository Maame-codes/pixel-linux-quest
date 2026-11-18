/** A quiz clears at 80% or more correct answers. */
export const QUIZ_PASS_PERCENT = 80

/** True when `score` out of `total` reaches the pass mark. Integer maths, no rounding drift. */
export function quizPassed(score: number, total: number): boolean {
  if (total <= 0) return false
  return score * 100 >= total * QUIZ_PASS_PERCENT
}
