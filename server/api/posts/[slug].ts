import { promises as fs } from 'fs'
import { join } from 'path'
import type { H3Event } from 'h3'
import { generateSlug } from '../../utils/slug'
import { getCachedPost, setCachedPost } from '../../utils/post-store'
import { fetchContentFromUrl } from '../../utils/content-fetcher'
import { buildSafeSourceLink, getNotionCoverUrl, isSafeRemoteUrl } from '../../utils/content-security'
import { buildHashVerification } from '../../utils/article-blocks'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')
const NOTION_API = 'https://api.notion.com/v1'

type NotionRichText = { plain_text?: string; href?: string | null; annotations?: { bold?: boolean; italic?: boolean; code?: boolean } }
type NotionBlock = { type: string; [key: string]: unknown }

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderRichText(nodes: NotionRichText[] = []): string {
  return nodes.map(node => {
    let value = escapeHtml(node.plain_text ?? '')
    if (node.annotations?.code) value = `<code>${value}</code>`
    if (node.annotations?.bold) value = `<strong>${value}</strong>`
    if (node.annotations?.italic) value = `<em>${value}</em>`
    const href = node.href && /^https?:\/\//i.test(node.href) ? node.href : null
    return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${value}</a>` : value
  }).join('')
}

async function fetchNotionBlocks(token: string, pageId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = []
  let cursor: string | undefined
  do {
    const params = new URLSearchParams({ page_size: '100' })
    if (cursor) params.set('start_cursor', cursor)
    const response = await fetch(`${NOTION_API}/blocks/${pageId}/children?${params}`, {
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
    })
    if (!response.ok) return []
    const data = await response.json() as { results: NotionBlock[]; has_more: boolean; next_cursor: string | null }
    blocks.push(...(data.results ?? []))
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)
  return blocks
}

export function renderNotionBlocks(blocks: NotionBlock[]): string {
  return blocks.map(block => {
    const data = block[block.type] as { rich_text?: NotionRichText[] } | undefined
    const text = renderRichText(data?.rich_text)
    if (!text) return ''
    if (block.type === 'heading_2') return `<h2>${text}</h2>`
    if (block.type === 'heading_3') return `<h3>${text}</h3>`
    if (block.type === 'bulleted_list_item') return `<ul><li>${text}</li></ul>`
    if (block.type === 'numbered_list_item') return `<ol><li>${text}</li></ol>`
    if (block.type === 'quote') return `<blockquote>${text}</blockquote>`
    return block.type === 'paragraph' ? `<p>${text}</p>` : ''
  }).join('\n')
}

function toResponse(post: {
  slug: string; title: string; content: string; thumbnail: string
  excerpt: string; created_at: string; tags: string[]
  content_hash?: string; computed_content_hash?: string
}) {
  const response: Record<string, unknown> = {
    slug: post.slug,
    title: post.title,
    content: post.content,
    description: post.excerpt,
    created_at: post.created_at,
    updated_at: post.created_at,
    tags: post.tags,
    thumbnail: post.thumbnail ? [{ url: post.thumbnail }] : null,
  }
  if (post.content_hash || post.computed_content_hash) {
    response.content_hash = post.content_hash ?? ''
    response.computed_content_hash = post.computed_content_hash ?? ''
  }
  return response
}

export default defineEventHandler(async (event: H3Event) => {
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
      const props = page.properties as Record<string, { title?: Array<{ plain_text: string }>; rich_text?: Array<{ plain_text: string }> }>
      const titleProp = props.title ?? props.Name ?? props.name
      const title = titleProp?.title?.[0]?.plain_text ?? ''
      const explicitSlug = props.slug?.rich_text?.map(node => node.plain_text).join('') ?? ''
      if (explicitSlug === slug || generateSlug(title) === slug) {
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
  let sourceUrl = ''
  const notionBlocks = await fetchNotionBlocks(notionToken, matchedPage.id as string)
  if (notionBlocks.length) {
    for (const block of notionBlocks) {
      if (block.type !== 'paragraph') continue
      const paragraph = block.paragraph as { rich_text?: Array<{ plain_text?: string }> } | undefined
      const text = paragraph?.rich_text?.map(t => t.plain_text ?? '').join('') ?? ''
      const m = text.match(/Source: (https?:\/\/\S+)/)
      if (m) { sourceUrl = m[1]; break }
    }
  }

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
  const storedContentHash = props.content_hash?.rich_text?.[0]?.plain_text ?? ''
  const linkedinCopy = props.linkedin_copy?.rich_text?.[0]?.plain_text ?? ''
  let thumbnail = getNotionCoverUrl(matchedPage)
  let excerpt = description
  let content = ''

  if (sourceUrl && isSafeRemoteUrl(sourceUrl)) {
    const enriched = await fetchContentFromUrl(sourceUrl)
    if (!enriched) throw createError({ statusCode: 503, statusMessage: 'Could not fetch article content' })
    thumbnail ||= enriched.thumbnail || ''
    excerpt = enriched.excerpt || description
    content = buildSafeSourceLink(sourceUrl) + enriched.content
  } else {
    content = renderNotionBlocks(notionBlocks)
  }

  if (!content) throw createError({ statusCode: 404, statusMessage: 'Post content not available yet' })

  const { computed_content_hash } = buildHashVerification({
    title: matchedTitle,
    excerpt: description,
    tags,
    contentHash: storedContentHash,
    linkedinCopy,
    notionBlocks,
  })

  const stored = {
    slug, title: matchedTitle, content, thumbnail,
    excerpt,
    created_at: createdAt, tags,
    content_hash: storedContentHash,
    computed_content_hash: computed_content_hash,
  }
  await setCachedPost(slug, stored)
  return toResponse(stored)
})
