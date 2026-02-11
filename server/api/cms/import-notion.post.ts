import { promises as fs } from 'fs'
import { join } from 'path'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')
const NOTION_API_BASE = 'https://api.notion.com/v1'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function extractRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return ''
  return richText.map(t => t.plain_text || '').join('')
}

function extractProperty(property: any): any {
  if (!property) return null

  switch (property.type) {
    case 'title':
      return extractRichText(property.title)
    case 'rich_text':
      return extractRichText(property.rich_text)
    case 'multi_select':
      return property.multi_select?.map((s: any) => s.name) || []
    case 'select':
      return property.select?.name || null
    case 'date':
      return property.date?.start || null
    case 'url':
      return property.url || null
    case 'files':
      if (property.files && property.files.length > 0) {
        const file = property.files[0]
        return file.file?.url || file.external?.url || null
      }
      return null
    case 'created_time':
      return property.created_time
    default:
      return null
  }
}

async function queryNotionDatabase(token: string, databaseId: string): Promise<any[]> {
  const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.results || []
}

async function getPageBlocks(token: string, pageId: string): Promise<any[]> {
  const response = await fetch(`${NOTION_API_BASE}/blocks/${pageId}/children?page_size=100`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28'
    }
  })

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  return data.results || []
}

async function getPageContent(token: string, pageId: string): Promise<string> {
  try {
    const blocks = await getPageBlocks(token, pageId)
    let html = ''

    for (const block of blocks) {
      const type = block.type
      const content = block[type]

      switch (type) {
        case 'paragraph':
          const pText = extractRichText(content?.rich_text)
          if (pText) html += `<p>${pText}</p>\n`
          break
        case 'heading_1':
          html += `<h1>${extractRichText(content?.rich_text)}</h1>\n`
          break
        case 'heading_2':
          html += `<h2>${extractRichText(content?.rich_text)}</h2>\n`
          break
        case 'heading_3':
          html += `<h3>${extractRichText(content?.rich_text)}</h3>\n`
          break
        case 'bulleted_list_item':
          html += `<ul><li>${extractRichText(content?.rich_text)}</li></ul>\n`
          break
        case 'numbered_list_item':
          html += `<ol><li>${extractRichText(content?.rich_text)}</li></ol>\n`
          break
        case 'quote':
          html += `<blockquote>${extractRichText(content?.rich_text)}</blockquote>\n`
          break
        case 'code':
          html += `<pre><code>${extractRichText(content?.rich_text)}</code></pre>\n`
          break
        case 'image':
          const imgUrl = content?.file?.url || content?.external?.url || ''
          if (imgUrl) html += `<img src="${imgUrl}" alt="Image" />\n`
          break
        case 'divider':
          html += '<hr />\n'
          break
        case 'callout':
          html += `<div class="callout">${extractRichText(content?.rich_text)}</div>\n`
          break
      }
    }

    return html
  } catch (error) {
    console.error('Error fetching page content:', error)
    return ''
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const notionToken = config.notionToken
  const notionTableId = config.public.notionTableId

  if (!notionToken || notionToken === 'YOUR_NOTION_INTEGRATION_TOKEN_HERE') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Notion integration token not configured. Add NOTION_TOKEN to your .env file.'
    })
  }

  if (!notionTableId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Notion table ID not configured'
    })
  }

  // Ensure articles directory exists
  try {
    await fs.access(ARTICLES_DIR)
  } catch {
    await fs.mkdir(ARTICLES_DIR, { recursive: true })
  }

  try {
    // Query the Notion database
    const pages = await queryNotionDatabase(notionToken, notionTableId)

    if (!pages || pages.length === 0) {
      return {
        success: true,
        message: 'No posts found in Notion database',
        imported: 0
      }
    }

    const imported: string[] = []
    const skipped: string[] = []
    const errors: string[] = []

    // Get existing slugs
    const existingSlugs = new Set<string>()
    try {
      const existingFiles = await fs.readdir(ARTICLES_DIR)
      for (const file of existingFiles) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
          const existing = JSON.parse(content)
          if (existing.slug) existingSlugs.add(existing.slug)
        }
      }
    } catch {}

    for (const page of pages) {
      try {
        const props = page.properties

        // Extract properties - adjust these based on your Notion database columns
        const title = extractProperty(props.title || props.Title || props.Name || props.name) || 'Untitled'
        const slug = extractProperty(props.slug || props.Slug) || generateSlug(title)
        const description = extractProperty(props.description || props.Description || props.excerpt || props.Excerpt) || ''
        const tags = extractProperty(props.tags || props.Tags) || []
        const createdAt = extractProperty(props.created_at || props.Created || props.Date) || page.created_time
        const thumbnail = extractProperty(props.thumbnail || props.Thumbnail || props.cover || props.Cover || props.image || props.Image)

        // Skip if already exists
        if (existingSlugs.has(slug)) {
          skipped.push(title)
          continue
        }

        // Fetch page content
        const pageContent = await getPageContent(notionToken, page.id)

        // Create article
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        const now = new Date().toISOString()

        const article = {
          id,
          title,
          slug,
          content: pageContent || `<p>${description}</p>`,
          excerpt: description,
          published: true,
          createdAt: createdAt ? new Date(createdAt).toISOString() : now,
          updatedAt: now,
          tags: Array.isArray(tags) ? tags : [],
          featuredImage: thumbnail || ''
        }

        // Save article
        await fs.writeFile(
          join(ARTICLES_DIR, `${id}.json`),
          JSON.stringify(article, null, 2)
        )

        imported.push(title)
        existingSlugs.add(slug)

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (err: any) {
        errors.push(`Error: ${err.message}`)
      }
    }

    return {
      success: true,
      message: 'Import completed',
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      details: {
        imported,
        skipped,
        errors
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to import from Notion: ${error.message}`
    })
  }
})
