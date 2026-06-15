import { useCallback, useEffect, useState } from 'react'
import type { ApplicationListItem } from '../application.types'
import { fetchApplications } from '../applications.api'

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
          message:
            error instanceof Error
              ? error.message
              : 'An unknown request error occurred.',
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
