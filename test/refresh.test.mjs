import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { refreshOnce, diff } from '../src/refresh.mjs';
import { parseWeekHtml, nyMidnight, monthWindows } from '../src/portal.mjs';
import { loadJsonFixture } from '../src/fixtures.mjs';

const raw = new URL('../data/raw/', import.meta.url).pathname;
const jsonRows = loadJsonFixture(raw + 'portal-json-2026-10.psv').map((r) => ({ backgroundColor: '#3366CC', textColor: '#fff', ...r, start: r.start.replace('T', ' '), end: r.end.replace('T', ' ') }));

// Builds HTML shaped like the portal's weekly page (h2 per day, table.schedule-table, add-event-info span, eid link).
function weekHtml() {
  const lines = readFileSync(raw + 'portal-week-2026-10-05.psv', 'utf8').trim().split('\n').map((l) => l.split('|'));
  const days = [...new Set(lines.map((l) => l[1]))];
  return days.map((d) => {
    const rows = lines.filter((l) => l[1] === d).map(([id, , time, name, text]) => {
      const canceled = /\(Canceled\)/.test(name), clean = name.replace(/\s*\(Canceled\)/, '');
      const [opp, ...loc] = text.split(' @ '), oppText = text.startsWith('@') ? `@ ${text.slice(2).split(' @ ')[0]}` : opp;
      const venue = text.split(' @ ').pop();
      return `<tr><td><strong>${time}</strong></td><td><span class="event-info"><i class="fa fa-circle m-r-5"></i><a href="#">${clean}</a>${canceled ? '<span class="add-event-info">(Canceled)</span>' : ''}</span></td><td><span class="opponent theme-color">${oppText}</span><span class="theme-color"><a onclick="window.open('/pages/event_details.php?eid=${id}')">${venue}</a></span></td></tr>`;
    }).join('');
    return `<h2>Mon ${d} 2026</h2><table class="schedule-table"><thead><tr><th>Time</th><th>Event</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('');
}

function fakePortal({ json = jsonRows, html = weekHtml(), fail = false } = {}) {
  return async (url, opts = {}) => {
    if (fail) throw new Error('network down');
    if (String(url).includes('schedule-json.php')) {
      const p = new URLSearchParams(opts.body); const s = Number(p.get('start')), e = Number(p.get('end'));
      const inWin = json.filter((r) => { const t = nyMidnight(r.start.slice(0, 10)); return t >= s && t < e; });
      return new Response(JSON.stringify(inWin), { status: 200 });
    }
    return new Response(html, { status: 200 });
  };
}
const tmp = () => join(mkdtempSync(join(tmpdir(), 'gcsd-')), 'schedule.json');
const run = (o) => refreshOnce({ pauseMs: 0, now: new Date('2026-10-05T16:00:00Z'), fromIso: '2026-10-01', toIso: '2026-11-01', log: () => {}, ...o });

test('month windows and NY midnight (EDT)', () => {
  assert.deepEqual(monthWindows('2026-10-01', '2026-12-15'), [['2026-10-01', '2026-11-01'], ['2026-11-01', '2026-12-01'], ['2026-12-01', '2027-01-01']]);
  assert.equal(nyMidnight('2026-10-05'), Date.parse('2026-10-05T04:00:00Z') / 1000);
  assert.equal(nyMidnight('2026-11-05'), Date.parse('2026-11-05T05:00:00Z') / 1000);
});

test('weekly html parser reads days, rows, ids, canceled', () => {
  const { rows, problems } = parseWeekHtml(weekHtml());
  assert.equal(problems.length, 0); assert.equal(rows.length, 28);
  const c = rows.find((r) => r.id === 7450960);
  assert.equal(c.date, '2026-10-05'); assert.match(c.name, /\(Canceled\)/); assert.equal(c.time, '4:30 PM');
  assert.equal(rows.find((r) => r.id === 7473297).text, 'vs Albertus Magnus High School @ Woodlands Middle/High School');
});

test('refresh writes a full, merged schedule', async () => {
  const f = tmp(); const r = await run({ fetchImpl: fakePortal(), file: f });
  assert.equal(r.health.ok, true);
  const saved = JSON.parse(readFileSync(f, 'utf8'));
  assert.equal(saved.events.length, 79);
  assert.equal(saved.events.filter((e) => e.status === 'canceled').length, 5);
});

test('a failed pull keeps the last good schedule', async () => {
  const f = tmp(); await run({ fetchImpl: fakePortal(), file: f });
  const r = await run({ fetchImpl: fakePortal({ fail: true }), file: f });
  assert.equal(r.health.ok, false);
  assert.equal(JSON.parse(readFileSync(f, 'utf8')).events.length, 79);
});

test('an empty or collapsed pull is rejected', async () => {
  const f = tmp(); await run({ fetchImpl: fakePortal(), file: f });
  const r = await run({ fetchImpl: fakePortal({ json: [], html: '' }), file: f });
  assert.equal(r.health.ok, false); assert.match(r.health.lastError, /zero games/);
  const r2 = await run({ fetchImpl: fakePortal({ json: jsonRows.slice(0, 10), html: '' }), file: f });
  assert.equal(r2.health.ok, false); assert.match(r2.health.lastError, /fell from/);
  assert.equal(JSON.parse(readFileSync(f, 'utf8')).events.length, 79);
});

test('cancellations survive after the weekly page moves on', async () => {
  const f = tmp(); await run({ fetchImpl: fakePortal(), file: f });
  const r = await run({ fetchImpl: fakePortal({ html: '<p>no tables</p>' }), file: f });
  assert.equal(r.health.ok, true);
  assert.equal(r.events.filter((e) => e.status === 'canceled').length, 5);
});

test('changes are detected', async () => {
  const f = tmp(); const first = await run({ fetchImpl: fakePortal(), file: f });
  const moved = jsonRows.map((r) => (r.id === 7442945 ? { ...r, start: '2026-10-07 18:00:00', end: '2026-10-07 19:29:00' } : r)).filter((r) => r.id !== 7438008);
  const second = await run({ fetchImpl: fakePortal({ json: moved, html: '<p></p>' }), file: f });
  const kinds = second.changes.map((c) => c.kind);
  assert.ok(kinds.includes('rescheduled')); assert.ok(kinds.includes('removed'));
  assert.deepEqual(diff(first.events, first.events, '2026-10-05'), []);
});

test('old space-format start vs new T-format start is not a reschedule', async () => {
  const { diff, falseResched } = await import('../src/refresh.mjs');
  const e = { id: '1', date: '2026-10-10', time: '1:30PM', status: 'scheduled', gender: 'Boys', level: 'Varsity', sport: 'Football', homeAway: 'home', opponent: 'X', venue: 'V' };
  assert.equal(diff([{ ...e, start: '2026-10-10 13:30:00' }], [{ ...e, start: '2026-10-10T13:30:00' }], '2026-10-01').length, 0);
  assert.equal(diff([{ ...e, start: '2026-10-10T13:30:00' }], [{ ...e, time: '2PM', start: '2026-10-10T14:00:00' }], '2026-10-01')[0].kind, 'rescheduled');
  assert.equal(falseResched({ kind: 'rescheduled', text: 'Boys Varsity Football vs. X, 2026-10-10 1:30PM (was 2026-10-10 1:30PM)' }), true);
  assert.equal(falseResched({ kind: 'rescheduled', text: 'Boys Varsity Football vs. X, 2026-10-10 2PM (was 2026-10-10 1:30PM)' }), false);
});
