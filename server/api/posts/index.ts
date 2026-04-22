import { promises as fs } from 'fs'
import { join } from 'path'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')

export default defineEventHandler(async () => {
  try {
    const files = await fs.readdir(ARTICLES_DIR)
    const posts = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const content = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
      const article = JSON.parse(content)
      if (!article.published) continue
      posts.push({
        slug: article.slug,
        title: article.title,
        description: article.excerpt,
        created_at: article.createdAt,
        tags: article.tags || [],
        thumbnail: article.featuredImage ? [{ url: article.featuredImage }] : null
      })
    }

    return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
})
