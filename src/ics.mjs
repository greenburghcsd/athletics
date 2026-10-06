// iCalendar feeds. Floating-free: events carry TZID America/New_York with a VTIMEZONE block.
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const fold = (l) => { const out = []; while (l.length > 74) { out.push(l.slice(0, 74)); l = ' ' + l.slice(74); } out.push(l); return out.join('\r\n'); };
const stampOf = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const local = (iso) => iso.replace(/[-:]/g, '').slice(0, 15);

const TZ = ['BEGIN:VTIMEZONE', 'TZID:America/New_York',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0400', 'TZNAME:EDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:-0400', 'TZOFFSETTO:-0500', 'TZNAME:EST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD', 'END:VTIMEZONE'];

export function buildIcs(events, { name, updatedAt, now = new Date() }) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Greenburgh Central School District//Woodlands Athletics//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`, 'X-WR-TIMEZONE:America/New_York', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H', ...TZ];
  for (const e of events) {
    const canceled = e.status === 'canceled';
    const team = `${e.gender} ${e.level} ${e.sport}`;
    const summary = `${canceled ? 'CANCELED: ' : ''}${team} ${e.homeAway === 'home' ? 'vs' : 'at'} ${e.opponent}`;
    // If the portal gave no end time, assume 90 minutes so calendars show a block.
    let end = e.end;
    if (!e.endKnown) { const d = new Date(e.start + 'Z'); d.setUTCMinutes(d.getUTCMinutes() + 90); end = d.toISOString().slice(0, 19); }
    L.push('BEGIN:VEVENT', `UID:${e.id}@athletics.greenburghcsd.org`, `DTSTAMP:${stampOf(now)}`,
      `DTSTART;TZID=America/New_York:${local(e.start)}`, `DTEND;TZID=America/New_York:${local(end)}`,
      fold(`SUMMARY:${esc(summary)}`), fold(`LOCATION:${esc(e.venue)}`),
      fold(`DESCRIPTION:${esc(`${e.homeAway === 'home' ? 'Home' : 'Away'} game${e.note ? ' · ' + e.note : ''}${canceled ? ' · This game has been canceled.' : ''}\nLatest schedule: https://woodlandsathletics.digitalsports.com`)}`),
      `STATUS:${canceled ? 'CANCELLED' : 'CONFIRMED'}`, 'TRANSP:OPAQUE', 'SEQUENCE:' + (canceled ? 1 : 0), 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}
