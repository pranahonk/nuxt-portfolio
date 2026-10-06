import assert from 'node:assert/strict'
import test from 'node:test'
import { formatJakartaTime } from '../utils/format.ts'

test('formats ISO timestamps in Jakarta time', () => {
  assert.equal(formatJakartaTime('2026-10-07T03:00:00.000Z'), '07 Oct, 10:00')
})

test('never throws on a systemd human timestamp (WebKit Invalid Date path)', () => {
  // V8 parses this; WebKit parses it to Invalid Date and Intl.format() then
  // throws RangeError mid-render, blanking the page. Either way it must not throw.
  const out = formatJakartaTime('Wed 2026-10-07 10:00:00 CST')
  assert.equal(typeof out, 'string')
  assert.ok(out.length > 0)
})

test('passes through any unparseable value without throwing', () => {
  assert.equal(formatJakartaTime('not a date'), 'not a date')
})
