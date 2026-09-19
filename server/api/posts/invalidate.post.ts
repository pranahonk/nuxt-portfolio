import { deleteCachedPost } from '../../utils/post-store'

export default defineEventHandler(async event => {
  const config = useRuntimeConfig()
  const authorization = getHeader(event, 'authorization') ?? ''
  if (!config.cronSecret || authorization !== `Bearer ${config.cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const body = await readBody<{ slug?: string }>(event)
  const slug = body.slug?.trim()
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  }
  await deleteCachedPost(slug)
  return { invalidated: slug }
})
