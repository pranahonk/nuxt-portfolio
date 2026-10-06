import { assertMissionControlSync } from '../../../utils/mission-control-auth'
import { readCommands } from '../../../utils/mission-control-store'

export default defineEventHandler(async (event) => {
  assertMissionControlSync(event)
  const staleCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const commands = (await readCommands()).filter(
    command => command.state === 'pending' || (command.state === 'running' && command.updatedAt < staleCutoff)
  )
  return { commands: commands.slice(0, 5) }
})
