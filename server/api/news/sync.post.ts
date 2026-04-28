import { Client } from '@notionhq/client'
import { generateSlug } from '../../utils/slug'
import { fetchContentFromUrl } from '../../utils/content-fetcher'
import { setCachedPost } from '../../utils/post-store'

const HN_API = 'https://hacker-news.firebaseio.com/v0'
const DEVTO_API = 'https://dev.to/api'
const NOTION_API = 'https://api.notion.com/v1'

interface Article {
  title: string
  url: string
  description: string
  tags: string[]
  thumbnail?: string
}

function assertAuth(event: Parameters<typeof getHeader>[0], secret: string) {
  const header = getHeader(event, 'authorization') ?? ''
  if (!secret || header !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

async function fetchHackerNews(): Promise<Article[]> {
  const res = await fetch(`${HN_API}/topstories.json`)
  if (!res.ok) return []
  const ids: number[] = await res.json()

  const results: Article[] = []
  for (let i = 0; i < 80 && results.length < 20; i += 10) {
    const batch = ids.slice(i, i + 10)
    const items = await Promise.all(
      batch.map(id =>
        fetch(`${HN_API}/item/${id}.json`).then(r => (r.ok ? r.json() : null))
      )
    )
    for (const item of items) {
      if (!item || item.type !== 'story' || !item.url) continue
      if ((item.score ?? 0) < 50) continue
      results.push({
        title: item.title ?? 'Untitled',
        url: item.url,
        description: `HN score: ${item.score} · by ${item.by ?? 'unknown'}`,
        tags: ['hacker-news', 'tech'],
      })
    }
  }
  return results
}

async function fetchDevTo(): Promise<Article[]> {
  const TAGS = ['ai', 'javascript', 'programming']
  const results: Article[] = []
  for (const tag of TAGS) {
    const res = await fetch(
      `${DEVTO_API}/articles?tag=${tag}&per_page=5&top=7`,
      { headers: { 'User-Agent': 'prana-portfolio/newssync' } }
    )
    if (!res.ok) continue
    const articles: Array<{
      title: string; url: string; description?: string
      cover_image?: string; social_image?: string
    }> = await res.json()
    for (const a of articles) {
      results.push({
        title: a.title,
        url: a.url,
        description: a.description ?? '',
        tags: [tag, 'dev-to'],
        thumbnail: a.cover_image || a.social_image || '',
      })
    }
  }
  return results
}

async function getExistingTitles(token: string, dbId: string): Promise<Set<string>> {
  const known = new Set<string>()
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) break

    const data: {
      results: Array<{ properties: Record<string, { title?: Array<{ plain_text: string }> }> }>
      has_more: boolean
      next_cursor: string | null
    } = await res.json()

    for (const page of data.results ?? []) {
      const prop =
        page.properties?.Name ??
        page.properties?.Title ??
        page.properties?.title
      const text = prop?.title?.[0]?.plain_text ?? ''
      if (text) known.add(text.toLowerCase().trim())
    }
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)

  return known
}

async function createNotionPage(notion: Client, dbId: string, article: Article): Promise<void> {
  await notion.pages.create({
    parent: { database_id: dbId },
    ...(article.thumbnail ? { cover: { external: { url: article.thumbnail } } } : {}),
    properties: {
      title: {
        title: [{ text: { content: article.title } }],
      },
      tags: {
        multi_select: article.tags.map(t => ({ name: t })),
      },
      description: {
        rich_text: [{ text: { content: article.description.slice(0, 2000) } }],
      },
      public: {
        checkbox: false,
      },
      created_at: {
        date: { start: new Date().toISOString() },
      },
    },
    children: [
      {
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [
            { type: 'text' as const, text: { content: '🔗 Source: ' } },
            {
              type: 'text' as const,
              text: { content: article.url, link: { url: article.url } },
            },
          ],
        },
      },
      {
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [{ type: 'text' as const, text: { content: article.description } }],
        },
      },
    ],
  })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  assertAuth(event, config.cronSecret ?? '')

  const notionToken = config.notionToken
  const dbId = config.public.notionTableId

  if (!notionToken) {
    throw createError({ statusCode: 500, statusMessage: 'NOTION_TOKEN not configured' })
  }
  if (!dbId) {
    throw createError({ statusCode: 500, statusMessage: 'NOTION_TABLE_ID not configured' })
  }

  const [hnArticles, devtoArticles] = await Promise.all([
    fetchHackerNews(),
    fetchDevTo(),
  ])

  const seen = new Set<string>()
  const allArticles = [...hnArticles, ...devtoArticles].filter(a => {
    const key = a.title.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const existingTitles = await getExistingTitles(notionToken, dbId)
  const notion = new Client({ auth: notionToken })

  let added = 0
  let skipped = 0

  for (const article of allArticles) {
    const key = article.title.toLowerCase().trim()
    if (existingTitles.has(key)) {
      skipped++
      continue
    }
    try {
      await createNotionPage(notion, dbId, article)
      existingTitles.add(key)
      added++
      if (article.url.includes('dev.to/')) {
        const enriched = await fetchContentFromUrl(article.url)
        if (enriched) {
          const slug = generateSlug(article.title)
          await setCachedPost(slug, {
            slug,
            title: article.title,
            content: `<p><a href="${article.url}" target="_blank" rel="noopener noreferrer">🔗 Read original article</a></p>\n` + enriched.content,
            thumbnail: enriched.thumbnail || article.thumbnail || '',
            excerpt: enriched.excerpt || article.description,
            created_at: new Date().toISOString(),
            tags: article.tags,
          })
        }
      }
      await new Promise(r => setTimeout(r, 350))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Notion create failed for "${article.title}":`, msg)
    }
  }

  return { added, skipped, total: allArticles.length }
})
