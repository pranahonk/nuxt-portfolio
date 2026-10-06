import { randomUUID } from 'node:crypto'
import { assertMissionControlAuth, assertMissionControlOrigin } from '../../utils/mission-control-auth'
import { createCommand, type MissionCommandType } from '../../utils/mission-control-store'

const commandTypes = new Set<MissionCommandType>(['pause', 'resume', 'run_now', 'promote_ready', 'move_backlog'])

export default defineEventHandler(async (event) => {
  assertMissionControlAuth(event)
  assertMissionControlOrigin(event)
  const body = await readBody<{ type?: unknown; issueNumber?: unknown }>(event)
  if (typeof body?.type !== 'string' || !commandTypes.has(body.type as MissionCommandType)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported command' })
  }
  const issueCommand = body.type === 'promote_ready' || body.type === 'move_backlog'
  const issueNumber = Number(body.issueNumber)
  if (issueCommand && (!Number.isSafeInteger(issueNumber) || issueNumber < 1 || issueNumber > 1_000_000)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid issue number required' })
  }

  const now = new Date().toISOString()
  const command = {
    id: randomUUID(),
    type: body.type as MissionCommandType,
    ...(issueCommand ? { issueNumber } : {}),
    state: 'pending' as const,
    createdAt: now,
    updatedAt: now
  }
  await createCommand(command)
  return { command }
})
