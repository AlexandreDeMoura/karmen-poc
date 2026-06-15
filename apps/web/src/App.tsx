import {
  ApplicationDetailPage,
  ApplicationListPage,
} from './features/applications'
import { selectApplicationsRoute } from './features/applications/applications.routes'

function RouteNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          Page introuvable
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Cette page ne fait pas partie de l’espace de suivi documentaire.
        </p>
        <a
          className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          href="/"
        >
          Retour aux demandes
        </a>
      </div>
    </main>
  )
}

function App() {
  const route = selectApplicationsRoute(window.location.pathname)

  if (route.page === 'list') {
    return <ApplicationListPage />
  }

  if (route.page === 'detail') {
    return <ApplicationDetailPage applicationId={route.applicationId} />
  }

  return <RouteNotFound />
}

export default App
