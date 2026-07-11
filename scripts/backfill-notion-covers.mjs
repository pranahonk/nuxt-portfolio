import * as dotenv from 'dotenv'

dotenv.config()

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'
const FETCH_TIMEOUT_MS = 5000
const NOTION_RATE_LIMIT_MS = 350

const token = process.env.NOTION_TOKEN
const dbId = process.env.NOTION_TABLE_ID
const onlyPageId = process.argv[2] || null

if (!token || !dbId) {
  console.error('Missing NOTION_TOKEN or NOTION_TABLE_ID in .env')
  process.exit(1)
}

async function notionFetch(path, init = {}) {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  return res
}

async function fetchAllPublicPages() {
  const pages = []
  let cursor
  do {
    const body = {
      page_size: 100,
      filter: {
        property: 'public',
        checkbox: { equals: true },
      },
    }
    if (cursor) body.start_cursor = cursor

    const res = await notionFetch(`/databases/${dbId}/query`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Notion query failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    for (const p of data.results || []) pages.push(p)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)
  return pages
}

function hasCover(page) {
  return !!(page?.cover?.external?.url || page?.cover?.file?.url)
}

async function getSourceUrlFromPage(pageId) {
  const res = await notionFetch(`/blocks/${pageId}/children?page_size=10`)
  if (!res.ok) return null
  const data = await res.json()
  for (const block of data.results || []) {
    if (block.type !== 'paragraph') continue
    const rt = block.paragraph?.rich_text || []
    const linkUrl = rt[1]?.text?.link?.url || rt[1]?.href || null
    if (linkUrl) return linkUrl
    for (const node of rt) {
      const u = node?.text?.link?.url || node?.href || null
      if (u) return u
    }
  }
  return null
}

async function fetchWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'prana-portfolio/backfill-covers-script',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    return res
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

async function extractOgImage(sourceUrl) {
  const res = await fetchWithTimeout(sourceUrl, FETCH_TIMEOUT_MS)
  if (!res || !res.ok) return null
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('text/html') && !ct.includes('application/xhtml')) return null
  const html = await res.text()
  const m1 = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
  const m2 = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  const url = m1?.[1] || m2?.[1] || null
  if (!url) return null
  try {
    return new URL(url, sourceUrl).toString()
  } catch {
    return null
  }
}

async function patchNotionCover(pageId, imageUrl) {
  const res = await notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      cover: { type: 'external', external: { url: imageUrl } },
    }),
  })
  return res.ok
}

async function main() {
  let pages = await fetchAllPublicPages()
  if (onlyPageId) pages = pages.filter((p) => p.id.replace(/-/g, '') === onlyPageId.replace(/-/g, ''))
  const target = pages.filter((p) => !hasCover(p))

  console.log(`Public pages scanned: ${pages.length}`)
  console.log(`Pages without cover: ${target.length}`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const page of target) {
    try {
      const sourceUrl = await getSourceUrlFromPage(page.id)
      if (!sourceUrl) {
        skipped++
        continue
      }
      const ogImage = await extractOgImage(sourceUrl)
      if (!ogImage) {
        skipped++
        continue
      }
      const ok = await patchNotionCover(page.id, ogImage)
      if (ok) updated++
      else errors++
      process.stdout.write('.')
      await new Promise((r) => setTimeout(r, NOTION_RATE_LIMIT_MS))
    } catch (err) {
      errors++
      console.error(`\nFailed page ${page.id}: ${err?.message || err}`)
    }
  }

  console.log(`\nUpdated=${updated} Skipped=${skipped} Errors=${errors}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
