import { promises as fs } from 'fs'
import { join } from 'path'

const ARTICLES_DIR = join(process.cwd(), 'server/data/articles')

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const filePath = join(ARTICLES_DIR, `${id}.json`)

  if (getMethod(event) === 'GET') {
    // Get single article
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found'
      })
    }
  }

  if (getMethod(event) === 'PUT') {
    // Update article
    try {
      const updates = await readBody(event)
      const existingContent = await fs.readFile(filePath, 'utf-8')
      const existingArticle = JSON.parse(existingContent)

      const updatedArticle = {
        ...existingArticle,
        ...updates,
        id: existingArticle.id, // Preserve original ID
        createdAt: existingArticle.createdAt, // Preserve creation date
        updatedAt: new Date().toISOString()
      }

      await fs.writeFile(filePath, JSON.stringify(updatedArticle, null, 2))
      return updatedArticle
    } catch (error) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found'
      })
    }
  }

  if (getMethod(event) === 'DELETE') {
    // Delete article
    try {
      await fs.unlink(filePath)
      return { success: true, message: 'Article deleted successfully' }
    } catch (error) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Article not found'
      })
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
