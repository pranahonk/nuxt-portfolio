import { createHash } from 'node:crypto'

export type ArticleBlockPayload = { type: string, text: string }

export interface NormalizeArticleInput {
  title: string
  excerpt: string
  tags: string[]
  contentHash?: string
  linkedinCopy?: string
  notionBlocks?: Array<{ type: string, [key: string]: unknown }>
}

export interface NormalizedArticlePayload {
  title: string
  excerpt: string
  tags: string[]
  articleBlocks: ArticleBlockPayload[]
  linkedinCopy?: string
}

const HASH_BLOCK_TYPES = new Set([
  'paragraph',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'quote',
])

type RichTextNode = { plain_text?: string }

function richText(type: 'paragraph' | 'heading_2' | 'heading_3' | 'bulleted_list_item' | 'numbered_list_item' | 'quote', block): RichTextNode[] {
  return (block?.[type]?.rich_text ?? [])
}

export function normalizeArticlePayload(article: NormalizeArticleInput): NormalizedArticlePayload {
  const payload: NormalizedArticlePayload = {
    title: article.title,
    excerpt: article.excerpt,
    tags: [...article.tags],
    articleBlocks: [],
  }
  if (typeof article.linkedinCopy === 'string' && article.linkedinCopy) {
    payload.linkedinCopy = article.linkedinCopy
  }
  for (const block of article.notionBlocks ?? []) {
    const type = block.type
    if (!HASH_BLOCK_TYPES.has(type)) continue
    payload.articleBlocks.push({ type, text: richText(type, block).map((n) => n.plain_text ?? '').join('') })
  }
  return payload
}

export function canonicalContentPayload(payload: NormalizedArticlePayload): string {
  const canonical = {
    title: payload.title,
    excerpt: payload.excerpt,
    tags: payload.tags,
    articleBlocks: payload.articleBlocks,
    linkedinCopy: payload.linkedinCopy ?? '',
  }
  return JSON.stringify(canonical)
}

export function contentHash(payload: NormalizedArticlePayload): string {
  return createHash('sha256').update(canonicalContentPayload(payload), 'utf8').digest('hex')
}

export function buildHashVerification(article: NormalizeArticleInput): {
  content_hash: string
  computed_content_hash: string
} {
  const payload = normalizeArticlePayload(article)
  return {
    content_hash: article.contentHash ?? '',
    computed_content_hash: contentHash(payload),
  }
}