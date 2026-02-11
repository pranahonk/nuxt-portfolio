import { promises as fs } from 'fs'
import { join } from 'path'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')

export default defineEventHandler(async () => {
  try {
    await fs.access(ARTICLES_DIR)
  } catch {
    return []
  }

  try {
    const files = await fs.readdir(ARTICLES_DIR)
    const posts = []

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
        const article = JSON.parse(content)

        // Only return published articles
        if (article.published) {
          posts.push({
            slug: article.slug,
            title: article.title,
            description: article.excerpt,
            created_at: article.createdAt,
            tags: article.tags || [],
            thumbnail: article.featuredImage ? [{ url: article.featuredImage }] : null
          })
        }
      }
    }

    // Sort by created date, newest first
    return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (error) {
    return []
  }
})
