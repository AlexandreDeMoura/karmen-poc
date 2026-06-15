import type {
  ExtractionStatus,
  ProblemSeverity,
  ProblemSource,
  RiskBucket,
} from '../application.types'

interface BadgePresentation {
  label: string
  className: string
}

const rateFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export const riskPresentation: Record<RiskBucket, BadgePresentation> = {
  low: {
    label: 'Risque faible',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  medium: {
    label: 'Risque moyen',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  high: {
    label: 'Risque élevé',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
}

export const extractionStatusPresentation: Record<
  ExtractionStatus,
  BadgePresentation
> = {
  success: {
    label: 'Extraction réussie',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  partial_success: {
    label: 'Extraction partielle',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  failed: {
    label: 'Échec de l’extraction',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
}

export const severityPresentation: Record<
  ProblemSeverity,
  BadgePresentation
> = {
  blocking: {
    label: 'Bloquant',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  warning: {
    label: 'Avertissement',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  info: {
    label: 'Information',
    className: 'border-sky-200 bg-sky-50 text-sky-800',
  },
}

export const problemSourceLabels: Record<ProblemSource, string> = {
  requirements_engine: 'Moteur de règles',
  mocked_document_diagnostic: 'Diagnostic documentaire simulé',
  score_context: 'Contexte du score',
}

export function formatInterestRate(value: number): string {
  return rateFormatter.format(value)
}

export function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

export function formatRequestStatus(value: string): string {
  const statusLabels: Record<string, string> = {
    pending_review: 'En attente de contrôle',
  }

  if (statusLabels[value]) {
    return statusLabels[value]
  }

  return value
    .split('_')
    .filter(Boolean)
    .join(' ')
}

export function maskAccount(account?: string): string {
  if (!account) {
    return 'Non renseigné'
  }

  const normalizedAccount = account.replace(/\s+/g, '')

  if (normalizedAccount.length <= 4) {
    return `**** ${normalizedAccount}`
  }

  return `${normalizedAccount.slice(0, 4)} **** ${normalizedAccount.slice(-4)}`
}
