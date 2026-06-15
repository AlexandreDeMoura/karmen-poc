import { useEffect, useRef, useState } from 'react'
import type { DocumentProblem, EmailPreview } from '../application.types'
import {
  generateEmailPreview,
  getApplicationsErrorMessage,
} from '../applications.api'
import { getSelectedClientFacingBlockingProblems } from './detail.logic'

interface EmailAssistantPanelProps {
  applicationId: string
  problems: DocumentProblem[]
  selectedProblemIds: ReadonlySet<string>
  selectionRevision: number
}

type RequestState =
  | { status: 'idle' }
  | { status: 'loading'; selectionRevision: number }
  | { status: 'error'; message: string; selectionRevision: number }

interface EditableEmailPreview extends EmailPreview {
  selectionRevision: number
}

interface CopyFeedback {
  status: 'success' | 'error'
  message: string
}

export function EmailAssistantPanel({
  applicationId,
  problems,
  selectedProblemIds,
  selectionRevision,
}: EmailAssistantPanelProps) {
  const [preview, setPreview] = useState<EditableEmailPreview | null>(null)
  const [requestState, setRequestState] = useState<RequestState>({
    status: 'idle',
  })
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null)
  const [isCopying, setIsCopying] = useState(false)
  const activeRequestRef = useRef<AbortController | null>(null)
  const requestTokenRef = useRef(0)

  const selectedClientFacingProblems =
    getSelectedClientFacingBlockingProblems(problems, selectedProblemIds)
  const selectedClientFacingCount = selectedClientFacingProblems.length
  const hasSelectedClientFacingProblem = selectedClientFacingCount > 0
  const isGenerating =
    requestState.status === 'loading' &&
    requestState.selectionRevision === selectionRevision
  const requestError =
    requestState.status === 'error' &&
    requestState.selectionRevision === selectionRevision
      ? requestState.message
      : null
  const isPreviewStale =
    preview !== null && preview.selectionRevision !== selectionRevision
  const canCopy =
    preview !== null && !isPreviewStale && !isGenerating && !isCopying

  useEffect(
    () => () => {
      requestTokenRef.current += 1
      activeRequestRef.current?.abort()
    },
    [],
  )

  const generatePreview = async () => {
    if (!hasSelectedClientFacingProblem || isGenerating) {
      return
    }

    activeRequestRef.current?.abort()

    const controller = new AbortController()
    const requestToken = requestTokenRef.current + 1
    const requestedSelectionRevision = selectionRevision

    requestTokenRef.current = requestToken
    activeRequestRef.current = controller
    setRequestState({
      status: 'loading',
      selectionRevision: requestedSelectionRevision,
    })
    setCopyFeedback(null)

    try {
      const generatedPreview = await generateEmailPreview(
        applicationId,
        selectedClientFacingProblems.map((problem) => problem.id),
        controller.signal,
      )

      if (requestTokenRef.current !== requestToken) {
        return
      }

      setPreview({
        ...generatedPreview,
        selectionRevision: requestedSelectionRevision,
      })
      setRequestState({ status: 'idle' })
    } catch (error: unknown) {
      if (
        controller.signal.aborted ||
        requestTokenRef.current !== requestToken
      ) {
        return
      }

      setRequestState({
        status: 'error',
        message: getApplicationsErrorMessage(
          error,
          'Impossible de contacter l’API pour générer l’aperçu.',
        ),
        selectionRevision: requestedSelectionRevision,
      })
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null
      }
    }
  }

  const updateBody = (body: string) => {
    setPreview((currentPreview) =>
      currentPreview ? { ...currentPreview, body } : currentPreview,
    )
    setCopyFeedback(null)
  }

  const copyBody = async () => {
    if (!preview || isPreviewStale || isGenerating || isCopying) {
      return
    }

    setIsCopying(true)
    setCopyFeedback(null)

    try {
      await navigator.clipboard.writeText(preview.body)
      setCopyFeedback({
        status: 'success',
        message: 'Le contenu modifié de l’e-mail a été copié.',
      })
    } catch {
      setCopyFeedback({
        status: 'error',
        message:
          'La copie a échoué. Votre e-mail modifié est toujours disponible. Vérifiez les autorisations du presse-papiers, puis réessayez.',
      })
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-5 @2xl:flex-row @2xl:items-end @2xl:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
            Communication client
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Assistant de rédaction
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Générez un brouillon à partir des demandes client sélectionnées,
            puis modifiez-le avant de le copier.
          </p>
        </div>

        <button
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
          disabled={!hasSelectedClientFacingProblem || isGenerating}
          onClick={generatePreview}
          type="button"
        >
          {isGenerating
            ? 'Génération en cours...'
            : preview
              ? 'Régénérer l’e-mail'
              : 'Générer l’e-mail'}
        </button>
      </div>

      <div aria-live="polite" className="mt-5">
        {!hasSelectedClientFacingProblem && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-950">
              Sélectionnez au moins une demande client pour générer un e-mail.
            </p>
          </div>
        )}

        {hasSelectedClientFacingProblem && isGenerating && (
          <div
            aria-busy="true"
            className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-sky-950">
              Génération de l’aperçu de l’e-mail...
            </p>
          </div>
        )}

        {hasSelectedClientFacingProblem && requestError && (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
            role="alert"
          >
            <p className="text-sm font-semibold text-rose-950">
              Impossible de générer l’aperçu de l’e-mail.
            </p>
            <p className="mt-1 text-sm leading-6 text-rose-800">
              {requestError}
            </p>
          </div>
        )}

        {hasSelectedClientFacingProblem &&
          !isGenerating &&
          !requestError &&
          isPreviewStale && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-950">
                Cet aperçu n’est plus à jour.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                La sélection a changé après la génération. Régénérez l’e-mail
                avant de le copier.
              </p>
            </div>
          )}

        {hasSelectedClientFacingProblem &&
          !isGenerating &&
          !requestError &&
          preview &&
          !isPreviewStale && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-950">
                Aperçu de l’e-mail prêt
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                {preview.includedProblemIds.length}{' '}
                {preview.includedProblemIds.length === 1
                  ? 'demande client incluse.'
                  : 'demandes client incluses.'}
              </p>
            </div>
          )}
      </div>

      {preview && (
        <div
          aria-busy={isGenerating}
          className={`mt-6 grid gap-5 ${
            isPreviewStale ? 'opacity-70' : ''
          }`}
        >
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Objet
            </p>
            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950">
              {preview.subject}
            </p>
          </div>

          <div>
            <label
              className="text-xs font-semibold tracking-wide text-slate-500 uppercase"
              htmlFor="email-preview-body"
            >
              Contenu modifiable de l’e-mail
            </label>
            <textarea
              className="mt-2 min-h-72 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={isPreviewStale || isGenerating}
              id="email-preview-body"
              onChange={(event) => updateBody(event.target.value)}
              spellCheck="true"
              value={preview.body}
            />
          </div>

          <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-center @2xl:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Cet aperçu n’est pas envoyé automatiquement. La copie utilise le
              contenu actuellement affiché.
            </p>
            <button
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
              disabled={!canCopy}
              onClick={copyBody}
              type="button"
            >
              {isCopying ? 'Copie en cours...' : 'Copier le contenu modifié'}
            </button>
          </div>

          {!isPreviewStale && (
            <div aria-live="polite">
              {copyFeedback && (
                <p
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    copyFeedback.status === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-rose-200 bg-rose-50 text-rose-950'
                  }`}
                  role={copyFeedback.status === 'error' ? 'alert' : 'status'}
                >
                  {copyFeedback.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
