import type { DocumentReviewStatus } from '../application.types'

const statusPresentation: Record<
  DocumentReviewStatus,
  { label: string; className: string; dotClassName: string }
> = {
  complete: {
    label: 'Complete',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    dotClassName: 'bg-emerald-500',
  },
  needs_action: {
    label: 'Needs action',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    dotClassName: 'bg-rose-500',
  },
  manual_review: {
    label: 'Manual review',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
    dotClassName: 'bg-amber-500',
  },
}

interface ReviewStatusBadgeProps {
  status: DocumentReviewStatus
}

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  const presentation = statusPresentation[status]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${presentation.className}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${presentation.dotClassName}`}
      />
      {presentation.label}
    </span>
  )
}
