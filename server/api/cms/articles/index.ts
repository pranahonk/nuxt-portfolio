import { promises as fs } from 'fs'
import { join } from 'path'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')

// Ensure articles directory exists
async function ensureArticlesDir() {
  try {
    await fs.access(ARTICLES_DIR)
  } catch {
    await fs.mkdir(ARTICLES_DIR, { recursive: true })
  }
}

export default defineEventHandler(async (event) => {
  await ensureArticlesDir()

  if (getMethod(event) === 'GET') {
    // Get all articles
    try {
      const files = await fs.readdir(ARTICLES_DIR)
      const articles = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
          const article = JSON.parse(content)
          articles.push({
            id: article.id,
            title: article.title,
            slug: article.slug,
            published: article.published,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            excerpt: article.excerpt
          })
        }
      }

      return articles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (error) {
      return []
    }
  }

  if (getMethod(event) === 'POST') {
    // Create new article
    const article = await readBody(event)
    const id = Date.now().toString()
    const now = new Date().toISOString()

    const newArticle = {
      id,
      title: article.title || 'Untitled Article',
      slug: article.slug || generateSlug(article.title || 'untitled-article'),
      content: article.content || '',
      excerpt: article.excerpt || '',
      published: false,
      createdAt: now,
      updatedAt: now,
      tags: article.tags || [],
      featuredImage: article.featuredImage || ''
    }

    await fs.writeFile(
      join(ARTICLES_DIR, `${id}.json`),
      JSON.stringify(newArticle, null, 2)
    )

    return newArticle
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
}
