const GITHUB_HOST = 'github.com'
const MAX_TEXT = 240

function fail(message) {
  const error = new Error(message)
  error.statusCode = 400
  throw error
}

function text(value, name, max = MAX_TEXT) {
  if (typeof value !== 'string' || value.length < 1 || value.length > max) fail(`Invalid ${name}`)
  return value
}

function optionalText(value, name, max = MAX_TEXT) {
  if (value === null || value === undefined || value === '') return null
  return text(value, name, max)
}

function integer(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000_000_000) fail(`Invalid ${name}`)
  return value
}

// Byte sizes and uptimes exceed the 1e9 cap that guards card/PR numbers.
function bigInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000_000_000_000_000) fail(`Invalid ${name}`)
  return value
}

function number(value, name, max = 1_000_000) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) fail(`Invalid ${name}`)
  return value
}

function optionalHttpUrl(value, name) {
  if (value === null || value === undefined || value === '') return null
  const raw = text(value, name, 2048)
  let url
  try {
    url = new URL(raw)
  } catch {
    fail(`Invalid ${name}`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') fail(`Invalid ${name}`)
  if (url.username || url.password) fail(`Invalid ${name}`)
  return url.toString()
}

function isoDate(value, name) {
  const raw = text(value, name, 64)
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) fail(`Invalid ${name}`)
  return date.toISOString()
}

function array(value, name, max = 100) {
  if (!Array.isArray(value) || value.length > max) fail(`Invalid ${name}`)
  return value
}

export function parseGitHubUrl(value, name = 'GitHub URL') {
  const raw = text(value, name, 2048)
  let url
  try {
    url = new URL(raw)
  } catch {
    fail(`Invalid ${name}`)
  }
  if (url.protocol !== 'https:' || url.hostname !== GITHUB_HOST || url.username || url.password) fail(`Invalid ${name}`)
  return url.toString()
}

export function validateMissionSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Invalid snapshot')
  const generatedAt = isoDate(value.generatedAt, 'generatedAt')

  const coordinator = value.coordinator
  if (!coordinator || typeof coordinator !== 'object' || typeof coordinator.paused !== 'boolean') fail('Invalid coordinator')

  const ide = optionalIde(value.ide)
  const system = optionalSystem(value.system)
  const timers = optionalTimers(value.timers)
  const opencode = optionalOpencode(value.opencode)
  const project = optionalProject(value.project)

  return {
    generatedAt,
    coordinator: {
      paused: coordinator.paused,
      service: text(coordinator.service, 'coordinator service'),
      timer: text(coordinator.timer, 'coordinator timer'),
      nextRun: optionalText(coordinator.nextRun, 'next run', 160),
      activeRun: optionalText(coordinator.activeRun, 'active run', 160),
      lastResult: text(coordinator.lastResult, 'last result')
    },
    ...(ide === undefined ? {} : { ide }),
    ...(system === undefined ? {} : { system }),
    ...(timers === undefined ? {} : { timers }),
    ...(opencode === undefined ? {} : { opencode }),
    ...(project === undefined ? {} : { project }),
    runners: array(value.runners, 'runners', 20).map((runner) => ({
      name: text(runner?.name, 'runner name'),
      status: text(runner?.status, 'runner status', 40),
      busy: typeof runner?.busy === 'boolean' ? runner.busy : fail('Invalid runner busy state')
    })),
    cards: array(value.cards, 'cards').map((card) => ({
      number: integer(card?.number, 'card number'),
      title: text(card?.title, 'card title'),
      labels: array(card?.labels, 'card labels', 30).map((label) => text(label, 'label', 80)),
      url: parseGitHubUrl(card?.url, 'card URL')
    })),
    pullRequests: array(value.pullRequests, 'pull requests').map((pr) => ({
      number: integer(pr?.number, 'pull request number'),
      title: text(pr?.title, 'pull request title'),
      state: text(pr?.state, 'pull request state', 40),
      branch: text(pr?.branch, 'pull request branch'),
      url: parseGitHubUrl(pr?.url, 'pull request URL'),
      checks: text(pr?.checks, 'pull request checks', 40)
    })),
    recentRuns: array(value.recentRuns, 'recent runs', 50).map((run) => ({
      name: text(run?.name, 'run name'),
      conclusion: typeof run?.conclusion === 'string' ? run.conclusion.slice(0, 40) : '',
      status: text(run?.status, 'run status', 40),
      url: parseGitHubUrl(run?.url, 'run URL'),
      createdAt: isoDate(run?.createdAt, 'run createdAt')
    })),
    hosts: array(value.hosts, 'hosts', 20).map((host) => ({
      name: text(host?.name, 'host name'),
      role: text(host?.role, 'host role'),
      status: text(host?.status, 'host status', 40)
    }))
  }
}

