import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import jitiFactory from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jiti = jitiFactory(import.meta.url)

// paginate is a pure helper; installing Nuxt globals lets the module load
// (its `export default defineEventHandler(...)` is evaluated at import time).
globalThis.defineEventHandler = (handler) => handler

// Pure paginate helper is exported for unit testing.
const { paginate } = jiti(join(__dirname, '../server/api/posts/index.ts'))

const list = Array.from({ length: 25 }, (_, i) => ({
  slug: `s${i}`, title: `T${i}`, description: '', created_at: '2026-07-12T00:00:00.000Z', tags: [], thumbnail: null,
}))

test('paginate returns first page slice with hasMore true', () => {
  const r = paginate(list, 1, 10)
  assert.equal(r.posts.length, 10)
  assert.equal(r.total, 25)
  assert.equal(r.hasMore, true)
  assert.equal(r.posts[0].slug, 's0')
})

test('paginate returns last partial page with hasMore false', () => {
  const r = paginate(list, 3, 10)
  assert.equal(r.posts.length, 5)
  assert.equal(r.hasMore, false)
  assert.equal(r.posts[0].slug, 's20')
})

test('paginate clamps invalid page/limit to defaults', () => {
  const r = paginate(list, 0, -5)
  assert.equal(r.posts.length, 10)
  assert.equal(r.posts[0].slug, 's0')
})
