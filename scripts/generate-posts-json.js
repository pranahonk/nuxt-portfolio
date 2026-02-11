const fs = require('fs');
const path = require('path');

// Read all articles
const articlesDir = path.join(__dirname, '../server/data/articles');
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

// Ensure public/api/posts directory exists
const postsDir = path.join(__dirname, '../public/api/posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

const postsList = [];

files.forEach(file => {
  const content = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf-8'));
  if (!content.published) return;

  // Add to list
  postsList.push({
    slug: content.slug,
    title: content.title,
    description: content.excerpt,
    created_at: content.createdAt,
    tags: content.tags || [],
    thumbnail: content.featuredImage ? [{ url: content.featuredImage }] : null
  });

  // Write individual post JSON
  const postData = {
    slug: content.slug,
    title: content.title,
    content: content.content,
    description: content.excerpt,
    created_at: content.createdAt,
    updated_at: content.updatedAt,
    tags: content.tags || [],
    thumbnail: content.featuredImage ? [{ url: content.featuredImage }] : null
  };
  fs.writeFileSync(path.join(postsDir, `${content.slug}.json`), JSON.stringify(postData));
});

// Sort by date and write posts list
postsList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
fs.writeFileSync(path.join(__dirname, '../public/api/posts.json'), JSON.stringify(postsList));

console.log('Generated public/api/posts.json with', postsList.length, 'posts');
console.log('Generated', postsList.length, 'individual post JSON files');
