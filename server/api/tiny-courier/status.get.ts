import { assertMissionControlAuth } from '../../utils/mission-control-auth'
import { readCommands, readSnapshot } from '../../utils/mission-control-store'

export default defineEventHandler(async (event) => {
  assertMissionControlAuth(event)
  return {
    snapshot: await readSnapshot(),
    commands: (await readCommands()).slice(-20).reverse()
  }
})
