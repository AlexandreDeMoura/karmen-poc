import type {
  ApplicationDocument,
  ApplicationListItem,
  ApplicationReview,
  Company,
  DocumentDiagnostic,
  DocumentProblem,
  EmailPreview,
  FinancingRequest,
  GenerateEmailPreviewRequest,
  Score,
} from './application.types'

const APPLICATIONS_ENDPOINT = '/api/applications'

export class ApplicationsApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApplicationsApiError'
    this.status = status
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function hasOptionalString(
  value: Record<string, unknown>,
  property: string,
): boolean {
  return value[property] === undefined || typeof value[property] === 'string'
}

function hasOptionalFiniteNumber(
  value: Record<string, unknown>,
  property: string,
): boolean {
  return value[property] === undefined || isFiniteNumber(value[property])
}

function hasOptionalBoolean(
  value: Record<string, unknown>,
  property: string,
): boolean {
  return value[property] === undefined || typeof value[property] === 'boolean'
}

function isFinancingType(value: unknown): boolean {
  return value === 'loan' || value === 'factoring'
}

function isRiskBucket(value: unknown): boolean {
  return value === 'low' || value === 'medium' || value === 'high'
}

function isDocumentReviewStatus(value: unknown): boolean {
  return (
    value === 'complete' ||
    value === 'needs_action' ||
    value === 'manual_review'
  )
}

function isApplicationListItem(value: unknown): value is ApplicationListItem {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.applicationId === 'string' &&
    typeof value.companyName === 'string' &&
    isFinancingType(value.financingType) &&
    isFiniteNumber(value.requestedAmount) &&
    isRiskBucket(value.riskBucket) &&
    isFiniteNumber(value.globalScore) &&
    isDocumentReviewStatus(value.documentReviewStatus)
  )
}

function isCompany(value: unknown): value is Company {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.siren === 'string' &&
    typeof value.businessType === 'string' &&
    typeof value.legalCategory === 'string' &&
    typeof value.codeNaf === 'string' &&
    typeof value.creationDate === 'string' &&
    typeof value.address === 'string' &&
    typeof value.countryCode === 'string' &&
    typeof value.postalCode === 'string' &&
    typeof value.owner === 'string'
  )
}

function isFinancingRequest(value: unknown): value is FinancingRequest {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    isFinancingType(value.type) &&
    typeof value.status === 'string' &&
    typeof value.company_id === 'string' &&
    typeof value.fundUsage === 'string' &&
    (value.rejectedReason === null ||
      typeof value.rejectedReason === 'string') &&
    isFiniteNumber(value.amount) &&
    isFiniteNumber(value.durationInMonth) &&
    isFiniteNumber(value.interestRate)
  )
}

function isApplicationDocument(
  value: unknown,
): value is ApplicationDocument {
  if (!isRecord(value) || !isRecord(value.metadata)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.type === 'liasse_fiscale' ||
      value.type === 'releve_bancaire') &&
    typeof value.company_id === 'string' &&
    typeof value.financing_request_id === 'string' &&
    hasOptionalFiniteNumber(value.metadata, 'year') &&
    hasOptionalString(value.metadata, 'bank') &&
    hasOptionalString(value.metadata, 'account') &&
    hasOptionalFiniteNumber(value.metadata, 'months_covered')
  )
}

function isScore(value: unknown): value is Score {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.financing_request_id === 'string' &&
    isRiskBucket(value.risk_bucket) &&
    isFiniteNumber(value.global_score)
  )
}

function isBooleanSignalGroup(
  value: unknown,
  properties: readonly string[],
): boolean {
  return (
    isRecord(value) &&
    properties.every((property) => hasOptionalBoolean(value, property))
  )
}

function isExtractedFields(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOptionalString(value, 'detectedPeriodLabel') &&
    hasOptionalFiniteNumber(value, 'monthsCovered') &&
    hasOptionalString(value, 'bankName') &&
    hasOptionalFiniteNumber(value, 'fiscalYear')
  )
}

function isDocumentDiagnostic(
  value: unknown,
): value is DocumentDiagnostic {
  if (!isRecord(value)) {
    return false
  }

  const hasValidPdfPrecheck =
    value.pdfPrecheck === undefined ||
    isBooleanSignalGroup(value.pdfPrecheck, [
      'hasTextLayer',
      'likelyScannedPdf',
      'isPasswordProtected',
      'isCorrupted',
    ])
  const hasValidQualitySignals =
    value.qualitySignals === undefined ||
    isBooleanSignalGroup(value.qualitySignals, [
      'lowResolution',
      'blurDetected',
      'croppedPageDetected',
      'skewDetected',
    ])
  const hasValidExtractedFields =
    value.extractedFields === undefined ||
    isExtractedFields(value.extractedFields)

  return (
    typeof value.documentId === 'string' &&
    (value.extractionStatus === 'success' ||
      value.extractionStatus === 'partial_success' ||
      value.extractionStatus === 'failed') &&
    value.source === 'mocked_document_pipeline' &&
    hasValidPdfPrecheck &&
    hasValidQualitySignals &&
    hasValidExtractedFields
  )
}

function isProblemMetadata(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (item) =>
        typeof item === 'string' ||
        typeof item === 'boolean' ||
        isFiniteNumber(item),
    )
  )
}

