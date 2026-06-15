interface ApplicationDetailPageProps {
  applicationId: string
}

export function ApplicationDetailPage({
  applicationId,
}: ApplicationDetailPageProps) {
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
        <a
          className="inline-flex text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
          href="/"
        >
          &larr; Back to applications
        </a>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-8">
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
            Application
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Application review
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Financing request{' '}
            <span className="font-semibold text-slate-950">
              {applicationId}
            </span>
          </p>
        </div>
      </main>
    </div>
  )
}
