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

const LISTING_KEY = 'posts:listing'

export interface PostSummary {
  slug: string
  title: string
  description: string
  created_at: string
  tags: string[]
  thumbnail: Array<{ url: string }> | null
}

export async function setPostListing(posts: PostSummary[], ttlSeconds: number): Promise<void> {
  try {
    const store = openStore()
    const envelope = { posts, expiresAt: Date.now() + ttlSeconds * 1000 }
    await store.set(LISTING_KEY, JSON.stringify(envelope))
  } catch {
    // No Netlify context in local dev — graceful degradation.
  }
}

export async function getPostListing(): Promise<PostSummary[] | null> {
  try {
    const store = openStore()
    const raw = await store.get(LISTING_KEY)
    if (!raw) return null
    const env = JSON.parse(raw) as { posts: PostSummary[]; expiresAt: number }
    if (!env.expiresAt || Date.now() > env.expiresAt) return null
    return env.posts
  } catch {
    return null
  }
}
