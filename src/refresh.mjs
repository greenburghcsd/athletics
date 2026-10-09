// Keeps data/schedule.json current. Runs inside the server every REFRESH_MINUTES, or once with --once.
// Safety rules: never replace good data with a bad pull; keep canceled flags the portal later drops.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { normalizeAll } from './normalize.mjs';
import { fetchJsonWindow, fetchWeekHtml, parseWeekHtml, monthWindows, delay } from './portal.mjs';

const FILE = new URL('../data/schedule.json', import.meta.url).pathname;
const nyDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d);
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export function readStore(file = FILE) { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return { events: [] }; } }

export async function refreshOnce({ fetchImpl = fetch, file = FILE, now = new Date(), pauseMs = Number(process.env.REFRESH_PAUSE_MS ?? 10_500), fromIso, toIso, log = console.log } = {}) {
  const prev = readStore(file);
  const today = nyDate(now);
  // Whole season so team schedules stay complete: from Aug 1 (or 60 days back) to 150 days ahead.
  const from = fromIso || (today.slice(5) >= '08-01' ? `${today.slice(0, 4)}-08-01` : addDays(today, -60));
  const to = toIso || addDays(today, 150);
  try {
    const rows = [];
    for (const [s, e] of monthWindows(from, to)) {
      rows.push(...await fetchJsonWindow(s, e, { fetchImpl }));
      await delay(pauseMs);
    }
    let html = { rows: [], problems: [] };
    try { html = parseWeekHtml(await fetchWeekHtml({ fetchImpl })); } catch (err) { log('weekly status page unavailable:', err.message); }
    const status = { canceled: new Set(), seenInHtml: new Set(), location: {}, opponent: {}, htmlRows: html.rows };
    for (const h of html.rows) {
      status.seenInHtml.add(h.id);
      if (/\((canceled|cancelled)\)/i.test(h.name)) status.canceled.add(h.id);
      if (h.text.includes(' @ ')) status.location[h.id] = h.text.split(' @ ').pop();
      status.opponent[h.id] = h.text.split(' @ ')[0].replace(/^(vs|@)\s+/i, '');
    }
    const { events, problems, duplicatesDropped } = normalizeAll(rows, status);

    if (events.length === 0) throw new Error('portal returned zero games');

    // Carry forward cancellations the weekly page has already moved past.
    const have = new Set(events.map((e) => e.id));
    for (const e of prev.events || []) if (e.status === 'canceled' && !have.has(e.id) && e.date >= from) events.push(e);
    events.sort((a, b) => a.start.localeCompare(b.start) || a.teamName.localeCompare(b.teamName));

    // Sanity gates: refuse a pull that looks broken.
    const prevInWindow = (prev.events || []).filter((e) => e.date >= from && e.date < to).length;
    if (prevInWindow >= 20 && events.length < prevInWindow * 0.5) throw new Error(`game count fell from ${prevInWindow} to ${events.length}`);
    if (problems.length > Math.max(3, rows.length * 0.1)) throw new Error(`${problems.length} rows did not parse (format may have changed)`);

    const out = { updatedAt: now.toISOString(), source: 'woodlandsathletics.digitalsports.com', events,
      health: { ok: true, lastSuccess: now.toISOString(), lastError: null, games: events.length, duplicatesDropped, unparsedRows: problems.length, statusRows: html.rows.length, statusProblems: html.problems.length } };
    const changes = diff(prev.events || [], events, today);
    out.changes = [...changes, ...(prev.changes || []).filter((c) => !falseResched(c) && c.at > new Date(now - 7 * 864e5).toISOString())].slice(0, 200);
    const tmp = file + '.tmp'; writeFileSync(tmp, JSON.stringify(out)); renameSync(tmp, file);
    if (changes.length) log(`${changes.length} schedule change(s)`);
    return out;
  } catch (err) {
    const keep = { ...prev, health: { ...(prev.health || {}), ok: false, lastError: err.message, lastErrorAt: now.toISOString() } };
    if (existsSync(file) || prev.events?.length) { const tmp = file + '.tmp'; writeFileSync(tmp, JSON.stringify(keep)); renameSync(tmp, file); }
    log('refresh failed, keeping last good schedule:', err.message);
    return keep;
  }
}

// Old published files stored "YYYY-MM-DD HH:mm:ss"; newer ones use "T". Compare them as the same moment.
const sameStart = (v) => String(v).replace(' ', 'T').slice(0, 16);
// A "rescheduled" note whose old time equals the new time is a false alarm (left by the old format difference).
export const falseResched = (c) => c && c.kind === 'rescheduled' && /(\d{4}-\d\d-\d\d \S+) \(was \1\)\s*$/.test(c.text || '');

// What changed since the last pull (upcoming games only): the list Michael can glance at.
export function diff(before, after, today, at = new Date().toISOString()) {
  const b = new Map(before.map((e) => [e.id, e])), a = new Map(after.map((e) => [e.id, e])), out = [];
  const label = (e) => `${e.gender} ${e.level} ${e.sport} ${e.homeAway === 'home' ? 'vs.' : 'at'} ${e.opponent}, ${e.date} ${e.time}`;
  if (before.length === 0) return out;
  for (const [id, e] of a) {
    if (e.date < today) continue;
    const o = b.get(id);
    if (!o) out.push({ at, kind: 'added', id, text: label(e) });
    else if (o.status !== e.status) out.push({ at, kind: e.status, id, text: label(e) });
    else if (sameStart(o.start) !== sameStart(e.start)) out.push({ at, kind: 'rescheduled', id, text: `${label(e)} (was ${o.date} ${o.time})` });
    else if (o.venue !== e.venue) out.push({ at, kind: 'venue', id, text: `${label(e)} (venue now ${e.venue})` });
  }
  for (const [id, o] of b) if (o.date >= today && !a.has(id)) out.push({ at, kind: 'removed', id, text: label(o) });
  return out;
}

export function startRefreshLoop({ minutes = Number(process.env.REFRESH_MINUTES || 10), ...opts } = {}) {
  let running = false;
  const tick = async () => { if (running) return; running = true; try { await refreshOnce(opts); } finally { running = false; } };
  tick();
  return setInterval(tick, minutes * 60_000);
}

if (process.argv[1] === new URL(import.meta.url).pathname && process.argv.includes('--once')) {
  refreshOnce().then((r) => { console.log(r.health); process.exit(r.health.ok ? 0 : 1); });
}
