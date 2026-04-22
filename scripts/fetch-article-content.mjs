import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ARTICLES_DIR = path.join(__dirname, '../server/data/articles')

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) return null
  return res.text()
}

async function fetchDevTo(articleUrl) {
  const match = articleUrl.match(/dev\.to\/([^/]+)\/([^/?#]+)/)
  if (!match) return null
  const [, username, slug] = match
  try {
    const res = await fetch(`https://dev.to/api/articles/${username}/${slug}`, {
      headers: { 'User-Agent': 'portfolio-fetcher/1.0' },
      signal: AbortSignal.timeout(10000)
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      content: data.body_html || '',
      thumbnail: data.cover_image || data.social_image || '',
      excerpt: data.description || ''
    }
  } catch { return null }
}

async function fetchReadability(url) {
  try {
    const html = await fetchHtml(url)
    if (!html) return null
    const { document } = parseHTML(html)
    const reader = new Readability(document)
    const article = reader.parse()
    if (!article?.content) return null
    return { content: article.content, excerpt: article.excerpt || '', thumbnail: '' }
  } catch { return null }
}

function extractSourceUrl(content) {
  const m = content.match(/Source: (https?:\/\/[^\s<"]+)/)
  return m ? m[1].replace(/\)$/, '') : null
}

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'))
let updated = 0, skipped = 0, failed = 0

for (const file of files) {
  const filePath = path.join(ARTICLES_DIR, file)
  const article = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  const plainText = article.content.replace(/<[^>]+>/g, '').trim()
  // Skip if already has real content (not just the source stub)
  if (plainText.length > 600 && !plainText.startsWith('🔗 Source:')) {
    skipped++
    continue
  }

  const srcUrl = extractSourceUrl(article.content)
  if (!srcUrl) { skipped++; continue }

  process.stdout.write(`Fetching: ${article.title.substring(0, 55).padEnd(55)} `)

  let result = null
  if (srcUrl.includes('dev.to/')) {
    result = await fetchDevTo(srcUrl)
  }
  if (!result || result.content.replace(/<[^>]+>/g,'').trim().length < 200) {
    result = await fetchReadability(srcUrl)
  }

  const contentLen = result?.content?.replace(/<[^>]+>/g,'').trim().length ?? 0

  if (result && contentLen > 200) {
    const sourceLink = `<p><a href="${srcUrl}" target="_blank" rel="noopener noreferrer">🔗 Read original article</a></p>\n`
    article.content = sourceLink + result.content
    if (!article.featuredImage && result.thumbnail) article.featuredImage = result.thumbnail
    if (result.excerpt) article.excerpt = result.excerpt.substring(0, 300)
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2))
    console.log(`✓ ${contentLen} chars`)
    updated++
  } else {
    console.log('✗ failed')
    failed++
  }

  await sleep(700)
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed`)
