import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import jitiFactory from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jiti = jitiFactory(import.meta.url)
const {
  sanitizeRemoteHtml,
  isSafeRemoteUrl,
  buildSafeSourceLink,
  getNotionCoverUrl,
} = jiti(join(__dirname, '../server/utils/content-security.ts'))

test('sanitizeRemoteHtml removes script tags, inline handlers, and dangerous URL schemes', () => {
  const dirty = '<div><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">click</a><a href=javascript:alert(2)>click2</a><img src="data:text/html,<script>alert(3)</script>"><p>safe</p></div>'
  const clean = sanitizeRemoteHtml(dirty)

  assert.equal(clean.includes('<script'), false)
  assert.equal(clean.includes('onerror='), false)
  assert.equal(clean.includes('javascript:'), false)
  assert.equal(clean.includes('data:text/html'), false)
  assert.equal(clean.includes('<p>safe</p>'), true)
})

test('isSafeRemoteUrl accepts public https URLs and rejects local/private targets', () => {
  assert.equal(isSafeRemoteUrl('https://dev.to/user/post'), true)
  assert.equal(isSafeRemoteUrl('https://example.com/article'), true)
  assert.equal(isSafeRemoteUrl('http://127.0.0.1/admin'), false)
  assert.equal(isSafeRemoteUrl('http://localhost:3000'), false)
  assert.equal(isSafeRemoteUrl('http://169.254.169.254/latest/meta-data'), false)
  assert.equal(isSafeRemoteUrl('http://10.0.0.5/internal'), false)
  assert.equal(isSafeRemoteUrl('javascript:alert(1)'), false)
  assert.equal(isSafeRemoteUrl('data:text/html,<script>alert(1)</script>'), false)
})

test('buildSafeSourceLink returns safe markup for valid URLs and empty string for unsafe ones', () => {
  assert.equal(
    buildSafeSourceLink('https://dev.to/user/post').startsWith('<p><a href="https://dev.to/user/post"'),
    true,
  )
  assert.equal(buildSafeSourceLink('javascript:alert(1)'), '')
  assert.equal(buildSafeSourceLink('http://127.0.0.1/test'), '')
})

test('getNotionCoverUrl reads top-level cover from Notion pages', () => {
  const page = {
    cover: {
      external: { url: 'https://cdn.example.com/cover.png' },
    },
    properties: {},
  }

  assert.equal(getNotionCoverUrl(page), 'https://cdn.example.com/cover.png')
})
