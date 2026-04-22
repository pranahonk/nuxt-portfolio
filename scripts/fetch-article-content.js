#!/usr/bin/env node
/**
 * Fetches full article content for imported news articles.
 * - Dev.to URLs: uses the Dev.to REST API (returns clean body_html)
 * - All others: fetches page HTML + runs Mozilla Readability to extract main content
 */
// ESM wrapper — must run as module
// This file uses dynamic imports to handle ESM-only deps

const ARTICLES_DIR = path.join(__dirname, '../server/data/articles')

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(10000),
        ...options
      })
      return res
    } catch (e) {
      if (i === retries) throw e
      await sleep(1000)
    }
  }
}

async function fetchDevTo(articleUrl) {
  // https://dev.to/username/slug  →  GET /api/articles/username/slug
  const match = articleUrl.match(/dev\.to\/([^/]+)\/([^/?#]+)/)
  if (!match) return null
  const [, username, slug] = match
  try {
    const res = await fetchWithRetry(`https://dev.to/api/articles/${username}/${slug}`)
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
    const res = await fetchWithRetry(url)
    if (!res.ok) return null
    const html = await res.text()
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()
    if (!article || !article.content) return null
    return {
      content: article.content,
      excerpt: article.excerpt || '',
      thumbnail: ''
    }
  } catch { return null }
}

function extractSourceUrl(content) {
  const m = content.match(/Source: (https?:\/\/[^\s<"]+)/)
  return m ? m[1].replace(/\)$/, '') : null
}

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'))
  let updated = 0, skipped = 0, failed = 0

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file)
    const article = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Skip articles that already have real content (more than 500 chars beyond the source line)
    const strippedContent = article.content.replace(/<[^>]+>/g, '').trim()
    if (strippedContent.length > 500 && !strippedContent.startsWith('🔗 Source:')) {
      skipped++
      continue
    }

    const srcUrl = extractSourceUrl(article.content)
    if (!srcUrl) { skipped++; continue }

    process.stdout.write(`Fetching: ${article.title.substring(0, 55)}... `)

    let result = null
    if (srcUrl.includes('dev.to/')) {
      result = await fetchDevTo(srcUrl)
    }
    if (!result) {
      result = await fetchReadability(srcUrl)
    }

    if (result && result.content && result.content.replace(/<[^>]+>/g, '').trim().length > 200) {
      // Prepend source link to content
      const sourceLink = `<p><a href="${srcUrl}" target="_blank" rel="noopener noreferrer">🔗 Read original article</a></p>\n`
      article.content = sourceLink + result.content
      if (!article.featuredImage && result.thumbnail) article.featuredImage = result.thumbnail
      if (!article.excerpt && result.excerpt) article.excerpt = result.excerpt.substring(0, 300)
      fs.writeFileSync(filePath, JSON.stringify(article, null, 2))
      console.log(`✓ (${result.content.replace(/<[^>]+>/g,'').trim().length} chars)`)
      updated++
    } else {
      console.log('✗ could not extract content')
      failed++
    }

    await sleep(600)
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed`)
}

main().catch(console.error)
