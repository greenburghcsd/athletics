// Turns raw portal rows (schedule-json.php + the HTML day tables) into clean events.
// Raw JSON row:  { id, start, end, title, description }   (start/end local "YYYY-MM-DDTHH:mm:ss")
// HTML status:   Map/Set of event ids marked "(Canceled)" / "(Postponed)", plus optional location text.

const KNOWN_HYPHENATED_OPPONENTS = ['Croton Harmon - Hen Hud'];
const LEVELS = { V: 'Varsity', JV: 'Junior Varsity', MOD: 'Modified' };
const GENDERS = { girls: 'Girls', boys: 'Boys', 'boys and girls': 'Boys & Girls' };

export const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// "4:30PM" / "10AM" style used on graphics (user's rule).
export function timeLabel(localIso) {
  const [h, m] = localIso.slice(11, 16).split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ap}` : `${h12}:${String(m).padStart(2, '0')}${ap}`;
}

function splitDescription(desc, htmlLoc) {
  const m = desc.match(/^(\d{1,2}(?::\d{2})?[AP]M)\s+(Vs|@)\s+(.*)$/i);
  if (!m) return { opponent: '', venue: htmlLoc || '', note: '' };
  let rest = m[3];
  let opponent;
  const known = KNOWN_HYPHENATED_OPPONENTS.find((k) => rest.startsWith(k));
  if (htmlLoc && rest.includes(` - ${htmlLoc}`)) {
    const i = rest.indexOf(` - ${htmlLoc}`);
    return { opponent: rest.slice(0, i), venue: htmlLoc, note: rest.slice(i + 3 + htmlLoc.length).replace(/^ - /, '') };
  }
  if (known) { opponent = known; rest = rest.slice(known.length).replace(/^ - /, ''); }
  const parts = rest.split(' - ');
  if (!known) opponent = parts.shift();
  const venue = htmlLoc || parts.shift() || '';
  return { opponent, venue, note: parts.join(' - ') };
}

export function normalizeEvent(raw, status = {}) {
  // The live portal sends "2026-10-06 16:30:00" (space); calendars and sorting want "2026-10-06T16:30:00".
  raw = { ...raw, start: String(raw.start).replace(' ', 'T'), end: String(raw.end).replace(' ', 'T') };
  const t = raw.title.match(/^(.*?)\s+\((V|JV|MOD)\)\s+(.*?)\s+\[(H|A)\]$/);
  if (!t) return null; // unknown shape: caller reports it, never silently guesses
  const genderKey = t[1].trim().toLowerCase();
  const gender = GENDERS[genderKey] || t[1].trim();
  const level = LEVELS[t[2]];
  const sport = t[3].trim();
  const loc = status.location?.[raw.id];
  const { opponent, venue, note } = splitDescription(raw.description, loc);
  const canceled = status.canceled?.has(raw.id) || false;
  // The HTML schedule says "Multiple Teams" for meets where the JSON names one school.
  const htmlOpp = status.opponent?.[raw.id];
  const oppFinal = htmlOpp && /^multiple teams/i.test(htmlOpp) ? htmlOpp : opponent;
  return {
    id: String(raw.id),
    sport, sportSlug: slug(sport),
    gender, level, levelCode: t[2],
    teamKey: `${slug(sport)}:${slug(gender)}:${t[2].toLowerCase()}`,
    teamName: `${gender} ${level} ${sport}`,
    homeAway: t[4] === 'H' ? 'home' : 'away',
    opponent: oppFinal, venue, note,
    start: raw.start, end: raw.end,
    date: raw.start.slice(0, 10),
    time: timeLabel(raw.start),
    status: canceled ? 'canceled' : 'scheduled',
    endKnown: !raw.htmlOnly,
  };
}

// Games the JSON feed omits (e.g. canceled ones) still appear in the HTML schedule; rebuild them from it.
// htmlRow: { id, date:'YYYY-MM-DD', time:'4:30 PM', name:'Soccer: Girls Junior Varsity Game (Canceled)', text:'vs X @ Venue' }
export function eventFromHtml(h) {
  const m = h.name.match(/^(.*?):\s+(Boys And Girls|Boys|Girls)\s+(Varsity|Junior Varsity|Modified)\s+Game(.*)$/i);
  if (!m) return null;
  const code = { varsity: 'V', 'junior varsity': 'JV', modified: 'MOD' }[m[3].toLowerCase()];
  const gender = { 'boys and girls': 'Boys and girls', boys: 'Boys', girls: 'Girls' }[m[2].toLowerCase()];
  const t = h.time.match(/(\d{1,2}):(\d{2})\s*([AP])M/i);
  let hh = Number(t[1]) % 12 + (t[3].toUpperCase() === 'P' ? 12 : 0);
  const start = `${h.date}T${String(hh).padStart(2, '0')}:${t[2]}:00`;
  const away = h.text.startsWith('@');
  const [opp, ...locs] = h.text.replace(/^(vs|@)\s+/i, '').split(' @ ');
  const note = m[4].replace(/\((canceled|cancelled)\)/i, '').trim();
  return {
    id: h.id, start, end: start,
    title: `${gender} (${code}) ${m[1].trim()} [${away ? 'A' : 'H'}]`,
    description: `${timeLabel(start)} ${away ? '@' : 'Vs'} ${opp} - ${locs.join(' @ ')}${note ? ' - ' + note : ''}`,
  };
}

export function normalizeAll(rows, status = {}) {
  const have = new Set(rows.map((r) => Number(r.id)));
  rows = [...rows];
  for (const h of status.htmlRows || []) {
    if (have.has(Number(h.id))) continue;
    const r = eventFromHtml(h);
    if (r) rows.push({ ...r, htmlOnly: true });
  }
  const events = [], problems = [];
  for (const r of rows) {
    const e = normalizeEvent(r, status);
    e ? events.push(e) : problems.push({ id: r.id, title: r.title });
  }
  // Duplicate postings of the same game: keep the one the HTML schedule shows, else the lowest id.
  const seen = new Map();
  for (const e of events) {
    const k = [e.teamKey, e.start, e.homeAway, e.opponent].join('|');
    const cur = seen.get(k);
    const inHtml = (x) => status.seenInHtml?.has(Number(x.id)) ? 1 : 0;
    if (!cur || inHtml(e) > inHtml(cur) || (inHtml(e) === inHtml(cur) && Number(e.id) < Number(cur.id))) seen.set(k, e);
  }
  const out = [...seen.values()].sort((a, b) => a.start.localeCompare(b.start) || a.teamName.localeCompare(b.teamName));
  return { events: out, problems, duplicatesDropped: events.length - out.length };
}
