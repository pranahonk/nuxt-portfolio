import { assertMissionControlSync } from '../../../../utils/mission-control-auth'
import { updateCommand } from '../../../../utils/mission-control-store'

export default defineEventHandler(async (event) => {
  assertMissionControlSync(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ state?: unknown; message?: unknown }>(event)
  if (body.state !== 'running' && body.state !== 'completed' && body.state !== 'failed') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid command state' })
  }
  if (body.message !== undefined && (typeof body.message !== 'string' || body.message.length > 500)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid command message' })
  }
  const command = await updateCommand(id || '', body.state, typeof body.message === 'string' ? body.message : undefined)
  return { command }
})
