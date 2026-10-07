import assert from 'node:assert/strict'
import test from 'node:test'
import { assertCommandTransition, commandKey, parseGitHubUrl, validateMissionSnapshot } from '../server/utils/mission-control-validation.mjs'

const snapshot = {
  generatedAt: '2026-10-06T09:00:00+07:00',
  coordinator: { paused: false, service: 'inactive', timer: 'active', nextRun: null, activeRun: null, lastResult: 'success' },
  runners: [{ name: 'MSI-Tiny-Courier', status: 'online', busy: false }],
  cards: [{ number: 1, title: 'Card', labels: ['ready', 'risk-low'], url: 'https://github.com/pranahonk/tiny-courier/issues/1' }],
  pullRequests: [{ number: 4, title: 'PR', state: 'OPEN', branch: 'feature', url: 'https://github.com/pranahonk/tiny-courier/pull/4', checks: 'success' }],
  recentRuns: [{ name: 'Android', conclusion: 'success', status: 'completed', url: 'https://github.com/pranahonk/tiny-courier/actions/runs/1', createdAt: '2026-10-06T02:00:00Z' }],
  hosts: [{ name: 'VPS', role: 'Coordinator', status: 'online' }]
}

test('only canonical HTTPS GitHub URLs are accepted', () => {
  assert.equal(parseGitHubUrl('https://github.com/pranahonk/tiny-courier/issues/1'), 'https://github.com/pranahonk/tiny-courier/issues/1')
  for (const value of ['javascript:alert(1)', 'data:text/html,x', 'http://github.com/x', 'https://github.example.com/x', 'https://evil.example/x']) {
    assert.throws(() => parseGitHubUrl(value), /Invalid/)
  }
})

test('snapshot validation rejects a hostile nested URL', () => {
  assert.equal(validateMissionSnapshot(snapshot).cards[0].number, 1)
  assert.throws(() => validateMissionSnapshot({ ...snapshot, cards: [{ ...snapshot.cards[0], url: 'https://evil.example/phish' }] }), /Invalid card URL/)
})

test('GitHub Project workflow data validates without weakening URL checks', () => {
  const project = {
    title: 'Tiny Courier',
    url: 'https://github.com/users/pranahonk/projects/1',
    items: [{ number: 1, title: 'Card', labels: ['risk-low'], url: snapshot.cards[0].url, workflow: 'Done', closed: true }]
  }
  assert.equal(validateMissionSnapshot({ ...snapshot, project }).project.items[0].workflow, 'Done')
  assert.throws(() => validateMissionSnapshot({ ...snapshot, project: { ...project, url: 'https://evil.example/project' } }), /Invalid project URL/)
})

test('command transitions move forward and terminal states cannot regress', () => {
  assert.doesNotThrow(() => assertCommandTransition('pending', 'running'))
  assert.doesNotThrow(() => assertCommandTransition('running', 'completed'))
  assert.doesNotThrow(() => assertCommandTransition('completed', 'completed'))
  assert.throws(() => assertCommandTransition('completed', 'running'), /Invalid command transition/)
  assert.throws(() => assertCommandTransition('running', 'pending'), /Invalid command transition/)
})

test('command keys reject path traversal and malformed ids', () => {
  assert.equal(commandKey('123e4567-e89b-12d3-a456-426614174000'), 'commands/123e4567-e89b-12d3-a456-426614174000')
  assert.throws(() => commandKey('../status'), /Invalid command id/)
})

test('an older snapshot without the opencode block stays valid', () => {
  assert.equal(validateMissionSnapshot(snapshot).opencode, undefined)
})

test('the opencode live-run block validates and normalizes timestamps', () => {
  const withOpencode = {
    ...snapshot,
    opencode: {
      activeAgent: 'orchestrator',
      lastEvent: 'active',
      logAgeSeconds: 48010,
      mcpDown: ['blender-mcp', 'figma'],
      agents: [
        { name: 'orchestrator', state: 'Stalled', mode: 'primary', model: '9router/medium', lastSeen: '2026-10-06T02:17:57.898Z' },
        { name: 'reporter', state: 'Idle', mode: 'subagent', model: '9router/easy', lastSeen: null }
      ]
    }
  }
  const out = validateMissionSnapshot(withOpencode).opencode
  assert.equal(out.agents[0].state, 'Stalled')
  assert.equal(out.agents[0].lastSeen, '2026-10-06T02:17:57.898Z')
  assert.equal(out.agents[1].lastSeen, null)
  assert.equal(out.logAgeSeconds, 48010)
  assert.deepEqual(out.mcpDown, ['blender-mcp', 'figma'])
})

test('a malformed opencode block fails closed', () => {
  assert.throws(() => validateMissionSnapshot({ ...snapshot, opencode: 'nope' }), /Invalid opencode/)
  assert.throws(() => validateMissionSnapshot({ ...snapshot, opencode: { agents: [{ name: '', state: 'Idle' }] } }), /Invalid opencode agent name/)
  assert.throws(() => validateMissionSnapshot({ ...snapshot, opencode: { logAgeSeconds: -1 } }), /Invalid opencode log age/)
})