function isDocumentProblem(value: unknown): value is DocumentProblem {
  if (!isRecord(value)) {
    return false
  }

  const isProblemCode =
    value.code === 'MISSING_TAX_RETURN_YEAR' ||
    value.code === 'MISSING_BANK_STATEMENT_MONTHS' ||
    value.code === 'EXTRACTION_FAILED' ||
    value.code === 'SCANNED_PDF_NO_TEXT_LAYER' ||
    value.code === 'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW' ||
    value.code === 'HIGH_RISK_MANUAL_REVIEW'
  const isProblemSeverity =
    value.severity === 'blocking' ||
    value.severity === 'warning' ||
    value.severity === 'info'
  const isProblemSource =
    value.source === 'requirements_engine' ||
    value.source === 'mocked_document_diagnostic' ||
    value.source === 'score_context'

  return (
    typeof value.id === 'string' &&
    isProblemCode &&
    isProblemSeverity &&
    typeof value.analystLabel === 'string' &&
    hasOptionalString(value, 'clientFacingLabel') &&
    typeof value.description === 'string' &&
    typeof value.recommendedAction === 'string' &&
    isProblemSource &&
    hasOptionalString(value, 'documentId') &&
    typeof value.clientFacing === 'boolean' &&
    typeof value.selectedByDefault === 'boolean' &&
    (value.metadata === undefined || isProblemMetadata(value.metadata))
  )
}

function isApplicationReview(value: unknown): value is ApplicationReview {
  if (!isRecord(value) || !isRecord(value.requirements)) {
    return false
  }

  return (
    typeof value.applicationId === 'string' &&
    isCompany(value.company) &&
    isFinancingRequest(value.financingRequest) &&
    isScore(value.score) &&
    Array.isArray(value.requirements.expectedTaxReturnYears) &&
    value.requirements.expectedTaxReturnYears.every(isFiniteNumber) &&
    isFiniteNumber(value.requirements.expectedBankStatementMonths) &&
    Array.isArray(value.documents) &&
    value.documents.every(isApplicationDocument) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isDocumentDiagnostic) &&
    Array.isArray(value.problems) &&
    value.problems.every(isDocumentProblem) &&
    isDocumentReviewStatus(value.documentReviewStatus)
  )
}

function isEmailPreview(value: unknown): value is EmailPreview {
  return (
    isRecord(value) &&
    typeof value.subject === 'string' &&
    typeof value.body === 'string' &&
    isStringArray(value.includedProblemIds)
  )
}

function getErrorDetail(responseBody: string, statusText: string): string {
  const trimmedBody = responseBody.trim()

  if (!trimmedBody) {
    return statusText
  }

  try {
    const payload: unknown = JSON.parse(trimmedBody)

    if (isRecord(payload)) {
      if (typeof payload.message === 'string') {
        return payload.message
      }

      if (isStringArray(payload.message)) {
        return payload.message.join('; ')
      }
    }
  } catch {
    // Fall back to the raw response body for non-JSON errors.
  }

  return trimmedBody
}

async function getResponseError(
  response: Response,
  requestName: string,
): Promise<ApplicationsApiError> {
  const responseBody = await response.text()
  const detail = getErrorDetail(responseBody, response.statusText)

  return new ApplicationsApiError(
    `${requestName} failed (${response.status})${detail ? `: ${detail}` : ''}`,
    response.status,
  )
}

export async function fetchApplications(
  signal?: AbortSignal,
): Promise<ApplicationListItem[]> {
  const response = await fetch(APPLICATIONS_ENDPOINT, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw await getResponseError(response, 'Applications request')
  }

  const payload: unknown = await response.json()

  if (!Array.isArray(payload) || !payload.every(isApplicationListItem)) {
    throw new Error('Applications request returned an unexpected response.')
  }

  return payload
}

export async function fetchApplicationReview(
  applicationId: string,
  signal?: AbortSignal,
): Promise<ApplicationReview> {
  const encodedApplicationId = encodeURIComponent(applicationId)
  const response = await fetch(
    `${APPLICATIONS_ENDPOINT}/${encodedApplicationId}/review`,
    {
      headers: { Accept: 'application/json' },
      signal,
    },
  )

  if (!response.ok) {
    throw await getResponseError(response, 'Application review request')
  }

  const payload: unknown = await response.json()

  if (!isApplicationReview(payload)) {
    throw new Error(
      'Application review request returned an unexpected response.',
    )
  }

  return payload
}

export async function generateEmailPreview(
  applicationId: string,
  selectedProblemIds: string[],
  signal?: AbortSignal,
): Promise<EmailPreview> {
  const encodedApplicationId = encodeURIComponent(applicationId)
  const request: GenerateEmailPreviewRequest = { selectedProblemIds }
  const response = await fetch(
    `${APPLICATIONS_ENDPOINT}/${encodedApplicationId}/email-preview`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    },
  )

  if (!response.ok) {
    throw await getResponseError(response, 'Email preview request')
  }

  const payload: unknown = await response.json()

  if (!isEmailPreview(payload)) {
    throw new Error('Email preview request returned an unexpected response.')
  }

  return payload
}
