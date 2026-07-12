import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import jitiFactory from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jiti = jitiFactory(import.meta.url)
const { fetchNotionListing } = jiti(join(__dirname, '../server/utils/notion-listing.ts'))

test('fetchNotionListing returns [] when fetch fails', async () => {
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) })
  try {
    const result = await fetchNotionListing('token', 'db')
    assert.deepEqual(result, [])
  } finally {
    globalThis.fetch = origFetch
  }
})

test('fetchNotionListing maps and sorts pages newest-first', async () => {
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      results: [
        { id: '1', created_time: '2026-07-10T00:00:00Z', cover: null,
          properties: { title: { type: 'title', title: [{ plain_text: 'Older' }] },
            description: { type: 'rich_text', rich_text: [] },
            tags: { type: 'multi_select', multi_select: [] },
            created_at: { type: 'date', date: { start: '2026-07-10T00:00:00Z' } } } },
        { id: '2', created_time: '2026-07-12T00:00:00Z', cover: { external: { url: 'http://x/y.png' } },
          properties: { title: { type: 'title', title: [{ plain_text: 'Newer' }] },
            description: { type: 'rich_text', rich_text: [] },
            tags: { type: 'multi_select', multi_select: [] },
            created_at: { type: 'date', date: { start: '2026-07-12T00:00:00Z' } } } },
      ],
      has_more: false, next_cursor: null,
    }),
  })
  try {
    const result = await fetchNotionListing('token', 'db')
    assert.equal(result.length, 2)
    assert.equal(result[0].title, 'Newer')
    assert.deepEqual(result[0].thumbnail, [{ url: 'http://x/y.png' }])
    assert.equal(result[1].title, 'Older')
  } finally {
    globalThis.fetch = origFetch
  }
})
