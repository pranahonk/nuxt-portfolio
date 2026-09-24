import { randomBytes } from 'node:crypto'
import { assertCmsAuth } from '~/server/utils/cms-auth'

export default defineEventHandler((event) => {
  assertCmsAuth(event)

  const config = useRuntimeConfig()
  const state = randomBytes(24).toString('hex')
  const redirectUri = config.threadsRedirectUri

  if (!config.threadsAppId || !config.threadsRedirectUri) {
    throw createError({ statusCode: 500, statusMessage: 'Threads OAuth is not configured' })
  }

  setCookie(event, 'threads-oauth-state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/'
  })

  const params = new URLSearchParams({
    client_id: config.threadsAppId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'threads_basic,threads_content_publish',
    state
  })

  return sendRedirect(event, `https://threads.net/oauth/authorize?${params.toString()}`)
})
