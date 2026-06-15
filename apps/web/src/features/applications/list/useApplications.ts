import { useCallback, useEffect, useState } from 'react'
import type { ApplicationListItem } from '../application.types'
import {
  fetchApplications,
  getApplicationsErrorMessage,
} from '../applications.api'

type ApplicationsState =
  | { status: 'loading' }
  | { status: 'success'; applications: ApplicationListItem[] }
  | { status: 'error'; message: string }

export function useApplications() {
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
          message: getApplicationsErrorMessage(
            error,
            'Impossible de contacter l’API. Vérifiez qu’elle est démarrée.',
          ),
        })
      })

    return () => controller.abort()
  }, [requestVersion])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setRequestVersion((version) => version + 1)
  }, [])

  return { state, retry }
}
