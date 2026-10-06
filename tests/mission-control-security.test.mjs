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
