import { NEW_ISSUE_URL } from '../site'

type FeedbackLinkProps = { className?: string }

/** Opens the repo's "new issue" page, where the learner picks a template. */
export function FeedbackLink({ className }: FeedbackLinkProps) {
  return (
    <a className={className} href={NEW_ISSUE_URL} target="_blank" rel="noopener noreferrer">
      Suggest an idea / Report a bug
      <span className="sr-only"> (opens GitHub in a new tab)</span>
    </a>
  )
}
