import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'

export interface EnrichedContent {
  content: string
  thumbnail: string
  excerpt: string
}

async function fetchDevToContent(url: string): Promise<EnrichedContent | null> {
  const match = url.match(/dev\.to\/([^/]+)\/([^/?#]+)/)
  if (!match) return null
  const [, username, slug] = match
  try {
    const res = await fetch(`https://dev.to/api/articles/${username}/${slug}`, {
      headers: { 'User-Agent': 'prana-portfolio/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.body_html || (data.body_html as string).replace(/<[^>]+>/g, '').trim().length < 200) return null
    return {
      content: data.body_html as string,
      thumbnail: (data.cover_image || data.social_image || '') as string,
      excerpt: (data.description || '') as string,
    }
  } catch {
    return null
  }
}

async function fetchReadabilityContent(url: string): Promise<EnrichedContent | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-fetcher/1.0)' },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const { document } = parseHTML(html)
    const reader = new Readability(document as unknown as Document)
    const article = reader.parse()
    if (!article?.content || article.content.replace(/<[^>]+>/g, '').trim().length < 200) return null
    return {
      content: article.content,
      thumbnail: '',
      excerpt: article.excerpt || '',
    }
  } catch {
    return null
  }
}

export async function fetchContentFromUrl(url: string): Promise<EnrichedContent | null> {
  if (url.includes('dev.to/')) {
    const result = await fetchDevToContent(url)
    if (result) return result
  }
  return fetchReadabilityContent(url)
}
