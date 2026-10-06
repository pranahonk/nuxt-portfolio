import { assertMissionControlAuth } from '../../../utils/mission-control-auth'

export default defineEventHandler((event) => {
  try {
    assertMissionControlAuth(event)
    return { authenticated: true }
  } catch {
    return { authenticated: false }
  }
})
