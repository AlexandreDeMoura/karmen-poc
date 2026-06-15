import type {
  ProblemSummary,
  RiskBucket,
} from '../application.types'

interface BadgePresentation {
  label: string
  className: string
}

interface ProblemPresentation extends BadgePresentation {
  key: keyof ProblemSummary
  shortLabel: string
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

export const problemPresentation: readonly ProblemPresentation[] = [
  {
    key: 'blocking',
    label: 'blocking',
    shortLabel: 'Blocking',
    className: 'bg-rose-50 text-rose-800',
  },
  {
    key: 'warning',
    label: 'warnings',
    shortLabel: 'Warning',
    className: 'bg-amber-50 text-amber-900',
  },
  {
    key: 'info',
    label: 'information',
    shortLabel: 'Info',
    className: 'bg-sky-50 text-sky-800',
  },
]
