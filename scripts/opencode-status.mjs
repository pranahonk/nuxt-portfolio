// opencode-status — derive live OpenCode role-agent state for Mission Room.
//
// Reads an OpenCode log plus the role definition files and returns one block:
// which role is active, what it last did, how long the log has been quiet,
// which MCP servers failed, and a state for every defined role.
//
// ponytail: state is inferred from the log tail — there is no OpenCode status
// API on the VPS box. Working/Stalled are gated on a live `opencode run`
// process; without one every role is Idle (the last log line is history).
// staleSeconds is the one knob: raise it if a run can stream nothing for longer.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const OC_STATES = ['Working', 'Waiting', 'Stalled', 'Idle']

function parseLines(logText) {
  const events = []
  for (const line of logText.split('\n')) {
    if (!line.startsWith('timestamp=')) continue
    const ts = /^timestamp=(\S+)/.exec(line)?.[1]
    const epoch = ts ? Date.parse(ts) : NaN
    if (Number.isNaN(epoch)) continue
    const message = line.slice(line.indexOf('message=') + 8)
    const agent = /(?:^|\s)agent=([A-Za-z0-9_-]+)/.exec(line)?.[1] ?? null
    const mcp = /server unavailable/.test(message)
      ? /key=(\S+)/.exec(message)?.[1] ?? null
      : null
    events.push({ epoch, message: message.replace(/^"/, ''), agent, mcp })
  }
  return events
}

export function readAgentFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const text = readFileSync(join(dir, name), 'utf8')
      return {
        name: name.slice(0, -3),
        mode: /^mode:[ \t]*(.+)$/m.exec(text)?.[1]?.trim() ?? null,
        model: /^model:[ \t]*(.+)$/m.exec(text)?.[1]?.trim() ?? null
      }
    })
}

// A coordinated run spawns `opencode run …` (argv[1]==='run'). The 49-IDE tmux
// TUI is also an `opencode` process, so match on argv, not the binary name, and
// read /proc directly — pgrep would also match the shell running the command.
export function scanLiveRun() {
  try {
    for (const pid of readdirSync('/proc')) {
      if (!/^\d+$/.test(pid)) continue
      let argv
      try {
        argv = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean)
      } catch {
        continue
      }
      if (/(^|\/)opencode$/.test(argv[0] ?? '') && argv.includes('run')) return true
    }
  } catch {
    return false
  }
  return false
}

export function deriveOpencodeStatus({ logText, agentFiles = [], nowMs = Date.now(), staleSeconds = 300, runActive = false }) {
  const events = parseLines(logText)
  const last = events.at(-1) ?? null
  const logAgeSeconds = last ? Math.max(0, Math.round((nowMs - last.epoch) / 1000)) : null
  const activeAgent = runActive ? [...events].reverse().find((e) => e.agent)?.agent ?? null : null
  const lastEvent = !last ? null
    : /^asking\b/.test(last.message) ? 'asking'
    : /^exiting loop\b/.test(last.message) ? 'exited'
    : 'active'
  const mcpDown = [...new Set(events.map((e) => e.mcp).filter(Boolean))]

  const lastSeenOf = (name) => {
    const hit = [...events].reverse().find((e) => e.agent === name)
    return hit ? new Date(hit.epoch).toISOString() : null
  }

  const agents = agentFiles.map(({ name, mode, model }) => {
    const lastSeen = lastSeenOf(name)
    const age = lastSeen ? (nowMs - Date.parse(lastSeen)) / 1000 : null
    let state
    // No live run → every role is Idle regardless of what the log last said.
    if (!runActive) state = 'Idle'
    else if (lastSeen === null) state = 'Idle'
    else if (name === activeAgent) {
      state = lastEvent === 'asking' ? 'Waiting'
        : lastEvent === 'exited' ? 'Idle'
        : logAgeSeconds !== null && logAgeSeconds > staleSeconds ? 'Stalled'
        : 'Working'
    } else if (age !== null && age < staleSeconds) state = 'Working'
    else state = 'Idle'
    return { name, state, mode: mode ?? undefined, model: model ?? undefined, lastSeen: lastSeen ?? undefined }
  })

  return {
    runActive,
    activeAgent,
    lastEvent,
    logAgeSeconds,
    mcpDown,
    agents,
    coverage: { defined: agentFiles.length, active: agents.filter((a) => a.state === 'Working').length }
  }
}

function main() {
  const logPath = process.env.OPENCODE_LOG || '/home/ubuntu/tiny-courier-control/opencode-data/opencode/log/opencode.log'
  const agentsDir = process.env.AGENTS_DIR || '/home/ubuntu/tiny-courier-control/repo/.opencode/agents'
  const staleSeconds = Number(process.env.STALE_SECONDS || 300)
  const empty = { runActive: false, activeAgent: null, lastEvent: null, logAgeSeconds: null, mcpDown: [], agents: [] }
  if (!existsSync(logPath)) return process.stdout.write(JSON.stringify({ ...empty, error: 'log-missing' }) + '\n')
  const logText = readFileSync(logPath, 'utf8')
  const runActive = scanLiveRun()
  const out = deriveOpencodeStatus({ logText, agentFiles: readAgentFiles(agentsDir), staleSeconds, runActive })
  process.stdout.write(JSON.stringify(out) + '\n')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
