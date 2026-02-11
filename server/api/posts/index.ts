import { articles } from '~/server/data/articlesData'

export default defineEventHandler(async () => {
  try {
    const posts = articles
      .filter(article => article.published)
      .map(article => ({
        slug: article.slug,
        title: article.title,
        description: article.excerpt,
        created_at: article.createdAt,
        tags: article.tags || [],
        thumbnail: article.featuredImage ? [{ url: article.featuredImage }] : null
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return posts
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
})
