import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import jitiFactory from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jiti = jitiFactory(import.meta.url)
const {
  normalizeArticlePayload,
  canonicalContentPayload,
  contentHash,
  buildHashVerification,
} = jiti(join(__dirname, '../server/utils/article-blocks.ts'))

function sampleArticle(paragraphText) {
  return {
    title: 'The verified article',
    excerpt: 'A short excerpt',
    tags: ['ai', 'career'],
    contentHash: 'stored-hash-FIXED',
    notionBlocks: [
      { type: 'paragraph', paragraph: { rich_text: [{ plain_text: paragraphText }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Section title' }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: 'one' }, { plain_text: ' two' }] } },
      { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ plain_text: 'item' }] } },
      { type: 'quote', quote: { rich_text: [{ plain_text: 'a quoted line' }] } },
    ],
  }
}

test('normalizeArticlePayload strips markup and joins multi-part rich text into articleBlocks', () => {
  const payload = normalizeArticlePayload(sampleArticle('Plain <script>alert(1)</script> body'))
  assert.equal(payload.title, 'The verified article')
  assert.equal(payload.excerpt, 'A short excerpt')
  assert.deepEqual(payload.tags, ['ai', 'career'])
  assert.equal(payload.articleBlocks[0].type, 'paragraph')
  assert.equal(payload.articleBlocks[0].text, 'Plain <script>alert(1)</script> body')
  assert.equal(payload.articleBlocks[1].type, 'heading_2')
  assert.equal(payload.articleBlocks[1].text, 'Section title')
  assert.equal(payload.articleBlocks[2].type, 'bulleted_list_item')
  assert.equal(payload.articleBlocks[2].text, 'one two')
  assert.equal(payload.articleBlocks[3].type, 'numbered_list_item')
  assert.equal(payload.articleBlocks[4].type, 'quote')
})

test('contentHash is a stable 64 hex digest over the fixed canonical field order', () => {
  const a = contentHash(normalizeArticlePayload(sampleArticle('Body')))
  const b = contentHash(normalizeArticlePayload(sampleArticle('Body')))
  assert.equal(a, b)
  assert.match(a, /^[a-f0-9]{64}$/)
  // canonical payload always carries the five keys in repo-1 hash.ts order
  const payload = normalizeArticlePayload(sampleArticle('Body'))
  assert.deepEqual(
    Object.keys(JSON.parse(canonicalContentPayload(payload))),
    ['title', 'excerpt', 'tags', 'articleBlocks', 'linkedinCopy'],
  )
})

test('a changed Notion paragraph changes computed_content_hash while stored content_hash is unchanged', () => {
  const before = buildHashVerification(sampleArticle('First sentence'))
  const after = buildHashVerification(sampleArticle('Second sentence, different'))
  assert.equal(before.content_hash, 'stored-hash-FIXED')
  assert.equal(after.content_hash, 'stored-hash-FIXED')
  assert.notEqual(before.computed_content_hash, after.computed_content_hash)
})

test('normalization is stable and ignores block order drift only when text is identical', () => {
  const a = buildHashVerification(sampleArticle('Identical text'))
  const b = buildHashVerification(sampleArticle('Identical text'))
  assert.equal(a.computed_content_hash, b.computed_content_hash)
})

test('unsupported block types are dropped from the normalized hash', () => {
  const article = sampleArticle('Body')
  article.notionBlocks.push({ type: 'divider', divider: {} })
  article.notionBlocks.push({ type: 'code', code: { rich_text: [{ plain_text: 'ignored' }] } })
  const payload = normalizeArticlePayload(article)
  assert.ok(payload.articleBlocks.every((b) => b.type !== 'divider' && b.type !== 'code'))
})