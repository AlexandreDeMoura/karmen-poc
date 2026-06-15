export type FinancingType = 'loan' | 'factoring'

export type RiskBucket = 'low' | 'medium' | 'high'

export type DocumentType = 'liasse_fiscale' | 'releve_bancaire'

export type DocumentReviewStatus =
  | 'complete'
  | 'needs_action'
  | 'manual_review'

export interface Company {
  id: string
  name: string
  siren: string
  businessType: string
  legalCategory: string
  codeNaf: string
  creationDate: string
  address: string
  countryCode: string
  postalCode: string
  owner: string
}

export interface FinancingRequest {
  id: string
  type: FinancingType
  status: string
  company_id: string
  fundUsage: string
  rejectedReason: string | null
  amount: number
  durationInMonth: number
  interestRate: number
}

export interface DocumentMetadata {
  year?: number
  bank?: string
  account?: string
  months_covered?: number
}

export interface ApplicationDocument {
  id: string
  name: string
  type: DocumentType
  company_id: string
  financing_request_id: string
  metadata: DocumentMetadata
}

export interface Score {
  id: string
  financing_request_id: string
  risk_bucket: RiskBucket
  global_score: number
}

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

export interface DocumentRequirements {
  expectedTaxReturnYears: readonly number[]
  expectedBankStatementMonths: number
}

export type ExtractionStatus = 'success' | 'partial_success' | 'failed'

export interface DocumentDiagnostic {
  documentId: string
  extractionStatus: ExtractionStatus
  source: 'mocked_document_pipeline'
  pdfPrecheck?: {
    hasTextLayer?: boolean
    likelyScannedPdf?: boolean
    isPasswordProtected?: boolean
    isCorrupted?: boolean
  }
  qualitySignals?: {
    lowResolution?: boolean
    blurDetected?: boolean
    croppedPageDetected?: boolean
    skewDetected?: boolean
  }
  extractedFields?: {
    detectedPeriodLabel?: string
    monthsCovered?: number
    bankName?: string
    fiscalYear?: number
  }
}

export type ProblemCode =
  | 'MISSING_TAX_RETURN_YEAR'
  | 'MISSING_BANK_STATEMENT_MONTHS'
  | 'EXTRACTION_FAILED'
  | 'SCANNED_PDF_NO_TEXT_LAYER'
  | 'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW'
  | 'HIGH_RISK_MANUAL_REVIEW'

export type ProblemSeverity = 'blocking' | 'warning' | 'info'

export type ProblemSource =
  | 'requirements_engine'
  | 'mocked_document_diagnostic'
  | 'score_context'

export type ProblemMetadata = Record<string, string | number | boolean>

export interface DocumentProblem {
  id: string
  code: ProblemCode
  severity: ProblemSeverity
  analystLabel: string
  clientFacingLabel?: string
  description: string
  recommendedAction: string
  source: ProblemSource
  documentId?: string
  clientFacing: boolean
  selectedByDefault: boolean
  metadata?: ProblemMetadata
}

export interface ApplicationReview {
  applicationId: string
  company: Company
  financingRequest: FinancingRequest
  score: Score
  requirements: DocumentRequirements
  documents: ApplicationDocument[]
  diagnostics: DocumentDiagnostic[]
  problems: DocumentProblem[]
  documentReviewStatus: DocumentReviewStatus
}

export interface GenerateEmailPreviewRequest {
  selectedProblemIds: string[]
}

export interface EmailPreview {
  subject: string
  body: string
  includedProblemIds: string[]
}
