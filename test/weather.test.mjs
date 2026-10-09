import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseForecast, addWeather } from '../src/weather.mjs';

const good = { hourly: { time: ['2026-10-06T16:00', '2026-10-06T17:00'], temperature_2m: [52.4, 50.6], precipitation_probability: [20, 65] } };

test('forecast is keyed by local hour with rounded values', () => {
  assert.deepEqual(parseForecast(good), { '2026-10-06T16': { t: 52, p: 20 }, '2026-10-06T17': { t: 51, p: 65 } });
});
test('bad shapes are rejected', () => {
  assert.throws(() => parseForecast({}), /unexpected shape/);
  assert.throws(() => parseForecast({ hourly: { time: [], temperature_2m: [] } }), /empty/);
});
test('addWeather writes the forecast, and leaves the file alone on failure', async () => {
  const f = join(mkdtempSync(join(tmpdir(), 'w-')), 's.json'); const base = { updatedAt: 'x', events: [] };
  writeFileSync(f, JSON.stringify(base));
  assert.equal(await addWeather({ file: f, fetchImpl: async () => ({ ok: true, json: async () => good }), log: () => {} }), true);
  assert.equal(JSON.parse(readFileSync(f, 'utf8')).weather.hours['2026-10-06T17'].p, 65);
  writeFileSync(f, JSON.stringify(base));
  assert.equal(await addWeather({ file: f, fetchImpl: async () => ({ ok: false, status: 503 }), log: () => {} }), false);
  assert.deepEqual(JSON.parse(readFileSync(f, 'utf8')), base);
});
