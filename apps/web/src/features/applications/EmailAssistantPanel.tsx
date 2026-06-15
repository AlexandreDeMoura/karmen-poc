import { useEffect, useRef, useState } from 'react'
import type { DocumentProblem, EmailPreview } from './application.types'
import { generateEmailPreview } from './applications.api'

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

  const selectedProblems = problems.filter((problem) =>
    selectedProblemIds.has(problem.id),
  )
  const selectedClientFacingCount = selectedProblems.filter(
    (problem) => problem.clientFacing,
  ).length
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
        selectedProblems.map((problem) => problem.id),
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
        message:
          error instanceof Error
            ? error.message
            : 'An unknown email preview error occurred.',
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
        message: 'Edited email body copied to the clipboard.',
      })
    } catch {
      setCopyFeedback({
        status: 'error',
        message:
          'Copy failed. Your edited email is still available. Check clipboard permissions and try again.',
      })
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
            Client communication
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Email assistant
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Generate a deterministic draft from the selected client-facing
            requests, then edit it before copying.
          </p>
        </div>

        <button
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
          disabled={!hasSelectedClientFacingProblem || isGenerating}
          onClick={generatePreview}
          type="button"
        >
          {isGenerating
            ? 'Generating email...'
            : preview
              ? 'Regenerate email'
              : 'Generate email'}
        </button>
      </div>

      <div aria-live="polite" className="mt-5">
        {!hasSelectedClientFacingProblem && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-950">
              Select at least one client-facing request to generate an email.
            </p>
          </div>
        )}

        {hasSelectedClientFacingProblem && isGenerating && (
          <div
            aria-busy="true"
            className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-sky-950">
              Generating the email preview...
            </p>
          </div>
        )}

        {hasSelectedClientFacingProblem && requestError && (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
            role="alert"
          >
            <p className="text-sm font-semibold text-rose-950">
              The email preview could not be generated.
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
                This preview is out of date.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                The checklist changed after generation. Regenerate the email
                before copying it.
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
                Email preview ready
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                {preview.includedProblemIds.length}{' '}
                {preview.includedProblemIds.length === 1
                  ? 'client request is'
                  : 'client requests are'}{' '}
                included.
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
              Subject
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
              Editable email body
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              This preview is not sent automatically. Copying uses the current
              edited body.
            </p>
            <button
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
              disabled={!canCopy}
              onClick={copyBody}
              type="button"
            >
              {isCopying ? 'Copying...' : 'Copy edited body'}
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
