const fs = require('fs')
const path = require('path')

const ARTICLES_DIR = path.join(__dirname, '../server/data/articles')
const OUTPUT = path.join(__dirname, '../server/data/articlesData.ts')

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'))
const articles = files.map(f => JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf-8')))

const content = `// Auto-generated file — run scripts/generate-articles-ts.js to update\nexport const articles = ${JSON.stringify(articles, null, 2)}\n`
fs.writeFileSync(OUTPUT, content)
console.log(`Generated articlesData.ts with ${articles.length} articles`)
