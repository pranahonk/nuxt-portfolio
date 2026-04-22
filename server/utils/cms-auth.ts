import jwt from 'jsonwebtoken'

export function assertCmsAuth(event: Parameters<typeof getCookie>[0]): void {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'cms-token')

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    jwt.verify(token, config.jwtSecret)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }
}
