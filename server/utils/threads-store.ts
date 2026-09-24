import { getStore } from '@netlify/blobs'

export interface ThreadsTokenRecord {
  accessToken: string
  userId?: string
  username?: string
  expiresAt?: string
  updatedAt: string
}

const STORE_NAME = 'threads-oauth'
const TOKEN_KEY = 'primary'

export async function saveThreadsToken(record: ThreadsTokenRecord): Promise<void> {
  await getStore({ name: STORE_NAME, consistency: 'strong' }).set(TOKEN_KEY, JSON.stringify(record))
}
