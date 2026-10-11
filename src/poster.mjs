// "This Week's Events" poster: same look as the weekly graphic Michael posts, filled from live data.
import { addDays, mondayOf } from './print.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dparse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const md = (iso, pad) => { const d = dparse(iso); const m = d.getUTCMonth() + 1, dd = d.getUTCDate(); return pad ? `${String(m).padStart(2, '0')}/${String(dd).padStart(2, '0')}` : `${m}/${dd}`; };

const LEVEL = { V: 'V', JV: 'JV', MOD: 'Mod' };
const SPORT = { 'Swimming And Diving': 'Swim', 'Cross Country': 'XC' };
const OPP = { 'Albertus Magnus': 'Magnus', 'Charter School of Educational Excellence': 'CSEE', 'Alexander Hamilton': 'Hamilton', 'Mount Vernon': 'Mt. Vernon',
  'Yonkers Montessori Academy': 'Yonkers Montessori', 'Haldane Central': 'Haldane', 'Croton Harmon - Hen Hud': 'Croton-Harmon / Hen Hud', 'John Jay Cross River': 'John Jay' };

export function shortOpponent(name, lang) {
  if (/^multiple teams/i.test(name)) return lang === 'es' ? 'varios equipos' : 'multiple teams';
  const base = name.replace(/\s+(Middle\/High School|Jr\.\/Sr\. High School|High School|Central School District|School District|Coop|School)$/i, '').trim();
  return OPP[base] || OPP[name] || base;
}

const SP_ES = { 'Cross Country': 'Cross country', 'Football': 'Fútbol americano', 'Soccer': 'Fútbol', 'Swimming And Diving': 'Natación', 'Tennis': 'Tenis', 'Volleyball': 'Voleibol', 'Basketball': 'Baloncesto', 'Baseball': 'Béisbol', 'Softball': 'Sóftbol', 'Track': 'Atletismo', 'Golf': 'Golf', 'Bowling': 'Boliche', 'Fencing': 'Esgrima', 'Flag Football': 'Fútbol bandera', 'Wrestling': 'Lucha', 'Lacrosse': 'Lacrosse' };
const GEN_ES = { 'Boys': 'chicos', 'Girls': 'chicas', 'Boys & Girls': '' };
const LV_ES = { V: 'V', JV: 'JV', MOD: 'Mod' };
const tmOf = (iso) => { const h = +iso.slice(11, 13), m = iso.slice(14, 16); return `${h % 12 || 12}${m === '00' ? '' : ':' + m}\u00a0${h < 12 ? 'AM' : 'PM'}`; };
export function entry(e, lang) {
  const es = lang === 'es';
  const gender = e.gender === 'Boys & Girls' ? '' : e.gender + ' ';
  const label = es ? `${SP_ES[e.sport] || e.sport} ${LV_ES[e.levelCode]} ${GEN_ES[e.gender] ?? ''}`.replace(/\s+/g, ' ').trim() : `${LEVEL[e.levelCode]} ${gender}${SPORT[e.sport] || e.sport}`.replace(/\s+/g, ' ');
  let where = shortOpponent(e.opponent, lang);
  if (e.homeAway === 'away' && e.sport === 'Cross Country' && /cortlandt/i.test(e.venue)) where = 'Van Cortlandt Park';
  return { label, line2: `${e.homeAway === 'home' ? 'vs.' : '@'} ${where}`, time: tmOf(e.start), home: e.homeAway === 'home', canceled: e.status === 'canceled' };
}

