import { Client } from '@notionhq/client'

const SYNC_BUDGET_MS = 8_000
const EXTERNAL_FETCH_TIMEOUT_MS = 4_000
const NOTION_RATE_LIMIT_MS = 350
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

const SOURCE_URL_PROPERTY_CANDIDATES = ['source_url', 'Source URL'] as const

type SourceUrlPropertyName = string

type SourceUrlPropertyResolution =
  | { kind: 'found'; propertyName: SourceUrlPropertyName }
  | { kind: 'missing' }
  | { kind: 'ambiguous'; propertyNames: string[] }
  | { kind: 'error'; statusMessage: string }

function normalizeSourceUrl(url: string): string {
  return url.trim()
}

function getTitleKey(title: string): string {
  return title.toLowerCase().trim()
}

function getUrlPropertyNames(properties: Record<string, unknown>): string[] {
  return Object.entries(properties)
    .filter(([, property]) => (property as { type?: string } | undefined)?.type === 'url')
    .map(([name]) => name)
}

function resolveSourceUrlPropertyName(
  properties: Record<string, unknown>
): SourceUrlPropertyResolution {
  for (const candidate of SOURCE_URL_PROPERTY_CANDIDATES) {
    const property = properties[candidate] as { type?: string } | undefined
    if (property?.type === 'url') {
      return { kind: 'found', propertyName: candidate }
    }
  }

  const urlPropertyNames = getUrlPropertyNames(properties)
  if (urlPropertyNames.length === 1) {
    return { kind: 'found', propertyName: urlPropertyNames[0] }
  }
  if (urlPropertyNames.length > 1) {
    return { kind: 'ambiguous', propertyNames: urlPropertyNames }
  }
  return { kind: 'missing' }
}

function extractExistingSourceUrl(
  properties: Record<string, unknown>,
  propertyName?: string | null
): string | null {
  const resolution: SourceUrlPropertyResolution = propertyName
    ? { kind: 'found', propertyName }
    : resolveSourceUrlPropertyName(properties)

  if (resolution.kind !== 'found') return null

  const property = properties[resolution.propertyName] as { url?: string | null } | undefined
  const value = property?.url?.trim()
  return value ? normalizeSourceUrl(value) : null
}

function buildMissingSourceUrlPropertyMessage(urlPropertyNames: string[]): string {
  if (urlPropertyNames.length > 1) {
    return (
      'Notion database has multiple url properties and none match source_url or Source URL: ' +
      urlPropertyNames.join(', ')
    )
  }

  return 'Notion database must expose a url property named source_url or Source URL'
}

function buildEmptyDbSourceUrlPropertyMessage(urlPropertyNames: string[]): string {
  if (urlPropertyNames.length > 1) {
    return (
      'Notion database is empty and has multiple url properties; rename one to source_url or Source URL, or leave only one url property: ' +
      urlPropertyNames.join(', ')
    )
  }

  return (
    'Notion database is empty and schema has no url property named ' +
    'source_url or Source URL; add this column to the database before the first sync'
  )
}

