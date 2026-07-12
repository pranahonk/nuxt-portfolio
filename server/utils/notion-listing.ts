import { generateSlug } from './slug'
import type { PostSummary } from './post-store'

const NOTION_API = 'https://api.notion.com/v1'

export async function fetchNotionListing(
  token: string,
  dbId: string
): Promise<PostSummary[]> {
  const posts: PostSummary[] = []
  let cursor: string | undefined
  try {
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
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) return []

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
  } catch {
    return []
  }

  posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return posts
}
