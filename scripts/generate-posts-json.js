const fs = require('fs')
const path = require('path')

const NOTION_API = 'https://api.notion.com/v1'
const token = process.env.NOTION_TOKEN
const dbId = process.env.NOTION_TABLE_ID

function slugify(title) {
  return String(title).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

async function fetchNotion() {
  if (!token || !dbId) return []
  const posts = []
  let cursor
  do {
    const body = {
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
    if (!res.ok) { console.error('Notion query failed', res.status); break }
    const data = await res.json()
    for (const page of data.results ?? []) {
      const props = page.properties
      const titleProp = props.title ?? props.Name ?? props.name
      const title = titleProp?.title?.[0]?.plain_text ?? ''
      if (!title) continue
      const coverUrl = page.cover?.external?.url || page.cover?.file?.url || null
      posts.push({
        slug: slugify(title),
        title,
        description: props.description?.rich_text?.[0]?.plain_text ?? '',
        created_at: new Date(props.created_at?.date?.start ?? page.created_time).toISOString(),
        tags: props.tags?.multi_select?.map(t => t.name) ?? [],
        thumbnail: coverUrl ? [{ url: coverUrl }] : null,
      })
    }
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)
  return posts
}

async function primeBlobCache(posts) {
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore({ name: 'posts', consistency: 'strong' })
    const envelope = { posts, expiresAt: Date.now() + 3600 * 1000 }
    await store.set('posts:listing', JSON.stringify(envelope))
    console.log('Primed posts:listing blob cache with', posts.length, 'posts')
  } catch {
    // Not running in Netlify environment — skip gracefully
  }
}

async function main() {
  const notionPosts = await fetchNotion()

  // Local articles as fallback (Notion wins on slug conflict).
  const articlesDir = path.join(__dirname, '../server/data/articles')
  const localPosts = []
  try {
    for (const file of fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'))) {
      const c = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf-8'))
      if (!c.published) continue
      localPosts.push({
        slug: c.slug,
        title: c.title,
        description: c.excerpt ?? '',
        created_at: new Date(c.createdAt).toISOString(),
        tags: c.tags || [],
        thumbnail: c.featuredImage ? [{ url: c.featuredImage }] : null,
      })
    }
  } catch { /* dir may not exist */ }

  const bySlug = new Map()
  for (const p of localPosts) bySlug.set(p.slug, p)
  for (const p of notionPosts) bySlug.set(p.slug, p) // Notion overrides

  const all = [...bySlug.values()].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  const apiDir = path.join(__dirname, '../public/api')
  fs.mkdirSync(apiDir, { recursive: true })
  fs.writeFileSync(path.join(apiDir, 'posts.json'), JSON.stringify(all))
  console.log('Generated public/api/posts.json with', all.length, 'posts')

  // Attempt to prime the Blob cache (only works inside Netlify)
  await primeBlobCache(all)
}

main().catch(err => { console.error(err); process.exit(1) })
