import { Client } from '@notionhq/client'
import * as dotenv from 'dotenv'

dotenv.config()

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const dbId = process.env.NOTION_TABLE_ID

async function makeAllPublic() {
  if (!dbId) {
    console.error('Missing NOTION_TABLE_ID')
    process.exit(1)
  }

  console.log(`Querying database ${dbId} for unpublished pages...`)

  let cursor = undefined
  let pagesToUpdate = []

  do {
    const res = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      filter: {
        property: 'public',
        checkbox: {
          equals: false
        }
      }
    })

    pagesToUpdate.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)

  console.log(`Found ${pagesToUpdate.length} unpublished pages. Updating...`)

  let updated = 0
  for (const page of pagesToUpdate) {
    try {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          public: {
            checkbox: true
          }
        }
      })
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