function optionalProject(value) {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Invalid project')
  return {
    title: text(value.title, 'project title'),
    url: parseGitHubUrl(value.url, 'project URL'),
    items: array(value.items, 'project items').map((item) => ({
      number: integer(item?.number, 'project item number'),
      title: text(item?.title, 'project item title'),
      labels: array(item?.labels, 'project item labels', 30).map((label) => text(label, 'project item label', 80)),
      url: parseGitHubUrl(item?.url, 'project item URL'),
      workflow: text(item?.workflow, 'project item workflow', 40),
      closed: typeof item?.closed === 'boolean' ? item.closed : fail('Invalid project item closed state')
    }))
  }
}

// Optional blocks. A snapshot from an older VPS sync lacks these, so absence
// must stay valid; when present they are validated as strictly as the rest.
function optionalIde(value) {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Invalid ide')
  return {
    relay: text(value.relay, 'ide relay', 40),
    url: optionalHttpUrl(value.url, 'ide url'),
    agents: array(value.agents, 'ide agents', 20).map((agent) => ({
      name: text(agent?.name, 'ide agent name'),
      status: text(agent?.status, 'ide agent status', 40),
      version: optionalText(agent?.version, 'ide agent version', 40)
    })),
    terminals: array(value.terminals, 'ide terminals', 20).map((terminal) => ({
      name: text(terminal?.name, 'ide terminal name'),
      command: text(terminal?.command, 'ide terminal command', 80),
      path: optionalText(terminal?.path, 'ide terminal path', 240)
    }))
  }
}

function optionalSystem(value) {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Invalid system')
  return {
    hostname: text(value.hostname, 'system hostname', 120),
    uptimeSeconds: bigInteger(value.uptimeSeconds, 'system uptime'),
    load1: number(value.load1, 'system load1'),
    load5: number(value.load5, 'system load5'),
    load15: number(value.load15, 'system load15'),
    cpus: integer(value.cpus, 'system cpus'),
    memTotal: bigInteger(value.memTotal, 'system memTotal'),
    memUsed: bigInteger(value.memUsed, 'system memUsed'),
    diskTotal: bigInteger(value.diskTotal, 'system diskTotal'),
    diskUsed: bigInteger(value.diskUsed, 'system diskUsed')
  }
}

function optionalTimers(value) {
  if (value === undefined) return undefined
  return array(value, 'timers', 40).map((timer) => ({
    unit: text(timer?.unit, 'timer unit', 160),
    activates: optionalText(timer?.activates, 'timer activates', 160),
    next: optionalText(timer?.next, 'timer next', 64),
    last: optionalText(timer?.last, 'timer last', 64),
    state: text(timer?.state, 'timer state', 40)
  }))
}

// OpenCode live-run view. Optional so a snapshot from an older VPS sync stays
// valid; the probe emits {} when the log or node is missing, which is why the
// inner fields are optional and arrays degrade to empty rather than failing.
function optionalOpencode(value) {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Invalid opencode')
  return {
    runActive: value.runActive === true,
    activeAgent: optionalText(value.activeAgent, 'opencode active agent', 80),
    lastEvent: optionalText(value.lastEvent, 'opencode last event', 40),
    logAgeSeconds: value.logAgeSeconds === null || value.logAgeSeconds === undefined
      ? null
      : integer(value.logAgeSeconds, 'opencode log age'),
    mcpDown: array(value.mcpDown ?? [], 'opencode mcpDown', 40).map((name) => text(name, 'opencode mcp name', 80)),
    agents: array(value.agents ?? [], 'opencode agents', 40).map((agent) => ({
      name: text(agent?.name, 'opencode agent name', 80),
      state: text(agent?.state, 'opencode agent state', 24),
      mode: optionalText(agent?.mode, 'opencode agent mode', 24),
      model: optionalText(agent?.model, 'opencode agent model', 80),
      lastSeen: agent?.lastSeen === undefined || agent?.lastSeen === null || agent?.lastSeen === ''
        ? null
        : isoDate(agent.lastSeen, 'opencode agent lastSeen')
    }))
  }
}

export function commandKey(id) {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) fail('Invalid command id')
  return `commands/${id}`
}

export function assertCommandTransition(current, next) {
  if (current === next) return
  const allowed = {
    pending: new Set(['running', 'failed']),
    running: new Set(['completed', 'failed']),
    completed: new Set(),
    failed: new Set()
  }
  if (!allowed[current]?.has(next)) fail(`Invalid command transition: ${current} -> ${next}`)
}
