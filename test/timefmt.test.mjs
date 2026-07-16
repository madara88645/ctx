import test from 'node:test';
import assert from 'node:assert';
import { formatRelative } from '../src/timefmt.mjs';

test('formatRelative - just now (30s and 0s)', () => {
  const now = 100000;
  assert.strictEqual(formatRelative(now - 30000, now), 'just now');
  assert.strictEqual(formatRelative(now, now), 'just now');
});

test('formatRelative - negative delta (future)', () => {
  const now = 100000;
  assert.strictEqual(formatRelative(now + 10000, now), 'just now');
});

test('formatRelative - minutes boundary (59s -> just now, 60s -> 1 minute ago)', () => {
  const now = 100000;
  assert.strictEqual(formatRelative(now - 59999, now), 'just now');
  assert.strictEqual(formatRelative(now - 60000, now), '1 minute ago');
});

test('formatRelative - minutes plural', () => {
  const now = 3600000;
  assert.strictEqual(formatRelative(now - 59 * 60000, now), '59 minutes ago');
});

test('formatRelative - hours boundary', () => {
  const now = 100000000;
  assert.strictEqual(formatRelative(now - 3600000 + 1, now), '59 minutes ago');
  assert.strictEqual(formatRelative(now - 3600000, now), '1 hour ago');
});

test('formatRelative - hours plural', () => {
  const now = 100000000;
  assert.strictEqual(formatRelative(now - 23 * 3600000, now), '23 hours ago');
});

test('formatRelative - days boundary', () => {
  const now = 100000000;
  assert.strictEqual(formatRelative(now - 86400000 + 1, now), '23 hours ago');
  assert.strictEqual(formatRelative(now - 86400000, now), '1 day ago');
});

test('formatRelative - days plural', () => {
  const now = 3000000000;
  assert.strictEqual(formatRelative(now - 29 * 86400000, now), '29 days ago');
});

test('formatRelative - absolute UTC date (45d with specified epoch)', () => {
  const thenMs = Date.UTC(2026, 0, 15); // 2026-01-15T00:00:00Z
  const nowMs = thenMs + 45 * 86400000; // 45 days later
  assert.strictEqual(formatRelative(thenMs, nowMs), 'on 2026-01-15');
});

test('formatRelative - absolute UTC date padding test', () => {
  const thenMs = Date.UTC(2026, 8, 5); // 2026-09-05T00:00:00Z
  const nowMs = thenMs + 50 * 86400000;
  assert.strictEqual(formatRelative(thenMs, nowMs), 'on 2026-09-05');
});
