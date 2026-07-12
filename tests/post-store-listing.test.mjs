import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import jitiFactory from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jiti = jitiFactory(import.meta.url)

const { getPostListing, setPostListing } = jiti(join(__dirname, '../server/utils/post-store.ts'))

test('getPostListing returns null outside Netlify context (graceful)', async () => {
  const result = await getPostListing()
  assert.equal(result, null)
})

test('setPostListing does not throw outside Netlify context', async () => {
  await assert.doesNotReject(setPostListing([], 300))
})
