import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

type ApiStatus =
  | { state: 'loading'; message: string }
  | { state: 'connected'; message: string }
  | { state: 'error'; message: string }

function App() {
  const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    state: 'loading',
    message: 'Connecting to API...',
  })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/health', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API responded with ${response.status}`)
        }

        return response.json() as Promise<{ message: string }>
      })
      .then(({ message }) => {
        setApiStatus({ state: 'connected', message })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setApiStatus({ state: 'error', message: 'API connection failed' })
      })

    return () => controller.abort()
  }, [])

  return (
      <section id="center">
       
        <p className={`api-status api-status--${apiStatus.state}`}>
          <span aria-hidden="true" />
          Backend: {apiStatus.message}
        </p>
      </section>
  )
}

export default App
