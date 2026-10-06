// Print layouts (letter, portrait). Rendered to PDF on request from the freshest stored schedule.
const TZ = 'America/New_York';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dparse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const addDays = (iso, n) => { const d = dparse(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const mondayOf = (iso) => addDays(iso, -((dparse(iso).getUTCDay() + 6) % 7));
const dayName = (iso) => dparse(iso).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
const dayShort = (iso) => dparse(iso).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
const prose = (d) => d.toLocaleString('en-US', { timeZone: TZ, month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(' AM', ' a.m.').replace(' PM', ' p.m.').replace(', ', ', ').replace(/(\d{4}), /, '$1, at ');
const sportName = (s) => s.replace(/\bAnd\b/, 'and');

const CSS = `
@page{size:Letter;margin:0.45in 0.55in 0.75in;@bottom-left{content:var(--gen);font:7.5pt Arial,sans-serif;color:#5b5752;vertical-align:top;padding-top:6pt}@bottom-right{content:"Page " counter(page) " of " counter(pages);font:7.5pt Arial,sans-serif;color:#5b5752;vertical-align:top;padding-top:6pt}}
*{box-sizing:border-box}
body{font:10pt/1.3 "Gill Sans","Gill Sans MT","Open Sans",Arial,sans-serif;color:#2d2926;margin:0}
.band{background:#00843d;color:#fff;padding:14pt 16pt;border-radius:6pt;display:flex;justify-content:space-between;align-items:flex-end;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.band .k{font-size:8.5pt;letter-spacing:.09em;text-transform:uppercase}
.band h1{margin:2pt 0 0;font-size:20pt;line-height:1.1}
.band .r{text-align:right;font-size:11pt;font-weight:700;white-space:nowrap;padding-left:12pt}
.rule{height:4pt;background:#fecb00;margin:0 0 10pt;border-radius:0 0 3pt 3pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h2{font-size:11.5pt;margin:12pt 0 3pt;padding-bottom:2pt;border-bottom:2pt solid #00843d;break-after:avoid}
table{width:100%;border-collapse:collapse}
td,th{padding:3pt 5pt;border-bottom:.5pt solid #cfd2d3;vertical-align:top;text-align:left}
th{font-size:8pt;text-transform:uppercase;letter-spacing:.06em;color:#5b5752}
.t{font-weight:700;color:#006b31;white-space:nowrap;width:52pt}
.ha{width:44pt;font-weight:700;font-size:8.5pt;text-transform:uppercase}
.ha.home{color:#006b31}.ha.away{color:#5b5752}
.v{color:#5b5752;font-size:9pt}
tr{break-inside:avoid}
.x td{color:#6b6762}.x .team,.x .t,.x .opp{text-decoration:line-through}
.flag{display:inline-block;color:#b3261e;font-weight:700;font-size:8.5pt;text-transform:uppercase;letter-spacing:.04em;border:1pt solid #b3261e;border-radius:8pt;padding:0 5pt;margin-left:5pt}
.empty{padding:20pt 0;font-size:12pt}
footer{display:flex;justify-content:space-between;align-items:center;gap:12pt;font-size:9pt;color:#5b5752;border-top:.5pt solid #a5acaf;padding-top:8pt;margin-top:14pt;break-inside:avoid}
footer .qr{width:44pt;height:44pt;flex:none}
footer .qr svg{width:100%;height:100%}
footer b{color:#2d2926}
.note{margin-top:10pt;font-size:9pt;color:#5b5752}
`;

function shell({ title, band, body, liveUrl, generated, asOf, qr = '<!--QR-->' }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>:root{--gen:${JSON.stringify(`Generated ${prose(generated)} from schedule data as of ${prose(new Date(asOf))}`)}}${CSS}</style></head><body>
<div class="band"><div><div class="k">Greenburgh Central School District</div><h1>${esc(band.title)}</h1></div><div class="r">${esc(band.right)}</div></div><div class="rule"></div>
<main>${body}</main>
<footer><div>Schedules can change. For the latest games and cancellations, scan the code or visit <b>${esc(liveUrl.replace(/^https?:\/\//, ''))}</b><br>Generated ${esc(prose(generated))} · Soaring Together</div><div class="qr" role="img" aria-label="QR code linking to the live schedule">${qr}</div></footer>
</body></html>`;
}

const row = (e, withDate) => `<tr class="${e.status === 'canceled' ? 'x' : ''}">
  ${withDate ? `<td class="t">${esc(dayShort(e.date))}</td>` : ''}<td class="t">${esc(e.time)}</td>
  <td><span class="team"><b>${esc(e.gender)} ${esc(e.level)} ${esc(sportName(e.sport))}</b></span>${e.status === 'canceled' ? '<span class="flag">Canceled</span>' : ''}<br><span class="opp">${e.homeAway === 'home' ? 'vs' : 'at'} ${esc(e.opponent)}</span></td>
  <td class="v">${esc(e.venue)}${e.note ? '<br>' + esc(e.note) : ''}</td><td class="ha ${e.homeAway}">${e.homeAway}</td></tr>`;

export function weekHtml(events, weekStart, ctx) {
  const end = addDays(weekStart, 6);
  const wk = events.filter((e) => e.date >= weekStart && e.date <= end);
  let body = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i), list = wk.filter((e) => e.date === d);
    if (list.length) body += `<h2>${esc(dayName(d))}</h2><table><tbody>${list.map((e) => row(e, false)).join('')}</tbody></table>`;
  }
  if (!wk.length) body = '<p class="empty">No games are scheduled this week.</p>';
  const fmt = (iso, o) => dparse(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...o });
  return shell({ ...ctx, title: `This Week in Woodlands Athletics, ${fmt(weekStart, { month: 'long', day: 'numeric' })} to ${fmt(end, { month: 'long', day: 'numeric', year: 'numeric' })}`,
    band: { title: 'Woodlands Athletics: This Week', right: `${fmt(weekStart, { month: 'short', day: 'numeric' })} – ${fmt(end, { month: 'short', day: 'numeric' })}` }, body });
}

export function teamHtml(events, ctx) {
  const t = events[0];
  const body = `<table><thead><tr><th>Date</th><th>Time</th><th>Opponent</th><th>Location</th><th>H/A</th></tr></thead><tbody>${events.map((e) => row(e, true)).join('')}</tbody></table>`;
  return shell({ ...ctx, title: `${t.teamName} Schedule`, band: { title: t.teamName, right: 'Season schedule' }, body });
}
