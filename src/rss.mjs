// RSS 2.0 feeds: a weekly digest item plus one item per upcoming game (next 14 days).
// A game's guid includes its status, so a cancellation shows up as a NEW item in readers.
import { createHash } from 'node:crypto';
import { addDays, mondayOf } from './print.mjs';

const BASE = () => process.env.BASE_URL || 'https://greenburghcsd.org/athletics';
const x = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const rfc = (d) => d.toUTCString();
const dparse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const dayLabel = (iso) => dparse(iso).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
const dayShort = (iso) => dparse(iso).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
const sport = (s) => s.replace(/\bAnd\b/, 'and');
// Local ET wall-clock -> a real instant (EDT/EST) for pubDate.
const etInstant = (local) => { const guess = new Date(local + 'Z'); const off = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' }).formatToParts(guess).find((p) => p.type === 'timeZoneName').value; const h = Number(off.replace('GMT', '') || 0); return new Date(guess.getTime() - h * 3600e3); };

const title = (e) => `${e.status === 'canceled' ? 'CANCELED: ' : ''}${e.gender} ${e.level} ${sport(e.sport)} ${e.homeAway === 'home' ? 'vs.' : 'at'} ${e.opponent}, ${dayShort(e.date)}, ${e.time}`;
const gameHtml = (e) => `<p><strong>${x(e.gender)} ${x(e.level)} ${x(sport(e.sport))}</strong> ${e.homeAway === 'home' ? 'vs.' : 'at'} ${x(e.opponent)}</p><p>${x(dayLabel(e.date))} at ${x(e.time)} · ${e.homeAway === 'home' ? 'Home' : 'Away'}<br>${x(e.venue)}${e.note ? ' · ' + x(e.note) : ''}</p>${e.status === 'canceled' ? '<p><strong>This game has been canceled.</strong></p>' : ''}<p>Latest schedule: <a href="https://woodlandsathletics.digitalsports.com">woodlandsathletics.digitalsports.com</a></p>`;

export function buildRss(events, { name, selfPath, updatedAt, today, teamKey }) {
  const base = BASE(), mon = mondayOf(today), end = addDays(today, 14);
  const upcoming = events.filter((e) => e.date >= today && e.date < end);
  const items = [];
  if (!teamKey) {
    const wk = events.filter((e) => e.date >= mon && e.date <= addDays(mon, 6));
    const digest = wk.length ? `<h3>Week of ${x(dayLabel(mon))}</h3>` + Array.from({ length: 7 }, (_, i) => addDays(mon, i)).map((d) => {
      const l = wk.filter((e) => e.date === d); return l.length ? `<h4>${x(dayLabel(d))}</h4><ul>${l.map((e) => `<li>${e.status === 'canceled' ? '<s>' : ''}${x(e.time)} ${x(e.gender)} ${x(e.level)} ${x(sport(e.sport))} ${e.homeAway === 'home' ? 'vs.' : 'at'} ${x(e.opponent)}${e.status === 'canceled' ? '</s> <strong>CANCELED</strong>' : ''}</li>`).join('')}</ul>` : '';
    }).join('') + `<p><a href="${x(base)}/poster.png?date=${mon}">View the weekly poster</a></p>` : '<p>No games this week.</p>';
    const h = createHash('sha1').update(JSON.stringify(wk.map((e) => [e.id, e.status, e.start]))).digest('hex').slice(0, 8);
    items.push({ title: `This Week's Events: ${dayShort(mon)} to ${dayShort(addDays(mon, 5))}`, guid: `week-${mon}-${h}`, link: `${base}/`, date: etInstant(mon + 'T06:00:00'), html: digest });
  }
  for (const e of upcoming) {
    items.push({ title: title(e), guid: `${e.id}-${e.status}-${e.start}`, link: `${base}/`, date: new Date(Math.min(etInstant(e.start).getTime(), Date.parse(updatedAt))), html: gameHtml(e), cat: `${e.gender} ${e.level} ${sport(e.sport)}` });
  }
  items.sort((a, b) => b.date - a.date);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${x(name)}</title><link>${x(base)}/</link>
<atom:link href="${x(base + selfPath)}" rel="self" type="application/rss+xml"/>
<description>Games, times, locations and cancellations for Woodlands Falcons teams.</description>
<language>en-us</language><lastBuildDate>${rfc(new Date(updatedAt))}</lastBuildDate><ttl>30</ttl>
${items.map((i) => `<item><title>${x(i.title)}</title><link>${x(i.link)}</link><guid isPermaLink="false">${x(i.guid)}</guid><pubDate>${rfc(i.date)}</pubDate>${i.cat ? `<category>${x(i.cat)}</category>` : ''}<description><![CDATA[${i.html.replace(/]]>/g, ']]&gt;')}]]></description></item>`).join('\n')}
</channel></rss>
`;
}
