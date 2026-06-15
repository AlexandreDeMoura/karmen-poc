import { useCallback, useEffect, useState } from 'react'
import type { ApplicationReview } from '../application.types'
import {
  ApplicationsApiError,
  fetchApplicationReview,
} from '../applications.api'

type ApplicationReviewState =
  | { status: 'loading' }
  | { status: 'success'; review: ApplicationReview }
  | { status: 'error'; message: string; notFound: boolean }

export function useApplicationReview(applicationId: string) {
  const [requestVersion, setRequestVersion] = useState(0)
  const [state, setState] = useState<ApplicationReviewState>({
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

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setRequestVersion((version) => version + 1)
  }, [])

  return { state, retry }
}
