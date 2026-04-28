import { generateSlug } from '../../utils/slug'

const NOTION_API = 'https://api.notion.com/v1'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const notionToken = config.notionToken
  const dbId = config.public.notionTableId
  if (!notionToken || !dbId) return []

  const posts: Array<{
    slug: string
    title: string
    description: string
    created_at: string
    tags: string[]
    thumbnail: Array<{ url: string }> | null
  }> = []

  let cursor: string | undefined
  do {
    const body: Record<string, unknown> = {
      page_size: 100,
      filter: { property: 'public', checkbox: { equals: true } },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
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

    const data: {
      results: Array<{
        id: string
        created_time: string
        cover?: { external?: { url: string }; file?: { url: string } }
        properties: Record<string, {
          type: string
          title?: Array<{ plain_text: string }>
          rich_text?: Array<{ plain_text: string }>
          multi_select?: Array<{ name: string }>
          date?: { start: string }
        }>
      }>
      has_more: boolean
      next_cursor: string | null
    } = await res.json()

    for (const page of data.results ?? []) {
      const props = page.properties
      const titleProp = props.title ?? props.Name ?? props.name
      const title = titleProp?.title?.[0]?.plain_text ?? ''
      if (!title) continue

      const slug = generateSlug(title)
      const description = props.description?.rich_text?.[0]?.plain_text ?? ''
      const tags = props.tags?.multi_select?.map(t => t.name) ?? []
      const createdAt = props.created_at?.date?.start ?? page.created_time
      const coverUrl = page.cover?.external?.url || page.cover?.file?.url || null

      posts.push({
        slug,
        title,
        description,
        created_at: new Date(createdAt).toISOString(),
        tags,
        thumbnail: coverUrl ? [{ url: coverUrl }] : null,
      })
    }

    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)

  // Fallback: serve local JSON articles when Notion returns nothing
  if (posts.length === 0) {
    const { promises: fs } = await import('fs')
    const { join } = await import('path')
    const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')
    try {
      const files = await fs.readdir(ARTICLES_DIR)
      for (const file of files) {
        if (!file.endsWith('.json')) continue
        const raw = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
        const a = JSON.parse(raw)
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
    } catch {
      // articles dir absent in some deploy environments — skip
    }
  }

  return posts
})
