import { articles } from '~/server/data/articlesData'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  try {
    const article = articles.find(a => a.slug === slug && a.published)

    if (!article) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Post not found'
      })
    }

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
  } catch (error: any) {
    if (error.statusCode === 404) {
      throw error
    }
    console.error('Error loading post:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error loading post'
    })
  }
})
