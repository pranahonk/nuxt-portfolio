import { getPostListing, setPostListing, type PostSummary } from '../../utils/post-store'
import { fetchNotionListing } from '../../utils/notion-listing'

const LISTING_TTL_SECONDS = 300

export function paginate(
  posts: PostSummary[],
  page: number,
  limit: number
): { posts: PostSummary[]; total: number; hasMore: boolean } {
  const p = Number.isInteger(page) && page > 0 ? page : 1
  const l = Number.isInteger(limit) && limit > 0 ? limit : 10
  const start = (p - 1) * l
  const slice = posts.slice(start, start + l)
  return { posts: slice, total: posts.length, hasMore: start + l < posts.length }
}

export function paginatePartial(
  posts: PostSummary[],
  page: number,
  limit: number
): { posts: PostSummary[]; total: number | null; hasMore: boolean } {
  const start = (page - 1) * limit
  const hasMore = posts.length > page * limit
  return {
    posts: posts.slice(start, start + limit),
    total: hasMore ? null : posts.length,
    hasMore,
  }
}

async function localFallback(): Promise<PostSummary[]> {
  const { articles: localArticles } = await import('../../data/articlesData')
  const posts: PostSummary[] = []
  for (const a of localArticles) {
    if (!a.published) continue
    posts.push({
      slug: a.slug as string,
      title: a.title as string,
      description: (a.excerpt ?? '') as string,
      created_at: new Date(a.createdAt as string).toISOString(),
      tags: (a.tags ?? []) as string[],
      thumbnail: a.featuredImage ? [{ url: a.featuredImage as string }] : null,
    })
  }
  posts.sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime())
  return posts
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    'netlify-cdn-cache-control': 'public, durable, s-maxage=300, stale-while-revalidate=86400',
  })
  const query = getQuery(event)
  const requestedPage = parseInt(String(query.page ?? '1'), 10)
  const requestedLimit = parseInt(String(query.limit ?? '10'), 10)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 50) : 10

  // Tier 1: Blob listing cache (fast path).
  let listing = await getPostListing()

  // Tier 2/3: rebuild from Notion, then local fallback.
  if (!listing) {
    const config = useRuntimeConfig()
    const notionToken = config.notionToken
    const dbId = config.public.notionTableId

    if (notionToken && dbId) {
      listing = await fetchNotionListing(notionToken, dbId, page * limit + 1)
    }

    if (!listing || listing.length === 0) {
      listing = await localFallback()
    } else if (listing.length <= page * limit) {
      // Cache only real Notion results, not the local fallback.
      await setPostListing(listing, LISTING_TTL_SECONDS)
    } else {
      return paginatePartial(listing, page, limit)
    }
  }

  return paginate(listing, page, limit)
})
