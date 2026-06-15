export type ApplicationsRoute =
  | { page: 'list' }
  | { page: 'detail'; applicationId: string }
  | { page: 'not-found' }

export function getApplicationPath(applicationId: string): string {
  return `/applications/${encodeURIComponent(applicationId)}`
}

export function selectApplicationsRoute(
  pathname: string,
): ApplicationsRoute {
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
