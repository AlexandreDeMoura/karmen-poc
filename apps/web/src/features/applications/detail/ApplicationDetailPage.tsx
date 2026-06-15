import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { EmailAssistantPanel } from './EmailAssistantPanel'
import { ProblemChecklist } from './ProblemChecklist'
import { ReviewStatusBadge } from '../shared/ReviewStatusBadge'
import type {
  ApplicationDocument,
  ApplicationReview,
  DocumentDiagnostic,
} from '../application.types'
import {
  financingTypeLabels,
  formatAmount,
} from '../application.presentation'
import {
  changeProblemSelection,
  createProblemSelection,
  getDiagnosticSignals,
  groupDocuments,
  indexDiagnosticsByDocumentId,
} from './detail.logic'
import {
  extractionStatusPresentation,
  formatDate,
  formatInterestRate,
  formatRequestStatus,
  maskAccount,
  riskPresentation,
} from './detail.presentation'
import { useApplicationReview } from './useApplicationReview'

interface ApplicationDetailPageProps {
  applicationId: string
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
            <p className="text-xs text-slate-500">Opérations de crédit</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          Suivi documentaire
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
      &larr; Retour aux demandes
    </a>
  )
}

function LoadingState() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Chargement du contrôle de la demande...</p>

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
        {notFound ? 'Demande introuvable' : 'Échec de la requête'}
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {notFound
          ? `Aucun contrôle n’est disponible pour ${applicationId}`
          : 'Impossible de charger le contrôle de la demande'}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
        {notFound
          ? 'La demande de financement n’existe peut-être plus ou le lien est incorrect.'
          : 'Vérifiez que l’API est démarrée, puis relancez la requête.'}
      </p>
      <p className="mx-auto mt-2 max-w-xl text-xs text-slate-500">{message}</p>
      <button
        className="mt-6 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        onClick={onRetry}
        type="button"
      >
        Réessayer
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

interface ScoreContextProps {
  review: ApplicationReview
}

