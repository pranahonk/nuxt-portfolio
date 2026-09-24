import { saveThreadsToken } from '~/server/utils/threads-store'

interface ThreadsTokenResponse {
  access_token?: string
  user_id?: string
  error_message?: string
}

interface ThreadsProfileResponse {
  id?: string
  username?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.threadsAppId || !config.threadsAppSecret || !config.threadsRedirectUri) {
    throw createError({ statusCode: 500, statusMessage: 'Threads OAuth is not configured' })
  }

  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const expectedState = getCookie(event, 'threads-oauth-state')

  deleteCookie(event, 'threads-oauth-state', { path: '/' })

  if (!code || !state || !expectedState || state !== expectedState) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Threads OAuth callback' })
  }

  const shortLivedResponse = await $fetch<ThreadsTokenResponse>('https://graph.threads.net/oauth/access_token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: config.threadsAppId,
      client_secret: config.threadsAppSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.threadsRedirectUri
    }).toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded' }
  })

  if (!shortLivedResponse.access_token) {
    throw createError({ statusCode: 502, statusMessage: shortLivedResponse.error_message || 'Threads token exchange failed' })
  }

  const longLivedResponse = await $fetch<ThreadsTokenResponse>('https://graph.threads.net/access_token', {
    query: {
      grant_type: 'th_exchange_token',
      client_secret: config.threadsAppSecret,
      access_token: shortLivedResponse.access_token
    }
  })

  const accessToken = longLivedResponse.access_token || shortLivedResponse.access_token
  const profile = await $fetch<ThreadsProfileResponse>('https://graph.threads.net/v1.0/me', {
    query: { fields: 'id,username', access_token: accessToken }
  })

  await saveThreadsToken({
    accessToken,
    userId: profile.id || shortLivedResponse.user_id,
    username: profile.username,
    updatedAt: new Date().toISOString()
  })

  return sendRedirect(event, '/?threads=connected')
})
