import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAll, timeLabel } from '../src/normalize.mjs';
import { loadJsonFixture, loadHtmlFixture } from '../src/fixtures.mjs';

const rows = loadJsonFixture(new URL('../data/raw/portal-json-2026-10.psv', import.meta.url).pathname);
const html = loadHtmlFixture(new URL('../data/raw/portal-week-2026-10-05.psv', import.meta.url).pathname);
const { events, problems, duplicatesDropped } = normalizeAll(rows, html);
const byId = (id) => events.find((e) => e.id === String(id));

test('time labels follow house style', () => {
  assert.equal(timeLabel('2026-10-05T16:30:00'), '4:30PM');
  assert.equal(timeLabel('2026-10-10T10:00:00'), '10AM');
  assert.equal(timeLabel('2026-10-10T12:00:00'), '12PM');
});

test('every row parses', () => assert.deepEqual(problems, []));

test('duplicate posting dropped, HTML-listed id kept', () => {
  assert.equal(duplicatesDropped, 1);
  assert.ok(byId(7438042));
  assert.equal(byId(7460052), undefined);
});

test('canceled flags merge from HTML', () => {
  for (const id of [7450960, 7443337, 7479693, 7478891, 7443396]) {
    // some canceled games appear only in the HTML view (the JSON omits them)
    assert.equal(byId(id).status, 'canceled');
  }
  assert.equal(byId(7473297).status, 'scheduled');
  assert.equal(byId(7443337).opponent, 'Port Chester High School');
  assert.equal(byId(7443337).time, '5PM');
});

test('fields', () => {
  const e = byId(7473297);
  assert.equal(e.sport, 'Volleyball'); assert.equal(e.gender, 'Girls'); assert.equal(e.level, 'Varsity');
  assert.equal(e.homeAway, 'home'); assert.equal(e.opponent, 'Albertus Magnus High School');
  assert.equal(e.venue, 'Woodlands Middle/High School'); assert.equal(e.time, '4:30PM');
  assert.equal(byId(7476449).gender, 'Boys & Girls');
  assert.equal(byId(7450979).opponent, 'Croton Harmon - Hen Hud');
  assert.equal(byId(7570582).note, '2026 Elmsford Classic - Girls JV VB Tournament');
});

test('meets with many teams read as multi-team', () => assert.match(byId(7657928).opponent, /^Multiple Teams/));

test('summary', () => console.log(`${events.length} events, ${new Set(events.map((e) => e.teamKey)).size} teams`));

test('portal timestamps with a space are normalised to ISO T form', () => {
  const [e] = normalizeAll([{ id: 1, start: '2026-10-06 16:30:00', end: '2026-10-06 17:59:00', title: 'Boys (MOD) Football [H]', description: '4:30PM Vs Ossining High School - Woodlands High School - ' }]).events;
  assert.equal(e.start, '2026-10-06T16:30:00'); assert.equal(e.end, '2026-10-06T17:59:00'); assert.equal(e.date, '2026-10-06'); assert.equal(e.time, '4:30PM');
});
