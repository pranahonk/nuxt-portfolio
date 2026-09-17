import test from 'node:test'
import assert from 'node:assert/strict'
import jitiFactory from 'jiti'

globalThis.defineEventHandler = handler => handler
const jiti = jitiFactory(import.meta.url)
const { renderNotionBlocks } = jiti('../server/api/posts/[slug].ts')

test('renderNotionBlocks escapes content and preserves safe links', () => {
  const html = renderNotionBlocks([
    { type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'A & B' }] } },
    { type: 'paragraph', paragraph: { rich_text: [{ plain_text: '<script>', href: 'https://example.com' }] } },
  ])
  assert.match(html, /<h2>A &amp; B<\/h2>/)
  assert.match(html, /&lt;script&gt;/)
  assert.doesNotMatch(html, /<script>/)
})

test('renderNotionBlocks drops unsafe link protocols', () => {
  const html = renderNotionBlocks([
    { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'unsafe', href: 'javascript:alert(1)' }] } },
  ])
  assert.equal(html, '<p>unsafe</p>')
})