function assertAuth(event: Parameters<typeof getHeader>[0], secret: string) {
  const header = getHeader(event, 'authorization') ?? ''
  if (!secret || header !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

async function fetchHackerNews(): Promise<Article[]> {
  try {
    const res = await fetch(`${HN_API}/topstories.json`, {
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return []
    const ids: number[] = await res.json()

    const results: Article[] = []
    for (let i = 0; i < 80 && results.length < 20; i += 10) {
      const batch = ids.slice(i, i + 10)
      const items = await Promise.all(
        batch.map(async (id) => {
          try {
            const response = await fetch(`${HN_API}/item/${id}.json`, {
              signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
            })
            return response.ok ? response.json() : null
          } catch {
            return null
          }
        })
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
  } catch {
    return []
  }
}

async function fetchDevTo(): Promise<Article[]> {
  const TAGS = ['ai', 'javascript', 'programming']
  const results: Article[] = []
  for (const tag of TAGS) {
    try {
      const res = await fetch(
        `${DEVTO_API}/articles?tag=${tag}&per_page=5&top=7`,
        {
          headers: { 'User-Agent': 'prana-portfolio/newssync' },
          signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
        }
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
    } catch {
      continue
    }
  }
  return results
}

/**
 * Fetches the Notion database schema directly to detect the writable URL
 * property name without requiring existing rows.  Used when the database is
 * empty (first-ever sync / bootstrap path).
 */
async function fetchWritablePropertyFromDbSchema(
  token: string,
  dbId: string
): Promise<SourceUrlPropertyResolution> {
  try {
    const res = await fetch(`${NOTION_API}/databases/${dbId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
      signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return {
        kind: 'error',
        statusMessage: `Notion schema API returned ${res.status}: ${body.slice(0, 300)}`,
      }
    }
    const data: { properties?: Record<string, { type?: string }> } = await res.json()
    return resolveSourceUrlPropertyName(
      (data.properties ?? {}) as Record<string, unknown>
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      kind: 'error',
      statusMessage: `Failed to query Notion schema: ${message}`,
    }
  }
}

async function getExistingSourceState(
  token: string,
  dbId: string,
  deadline: number
): Promise<{
  sourceUrls: Set<string>
  legacyTitleKeys: Set<string>
  writablePropertyName: SourceUrlPropertyName
}> {
  const sourceUrls = new Set<string>()
  const legacyTitleKeys = new Set<string>()
  let writablePropertyName: SourceUrlPropertyName | null = null
  let ambiguousUrlPropertyNames: string[] = []
  let cursor: string | undefined
  let pagesObserved = 0
  let sawSuccessfulQuery = false

  do {
    if (Date.now() >= deadline) break

    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    try {
      const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw createError({
          statusCode: 500,
          statusMessage: `Notion API returned ${res.status}: ${body.slice(0, 300)}`,
        })
      }

      const data: {
        results: Array<{ properties: Record<string, unknown> }>
        has_more: boolean
        next_cursor: string | null
      } = await res.json()

      sawSuccessfulQuery = true
      pagesObserved += data.results?.length ?? 0

      for (const page of data.results ?? []) {
        const properties = page.properties ?? {}

        if (!writablePropertyName) {
          const resolution = resolveSourceUrlPropertyName(properties)
          if (resolution.kind === 'found') {
            writablePropertyName = resolution.propertyName
          } else if (resolution.kind === 'ambiguous') {
            ambiguousUrlPropertyNames = resolution.propertyNames
          }
        }

        const existingUrl = extractExistingSourceUrl(properties, writablePropertyName)
        if (existingUrl) {
          sourceUrls.add(existingUrl)
          continue
        }

        const titleProp =
          (properties.Name as { title?: Array<{ plain_text: string }> } | undefined) ??
          (properties.Title as { title?: Array<{ plain_text: string }> } | undefined) ??
          (properties.title as { title?: Array<{ plain_text: string }> } | undefined)
        const title = titleProp?.title?.[0]?.plain_text ?? ''
        if (title) legacyTitleKeys.add(getTitleKey(title))
      }

      cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
    } catch (err) {
      if (err && typeof err === 'object' && 'statusCode' in err) throw err
      break
    }
  } while (cursor)

  // The query loop never completed successfully — credentials or network issue.
  if (!sawSuccessfulQuery) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to query Notion database; check NOTION_TOKEN and NOTION_TABLE_ID',
    })
  }

  // Pages were present but none exposed a resolvable URL property — clear schema error.
  if (pagesObserved > 0 && !writablePropertyName) {
    throw createError({
      statusCode: 500,
      statusMessage: buildMissingSourceUrlPropertyMessage(ambiguousUrlPropertyNames),
    })
  }

  // Database is empty (first-ever sync / bootstrap).  We cannot infer the
  // writable property name from page rows, so probe the database schema
  // directly.  This allows bootstrapping without requiring a manual seed row.
  if (pagesObserved === 0 && !writablePropertyName) {
    const schemaResolution = await fetchWritablePropertyFromDbSchema(token, dbId)
    if (schemaResolution.kind === 'found') {
      writablePropertyName = schemaResolution.propertyName
    } else if (schemaResolution.kind === 'ambiguous') {
      throw createError({
        statusCode: 500,
        statusMessage: buildEmptyDbSourceUrlPropertyMessage(schemaResolution.propertyNames),
      })
    } else if (schemaResolution.kind === 'error') {
      throw createError({
        statusCode: 500,
        statusMessage: schemaResolution.statusMessage,
      })
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: buildEmptyDbSourceUrlPropertyMessage([]),
      })
    }
  }

  // writablePropertyName is guaranteed non-null here: all null paths above throw.
  return {
    sourceUrls,
    legacyTitleKeys,
    writablePropertyName: writablePropertyName as SourceUrlPropertyName,
  }
}

async function createNotionPage(
  notion: Client,
  dbId: string,
  article: Article,
  writablePropertyName: SourceUrlPropertyName
): Promise<void> {
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
        checkbox: true,
      },
      created_at: {
        date: { start: new Date().toISOString() },
      },
      [writablePropertyName]: {
        url: article.url,
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

  const deadline = Date.now() + SYNC_BUDGET_MS

  const [hnArticles, devtoArticles] = await Promise.all([
    fetchHackerNews(),
    fetchDevTo(),
  ])

  const seen = new Set<string>()
  const allArticles = [...hnArticles, ...devtoArticles].filter(a => {
    const key = getTitleKey(a.title)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const {
    sourceUrls: existingSourceUrls,
    legacyTitleKeys,
    writablePropertyName,
  } = await getExistingSourceState(notionToken, dbId, deadline)
  const notion = new Client({ auth: notionToken })

  let added = 0
  let skipped = 0
  let budgetExhausted = false

  for (const article of allArticles) {
    if (Date.now() >= deadline) {
      budgetExhausted = true
      break
    }
    const sourceUrlKey = normalizeSourceUrl(article.url)
    const titleKey = getTitleKey(article.title)

    if (existingSourceUrls.has(sourceUrlKey) || legacyTitleKeys.has(titleKey)) {
      skipped++
      continue
    }
    try {
      await createNotionPage(notion, dbId, article, writablePropertyName)
      existingSourceUrls.add(sourceUrlKey)
      legacyTitleKeys.add(titleKey)
      added++
      await new Promise(r => setTimeout(r, NOTION_RATE_LIMIT_MS))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Notion create failed for "${article.title}":`, msg)
    }
  }

  return { added, skipped, total: allArticles.length, budgetExhausted }
})
