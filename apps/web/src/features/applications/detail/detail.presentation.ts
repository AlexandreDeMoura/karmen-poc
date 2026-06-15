import type {
  ExtractionStatus,
  FinancingType,
  ProblemSeverity,
  ProblemSource,
  RiskBucket,
} from '../application.types'

interface BadgePresentation {
  label: string
  className: string
}

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const rateFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export const financingTypeLabels: Record<FinancingType, string> = {
  loan: 'Loan',
  factoring: 'Factoring',
}

export const riskPresentation: Record<RiskBucket, BadgePresentation> = {
  low: {
    label: 'Low risk',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  medium: {
    label: 'Medium risk',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  high: {
    label: 'High risk',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
}

export const extractionStatusPresentation: Record<
  ExtractionStatus,
  BadgePresentation
> = {
  success: {
    label: 'Extraction succeeded',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  partial_success: {
    label: 'Partial extraction',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  failed: {
    label: 'Extraction failed',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
}

export const severityPresentation: Record<
  ProblemSeverity,
  BadgePresentation
> = {
  blocking: {
    label: 'Blocking',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  warning: {
    label: 'Warning',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  info: {
    label: 'Information',
    className: 'border-sky-200 bg-sky-50 text-sky-800',
  },
}

export const problemSourceLabels: Record<ProblemSource, string> = {
  requirements_engine: 'Requirements engine',
  mocked_document_diagnostic: 'Mocked document diagnostic',
  score_context: 'Score context',
}

export function formatAmount(value: number): string {
  return amountFormatter.format(value)
}

export function formatInterestRate(value: number): string {
  return rateFormatter.format(value)
}

export function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export function formatRequestStatus(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

export function maskAccount(account?: string): string {
  if (!account) {
    return 'Not specified'
  }

  const normalizedAccount = account.replace(/\s+/g, '')

  if (normalizedAccount.length <= 4) {
    return `**** ${normalizedAccount}`
  }

  return `${normalizedAccount.slice(0, 4)} **** ${normalizedAccount.slice(-4)}`
}
