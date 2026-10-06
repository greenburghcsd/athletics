// Talks to the Woodlands DigitalSports portal. Polite by design: identified user agent, a pause between
// requests (robots.txt asks for a 10 second crawl delay), and only a handful of requests per refresh.
export const PORTAL = process.env.PORTAL_BASE || 'https://woodlandsathletics.digitalsports.com';
const UA = 'GCSD-Athletics-Schedule-Sync/1.0 (+https://greenburghcsd.org/athletics; contact: mmccoy@greenburghcsd.org)';
const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Unix seconds for midnight America/New_York on a YYYY-MM-DD date.
export function nyMidnight(iso) {
  const guess = new Date(iso + 'T00:00:00Z');
  const off = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' }).formatToParts(new Date(iso + 'T12:00:00Z')).find((p) => p.type === 'timeZoneName').value;
  return Math.floor((guess.getTime() - Number(off.replace('GMT', '') || 0) * 3600e3) / 1000);
}

export function monthWindows(fromIso, toIso) {
  const out = []; let [y, m] = fromIso.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  while (`${y}-${pad(m)}-01` < toIso) {
    const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
    out.push([`${y}-${pad(m)}-01`, `${ny}-${pad(nm)}-01`]); y = ny; m = nm;
  }
  return out;
}

export async function fetchJsonWindow(startIso, endIso, { fetchImpl = fetch, entityId = '4661' } = {}) {
  const body = new URLSearchParams({ entityId, entityType: '3', req_event_team: 'null', req_event_season: '', req_event_types: 'null', start: String(nyMidnight(startIso)), end: String(nyMidnight(endIso)) });
  const r = await fetchImpl(`${PORTAL}/pages/schedule/schedule-json.php`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body });
  if (!r.ok) throw new Error(`schedule-json ${r.status}`);
  const j = JSON.parse(await r.text());
  if (!Array.isArray(j)) throw new Error('schedule-json: not an array');
  return j;
}

export async function fetchWeekHtml({ fetchImpl = fetch } = {}) {
  const r = await fetchImpl(`${PORTAL}/pages/schedule/call-school-ajax.php?filter=weekly`, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`weekly html ${r.status}`);
  return r.text();
}

const text = (h) => h.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Parses the portal's weekly HTML: one <h2> day heading + <table class="schedule-table"> per day.
export function parseWeekHtml(html) {
  const rows = [], problems = [];
  const blocks = html.split(/<h2[^>]*>/i).slice(1);
  for (const b of blocks) {
    const [headEnd, ...rest] = b.split(/<\/h2>/i);
    const hm = text(headEnd).match(/([A-Z][a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/);
    if (!hm || !MONTHS[hm[1]]) continue;
    const date = `${hm[3]}-${String(MONTHS[hm[1]]).padStart(2, '0')}-${String(hm[2]).padStart(2, '0')}`;
    const body = rest.join('</h2>').split(/<\/table>/i)[0];
    for (const tr of body.match(/<tr[\s>][\s\S]*?<\/tr>/gi) || []) {
      const tds = tr.match(/<td[\s\S]*?<\/td>/gi);
      if (!tds || tds.length < 3) continue; // header row
      const eid = tr.match(/eid=(\d+)/i)?.[1];
      const time = text(tds[0]);
      const nameCell = tds[1];
      const canceled = /add-event-info[^>]*>\s*\(?\s*(cancel+ed|postponed)/i.test(nameCell);
      const name = text(nameCell.replace(/<span[^>]*add-event-info[^>]*>[\s\S]*?<\/span>/i, ''));
      const detail = tds[2];
      const sp = detail.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
      const opp = sp ? text(sp[1]) : '';
      const venue = text((detail.match(/<a[^>]*eid=[\s\S]*?>([\s\S]*?)<\/a>/i) || [])[1] || '');
      if (!eid || !/\d:\d\d/.test(time) || !name) { problems.push({ date, time, name }); continue; }
      rows.push({ id: Number(eid), date, time, name: name + (canceled ? ' (Canceled)' : ''), text: `${opp}${venue ? ' @ ' + venue : ''}` });
    }
  }
  return { rows, problems };
}

export const delay = sleep;
