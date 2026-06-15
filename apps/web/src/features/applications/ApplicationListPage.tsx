import { useEffect, useState } from 'react'
import { ApplicationListTable } from './ApplicationListTable'
import type { ApplicationListItem } from './application.types'
import { fetchApplications } from './applications.api'

type ApplicationsState =
  | { status: 'loading' }
  | { status: 'success'; applications: ApplicationListItem[] }
  | { status: 'error'; message: string }

function LoadingState() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <p className="sr-only">Loading applications...</p>
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 sm:w-1/3" />
      </div>
      <div aria-hidden="true" className="divide-y divide-slate-100">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="grid grid-cols-[2fr_1fr] gap-6 px-5 py-6 sm:grid-cols-4 lg:grid-cols-7"
          >
            <div className="h-4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="hidden h-4 animate-pulse rounded bg-slate-100 sm:block" />
            <div className="hidden h-4 animate-pulse rounded bg-slate-100 sm:block" />
            <div className="hidden h-4 animate-pulse rounded bg-slate-100 lg:block" />
            <div className="hidden h-4 animate-pulse rounded bg-slate-100 lg:block" />
            <div className="hidden h-4 animate-pulse rounded bg-slate-100 lg:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-xl font-semibold text-slate-500"
      >
        0
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">
        No applications yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Applications will appear here once they are available from the API.
      </p>
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="rounded-2xl border border-rose-200 bg-white px-6 py-14 text-center shadow-sm"
      role="alert"
    >
      <div
        aria-hidden="true"
        className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-50 text-xl font-bold text-rose-700"
      >
        !
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">
        Applications could not be loaded
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Check that the API is running, then try again.
      </p>
      <p className="mx-auto mt-2 max-w-xl text-xs text-slate-500">{message}</p>
      <button
        className="mt-6 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  )
}

export function ApplicationListPage() {
  const [requestVersion, setRequestVersion] = useState(0)
  const [state, setState] = useState<ApplicationsState>({
    status: 'loading',
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchApplications(controller.signal)
      .then((applications) => {
        setState({ status: 'success', applications })
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
        })
      })

    return () => controller.abort()
  }, [requestVersion])

  const retry = () => {
    setState({ status: 'loading' })
    setRequestVersion((version) => version + 1)
  }

  const applicationCount =
    state.status === 'success' ? state.applications.length : null

  return (
    <div className="min-h-screen">
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

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-emerald-700 uppercase">
              Portfolio
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Financing applications
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Review document readiness before starting credit analysis.
            </p>
          </div>

          {applicationCount !== null && (
            <p className="text-sm font-medium text-slate-600" aria-live="polite">
              {applicationCount}{' '}
              {applicationCount === 1 ? 'application' : 'applications'}
            </p>
          )}
        </div>

        {state.status === 'loading' && <LoadingState />}

        {state.status === 'error' && (
          <ErrorState message={state.message} onRetry={retry} />
        )}

        {state.status === 'success' && state.applications.length === 0 && (
          <EmptyState />
        )}

        {state.status === 'success' && state.applications.length > 0 && (
          <ApplicationListTable applications={state.applications} />
        )}
      </main>
    </div>
  )
}
