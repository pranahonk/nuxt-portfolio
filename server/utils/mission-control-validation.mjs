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
