const fs = require('fs');
const path = require('path');

// Read all articles
const articlesDir = path.join(__dirname, '../server/data/articles');
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

const postsList = [];

files.forEach(file => {
  const content = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf-8'));
  if (!content.published) return;

  postsList.push({
    slug: content.slug,
    title: content.title,
    description: content.excerpt,
    created_at: content.createdAt,
    tags: content.tags || [],
    thumbnail: content.featuredImage ? [{ url: content.featuredImage }] : null
  });
});

// Sort by date and write posts list
postsList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

const apiDir = path.join(__dirname, '../public/api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}
fs.writeFileSync(path.join(apiDir, 'posts.json'), JSON.stringify(postsList));

console.log('Generated public/api/posts.json with', postsList.length, 'posts');
