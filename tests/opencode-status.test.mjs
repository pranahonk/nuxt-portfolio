import assert from 'node:assert/strict'
import test from 'node:test'
import { deriveOpencodeStatus, readAgentFiles } from '../scripts/opencode-status.mjs'

const NOW = Date.parse('2026-10-06T03:00:00Z')
const iso = (secondsAgo) => new Date(NOW - secondsAgo * 1000).toISOString()

const agentFiles = [
  { name: 'orchestrator', mode: 'primary', model: '9router/medium' },
  { name: 'test-engineer', mode: 'subagent', model: '9router/Hard' },
  { name: 'reporter', mode: 'subagent', model: '9router/easy' }
]

function log(lines) {
  return lines
    .map((line) => `timestamp=${line.ts} level=INFO run=r1 message=${line.msg}`)
    .join('\n') + '\n'
}

const agents = (out) => Object.fromEntries(out.agents.map((a) => [a.name, a.state]))

test('no live run → every role is Idle, even with a fresh log', () => {
  const logText = log([{ ts: iso(1), msg: 'stream agent=orchestrator mode=primary' }])
  const out = deriveOpencodeStatus({ logText, agentFiles, nowMs: NOW, runActive: false })
  assert.equal(out.runActive, false)
  assert.equal(out.activeAgent, null)
  assert.deepEqual(agents(out), { orchestrator: 'Idle', 'test-engineer': 'Idle', reporter: 'Idle' })
})

test('a live run with a stale log → active agent Stalled, absent roles Idle', () => {
  const logText = log([
    { ts: iso(3600), msg: 'stream providerID=9router modelID=medium agent=orchestrator mode=primary' },
    { ts: iso(3600), msg: '"llm runtime selected" llm.model=medium' }
  ])
  const out = deriveOpencodeStatus({ logText, agentFiles, nowMs: NOW, staleSeconds: 300, runActive: true })
  assert.equal(out.runActive, true)
  assert.equal(agents(out).orchestrator, 'Stalled')
  assert.equal(agents(out)['test-engineer'], 'Idle')
  assert.equal(out.activeAgent, 'orchestrator')
  assert.equal(out.lastEvent, 'active')
  assert.equal(out.logAgeSeconds, 3600)
})

test('a live run with a fresh active agent is Working, and a pending ask is Waiting', () => {
  const fresh = log([{ ts: iso(10), msg: 'stream agent=orchestrator mode=primary' }])
  assert.equal(
    deriveOpencodeStatus({ logText: fresh, agentFiles, nowMs: NOW, runActive: true }).agents.find((a) => a.name === 'orchestrator').state,
    'Working'
  )

  const asking = log([
    { ts: iso(5), msg: 'stream agent=orchestrator mode=primary' },
    { ts: iso(2), msg: 'asking id=per_1 permission=bash patterns="[\\"git status\\"]"' }
  ])
  assert.equal(
    deriveOpencodeStatus({ logText: asking, agentFiles, nowMs: NOW, runActive: true }).agents.find((a) => a.name === 'orchestrator').state,
    'Waiting'
  )
})

test('an exited loop reads Idle even when fresh and runActive', () => {
  const logText = log([
    { ts: iso(5), msg: 'stream agent=orchestrator mode=primary' },
    { ts: iso(3), msg: '"exiting loop" session.id=ses_1' }
  ])
  const out = deriveOpencodeStatus({ logText, agentFiles, nowMs: NOW, runActive: true })
  assert.equal(out.lastEvent, 'exited')
  assert.equal(out.agents.find((a) => a.name === 'orchestrator').state, 'Idle')
})

test('failed MCP servers are collected and deduped', () => {
  const logText = log([
    { ts: iso(300), msg: '"server unavailable" key=blender-mcp type=local status=failed' },
    { ts: iso(299), msg: '"server unavailable" key=figma type=remote status=failed' },
    { ts: iso(298), msg: '"server unavailable" key=blender-mcp type=local status=failed' },
    { ts: iso(5), msg: 'stream agent=orchestrator mode=primary' }
  ])
  const out = deriveOpencodeStatus({ logText, agentFiles, nowMs: NOW })
  assert.deepEqual(out.mcpDown.sort(), ['blender-mcp', 'figma'])
})

test('a missing log degrades without throwing', () => {
  const out = deriveOpencodeStatus({ logText: '', agentFiles, nowMs: NOW })
  assert.equal(out.activeAgent, null)
  assert.equal(out.logAgeSeconds, null)
  assert.equal(out.agents.length, 3)
  assert.ok(out.agents.every((a) => a.state === 'Idle'))
})

test('readAgentFiles parses definitions from a real directory', () => {
  const files = readAgentFiles(new URL('../repo-does-not-exist', import.meta.url).pathname)
  assert.deepEqual(files, [])
})
