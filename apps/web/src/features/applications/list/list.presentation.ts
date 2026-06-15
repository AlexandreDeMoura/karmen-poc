import type { RiskBucket } from '../application.types'

interface BadgePresentation {
  label: string
  className: string
}

export const riskPresentation: Record<
  RiskBucket,
  BadgePresentation
> = {
  low: {
    label: 'Low',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-50 text-amber-900 ring-amber-600/20',
  },
  high: {
    label: 'High',
    className: 'bg-rose-50 text-rose-800 ring-rose-600/20',
  },
}
