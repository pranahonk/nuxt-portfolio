import { assertMissionControlAuth, assertMissionControlOrigin, clearMissionControlSession } from '../../../utils/mission-control-auth'

export default defineEventHandler((event) => {
  assertMissionControlAuth(event)
  assertMissionControlOrigin(event)
  clearMissionControlSession(event)
  return { success: true }
})
