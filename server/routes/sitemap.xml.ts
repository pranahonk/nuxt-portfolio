import { articles as localArticles } from '../data/articlesData'
import { fetchNotionListing } from '../utils/notion-listing'
import type { H3Event } from 'h3'

const SITE_URL = 'https://www.pwijaya.com'

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig()
  const notionPosts = config.notionToken && config.public.notionTableId
    ? await fetchNotionListing(config.notionToken, config.public.notionTableId)
    : []
  const posts = notionPosts.length ? notionPosts : localArticles.filter(article => article.published).map(article => ({ slug: article.slug, created_at: article.updatedAt || article.createdAt }))
  const urls = [
    { path: '/', modified: '' },
    { path: '/about', modified: '' },
    { path: '/projects', modified: '' },
    { path: '/posts', modified: posts[0]?.created_at || new Date().toISOString() },
    ...posts.map(post => ({ path: `/posts/${post.slug}`, modified: post.created_at })),
  ]
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${xml(`${SITE_URL}${url.path}`)}</loc>${url.modified ? `<lastmod>${xml(url.modified)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`
})
