import test from 'node:test'
import assert from 'node:assert/strict'
import { htmlToBlocks, normalizeLinkedInHashtags, publicationKey, selectTopic, slugify, topics } from '../scripts/daily-article.mjs'

test('selectTopic avoids recently used topics until the rotation is exhausted', () => {
  const selected = selectTopic(topics.slice(0, -1), new Date('2026-09-17T00:00:00Z'))
  assert.equal(selected, topics.at(-1))
})

test('slugify produces a stable URL segment', () => {
  assert.equal(slugify('Senior Roles: What Companies Say'), 'senior-roles-what-companies-say')
})

test('publicationKey separates the two Asia/Jakarta publication slots', () => {
  assert.equal(publicationKey(new Date('2026-09-16T22:30:00Z')), '2026-09-17-0530')
  assert.equal(publicationKey(new Date('2026-09-17T10:30:00Z')), '2026-09-17-1730')
})

test('htmlToBlocks creates native article blocks and linked sources', () => {
  const blocks = htmlToBlocks('<p>Intro</p><h2>Reality</h2><p>Details</p>', [{ title: 'Evidence', url: 'https://example.com' }])
  assert.equal(blocks[0].type, 'paragraph')
  assert.equal(blocks[1].type, 'heading_2')
  assert.equal(blocks.at(-1).bulleted_list_item.rich_text[0].text.link.url, 'https://example.com')
})

test('normalizeLinkedInHashtags adds 6-9 specific hashtags and removes generic tags', () => {
  const copy = normalizeLinkedInHashtags('Summary #AI #Technology #RemoteWork')
  const hashtags = copy.match(/#[A-Za-z0-9_-]+/g) ?? []
  assert.ok(hashtags.length >= 6 && hashtags.length <= 9)
  assert.equal(hashtags.includes('#AI'), false)
  assert.equal(hashtags.includes('#Technology'), false)
  assert.ok(hashtags.includes('#IndonesianDevelopers'))
})
