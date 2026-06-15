import type { FinancingType } from './application.types'

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export const financingTypeLabels: Record<FinancingType, string> = {
  loan: 'Prêt',
  factoring: 'Affacturage',
}

export function formatAmount(value: number): string {
  return amountFormatter.format(value)
}
