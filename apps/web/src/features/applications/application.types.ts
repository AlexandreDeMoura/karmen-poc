export type FinancingType = 'loan' | 'factoring'

export type RiskBucket = 'low' | 'medium' | 'high'

export type DocumentReviewStatus =
  | 'complete'
  | 'needs_action'
  | 'manual_review'

export interface ProblemSummary {
  blocking: number
  warning: number
  info: number
}

export interface ApplicationListItem {
  applicationId: string
  companyName: string
  financingType: FinancingType
  requestedAmount: number
  riskBucket: RiskBucket
  globalScore: number
  documentReviewStatus: DocumentReviewStatus
  problemSummary: ProblemSummary
}
