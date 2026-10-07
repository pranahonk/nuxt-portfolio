import { getStore } from '@netlify/blobs'
import { assertCommandTransition, commandKey } from './mission-control-validation.mjs'

export type MissionCommandType = 'pause' | 'resume' | 'run_now' | 'promote_ready' | 'move_backlog'
export type MissionCommandState = 'pending' | 'running' | 'completed' | 'failed'

export interface MissionCommand {
  id: string
  type: MissionCommandType
  issueNumber?: number
  state: MissionCommandState
  createdAt: string
  updatedAt: string
  message?: string
}

export interface MissionIde {
  relay: string
  url: string | null
  agents: Array<{ name: string; status: string; version?: string | null }>
  terminals: Array<{ name: string; command: string; path?: string | null }>
}

export interface MissionSystem {
  hostname: string
  uptimeSeconds: number
  load1: number
  load5: number
  load15: number
  cpus: number
  memTotal: number
  memUsed: number
  diskTotal: number
  diskUsed: number
}

export interface MissionTimer {
  unit: string
  activates?: string | null
  next?: string | null
  last?: string | null
  state: string
}

export type MissionOpencodeState = 'Working' | 'Waiting' | 'Stalled' | 'Idle'

export interface MissionOpencode {
  runActive: boolean
  activeAgent: string | null
  lastEvent: string | null
  logAgeSeconds: number | null
  mcpDown: string[]
  agents: Array<{
    name: string
    state: MissionOpencodeState | string
    mode?: string | null
    model?: string | null
    lastSeen?: string | null
  }>
}

export interface MissionSnapshot {
  generatedAt: string
  coordinator: {
    paused: boolean
    service: string
    timer: string
    nextRun: string | null
    activeRun: string | null
    lastResult: string
  }
  runners: Array<{ name: string; status: string; busy: boolean }>
  cards: Array<{ number: number; title: string; labels: string[]; url: string }>
  pullRequests: Array<{ number: number; title: string; state: string; branch: string; url: string; checks: string }>
  recentRuns: Array<{ name: string; conclusion: string; status: string; url: string; createdAt: string }>
  hosts: Array<{ name: string; role: string; status: string }>
  ide?: MissionIde
  system?: MissionSystem
  timers?: MissionTimer[]
  opencode?: MissionOpencode
  project?: {
    title: string
    url: string
    items: Array<{ number: number; title: string; labels: string[]; url: string; workflow: string; closed: boolean }>
  }
}

const STATUS_KEY = 'status'

function store() {
  return getStore({ name: 'tiny-courier-control', consistency: 'strong' })
}

export async function readSnapshot(): Promise<MissionSnapshot | null> {
  const raw = await store().get(STATUS_KEY)
  return raw ? JSON.parse(raw) as MissionSnapshot : null
}

export async function writeSnapshot(snapshot: MissionSnapshot): Promise<void> {
  await store().set(STATUS_KEY, JSON.stringify(snapshot))
}

export async function readCommands(): Promise<MissionCommand[]> {
  const commandStore = store()
  const { blobs } = await commandStore.list({ prefix: 'commands/' })
  const commands = await Promise.all(blobs.map(async ({ key }) => commandStore.get(key, { type: 'json' }) as Promise<MissionCommand>))
  return commands.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function createCommand(command: MissionCommand): Promise<void> {
  const result = await store().setJSON(commandKey(command.id), command, { onlyIfNew: true })
  if (!result.modified) throw createError({ statusCode: 409, statusMessage: 'Command already exists' })
}

export async function updateCommand(id: string, state: MissionCommandState, message?: string): Promise<MissionCommand> {
  const commandStore = store()
  const key = commandKey(id)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await commandStore.getWithMetadata(key, { type: 'json' }) as { data: MissionCommand; etag?: string } | null
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Command not found' })
    assertCommandTransition(current.data.state, state)
    const updated = { ...current.data, state, updatedAt: new Date().toISOString(), message }
    const result = await commandStore.setJSON(key, updated, { onlyIfMatch: current.etag })
    if (result.modified) return updated
  }
  throw createError({ statusCode: 409, statusMessage: 'Command changed concurrently; retry' })
}
