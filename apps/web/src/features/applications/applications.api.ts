import type { ApplicationListItem } from './application.types'

const APPLICATIONS_ENDPOINT = '/applications'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApplicationListItem(value: unknown): value is ApplicationListItem {
  if (!isRecord(value) || !isRecord(value.problemSummary)) {
    return false
  }

  return (
    typeof value.applicationId === 'string' &&
    typeof value.companyName === 'string' &&
    (value.financingType === 'loan' || value.financingType === 'factoring') &&
    typeof value.requestedAmount === 'number' &&
    (value.riskBucket === 'low' ||
      value.riskBucket === 'medium' ||
      value.riskBucket === 'high') &&
    typeof value.globalScore === 'number' &&
    (value.documentReviewStatus === 'complete' ||
      value.documentReviewStatus === 'needs_action' ||
      value.documentReviewStatus === 'manual_review') &&
    typeof value.problemSummary.blocking === 'number' &&
    typeof value.problemSummary.warning === 'number' &&
    typeof value.problemSummary.info === 'number'
  )
}

async function getResponseError(response: Response): Promise<Error> {
  const responseBody = await response.text()
  const detail = responseBody.trim() || response.statusText

  return new Error(
    `Applications request failed (${response.status})${detail ? `: ${detail}` : ''}`,
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
    throw await getResponseError(response)
  }

  const payload: unknown = await response.json()

  if (!Array.isArray(payload) || !payload.every(isApplicationListItem)) {
    throw new Error('Applications request returned an unexpected response.')
  }

  return payload
}
