import { getStore } from '@netlify/blobs'

export interface StoredPost {
  slug: string
  title: string
  content: string
  thumbnail: string
  excerpt: string
  created_at: string
  tags: string[]
}

function openStore() {
  return getStore({ name: 'posts', consistency: 'strong' })
}

export async function getCachedPost(slug: string): Promise<StoredPost | null> {
  try {
    const store = openStore()
    const raw = await store.get(slug)
    if (!raw) return null
    return JSON.parse(raw) as StoredPost
  } catch {
    return null
  }
}

export async function setCachedPost(slug: string, post: StoredPost): Promise<void> {
  try {
    const store = openStore()
    await store.set(slug, JSON.stringify(post))
  } catch {
    // No Netlify context in local dev — graceful degradation
  }
}