function ScoreContext({ review }: ScoreContextProps) {
  const risk = riskPresentation[review.score.risk_bucket]

  return (
    <SummaryCard eyebrow="Pour information" title="Contexte du score">
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
          <span className="text-3xl font-semibold">
            {review.score.global_score}
          </span>
          <span className="mt-1 text-xs text-slate-300">sur 100</span>
        </div>
        <div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${risk.className}`}
          >
            {risk.label}
          </span>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            Le score et le niveau de risque apportent du contexte à l’analyste.
            Ils ne déterminent pas si le dossier documentaire est complet.
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
    <SummaryCard eyebrow="Documents attendus" title="Exigences documentaires">
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">
            Liasses fiscales
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Une liasse fiscale est attendue pour chaque exercice requis.
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
            Relevés bancaires
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            La période requise doit être couverte pour chaque compte bancaire
            détecté.
          </p>
          <p className="mt-4 text-2xl font-semibold text-slate-950">
            {review.requirements.expectedBankStatementMonths}
            <span className="ml-2 text-sm font-medium text-slate-500">
              mois par compte
            </span>
          </p>
        </div>
      </div>
    </SummaryCard>
  )
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
          Diagnostic simulé du traitement
        </p>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {signals.length > 0 && (
        <ul
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Signaux de précontrôle"
        >
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
        Il s’agit d’un signal simulé pour cette preuve de concept, et non d’une
        analyse du PDF effectuée dans le navigateur.
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
          {isTaxReturn ? 'FISC' : 'BANQ'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h4 className="break-words text-sm font-semibold text-slate-950">
                {document.name}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {isTaxReturn ? 'Liasse fiscale' : 'Relevé bancaire'} /{' '}
                {document.id}
              </p>
            </div>
            {isTaxReturn && document.metadata.year !== undefined && (
              <span className="w-fit rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Exercice {document.metadata.year}
              </span>
            )}
          </div>

          {!isTaxReturn && (
            <dl className="mt-4 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">Banque</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {document.metadata.bank ?? 'Non renseignée'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Compte</dt>
                <dd className="mt-1 font-mono text-xs font-semibold text-slate-900">
                  {maskAccount(document.metadata.account)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Période couverte</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {document.metadata.months_covered ?? 0} mois
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
          {documents.length} {documents.length === 1 ? 'fichier' : 'fichiers'}
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
          Aucun document reçu dans cette catégorie.
        </p>
      )}
    </section>
  )
}

interface ReviewDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  children: React.ReactNode
}

function ReviewDrawer({
  open,
  onClose,
  title,
  description,
  children,
}: ReviewDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocused = document.activeElement as HTMLElement | null

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        aria-label={title}
        aria-modal="true"
        className={`@container absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        inert={!open}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
              Espace analyste
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          <button
            aria-label="Fermer le panneau de contrôle"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg leading-none text-slate-500 transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ApplicationDetailProps {
  review: ApplicationReview
}

function ApplicationDetail({ review }: ApplicationDetailProps) {
  const [problemSelection, setProblemSelection] = useState(() =>
    createProblemSelection(review.problems),
  )
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const closePanel = useCallback(() => setIsPanelOpen(false), [])
  const { taxReturns, bankStatements } = useMemo(
    () => groupDocuments(review.documents),
    [review.documents],
  )
  const diagnosticsByDocumentId = useMemo(
    () => indexDiagnosticsByDocumentId(review.diagnostics),
    [review.diagnostics],
  )
  const updateProblemSelection = (problemId: string, selected: boolean) => {
    setProblemSelection((currentSelection) =>
      changeProblemSelection(currentSelection, problemId, selected),
    )
  }

  return (
    <>
      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-emerald-600" />
        <div className="flex flex-col gap-6 px-6 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
              Demande {review.applicationId}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {review.company.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Comparez les documents reçus aux pièces attendues pour cette
              demande.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">
              État du contrôle
            </span>
            <ReviewStatusBadge status={review.documentReviewStatus} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SummaryCard eyebrow="Demandeur" title="Informations sur l’entreprise">
          <DetailList
            items={[
              { label: 'SIREN', value: review.company.siren },
              {
                label: 'Activité',
                value: `${review.company.businessType} / ${review.company.legalCategory}`,
              },
              { label: 'Code NAF', value: review.company.codeNaf },
              { label: 'Dirigeant', value: review.company.owner },
              {
                label: 'Création',
                value: formatDate(review.company.creationDate),
              },
              {
                label: 'Adresse',
                value: `${review.company.address}, ${review.company.postalCode} ${review.company.countryCode}`,
              },
            ]}
          />
        </SummaryCard>

        <SummaryCard eyebrow="Demande" title="Synthèse du financement">
          <DetailList
            items={[
              {
                label: 'Montant',
                value: formatAmount(review.financingRequest.amount),
              },
              {
                label: 'Type de financement',
                value: financingTypeLabels[review.financingRequest.type],
              },
              {
                label: 'Durée',
                value: `${review.financingRequest.durationInMonth} mois`,
              },
              {
                label: 'Taux d’intérêt',
                value: `${formatInterestRate(review.financingRequest.interestRate)} % par an`,
              },
              {
                label: 'État de la demande',
                value: formatRequestStatus(review.financingRequest.status),
              },
              {
                label: 'Utilisation des fonds',
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
              Fichiers reçus
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Documents et diagnostics
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Les documents sont regroupés par type. Les diagnostics simulés
              apparaissent uniquement sur les fichiers concernés.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {review.documents.length}{' '}
            {review.documents.length === 1 ? 'document reçu' : 'documents reçus'}
          </p>
        </div>

        <div className="mt-7 grid gap-8 xl:grid-cols-2">
          <DocumentGroup
            title="Liasses fiscales"
            description="Documents fiscaux reçus pour cette demande."
            documents={taxReturns}
            diagnosticsByDocumentId={diagnosticsByDocumentId}
          />
          <DocumentGroup
            title="Relevés bancaires"
            description="Relevés regroupés par document source."
            documents={bankStatements}
            diagnosticsByDocumentId={diagnosticsByDocumentId}
          />
        </div>
      </section>

      <button
        aria-expanded={isPanelOpen}
        aria-haspopup="dialog"
        className={`fixed right-6 bottom-6 z-40 inline-flex items-center gap-2.5 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 ${
          isPanelOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        onClick={() => setIsPanelOpen(true)}
        type="button"
      >
        Contrôler et rédiger
        {review.problems.length > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 py-0.5 text-xs font-bold tabular-nums">
            {review.problems.length}
          </span>
        )}
      </button>

      <ReviewDrawer
        description="Confirmez les problèmes détectés, puis préparez l’e-mail au client."
        onClose={closePanel}
        open={isPanelOpen}
        title="Contrôle documentaire"
      >
        <ProblemChecklist
          onSelectionChange={updateProblemSelection}
          problems={review.problems}
          selectedProblemIds={problemSelection.selectedProblemIds}
        />

        <EmailAssistantPanel
          applicationId={review.applicationId}
          problems={review.problems}
          selectedProblemIds={problemSelection.selectedProblemIds}
          selectionRevision={problemSelection.revision}
        />
      </ReviewDrawer>
    </>
  )
}

export function ApplicationDetailPage({
  applicationId,
}: ApplicationDetailPageProps) {
  const { state, retry } = useApplicationReview(applicationId)

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
