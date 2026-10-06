import { createHash, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'tiny-courier-session'

function requireSecret(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length < 24) {
    throw createError({ statusCode: 503, statusMessage: `${name} is not configured` })
  }
  return value
}

export function assertMissionControlAuth(event: Parameters<typeof getCookie>[0]): void {
  const config = useRuntimeConfig()
  const token = getCookie(event, COOKIE_NAME)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  try {
    const payload = jwt.verify(token, requireSecret(config.missionControlJwtSecret, 'Mission Control JWT secret'))
    if (typeof payload !== 'object' || payload.aud !== 'tiny-courier-mission-control') throw new Error('wrong audience')
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }
}

export function setMissionControlSession(event: Parameters<typeof setCookie>[0]): void {
  const config = useRuntimeConfig()
  const token = jwt.sign(
    { role: 'operator' },
    requireSecret(config.missionControlJwtSecret, 'Mission Control JWT secret'),
    { audience: 'tiny-courier-mission-control', expiresIn: '8h' }
  )
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8
  })
}

export function clearMissionControlSession(event: Parameters<typeof setCookie>[0]): void {
  setCookie(event, COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  })
}

export function passwordMatches(candidate: string): boolean {
  const configured = requireSecret(useRuntimeConfig().missionControlPassword, 'Mission Control password')
  const left = createHash('sha256').update(candidate).digest()
  const right = createHash('sha256').update(configured).digest()
  return timingSafeEqual(left, right)
}

export function assertMissionControlOrigin(event: Parameters<typeof getHeader>[0]): void {
  const origin = getHeader(event, 'origin')
  if (!origin) throw createError({ statusCode: 403, statusMessage: 'Origin required' })
  const requestUrl = getRequestURL(event)
  const expected = `${requestUrl.protocol}//${getHeader(event, 'x-forwarded-host') || requestUrl.host}`
  if (origin !== expected) throw createError({ statusCode: 403, statusMessage: 'Invalid origin' })
}

export function assertMissionControlSync(event: Parameters<typeof getHeader>[0]): void {
  const configured = requireSecret(useRuntimeConfig().missionControlSyncSecret, 'Mission Control sync secret')
  const header = getHeader(event, 'authorization') || ''
  const candidate = header.startsWith('Bearer ') ? header.slice(7) : ''
  const left = createHash('sha256').update(candidate).digest()
  const right = createHash('sha256').update(configured).digest()
  if (!timingSafeEqual(left, right)) throw createError({ statusCode: 401, statusMessage: 'Invalid sync credential' })
}
