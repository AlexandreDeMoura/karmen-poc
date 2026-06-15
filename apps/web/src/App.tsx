import { ApplicationListPage } from './features/applications/ApplicationListPage'
import { ApplicationDetailPage } from './features/applications/ApplicationDetailPage'

type AppRoute =
  | { page: 'list' }
  | { page: 'detail'; applicationId: string }
  | { page: 'not-found' }

function selectRoute(pathname: string): AppRoute {
  if (pathname === '/') {
    return { page: 'list' }
  }

  const detailMatch = pathname.match(/^\/applications\/([^/]+)\/?$/)

  if (!detailMatch) {
    return { page: 'not-found' }
  }

  try {
    return {
      page: 'detail',
      applicationId: decodeURIComponent(detailMatch[1]),
    }
  } catch {
    return { page: 'not-found' }
  }
}

function RouteNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This route is not part of the document readiness workspace.
        </p>
        <a
          className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          href="/"
        >
          Back to applications
        </a>
      </div>
    </main>
  )
}

function App() {
  const route = selectRoute(window.location.pathname)

  if (route.page === 'list') {
    return <ApplicationListPage />
  }

  if (route.page === 'detail') {
    return <ApplicationDetailPage applicationId={route.applicationId} />
  }

  return <RouteNotFound />
}

export default App
