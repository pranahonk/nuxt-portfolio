import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import jitiFactory from 'jiti'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jiti = jitiFactory(import.meta.url)
const NOTION_DB_ID = 'db-123'
const NOTION_DB_URL = `https://api.notion.com/v1/databases/${NOTION_DB_ID}`
const NOTION_QUERY_URL = `${NOTION_DB_URL}/query`

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function installNuxtGlobals() {
  globalThis.defineEventHandler = (handler) => handler
  globalThis.useRuntimeConfig = () => ({
    cronSecret: 'secret',
    notionToken: 'token',
    public: { notionTableId: NOTION_DB_ID },
  })
  globalThis.getHeader = (event, name) => event.headers?.[name]
  globalThis.createError = ({ statusCode, statusMessage }) =>
    Object.assign(new Error(statusMessage), { statusCode, statusMessage })
}

function buildPage(properties) {
  return { properties }
}

function setFetchMock({
  notionResults = [],
  notionSchemaProperties = null,
  notionSchemaResponse = null,
}) {
  globalThis.fetch = async (url, options = {}) => {
    if (url === 'https://hacker-news.firebaseio.com/v0/topstories.json') {
      return jsonResponse([])
    }

    if (typeof url === 'string' && url.startsWith('https://dev.to/api/articles?')) {
      return jsonResponse([])
    }

    if (url === NOTION_QUERY_URL && options.method === 'POST') {
      return jsonResponse({
        results: notionResults,
        has_more: false,
        next_cursor: null,
      })
    }

    if (url === NOTION_DB_URL && notionSchemaResponse) {
      return notionSchemaResponse
    }

    if (url === NOTION_DB_URL && notionSchemaProperties) {
      return jsonResponse({ properties: notionSchemaProperties })
    }

    throw new Error(`Unhandled fetch in test: ${url}`)
  }
}

function textResponse(body, status) {
  return new Response(body, { status })
}

installNuxtGlobals()
const syncHandler = jiti(join(__dirname, '../server/api/news/sync.post.ts')).default

async function runSync() {
  return syncHandler({ headers: { authorization: 'Bearer secret' } })
}

test('news sync succeeds when existing rows use source_url', async () => {
  setFetchMock({
    notionResults: [
      buildPage({
        source_url: { type: 'url', url: 'https://example.com/post-1' },
        title: { title: [{ plain_text: 'Existing post' }] },
      }),
    ],
  })

  const result = await runSync()

  assert.equal(result.added, 0)
  assert.equal(result.total, 0)
})

test('news sync succeeds when existing rows use Source URL', async () => {
  setFetchMock({
    notionResults: [
      buildPage({
        'Source URL': { type: 'url', url: 'https://example.com/post-2' },
        title: { title: [{ plain_text: 'Existing post' }] },
      }),
    ],
  })

  const result = await runSync()

  assert.equal(result.added, 0)
  assert.equal(result.total, 0)
})

test('news sync succeeds when the database has a single arbitrary url property', async () => {
  setFetchMock({
    notionResults: [
      buildPage({
        'Article URL': { type: 'url', url: 'https://example.com/post-3' },
        title: { title: [{ plain_text: 'Existing post' }] },
      }),
    ],
  })

  const result = await runSync()

  assert.equal(result.added, 0)
  assert.equal(result.total, 0)
})

test('news sync succeeds on empty databases when schema has a single arbitrary url property', async () => {
  setFetchMock({
    notionResults: [],
    notionSchemaProperties: {
      'Article URL': { type: 'url' },
    },
  })

  const result = await runSync()

  assert.equal(result.added, 0)
  assert.equal(result.total, 0)
})

test('news sync fails clearly when multiple arbitrary url properties exist', async () => {
  setFetchMock({
    notionResults: [
      buildPage({
        'Article URL': { type: 'url', url: 'https://example.com/post-4' },
        Link: { type: 'url', url: 'https://example.com/post-4-alt' },
        title: { title: [{ plain_text: 'Existing post' }] },
      }),
    ],
  })

  await assert.rejects(
    runSync(),
    (error) => {
      assert.equal(error.statusCode, 500)
      assert.match(error.statusMessage, /multiple url properties/i)
      assert.match(error.statusMessage, /Article URL/)
      assert.match(error.statusMessage, /Link/)
      return true
    },
  )
})

test('news sync surfaces schema fetch failures instead of pretending the url column is missing', async () => {
  setFetchMock({
    notionResults: [],
    notionSchemaResponse: textResponse('{"code":"restricted_resource","message":"schema read denied"}', 403),
  })

  await assert.rejects(
    runSync(),
    (error) => {
      assert.equal(error.statusCode, 500)
      assert.match(error.statusMessage, /Notion schema API returned 403/)
      assert.match(error.statusMessage, /restricted_resource/)
      return true
    },
  )
})

test('news sync reports observed properties when existing rows have no url field', async () => {
  setFetchMock({
    notionResults: [
      buildPage({
        title: { type: 'title', title: [{ plain_text: 'Existing post' }] },
        description: { type: 'rich_text', rich_text: [] },
        public: { type: 'checkbox', checkbox: true },
      }),
    ],
  })

  await assert.rejects(
    runSync(),
    (error) => {
      assert.equal(error.statusCode, 500)
      assert.match(error.statusMessage, /detected properties/i)
      assert.match(error.statusMessage, /title:title/)
      assert.match(error.statusMessage, /description:rich_text/)
      assert.match(error.statusMessage, /public:checkbox/)
      return true
    },
  )
})
