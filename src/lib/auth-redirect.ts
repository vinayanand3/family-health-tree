const PRODUCTION_ORIGIN = 'https://family-health-tree.vercel.app'

export function getAuthRedirectOrigin() {
  const { hostname, origin } = window.location
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  const isProduction = hostname === 'family-health-tree.vercel.app'

  if (isLocal || isProduction) return origin
  if (hostname.endsWith('.vercel.app')) return PRODUCTION_ORIGIN

  return origin
}

export function getAuthCallbackUrl(path = '/auth/callback') {
  return `${getAuthRedirectOrigin()}${path}`
}
