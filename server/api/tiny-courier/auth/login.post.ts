import { createHash } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { assertMissionControlOrigin, passwordMatches, setMissionControlSession } from '../../../utils/mission-control-auth'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export default defineEventHandler(async (event) => {
  assertMissionControlOrigin(event)
  const body = await readBody<{ password?: unknown }>(event)
  if (typeof body?.password !== 'string' || body.password.length > 256) {
    throw createError({ statusCode: 400, statusMessage: 'Valid password required' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const key = `login:${createHash('sha256').update(ip).digest('hex')}`
  const store = getStore({ name: 'tiny-courier-control', consistency: 'strong' })
  const now = Date.now()
  let reserved = false
  for (let retry = 0; retry < 5 && !reserved; retry += 1) {
    const current = await store.getWithMetadata(key, { type: 'json' }) as { data: { count: number; resetAt: number }; etag?: string } | null
    if (!current) {
      reserved = (await store.setJSON(key, { count: 1, resetAt: now + WINDOW_MS }, { onlyIfNew: true })).modified
      continue
    }
    const attempt = current.data.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : current.data
    if (attempt.count >= MAX_ATTEMPTS) throw createError({ statusCode: 429, statusMessage: 'Too many attempts; try again later' })
    reserved = (await store.setJSON(key, { count: attempt.count + 1, resetAt: attempt.resetAt }, { onlyIfMatch: current.etag })).modified
  }
  if (!reserved) throw createError({ statusCode: 429, statusMessage: 'Too many concurrent attempts; try again' })

  if (!passwordMatches(body.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  await store.delete(key)
  setMissionControlSession(event)
  return { success: true }
})