const RANK = { V: 0, JV: 1, MOD: 2 };
const CSS = `
*{box-sizing:border-box;margin:0}
@page{size:11in 8.5in;margin:0}
@media print{html{zoom:.6083}}
html,body{height:1341px}body{display:flex;flex-direction:column;width:1736px;overflow:hidden;background:#00583f;font-family:"Gill Sans","Gill Sans MT",Inter,Arial,sans-serif;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.hero{height:300px;position:relative;overflow:hidden;background:#06261c url(__A__/streaks.jpg) center/cover}
.hero>*{position:absolute}
.logo{left:36px;top:20px;width:300px}
.title{left:370px;width:600px;top:30px;text-align:center;font:900 62px/1.02 "Inter Display",Inter,sans-serif;letter-spacing:-.01em;text-shadow:0 4px 10px rgba(0,0,0,.55)}
.title .dates{display:block;white-space:nowrap;font-size:64px;margin-top:2px}
.legend{left:430px;top:232px;width:480px;display:flex;justify-content:space-between;align-items:center;font:900 40px "Inter Display",Inter,sans-serif;text-shadow:0 3px 8px rgba(0,0,0,.6)}
.legend span{display:flex;align-items:center;gap:14px}
.legend i{width:28px;height:28px;border-radius:50%;display:block}
.legend .h i{background:#fff}.legend .a{color:#fecb00}.legend .a i{background:#fecb00}
.rule{left:1030px;top:40px;width:3px;height:220px;background:#6cc24a}
.contact{left:1060px;width:640px;top:78px;text-align:center;font:800 30px/1.2 "Inter Display",Inter,sans-serif;text-transform:uppercase;text-shadow:0 2px 6px rgba(0,0,0,.6)}
.contact a{display:block;margin-top:4px;color:#6cc24a;font-weight:700;text-transform:none;text-decoration:underline;font-size:30px}
.grid{flex:1;min-height:0;grid-template-rows:auto 1fr;display:grid;border:3px solid #0b0b0b;border-top:0;background:#0b0b0b;gap:3px}
.dh{background:#00604a;text-align:center;padding:10px 8px 8px;font:900 34px/1.05 "Inter Display",Inter,sans-serif;text-transform:uppercase}
.dh span{display:block;font-size:32px}
.col{padding:14px 6px 14px;display:flex;flex-direction:column;gap:var(--gap);align-items:center;min-height:0;overflow:hidden}
.col.d{background:#005a45}.col.l{background:#004d3c}
.g{margin:auto 0;text-align:center;font:800 var(--fs)/1.18 Inter,Arial,sans-serif;letter-spacing:-.02em}
.g .t{display:block}
.g.away{color:#fecb00}.g.home{color:#fff}
.g.x.home{color:#e3f2ea}.g.x.away{color:#ffe27a}.g.x .a1,.g.x .a2,.g.x .t{text-decoration:line-through}
.g .flag{display:inline-block;margin-top:3px;font:800 .66em/1 Inter,sans-serif;letter-spacing:.06em;color:#fff;background:#a31f18;padding:4px 9px;border-radius:5px;text-decoration:none}
.none{margin:auto;font:600 26px Inter;color:#b5d9c8}
.foot{text-align:center;padding:10px 20px 14px;font:800 26px/1.2 "Inter Display",Inter,sans-serif;text-transform:uppercase}
.foot a{display:block;color:#fecb00;text-transform:none;text-decoration:underline;font-weight:700}
.key{font:600 17px/1.3 Inter,Arial,sans-serif;text-transform:none;color:#d4eadd;margin-top:6px}.stamp{font:500 14px Inter;color:#b5d9c8;text-transform:none;margin-top:3px}
`;

