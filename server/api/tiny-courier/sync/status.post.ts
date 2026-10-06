import { assertMissionControlSync } from '../../../utils/mission-control-auth'
import { writeSnapshot } from '../../../utils/mission-control-store'
import { validateMissionSnapshot } from '../../../utils/mission-control-validation.mjs'

export default defineEventHandler(async (event) => {
  assertMissionControlSync(event)
  const snapshot = validateMissionSnapshot(await readBody(event))
  await writeSnapshot(snapshot)
  return { success: true }
})
