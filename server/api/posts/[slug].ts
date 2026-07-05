import { promises as fs } from 'fs'
import { join } from 'path'
import { generateSlug } from '../../utils/slug'
import { getCachedPost, setCachedPost } from '../../utils/post-store'
import { fetchContentFromUrl } from '../../utils/content-fetcher'
import { buildSafeSourceLink, getNotionCoverUrl, isSafeRemoteUrl } from '../../utils/content-security'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')
const NOTION_API = 'https://api.notion.com/v1'

function toResponse(post: {
  slug: string; title: string; content: string; thumbnail: string
  excerpt: string; created_at: string; tags: string[]
}) {
  return {
    slug: post.slug,
    title: post.title,
    content: post.content,
    description: post.excerpt,
    created_at: post.created_at,
    updated_at: post.created_at,
    tags: post.tags,
    thumbnail: post.thumbnail ? [{ url: post.thumbnail }] : null,
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const config = useRuntimeConfig()

  // Tier 1: Netlify Blob Storage
  const cached = await getCachedPost(slug)
  if (cached) return toResponse(cached)

  // Tier 2: Local JSON files (45 pre-enriched articles)
  try {
    const files = await fs.readdir(ARTICLES_DIR)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const raw = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
      const article = JSON.parse(raw)
      if (article.slug !== slug || !article.published) continue
      const stored = {
        slug: article.slug as string,
        title: article.title as string,
        content: article.content as string,
        thumbnail: (article.featuredImage ?? '') as string,
        excerpt: (article.excerpt ?? '') as string,
        created_at: new Date(article.createdAt as string).toISOString(),
        tags: (article.tags ?? []) as string[],
      }
      await setCachedPost(slug, stored)
      return toResponse(stored)
    }
  } catch {
    // ARTICLES_DIR may not exist in production — fall through
  }

  // Tier 3: Query Notion + fetch source URL on-demand
  const notionToken = config.notionToken
  const dbId = config.public.notionTableId
  if (!notionToken || !dbId) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  let matchedPage: Record<string, unknown> | null = null
  let matchedTitle = ''
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = {
      page_size: 100,
      filter: { property: 'public', checkbox: { equals: true } },
    }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) break

    const data = await res.json() as {
      results: Array<Record<string, unknown>>
      has_more: boolean
      next_cursor: string | null
    }

    for (const page of data.results ?? []) {
      const props = page.properties as Record<string, { title?: Array<{ plain_text: string }> }>
      const titleProp = props.title ?? props.Name ?? props.name
      const title = titleProp?.title?.[0]?.plain_text ?? ''
      if (generateSlug(title) === slug) {
        matchedPage = page
        matchedTitle = title
        break
      }
    }

    if (matchedPage) break
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)

  if (!matchedPage) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  // Extract source URL from Notion page blocks
  const blocksRes = await fetch(
    `${NOTION_API}/blocks/${matchedPage.id as string}/children?page_size=10`,
    { headers: { Authorization: `Bearer ${notionToken}`, 'Notion-Version': '2022-06-28' } }
  )

  let sourceUrl = ''
  if (blocksRes.ok) {
    const blocksData = await blocksRes.json() as {
      results: Array<{ type: string; paragraph?: { rich_text: Array<{ plain_text: string }> } }>
    }
    for (const block of blocksData.results ?? []) {
      if (block.type !== 'paragraph') continue
      const text = block.paragraph?.rich_text?.map(t => t.plain_text).join('') ?? ''
      const m = text.match(/Source: (https?:\/\/\S+)/)
      if (m) { sourceUrl = m[1]; break }
    }
  }

  if (!sourceUrl || !isSafeRemoteUrl(sourceUrl)) {
    throw createError({ statusCode: 404, statusMessage: 'Post content not available yet' })
  }

  const enriched = await fetchContentFromUrl(sourceUrl)
  if (!enriched) throw createError({ statusCode: 503, statusMessage: 'Could not fetch article content' })

  const props = matchedPage.properties as Record<string, {
    rich_text?: Array<{ plain_text: string }>
    multi_select?: Array<{ name: string }>
    date?: { start: string }
  }>
  const description = props.description?.rich_text?.[0]?.plain_text ?? ''
  const tags = props.tags?.multi_select?.map(t => t.name) ?? []
  const createdAt = new Date(
    (props.created_at?.date?.start ?? matchedPage.created_time) as string
  ).toISOString()
  const thumbnail = getNotionCoverUrl(matchedPage) || enriched.thumbnail || ''
  const content = buildSafeSourceLink(sourceUrl) + enriched.content

  const stored = {
    slug, title: matchedTitle, content, thumbnail,
    excerpt: enriched.excerpt || description,
    created_at: createdAt, tags,
  }
  await setCachedPost(slug, stored)
  return toResponse(stored)
})
