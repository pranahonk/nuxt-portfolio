import { promises as fs } from 'fs'
import { join } from 'path'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  try {
    await fs.access(ARTICLES_DIR)
  } catch {
    throw createError({
      statusCode: 404,
      statusMessage: 'Post not found'
    })
  }

  try {
    const files = await fs.readdir(ARTICLES_DIR)

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(join(ARTICLES_DIR, file), 'utf-8')
        const article = JSON.parse(content)

        // Find by slug and only return if published
        if (article.slug === slug && article.published) {
          return {
            slug: article.slug,
            title: article.title,
            content: article.content,
            description: article.excerpt,
            created_at: article.createdAt,
            updated_at: article.updatedAt,
            tags: article.tags || [],
            thumbnail: article.featuredImage ? [{ url: article.featuredImage }] : null
          }
        }
      }
    }

    throw createError({
      statusCode: 404,
      statusMessage: 'Post not found'
    })
  } catch (error: any) {
    if (error.statusCode === 404) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Error loading post'
    })
  }
})