export function posterHtml(events, weekStart, { assets = '/poster', showCanceled = true, generated, asOf, lang = 'en' } = {}) {
  const es = lang === 'es';
  let days = [0, 1, 2, 3, 4, 5].map((i) => addDays(weekStart, i));
  const sun = addDays(weekStart, 6);
  if (events.some((e) => e.date === sun)) days.push(sun);
  const by = Object.fromEntries(days.map((d) => [d, events.filter((e) => e.date === d && (showCanceled || e.status !== 'canceled')).sort((a, b) => a.start.localeCompare(b.start) || RANK[a.levelCode] - RANK[b.levelCode] || a.teamName.localeCompare(b.teamName)).map((e) => entry(e, lang))]));
  const maxN = Math.max(...Object.values(by).map((l) => l.length), 1);
  const AVAIL = 1341 - 300 - 62 - 112 - 36; // page - hero - day header - footer - col padding
  const need = (f) => Math.max(...Object.values(by).map((l) => l.reduce((a, g) => a + f * 3.54 + (g.canceled ? f * 0.95 : 0), 0) + Math.max(0, l.length - 1) * 8), 0);
  let fs = 30; while (fs > 15 && need(fs) > AVAIL) fs -= 1;
  const gap = 8;
  const names = es ? ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'] : ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT', 'SUN'];
  const last = days[days.length - 1];
  const body = days.map((d, i) => `<div class="col ${i % 2 ? 'l' : 'd'}">${by[d].length ? by[d].map((g) => `<div class="g ${g.home ? 'home' : 'away'} ${g.canceled ? 'x' : ''}"><span class="a1 t">${esc(g.label)}</span><span class="a2 t">${esc(g.line2)}</span><span class="t">${esc(g.time)}</span>${g.canceled ? `<span class="flag">${es ? 'CANCELADO' : 'CANCELED'}</span>` : ''}</div>`).join('') : '<p class="none">' + (es ? 'Sin juegos' : 'No games') + '</p>'}</div>`).join('');
  const stamp = generated ? (es ? `Generado ${generated}${asOf ? ` con datos del calendario al ${asOf}` : ''}` : `Generated ${generated}${asOf ? ` from schedule data as of ${asOf}` : ''}`) : '';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${es ? 'Eventos de esta semana' : "This Week's Events"} ${md(weekStart, true)}-${md(last, true)}, Woodlands Falcons Athletics</title><style>${CSS.replace('__A__', assets)}.col{--fs:${fs}px;--gap:${gap}px}</style></head><body>
<div class="hero">
 <img class="logo" src="${assets}/falcons_logo.png" alt="Woodlands Falcons">
 <h1 class="title">${es ? 'Eventos de<br>esta semana' : 'This Week’s<br>Events'}<span class="dates">${md(weekStart, true)}-${md(last, true)}</span></h1>
 <div class="legend"><span class="h"><i></i>${es ? 'Local' : 'Home'}</span><span class="a"><i></i>${es ? 'Visitante' : 'Away'}</span></div>
 <div class="rule"></div>
 <div class="contact">${es ? 'Preguntas: comunícate con<br>Michael McCoy<br>914-761-6052 ext.3014' : 'Questions please contact<br>Michael McCoy<br>914-761-6052 ext.3014'}<a href="mailto:mmccoy@greenburghcsd.org">mmccoy@greenburghcsd.org</a></div>
</div>
<div class="grid" style="grid-template-columns:repeat(${days.length},1fr)">${days.map((d, i) => `<div class="dh">${names[i]}<span>${md(d)}</span></div>`).join('')}${body.replace(/<div class="col/g, '<div class="col')}</div>
<div class="foot">${es ? 'Los calendarios pueden cambiar. Para la información más reciente, visita:' : 'Schedules are subject to change. For the most up to date information visit:'}<a href="https://woodlandsathletics.digitalsports.com">woodlandsathletics.digitalsports.com</a><div class="key">${es ? 'V = Varsity · JV = Junior Varsity · Mod = Modificado' : 'V = Varsity · JV = Junior Varsity · Mod = Modified · XC = Cross Country'}</div><div class="stamp">${esc(stamp)}</div></div>
<script>(function(){var c=[].slice.call(document.querySelectorAll('.col')),f=parseFloat(getComputedStyle(c[0]).getPropertyValue('--fs'));function wr(){return [].some.call(document.querySelectorAll('.g .t'),function(e){return e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).fontSize)*1.5})}function ov(){return (f>27.5&&wr())||c.some(function(x){return x.scrollHeight>x.clientHeight+1})}while(ov()&&f>14){f-=0.5;document.querySelectorAll('.col').forEach(function(x){x.style.setProperty('--fs',f+'px')})}})();</script>
</body></html>`;
}
