import { useEffect, useState } from 'react'
import { ReviewStatusBadge } from './ReviewStatusBadge'
import type {
  ApplicationDocument,
  ApplicationReview,
  DocumentDiagnostic,
  ExtractionStatus,
  FinancingType,
  RiskBucket,
} from './application.types'
import {
  ApplicationsApiError,
  fetchApplicationReview,
} from './applications.api'

interface ApplicationDetailPageProps {
  applicationId: string
}

type ApplicationDetailState =
  | { status: 'loading' }
  | { status: 'success'; review: ApplicationReview }
  | { status: 'error'; message: string; notFound: boolean }

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

const financingTypeLabels: Record<FinancingType, string> = {
  loan: 'Loan',
  factoring: 'Factoring',
}

const riskPresentation: Record<
  RiskBucket,
  { label: string; className: string }
> = {
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

const extractionStatusPresentation: Record<
  ExtractionStatus,
  { label: string; className: string }
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

function PageHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white"
          >
            K
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Karmen</p>
            <p className="text-xs text-slate-500">Credit operations</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          Document readiness
        </span>
      </div>
    </header>
  )
}

function BackLink() {
  return (
    <a
      className="inline-flex text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
      href="/"
    >
      &larr; Back to applications
    </a>
  )
}

function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading application review...</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 animate-pulse bg-slate-200" />
        <div className="px-6 py-8 sm:px-8">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-9 w-2/3 max-w-lg animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-4 w-48 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            aria-hidden="true"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-6 grid grid-cols-2 gap-5">
              {[0, 1, 2, 3].map((row) => (
                <div key={row}>
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-4 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ErrorStateProps {
  applicationId: string
  message: string
  notFound: boolean
  onRetry: () => void
}

function ErrorState({
  applicationId,
  message,
  notFound,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="mt-8 rounded-2xl border border-rose-200 bg-white px-6 py-14 text-center shadow-sm sm:px-8"
      role="alert"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-50 text-xl font-bold text-rose-700"
      >
        !
      </div>
      <p className="mt-5 text-xs font-semibold tracking-widest text-rose-700 uppercase">
        {notFound ? 'Application not found' : 'Request failed'}
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {notFound
          ? `No review is available for ${applicationId}`
          : 'The application review could not be loaded'}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
        {notFound
          ? 'The financing request may no longer exist or the link may be incorrect.'
          : 'Check that the API is running, then retry the request.'}
      </p>
      <p className="mx-auto mt-2 max-w-xl text-xs text-slate-500">{message}</p>
      <button
        className="mt-6 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        onClick={onRetry}
        type="button"
      >
        Retry request
      </button>
    </div>
  )
}

interface DetailListProps {
  items: Array<{ label: string; value: string }>
}

function DetailList({ items }: DetailListProps) {
  return (
    <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            {item.label}
          </dt>
          <dd className="mt-1.5 break-words text-sm font-medium text-slate-950">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

interface SummaryCardProps {
  eyebrow: string
  title: string
  children: React.ReactNode
}

function SummaryCard({ eyebrow, title, children }: SummaryCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      {children}
    </section>
  )
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

function formatRequestStatus(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

function maskAccount(account?: string): string {
  if (!account) {
    return 'Not specified'
  }

  const normalizedAccount = account.replace(/\s+/g, '')

  if (normalizedAccount.length <= 4) {
    return `**** ${normalizedAccount}`
  }

  return `${normalizedAccount.slice(0, 4)} **** ${normalizedAccount.slice(-4)}`
}

interface ScoreContextProps {
  review: ApplicationReview
}

function ScoreContext({ review }: ScoreContextProps) {
  const risk = riskPresentation[review.score.risk_bucket]

  return (
    <SummaryCard eyebrow="Context only" title="Score context">
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
          <span className="text-3xl font-semibold">
            {review.score.global_score}
          </span>
          <span className="mt-1 text-xs text-slate-300">out of 100</span>
        </div>
        <div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${risk.className}`}
          >
            {risk.label}
          </span>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            The score and risk bucket provide analyst context. They do not
            decide whether the document set is ready.
          </p>
        </div>
      </div>
    </SummaryCard>
  )
}

interface RequirementsSummaryProps {
  review: ApplicationReview
}

function RequirementsSummary({ review }: RequirementsSummaryProps) {
  return (
    <SummaryCard eyebrow="Expected documents" title="Readiness requirements">
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Tax returns</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            One fiscal return is expected for each required year.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {review.requirements.expectedTaxReturnYears.map((year) => (
              <span
                key={year}
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200"
              >
                {year}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">
            Bank statements
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Coverage is required for every detected bank account.
          </p>
          <p className="mt-4 text-2xl font-semibold text-slate-950">
            {review.requirements.expectedBankStatementMonths}
            <span className="ml-2 text-sm font-medium text-slate-500">
              months per account
            </span>
          </p>
        </div>
      </div>
    </SummaryCard>
  )
}

function getDiagnosticSignals(diagnostic: DocumentDiagnostic): string[] {
  const signals: string[] = []

  if (diagnostic.pdfPrecheck?.hasTextLayer === false) {
    signals.push('No text layer detected')
  }

  if (diagnostic.pdfPrecheck?.likelyScannedPdf === true) {
    signals.push('Likely scanned PDF')
  }

  if (diagnostic.pdfPrecheck?.isPasswordProtected === true) {
    signals.push('Password protection detected')
  }

  if (diagnostic.pdfPrecheck?.isCorrupted === true) {
    signals.push('File may be corrupted')
  }

  if (diagnostic.qualitySignals?.lowResolution === true) {
    signals.push('Low resolution')
  }

  if (diagnostic.qualitySignals?.blurDetected === true) {
    signals.push('Blur detected')
  }

  if (diagnostic.qualitySignals?.croppedPageDetected === true) {
    signals.push('Cropped page detected')
  }

  if (diagnostic.qualitySignals?.skewDetected === true) {
    signals.push('Page skew detected')
  }

  return signals
}

interface DiagnosticPanelProps {
  diagnostic: DocumentDiagnostic
}

function DiagnosticPanel({ diagnostic }: DiagnosticPanelProps) {
  const status = extractionStatusPresentation[diagnostic.extractionStatus]
  const signals = getDiagnosticSignals(diagnostic)

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-amber-950 uppercase">
          Mocked pipeline diagnostic
        </p>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {signals.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Precheck signals">
          {signals.map((signal) => (
            <li
              key={signal}
              className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-200"
            >
              {signal}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs leading-5 text-amber-900">
        This is a simulated document-pipeline signal for the POC, not a
        browser-side PDF inspection.
      </p>
    </div>
  )
}

interface DocumentCardProps {
  document: ApplicationDocument
  diagnostic?: DocumentDiagnostic
}

function DocumentCard({ document, diagnostic }: DocumentCardProps) {
  const isTaxReturn = document.type === 'liasse_fiscale'

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600"
        >
          {isTaxReturn ? 'TAX' : 'BANK'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h4 className="break-words text-sm font-semibold text-slate-950">
                {document.name}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {isTaxReturn ? 'Tax return' : 'Bank statement'} / {document.id}
              </p>
            </div>
            {isTaxReturn && document.metadata.year !== undefined && (
              <span className="w-fit rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Fiscal year {document.metadata.year}
              </span>
            )}
          </div>

          {!isTaxReturn && (
            <dl className="mt-4 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Bank</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {document.metadata.bank ?? 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Account</dt>
                <dd className="mt-1 font-mono text-xs font-semibold text-slate-900">
                  {maskAccount(document.metadata.account)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Coverage</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {document.metadata.months_covered ?? 0}{' '}
                  {(document.metadata.months_covered ?? 0) === 1
                    ? 'month'
                    : 'months'}
                </dd>
              </div>
            </dl>
          )}

          {diagnostic && <DiagnosticPanel diagnostic={diagnostic} />}
        </div>
      </div>
    </li>
  )
}

interface DocumentGroupProps {
  title: string
  description: string
  documents: ApplicationDocument[]
  diagnosticsByDocumentId: ReadonlyMap<string, DocumentDiagnostic>
}

function DocumentGroup({
  title,
  description,
  documents,
  diagnosticsByDocumentId,
}: DocumentGroupProps) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {documents.length} {documents.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {documents.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              diagnostic={diagnosticsByDocumentId.get(document.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          No documents received in this category.
        </p>
      )}
    </section>
  )
}

interface ApplicationDetailProps {
  review: ApplicationReview
}

function ApplicationDetail({ review }: ApplicationDetailProps) {
  const taxReturns = review.documents.filter(
    (document) => document.type === 'liasse_fiscale',
  )
  const bankStatements = review.documents.filter(
    (document) => document.type === 'releve_bancaire',
  )
  const diagnosticsByDocumentId = new Map(
    review.diagnostics.map((diagnostic) => [
      diagnostic.documentId,
      diagnostic,
    ]),
  )

  return (
    <>
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-emerald-600" />
        <div className="flex flex-col gap-6 px-6 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
              Application {review.applicationId}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {review.company.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review the received documents against the expected application
              requirements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">
              Review status
            </span>
            <ReviewStatusBadge status={review.documentReviewStatus} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SummaryCard eyebrow="Applicant" title="Company summary">
          <DetailList
            items={[
              { label: 'SIREN', value: review.company.siren },
              {
                label: 'Business',
                value: `${review.company.businessType} / ${review.company.legalCategory}`,
              },
              { label: 'NAF code', value: review.company.codeNaf },
              { label: 'Owner', value: review.company.owner },
              {
                label: 'Created',
                value: formatDate(review.company.creationDate),
              },
              {
                label: 'Address',
                value: `${review.company.address}, ${review.company.postalCode} ${review.company.countryCode}`,
              },
            ]}
          />
        </SummaryCard>

        <SummaryCard eyebrow="Request" title="Financing summary">
          <DetailList
            items={[
              {
                label: 'Amount',
                value: amountFormatter.format(review.financingRequest.amount),
              },
              {
                label: 'Financing type',
                value: financingTypeLabels[review.financingRequest.type],
              },
              {
                label: 'Duration',
                value: `${review.financingRequest.durationInMonth} ${
                  review.financingRequest.durationInMonth === 1
                    ? 'month'
                    : 'months'
                }`,
              },
              {
                label: 'Interest rate',
                value: `${rateFormatter.format(review.financingRequest.interestRate)}% annual`,
              },
              {
                label: 'Request status',
                value: formatRequestStatus(review.financingRequest.status),
              },
              {
                label: 'Use of funds',
                value: review.financingRequest.fundUsage,
              },
            ]}
          />
        </SummaryCard>

        <ScoreContext review={review} />
        <RequirementsSummary review={review} />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
              Received files
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Documents and diagnostics
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Documents are grouped by type. Mocked extraction diagnostics
              appear only on the files that have a simulated pipeline signal.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {review.documents.length}{' '}
            {review.documents.length === 1 ? 'document' : 'documents'} received
          </p>
        </div>

        <div className="mt-7 grid gap-8 xl:grid-cols-2">
          <DocumentGroup
            title="Tax returns"
            description="Fiscal documents received for the application."
            documents={taxReturns}
            diagnosticsByDocumentId={diagnosticsByDocumentId}
          />
          <DocumentGroup
            title="Bank statements"
            description="Statements grouped by their source document."
            documents={bankStatements}
            diagnosticsByDocumentId={diagnosticsByDocumentId}
          />
        </div>
      </section>
    </>
  )
}

export function ApplicationDetailPage({
  applicationId,
}: ApplicationDetailPageProps) {
  const [requestVersion, setRequestVersion] = useState(0)
  const [state, setState] = useState<ApplicationDetailState>({
    status: 'loading',
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchApplicationReview(applicationId, controller.signal)
      .then((review) => {
        setState({ status: 'success', review })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'An unknown request error occurred.',
          notFound:
            error instanceof ApplicationsApiError && error.status === 404,
        })
      })

    return () => controller.abort()
  }, [applicationId, requestVersion])

  const retry = () => {
    setState({ status: 'loading' })
    setRequestVersion((version) => version + 1)
  }

  return (
    <div className="min-h-screen">
      <PageHeader />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
        <BackLink />

        {state.status === 'loading' && <LoadingState />}

        {state.status === 'error' && (
          <ErrorState
            applicationId={applicationId}
            message={state.message}
            notFound={state.notFound}
            onRetry={retry}
          />
        )}

        {state.status === 'success' && (
          <ApplicationDetail review={state.review} />
        )}
      </main>
    </div>
  )
}
