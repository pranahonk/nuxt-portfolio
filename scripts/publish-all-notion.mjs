import * as dotenv from 'dotenv'

dotenv.config()

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

const token = process.env.NOTION_TOKEN
const dbId = process.env.NOTION_TABLE_ID

async function makeAllPublic() {
  if (!token || !dbId) {
    console.error('Missing NOTION_TOKEN or NOTION_TABLE_ID in .env')
    process.exit(1)
  }

  console.log(`Querying database ${dbId} for unpublished pages...`)

  let cursor = undefined
  let pagesToUpdate = []

  do {
    const body = {
      page_size: 100,
      filter: {
        property: 'public',
        checkbox: { equals: false }
      }
    }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error('Failed to query database:', await res.text())
      process.exit(1)
    }

    const data = await res.json()
    pagesToUpdate.push(...(data.results || []))
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  console.log(`Found ${pagesToUpdate.length} unpublished pages. Updating...`)

  let updated = 0
  for (const page of pagesToUpdate) {
    try {
      const res = await fetch(`${NOTION_API}/pages/${page.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            public: { checkbox: true }
          }
        })
      })

      if (!res.ok) throw new Error(await res.text())

      updated++
      process.stdout.write('.') // Progress indicator

      // Notion API rate limit is ~3 requests per second
      await new Promise(r => setTimeout(r, 350))
    } catch (e) {
      console.error(`\nFailed to update page ${page.id}:`, e.message)
    }
  }

  console.log(`\n\nSuccessfully published ${updated}/${pagesToUpdate.length} pages.`)
}

makeAllPublic()