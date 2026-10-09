/*! Woodlands Falcons Athletics widget. Paste into an Edlio embed:
 *  <div data-gcsd-athletics data-theme="spirit"></div>
 *  <script src=".../widget.js"><\/script>
 *  data-theme: "spirit" (lightly expressive, the default) or "classic" (conservative). Data comes from schedule.json next to this file. */
(function () {
  'use strict';
  var TZ = 'America/New_York';
  var SCRIPT = document.currentScript;
  var BASE = SCRIPT && SCRIPT.src ? SCRIPT.src.replace(/[^/]*$/, '') : '';
  var PORTAL = 'https://woodlandsathletics.digitalsports.com';
  var CONTACT = { name: 'Michael McCoy', phone: '914-761-6052 ext. 3014', email: 'mmccoy@greenburghcsd.org' };

  /* ---------- small helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nyToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date()); }
  function parse(iso) { var p = iso.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function addDays(iso, n) { var d = parse(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function mondayOf(iso) { return addDays(iso, -((parse(iso).getUTCDay() + 6) % 7)); }
  function fmt(iso, o) { return parse(iso).toLocaleDateString('en-US', Object.assign({ timeZone: 'UTC' }, o)); }
  function prose(iso) { return new Date(iso).toLocaleString('en-US', { timeZone: TZ, month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(' AM', ' a.m.').replace(' PM', ' p.m.'); }
  function sportName(s) { return s.replace(/\bAnd\b/, 'and'); }
  function school(n) { return n.replace(/\s+(Middle\/High School|Jr\.\/Sr\. High School|High School|Central School District|School District)$/i, ''); }
  function teamLabel(e) { return e.gender + ' ' + e.level + ' ' + sportName(e.sport); }
  function vs(e) { return (e.homeAway === 'home' ? 'vs. ' : 'at ') + school(e.opponent); }
  function store(key, val) {
    try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; }
  }

  /* ---------- single-game calendar file ---------- */
  function icsFor(e) {
    function loc(s) { return s.replace(/[-:]/g, '').slice(0, 15); }
    var end = e.endKnown === false ? (function () { var d = new Date(e.start + 'Z'); d.setUTCMinutes(d.getUTCMinutes() + 90); return d.toISOString().slice(0, 19); })() : e.end;
    function t(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GCSD//Woodlands Athletics//EN', 'BEGIN:VEVENT',
      'UID:' + e.id + '@athletics.greenburghcsd.org', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
      'DTSTART;TZID=America/New_York:' + loc(e.start), 'DTEND;TZID=America/New_York:' + loc(end),
      'SUMMARY:' + t(teamLabel(e) + ' ' + vs(e)), 'LOCATION:' + t(e.venue), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }

  /* ---------- styles (inside the shadow root, so Edlio's CSS cannot touch them) ---------- */
  var CSS = [
    ':host{display:block;all:initial;display:block}',
    '*{box-sizing:border-box}',
    '.w{--green:#00843d;--green-dk:#006b31;--green-lt:#6cc24a;--green-10:#e8f4ed;--green-20:#cfe8d9;--gray:#a5acaf;--gray-10:#f4f5f5;--gray-30:#dcdfe0;--ink:#2d2926;--ink-2:#5b5752;--yellow:#fecb00;--red:#b3261e;--red-10:#fbeceb;',
    '--bg:#fff;--card:#fff;--mus:#7a5800;--away-bg:#fff8d6;--away-bd:#e3c030;--home-bg:#f2f9f5;--home-bd:#a9d4bb;--x-bd:#e7aaa5;--red-ink:var(--red-ink);--ink-3:var(--ink-3);',
    'font:16px/1.4 "Gill Sans","Gill Sans MT","Open Sans",Arial,sans-serif;color:var(--ink);background:var(--bg);position:relative}',
    '.w.dark{--green-dk:#7fd05a;--green-10:#16291f;--green-20:#254d36;--gray:#6b7570;--gray-10:#1c2421;--gray-30:#34403b;--ink:#eceeed;--ink-2:#b5bdb8;--red:#ff8f86;--red-10:#3a1b19;--bg:#101614;--card:#18201d;--mus:#f2c94c;--away-bg:#2a2410;--away-bd:#8a7016;--home-bg:#13241b;--home-bd:#2c6445;--x-bd:#7d3b36;--red-ink:#ffc2bc;--ink-3:#9aa39e;color-scheme:dark}',
    '.w.dark .toast,.w.dark .tag.chg{background:#eceeed;color:#101614;border-color:#eceeed}',
    '.main{max-width:760px;margin:0 auto}',
    '.main.wide{max-width:1040px}',
    'button{font:inherit;color:inherit;cursor:pointer}',
    'a{color:var(--green-dk)}',
    ':focus-visible{outline:3px solid var(--ink);outline-offset:2px}',
    '.hero{container-type:inline-size;position:relative;overflow:hidden;background:#0b3d24;border-bottom:3px solid var(--green)}',
    '.hero-bg{position:absolute;left:0;right:0;top:-18px;bottom:-18px;background:#0b3d24 var(--bg-img) center/cover no-repeat;will-change:transform}',
    '.hero-in{position:relative;display:flex;flex-direction:column;align-items:center;--h:clamp(62px,17cqw,150px);padding:calc(var(--h) * .2) 16px calc(var(--h) * .14)}',
    '.logos{display:flex;align-items:center;justify-content:center;gap:calc(var(--h) * .07)}',
    '.hero-in img{display:block;height:var(--h);width:auto;flex:none;max-width:none}',
    '.hero-in img.wm{height:calc(var(--h) * .66)}',
    '.hero-up{margin:calc(var(--h) * .1) 0 0;text-align:center;color:#fff;font-size:clamp(11px,1.2cqw + 5px,14px);letter-spacing:.05em;text-transform:uppercase;line-height:1.3;text-shadow:0 1px 3px rgba(0,0,0,.65)}',
    '.hero-up .tm{white-space:nowrap}',
    '.hero-up b{display:inline;margin-right:.45em;font:inherit;letter-spacing:inherit;text-transform:inherit;font-weight:inherit;color:inherit;opacity:1}',
    '.spirit .hero{border-bottom:6px solid var(--yellow)}',
    '.intro{padding:14px 16px 12px;border-bottom:1.5px solid var(--gray-30)}',
    '.intro h1{margin:0;font-size:20px;line-height:1.2}',
    '.intro p{margin:3px 0 0;font-size:14px;color:var(--ink-2)}',
    '.hd{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;padding:14px 16px 12px;border-bottom:3px solid var(--green)}',
    '.hd h2{margin:0;font-size:19px;line-height:1.15}',
    '.hd .up{font-size:13px;color:var(--ink-2);white-space:nowrap}',
    '.banner{margin:12px 16px 12px;padding:10px 12px;border-radius:8px;background:var(--red-10);border:1.5px solid var(--red);color:var(--red-ink);font-size:15px}',
    '.banner b{display:block}',
    '.banner ul{margin:4px 0 0;padding-left:18px}',
    '.hlbox{position:relative;padding-right:44px}',
    '.hlre{margin:8px 16px 0}.hlre .chip{min-height:36px;font-size:13.5px}',
    '.hlbox .xb{position:absolute;top:0;right:0;width:44px;height:44px;border:0;background:none;font-size:26px;line-height:1;color:inherit}',
    '.hlbox ul{list-style:none;padding-left:0;margin:2px 0 0}',
    '.hlbox li.sh{font-weight:700;margin-top:6px}',
    '.hlbox ul:not(.open) li:nth-child(n+2){display:none}',
    '.hlbox ul:not(.open) li:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.hlbox .lnk{padding:2px 0;min-height:36px}',
    '.next.hlbox button.nb{padding:6px 0;min-height:36px;width:100%;text-align:left;border:0;background:none;font-size:15px;line-height:1.3;white-space:inherit;overflow:hidden;text-overflow:ellipsis}',
    '.mode{position:absolute;top:8px;right:8px;width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.6);background:rgba(0,0,0,.4);color:#fff;font-size:20px;line-height:1;z-index:1}',
    '.stripw{padding:8px 0 0}',
    '.shead{display:flex;align-items:center;justify-content:space-between;padding:0 14px 2px}',
    '.smon{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2)}',
    '.shead .lnk{font-size:13.5px}',
    '.strip{display:flex;align-items:stretch;gap:4px;padding:4px 8px 8px}',
    '.srow{position:relative;flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;padding:2px 2px 4px;scroll-padding-inline:2px}',
    '.srow::-webkit-scrollbar{display:none}',
    '.srow .day{flex:0 0 calc((100% - 24px) / 5.25);scroll-snap-align:center;min-width:44px}@media (min-width:640px){.srow .day{flex-basis:calc((100% - 36px) / 7)}}',
    '.srow .day.m1{margin-left:6px}',
    '.wk{border:0;background:none;width:32px;font-size:22px;color:var(--green-dk);border-radius:8px}',
    '.day{border:1.5px solid var(--gray-30);background:var(--card);border-radius:10px;padding:6px 0 7px;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;line-height:1.1}',
    '.day small{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-2)}',
    '.day strong{font-size:28px}',
    '.day i{display:block;height:6px;width:6px;border-radius:50%;background:var(--green);margin-top:2px}',
    '.day i.none{background:transparent}',
    '.day[aria-pressed=true]{background:var(--green);border-color:var(--green);color:#fff}',
    '.day[aria-pressed=true] small{color:#fff}',
    '.day[aria-pressed=true] i{background:#fff}',
    '.day.is-today:not([aria-pressed=true]){border-color:var(--green);box-shadow:inset 0 0 0 1px var(--green)}',
    '.vt{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:12px 16px 2px;padding:3px;border-radius:12px;background:var(--gray-10);border:1.5px solid var(--gray-30)}',
    '.vt button{border:0;background:transparent;min-height:40px;border-radius:9px;font-weight:700;font-size:14.5px;color:var(--ink-2)}',
    '.vt button[aria-pressed=true]{background:var(--green);color:#fff}',
    '.mhead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px 6px}',
    '.mhead h3{margin:0;font-size:19px}',
    '.mhead .arrows{display:flex;gap:6px}',
    '.mhead .wk{width:44px}',
    '.wk[disabled]{opacity:.35;cursor:default}',
    '.mcal{container-type:inline-size;padding:4px 8px 0}',
    '.mt{width:100%;border-collapse:separate;border-spacing:3px;table-layout:fixed}',
    '.mt th{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-2);font-weight:700;padding:4px 0}',
    '.mt td{padding:0;vertical-align:top}',
    '.cell{display:flex;flex-direction:column;align-items:stretch;width:100%;height:100%;min-height:58px;border:1.5px solid var(--gray-30);background:var(--card);border-radius:9px;padding:5px 4px 5px;text-align:left;line-height:1.15;overflow:hidden}',
    '.cell .n{display:block;font-size:14px;font-weight:700;text-align:center}',
    '.out .cell{background:var(--gray-10);color:#8a8680}',
    '.cell.is-today .n{display:inline-block;min-width:24px;padding:1px 0;border-radius:12px;background:var(--green);color:#fff;text-align:center}',
    '.cell[aria-pressed=true]{border-color:var(--green);box-shadow:inset 0 0 0 2px var(--green)}',
    '.dots{display:flex;flex-wrap:wrap;justify-content:center;gap:3px;margin-top:5px;min-height:8px}',
    '.dots i{width:8px;height:8px;border-radius:50%;background:var(--green);border:1.5px solid var(--green)}',
    '.dots i.a{background:var(--yellow);border-color:var(--away-bd)}',
    '.dots i.x{background:var(--card);border-color:var(--red)}',
    '.chips{display:none;min-width:0}',
    '.chips .c{display:block;margin-top:3px;padding:2px 4px;border-radius:5px;border-left:4px solid var(--green);background:var(--green-10);font-size:11.5px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.chips .c small{display:block;font-size:10.5px;color:var(--ink-2);overflow:hidden;text-overflow:ellipsis}',
    '.chips .c.a{border-left-color:var(--away-bd);background:var(--away-bg)}',
    '.chips .c.x{border-left-color:var(--red);background:var(--red-10);text-decoration:line-through;color:var(--red-ink)}',
    '.chips .c b{font-weight:700}',
    '.chips .more{display:block;text-align:left;margin-top:3px;font-size:11.5px;font-weight:700;color:var(--green-dk)}',
    '@container (min-width:600px){.dots{display:none}.chips{display:block}.cell{min-height:112px;padding:6px 5px}.cell .n{text-align:left;font-size:13px}.cell.is-today .n{padding:1px 7px}}',
    '.legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:8px 16px 0;font-size:13px;color:var(--ink-2)}',
    '.legend span{display:inline-flex;align-items:center;gap:6px}',
    '.legend i{width:10px;height:10px;border-radius:50%;background:var(--green);border:1.5px solid var(--green)}',
    '.legend i.a{background:var(--yellow);border-color:var(--away-bd)}.legend i.x{background:var(--card);border-color:var(--red)}',
    '.tag.chg{background:var(--ink);border:1.5px solid var(--ink);color:#fff}',
    '.t .was{display:block;font-size:11.5px;font-weight:600;color:var(--ink-2);text-decoration:line-through;line-height:1.2}',
    '.g.chg{outline:2px solid var(--ink);outline-offset:-2px}',
    '.cd{display:block;margin-top:2px;font-size:14px;font-weight:700;color:var(--green-dk)}',
    '.wx{display:block;margin-top:2px;font-size:13.5px;color:var(--ink-2)}',
    '.wx.wet{color:var(--ink);font-weight:700}',
    '.subr{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}',
    '.lnk{border:0;background:none;padding:6px 2px;min-height:32px;color:var(--green-dk);font-weight:700;font-size:14px;text-decoration:underline;cursor:pointer}',
    '.next{margin:12px 16px 4px;padding:12px 14px;border-radius:12px;background:var(--green-10);border:1.5px solid var(--green)}',
    '.next h3{margin:0 0 4px;font-size:16px}',
    '.next ul{list-style:none;margin:0;padding:0;display:grid;gap:2px}',
    '.next button{width:100%;text-align:left;border:0;background:none;padding:8px 0;min-height:44px;font-size:15px;line-height:1.3}',
    '.next b{color:var(--green-dk)}',
    '.stale{margin:12px 16px 0;padding:10px 12px;border-radius:10px;background:var(--gray-10);border:1.5px solid var(--ink);font-size:14.5px}',
    '.toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);max-width:90%;padding:10px 16px;border-radius:999px;background:var(--ink);color:#fff;font-weight:700;font-size:14.5px;z-index:5;box-shadow:0 4px 14px rgba(0,0,0,.25)}',
    '.fsum{margin:0 16px 6px;padding:8px 12px;border-radius:10px;background:var(--gray-10);font-size:14px}',
    '.seg3{display:inline-flex;border:1.5px solid var(--gray);border-radius:999px;overflow:hidden;background:var(--card)}',
    '.seg3 button{border:0;background:none;min-height:40px;padding:0 13px;font-size:14px;font-weight:600}',
    '.seg3 button[aria-pressed=true]{background:var(--green);color:#fff}',
    '.panel{margin:4px 16px 10px;padding:12px;border:1.5px solid var(--gray-30);border-radius:12px;background:var(--card);display:grid;gap:10px}',
    '.panel .note0{margin:0;font-size:14px;color:var(--ink-2)}',
    '.panel fieldset{margin:0;padding:0;border:0}',
    '.panel legend{display:flex;align-items:center;justify-content:space-between;width:100%;font-weight:700;padding:0 0 2px}',
    '.ck{display:inline-flex;align-items:center;gap:8px;min-height:44px;margin:0 14px 0 0;font-size:15px}',
    '.ck input{width:22px;height:22px;accent-color:var(--green)}',
    '.wgw{container-type:inline-size;padding:4px 12px 0}',
    '.wgrid{display:grid;gap:8px}',
    '.wd{border:1.5px solid var(--gray-30);border-radius:10px;padding:8px;background:var(--card)}',
    '.wd.none{display:none}',
    '.wd.is-today{border-color:var(--green);box-shadow:inset 0 0 0 1px var(--green)}',
    '.wd h4{margin:0 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-2)}',
    '.wd h4 b{font-size:18px;color:var(--ink)}',
    '.wd ul{list-style:none;margin:0;padding:0;display:grid;gap:5px}',
    '.wd .nog{margin:0;font-size:13px;color:var(--ink-2)}',
    '.wc{display:block;width:100%;text-align:left;padding:6px 8px;border-radius:7px;border:0;border-left:5px solid var(--green);background:var(--green-10);font-size:13.5px;line-height:1.25;min-height:44px}',
    '.wc.a{border-left-color:var(--away-bd);background:var(--away-bg)}',
    '.wc.x{border-left-color:var(--red);background:var(--red-10);color:var(--red-ink)}',
    '.wc.x b,.wc.x{text-decoration:none}',
    '.wc small{display:block;font-size:12px;color:var(--ink-2)}',
    '@container (min-width:640px){.wgrid{grid-template-columns:repeat(7,minmax(0,1fr))}.wd.none{display:block;background:var(--gray-10)}.wd{min-height:150px}}',
    '.legend .pr{margin-left:auto}',
    'details{border-top:1px solid var(--gray-30);padding:6px 0}',
    'summary{cursor:pointer;font-weight:700;min-height:40px;display:flex;align-items:center}',
    'details ol{margin:4px 0 8px;padding-left:22px;display:grid;gap:6px;font-size:15px}',
    '.team.hl{background:var(--green-10)}',
    '.team .nm .lnk{margin-left:8px;font-size:13px;font-weight:600}',
    '.sub{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 16px 4px}',
    '.sub h3{margin:0;font-size:17px}',
    '.chip{border:1.5px solid var(--gray);background:var(--card);border-radius:999px;min-height:40px;padding:0 14px;font-size:14px;font-weight:600}',
    '.chip[aria-pressed=true]{background:var(--green);border-color:var(--green);color:#fff}',
    '.list{list-style:none;margin:0;padding:0 16px}',
    '.g{border-bottom:1px solid var(--gray-30)}',
    '.gb{width:100%;text-align:left;border:0;background:none;display:grid;grid-template-columns:72px 1fr auto;gap:10px;padding:13px 0;align-items:start}',
    '.t{font-weight:700;font-size:17px;color:var(--green-dk);font-variant-numeric:tabular-nums}',
    '.who{font-weight:700;display:block}',
    '.opp{display:block;margin-top:1px}',
    '.tags{display:flex;flex-direction:column;align-items:flex-end;gap:4px}',
    '.tag{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:3px 9px;border-radius:999px;white-space:nowrap}',
    '.tag.home{background:var(--green-10);border:1.5px solid var(--green);color:var(--green-dk)}',
    '.tag.away{background:var(--away-bg);border:1.5px solid var(--away-bd);color:var(--mus)}',
    '.tag.x{background:var(--red-10);border:1.5px solid var(--red);color:var(--red)}',
    '.g.cx .t,.g.cx .who,.g.cx .opp{text-decoration:line-through;color:var(--ink-3)}',
    '.g.away .t,.g.away .cd{color:var(--mus)}',
    '.g.cx .t{color:var(--red)}',
    '.wc.a b,.chips .c.a b{color:var(--mus)}',
    '.wc.x b,.chips .c.x b{color:var(--red)}',
    '.more{padding:0 0 14px 82px;display:grid;gap:10px}',
    '.more p{margin:0;font-size:15px;color:var(--ink-2)}',
    '.acts{display:flex;flex-wrap:wrap;gap:8px}',
    '.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid var(--green);background:var(--card);color:var(--green-dk);font-weight:700;font-size:15px;text-decoration:none}',
    '.btn.fill{background:var(--green);color:#fff}',
    '.star{font-size:20px;line-height:1;margin-right:6px}',
    '.empty{margin:18px 16px;padding:18px;border-radius:12px;background:var(--gray-10);font-size:17px}',
    '.empty .btn{margin-top:12px}',
    '.dayh{margin:0;padding:16px 16px 6px;font-size:16px;display:flex;align-items:center;gap:8px}',
    '.pill{background:var(--yellow);color:#2d2926;font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding:2px 8px;border-radius:999px}',
    '.filters{padding:0 16px 6px;display:flex;flex-wrap:wrap;gap:6px}',
    '.grp{margin:0;padding:16px 16px 4px;font-size:13px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-2)}',
    '.team{display:grid;grid-template-columns:44px 1fr auto;gap:6px;align-items:center;padding:6px 16px;border-bottom:1px solid var(--gray-30);min-height:62px}',
    '.team .nm{font-weight:700}.team .nx{display:block;font-size:14px;color:var(--ink-2)}',
    '.sbtn{width:44px;height:44px;border:0;background:none;font-size:26px;color:var(--gray);border-radius:50%}',
    '.sbtn[aria-pressed=true]{color:#c99a00}',
    '.card{margin:12px 16px;padding:14px;border:1.5px solid var(--gray-30);border-radius:12px;display:grid;gap:8px}',
    '.card h3{margin:0;font-size:17px}.card p{margin:0;color:var(--ink-2);font-size:15px}',
    '.note{padding:14px 16px 0;font-size:14px;color:var(--ink-2)}',
    '.pad{height:84px}',
    '.nav{position:sticky;bottom:0;display:grid;grid-template-columns:repeat(4,1fr);background:var(--card);border-top:1.5px solid var(--gray-30);box-shadow:0 -4px 14px rgba(0,0,0,.06);z-index:2}',
    '.nav button{border:0;background:none;min-height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12.5px;font-weight:700;color:var(--ink-2)}',
    '.nav svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
    '.nav button[aria-current=page]{color:var(--green-dk);box-shadow:inset 0 3px 0 var(--green)}',
    '.loading{padding:30px 16px;color:var(--ink-2)}',
    '.si{width:30px;height:30px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
    '.grp{display:flex;align-items:center;gap:10px}',
    '.grp .si{width:34px;height:34px;padding:4px;border:1.5px solid currentColor;border-radius:50%}',
    '.panel .sp{display:flex;align-items:center;gap:8px}.panel .sp .si{width:26px;height:26px}',
    '.nav{grid-template-columns:repeat(5,1fr)}',
    '.set{margin:12px 16px;padding:14px;border:1.5px solid var(--gray-30);border-radius:12px;display:grid;gap:10px}',
    '.set h3{margin:0;font-size:17px}.set p{margin:0;color:var(--ink-2);font-size:15px}',
    '.set .acts .chip{min-height:44px}',
    '.set .chip[aria-pressed=true]{background:var(--green);border-color:var(--green);color:#fff}',
    '.sw{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px}',
    '.mt1{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;border-top:1px solid var(--gray-30)}',
    '.tx1 .main{zoom:1.2}.tx2 .main{zoom:1.4}.tx1 .toast{font-size:17px}.tx2 .toast{font-size:20px}',
    '.hc{--ink:#000;--ink-2:#1f1f1f;--gray:#4a4a4a;--gray-30:#6e6e6e;--mus:#5a4000;--away-bg:#fff;--home-bg:#fff;--red-10:#fff;--green-10:#fff;--home-bd:#006b31;--away-bd:#8a6300;--x-bd:#b3261e;--ink-3:#333}',
    '.hc.dark{--ink:#fff;--ink-2:#f2f2f2;--gray:#bdbdbd;--gray-30:#9a9a9a;--mus:#ffd84a;--away-bg:#000;--home-bg:#000;--red-10:#000;--green-10:#000;--bg:#000;--card:#000;--home-bd:#7fd05a;--away-bd:#f2c94c;--x-bd:#ff8f86;--ink-3:#ddd}',
    '.hc .g,.hc .card,.hc .set,.hc .day{border-width:2px}',
    '.hc .cd,.hc .wx{font-weight:800}',
    '.rm *{animation:none!important;transition:none!important;scroll-behavior:auto!important}',

    /* lightly expressive look */
    '.spirit .hd{background:var(--green);color:#fff;border-bottom:6px solid var(--yellow);padding:18px 16px 14px}',
    '.spirit .hd h2{font-size:24px;text-transform:uppercase;letter-spacing:.03em;font-weight:900}',
    '.spirit .hd .up{color:#d8efe2}',
    '.spirit .stripw{background:#0b3d2b}',
    '.spirit .smon{color:#cfe8d9}',
    '.spirit .shead .lnk{color:var(--yellow)}',
    '.spirit .strip{padding:4px 8px 12px}',
    '.spirit .wk{color:#fff}',
    '.spirit .day{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22);color:#fff}',
    '.spirit .day small{color:#cfe8d9}',
    '.spirit .day i{background:var(--yellow)}',
    '.spirit .day[aria-pressed=true]{background:var(--yellow);border-color:var(--yellow);color:#2d2926}',
    '.spirit .day[aria-pressed=true] small{color:#2d2926}.spirit .day[aria-pressed=true] i{background:#2d2926}',
    '.spirit .day.is-today:not([aria-pressed=true]){border-color:var(--yellow);box-shadow:none}',
    '.spirit .sub h3,.spirit .dayh{text-transform:uppercase;letter-spacing:.04em}',
    '.spirit .g{margin:8px 0;border:1.5px solid var(--gray-30);border-left:6px solid var(--gray);border-radius:10px;padding:0 12px}',
    '.spirit .g.home{background:var(--home-bg);border-color:var(--home-bd);border-left-color:var(--green)}',
    '.spirit .g.away{background:var(--away-bg);border-color:var(--away-bd);border-left-color:var(--yellow)}',
    '.spirit .g.cx{background:var(--red-10);border-color:var(--x-bd);border-left-color:var(--red)}',
    '.spirit .gb{padding:12px 0}',
    '.spirit .t{font-size:19px}',
    '.spirit .more{padding-left:82px}',
    '.spirit .day i.none{background:transparent}',
    '.spirit .nav button[aria-current=page]{box-shadow:inset 0 4px 0 var(--yellow);color:var(--green-dk)}',
    '.spirit .grp{color:var(--green-dk)}',
    '@media (max-width:420px){.intro h1{font-size:18px}.gb{grid-template-columns:66px 1fr auto}.spirit .t{font-size:18px}.team .btn{min-height:40px;padding:0 10px;font-size:14px}.strip{gap:2px;padding-inline:4px}.wk{width:26px}.more{padding-left:0}}',
    '@media (prefers-reduced-motion:no-preference){.g{transition:background .15s}}',
    '@media (prefers-reduced-motion:no-preference){',
    '.srow{scroll-behavior:smooth}',
    '.fx{animation:gc-rise .24s cubic-bezier(.2,.7,.2,1) both}',
    '.more.pop{animation:gc-rise .2s cubic-bezier(.2,.7,.2,1) both}',
    '.toast{animation:gc-rise .22s cubic-bezier(.2,.7,.2,1) both}',
    '.day,.btn,.chip,.wk,.gb,.wc,.cell,.vt button,.seg3 button,.nav button,.sbtn{transition:background-color .18s ease,border-color .18s ease,color .18s ease,transform .12s ease,box-shadow .18s ease}',
    '.day:active,.btn:active,.chip:active,.wk:active,.wc:active,.cell:active,.vt button:active,.nav button:active{transform:scale(.97)}',
    '.gb:active{background:var(--gray-10)}',
    '@keyframes gc-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '}'
  ].join('\n');

  /* outlined sport icons, one per sport the portal lists; falls back to a trophy */
  var SI = {
    baseball: '<circle cx="12" cy="12" r="8.800"/><path d="M5.800 6.200c2.500 2.700 2.500 8.900 0 11.600M18.200 6.200c-2.500 2.700-2.500 8.900 0 11.600M5.600 9.300l2 .6M5.900 12.200l2.100.1M5.700 15l2-.7M18.400 9.300l-2 .6M18.100 12.200l-2.100.1M18.300 15l-2-.7"/>',
    softball: '<path d="M12 3.500l8.500 8.500-8.500 8.500L3.500 12z"/><circle cx="12" cy="12" r="1.600"/><path d="M12 20.500v0M10.200 18.700l1.800 1.800 1.800-1.800"/>',
    basketball: '<circle cx="12" cy="12" r="8.500"/><path d="M12 3.500v17M3.500 12h17M6 6.200c3.200 3.200 3.200 8.400 0 11.600M18 6.200c-3.200 3.200-3.200 8.400 0 11.600"/>',
    bowling: '<circle cx="9" cy="15" r="5.500"/><circle cx="7.600" cy="13.200" r=".7"/><circle cx="10.400" cy="13.200" r=".7"/><circle cx="9" cy="16" r=".7"/><path d="M17.500 3.500c-1.300 0-1.800 1.300-1.300 2.300.5 1-.8 1.900-.8 3.700 0 1 .4 1.500.4 2.500h3.400c0-1 .4-1.500.4-2.500 0-1.800-1.300-2.700-.8-3.700.5-1 0-2.300-1.300-2.300z"/><path d="M15.500 7.500h4"/>',
    cross: '<path d="M3.500 6.500v10.500h17v-2.200c0-1.100-.8-1.900-1.900-2.100l-4-.8-2.600-3.600-3.200 1.800-2.300-2.300z"/><path d="M9.500 11l1.600 1.600M11.800 9.800l1.600 1.600"/><path d="M3.500 17v1.800M7.500 17v1.800M11.500 17v1.800M15.500 17v1.800M19.500 17v1.800"/>',
    fencing: '<path d="M6 9.500a6 6 0 0 1 12 0v4.500a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z"/><path d="M6 11.500h12M6.200 14.500h11.600M9 6.500v11.500M12 5.500v12.500M15 6.500v11.500M8.500 21h7"/>',
    flag: '<path d="M6 3.500V21M6 4.500h12.500l-3.500 4 3.500 4H6"/>',
    football: '<path d="M4.200 19.800C3 11.200 11.200 3 19.800 4.200 21 12.800 12.800 21 4.200 19.800z"/><path d="M9 15l6-6M10.600 10.600l1.300 1.300M12.200 12.200l1.300 1.300M8 13.200l1.300 1.300"/>',
    cheer: '<path d="M3.500 10v4h3.500l8.500 4V6L7 10z"/><path d="M18.500 9.500c1.500 1.200 1.500 3.800 0 5M7 14l1.200 5h2.600l-1.300-4.500"/>',
    golf: '<path d="M8 20.500V3.500l8.500 4L8 11.500"/><path d="M3.500 20.500h17"/><circle cx="15.500" cy="18" r="1.400"/>',
    indoor: '<circle cx="12" cy="13.500" r="7"/><path d="M12 6.500V3.500M9.500 3.500h5M12 13.500l3.200-2.600"/>',
    track: '<rect x="3" y="6.500" width="18" height="11" rx="5.500"/><rect x="6.500" y="10" width="11" height="4" rx="2"/>',
    soccer: '<circle cx="12" cy="12" r="8.800"/><path d="M12 8.500l3 2.200-1.100 3.500h-3.800L9 10.700z"/><path d="M12 8.500V3.300M15 10.700l5-1.600M13.900 14.200l3.100 4.200M10.100 14.200L7 18.400M9 10.700L4 9.100"/>',
    swim: '<circle cx="16.500" cy="6" r="2"/><path d="M5.500 12.500l5-3.500 4.500 1.800"/><path d="M3 16.500c1.500-1.400 3-1.400 4.500 0s3 1.400 4.500 0 3-1.400 4.500 0 3 1.400 4.500 0M3 20.500c1.500-1.400 3-1.400 4.500 0s3 1.400 4.500 0 3-1.400 4.500 0 3 1.400 4.500 0"/>',
    tennis: '<ellipse cx="9.500" cy="9.500" rx="5.200" ry="6.600" transform="rotate(-45 9.500 9.500)"/><path d="M13.500 13.500l6.500 6.500M6.500 6.500l6 6"/><circle cx="18" cy="6" r="2.200"/>',
    volleyball: '<circle cx="12" cy="12" r="8.800"/><path d="M12 3.200c-1.800 4-1.300 8 2 11.500M3.700 9.500c4.500-1.300 9 .2 11.300 5.200M20.300 10.500c-4.200.3-7.800 2.800-9.300 7.800"/>',
    wrestling: '<circle cx="12" cy="4.800" r="2.200"/><path d="M12 7.500v6.500M4.500 10.500L12 8.800l7.500 1.700M12 14l-4 6M12 14l4 6M4 21.800h16"/>',
    other: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1.500A3 3 0 0 0 8 10.500M16 6h3v1.500a3 3 0 0 1-3 3M12 13v4M8.500 20h7M10 17h4"/>'
  };
  function sportIcon(slug) {
    var k = String(slug || '').toLowerCase(), key = /flag/.test(k) ? 'flag' : /cheer/.test(k) ? 'cheer' : /indoor/.test(k) ? 'indoor' : /track/.test(k) ? 'track' : /cross|country/.test(k) ? 'cross' :
      /soft/.test(k) ? 'softball' : /base/.test(k) ? 'baseball' : /basket/.test(k) ? 'basketball' : /bowl/.test(k) ? 'bowling' : /fenc/.test(k) ? 'fencing' : /foot/.test(k) ? 'football' : /golf/.test(k) ? 'golf' :
      /soccer/.test(k) ? 'soccer' : /swim|div/.test(k) ? 'swim' : /tennis/.test(k) ? 'tennis' : /volley/.test(k) ? 'volleyball' : /wrest/.test(k) ? 'wrestling' : 'other';
    return '<svg class="si" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + SI[key] + '</svg>';
  }
  var ICON = {
    settings: '<svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
    today: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/></svg>',
    week: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h16M4 14.5h16M9.5 9.5V20M14.5 9.5V20"/></svg>',
    teams: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z"/></svg>',
    alerts: '<svg viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/></svg>'
  };

  /* ---------- the widget ---------- */
  function mount(host) {
    var theme = host.getAttribute('data-theme') === 'classic' ? 'classic' : 'spirit';
    var todayOverride = host.getAttribute('data-today');
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = '<style>' + CSS + '</style><div class="w ' + theme + '"><p class="loading">Loading the schedule…</p></div>';
    var w = root.querySelector('.w');
    var S = { events: [], updatedAt: '', changes: [], tab: 'today', sel: null, weekStart: null, open: null, mine: store('gcsd-ath-mine') || [], onlyMine: false, sport: null, fw: null, view: (function () { var v = store('gcsd-ath-view'); return v === 'month' || v === 'grid' ? v : 'list'; })(), month: null, pick: [], ha: null, panel: false, stale: null, weather: null, toast: '', focusTeam: null, mode: (function () { var m = store('gcsd-ath-mode'); return m === 'dark' || m === 'light' ? m : 'auto'; })(), dis: store('gcsd-ath-hl') || {}, hlOpen: {}, set: (function () { var o = store('gcsd-ath-set') || {}; return { text: o.text === 1 || o.text === 2 ? o.text : 0, hc: !!o.hc, rm: !!o.rm, wx: o.wx !== false, cd: o.cd !== false }; })() };
    var today = function () { return todayOverride || nyToday(); };
    var MQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    function isDark() { return S.mode === 'dark' || (S.mode === 'auto' && !!(MQ && MQ.matches)); }
    if (MQ && MQ.addEventListener) MQ.addEventListener('change', function () { if (S.mode === 'auto' && S.events.length) render(); });
    var RM0 = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), RM = RM0 || S.set.rm;
    var AB = host.getAttribute('data-assets') || (BASE + 'hdr/'), AI = window.GCSD_ATHLETICS_ASSETS || {};
    var ASSET = { bg: AI.bg || AB + 'streaks.jpg', falcon: AI.falcon || AB + 'falcon.png', wordmark: AI.wordmark || AB + 'wordmark.png' };
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches || host.getAttribute('data-parallax') === 'off', ticking = false;
    function parallax() {
      var hb = w.querySelector('.hero-bg'); if (!hb || still) return;
      var r = host.getBoundingClientRect(), y = Math.max(-18, Math.min(18, r.top * 0.12));
      hb.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    }
    if (!still) window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; parallax(); }); } }, { passive: true });

    function load() {
      var inline = window.GCSD_ATHLETICS_DATA;
      var p = inline ? Promise.resolve(inline) : fetch(host.getAttribute('data-src') || (BASE + 'schedule.json'), { cache: 'no-cache' }).then(function (r) { return r.json(); });
      return p.then(function (d) {
        var first = !S.events.length;
        if (d.updatedAt === S.updatedAt) return;
        S.events = d.events; S.updatedAt = d.updatedAt; S.changes = realChanges(d.changes); S.weather = d.weather || null; S.stale = null;
        if (!inline) store('gcsd-ath-cache', d);
        if (first) { S.weekStart = mondayOf(today()); S.sel = today(); applyHash(); }
        render();
      }).catch(function () {
        var c = store('gcsd-ath-cache');
        if (!S.events.length && c && c.events) {
          S.events = c.events; S.updatedAt = c.updatedAt; S.changes = realChanges(c.changes); S.weather = null; S.stale = c.updatedAt;
          S.weekStart = mondayOf(today()); S.sel = today(); applyHash(); render(); return;
        }
        if (S.events.length) { S.stale = S.updatedAt; render(); return; }
        if (!S.events.length) w.innerHTML = '<p class="loading">The schedule is taking a moment to load. Please try again, or open the <a href="' + PORTAL + '/pages/schedule/schedule.php">full schedule</a>.</p>';
      });
    }


    /* ---------- clock-based helpers (America/New_York) ---------- */
    function nowLocal() {
      var o = host.getAttribute('data-now'); if (o) return o;
      var p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute;
    }
    function minsBetween(a, b) { return Math.round((Date.parse(b + 'Z') - Date.parse(a + 'Z')) / 60000); }
    function dur(m) { return m >= 60 ? Math.floor(m / 60) + ' hr' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min'; }
    // Soft, schedule-based wording only: we have no live scores or delay information.
    function cdText(start, end, endKnown, date) {
      if (date !== today()) return '';
      var m = minsBetween(nowLocal(), start.slice(0, 16));
      if (m > 180) return '';
      if (m > 0) return 'Starts in ' + dur(m);
      var len = endKnown === false ? 90 : Math.min(240, Math.max(60, minsBetween(start.slice(0, 16), end.slice(0, 16)) || 90));
      if (-m === 0) return 'Starting now';
      return -m <= len ? 'Underway' : 'Earlier today';
    }
    function cdHtml(e) {
      if (e.status === 'canceled' || !S.set.cd) return '';
      var t = cdText(e.start, e.end, e.endKnown, e.date); if (!t) return '';
      return '<span class="cd" data-s="' + esc(e.start) + '" data-e="' + esc(e.end) + '" data-k="' + (e.endKnown === false ? 0 : 1) + '" data-d="' + esc(e.date) + '">' + esc(t) + '</span>';
    }
    function tickClock() {
      var els = root.querySelectorAll ? root.querySelectorAll('.cd') : [];
      for (var i = 0; i < els.length; i++) { var c = els[i]; c.textContent = cdText(c.getAttribute('data-s'), c.getAttribute('data-e'), c.getAttribute('data-k') === '0' ? false : true, c.getAttribute('data-d')) || ''; }
    }
    function wxHtml(e) {
      if (e.status === 'canceled' || e.homeAway !== 'home' || !/Woodlands/i.test(e.venue) || !S.weather || !S.weather.hours || !S.set.wx) return '';
      var h = S.weather.hours[e.start.slice(0, 13)]; if (!h) return '';
      return '<span class="wx' + (h.p != null && h.p >= 50 ? ' wet' : '') + '">' + h.t + '°F' + (h.p != null ? ' · ' + h.p + '% chance of rain' : '') + '</span>';
    }
    // Most recent change to this game in the last 3 days: { kind, old }
    function realChanges(list) { return (list || []).filter(function (c) { return !(c && c.kind === 'rescheduled' && /(\d{4}-\d\d-\d\d \S+) \(was \1\)\s*$/.test(c.text || '')); }); }
    function chgOf(e) {
      var cut = Date.now() - 72 * 3600e3, hit = null;
      S.changes.forEach(function (c) { if (String(c.id) === e.id && Date.parse(c.at) > cut && c.kind !== 'canceled' && c.kind !== 'removed') { if (!hit || Date.parse(c.at) > Date.parse(hit.at)) hit = c; } });
      if (!hit) return null;
      var m = /\(was (\d{4}-\d\d-\d\d) ([^)]+)\)/.exec(hit.text || '');
      return { kind: hit.kind, oldDate: m ? m[1] : '', oldTime: m ? m[2] : '' };
    }

    /* ---------- links, sharing, small toast ---------- */
    function pageUrl() { return String(location.href).split('#')[0]; }
    function say(msg) { S.toast = msg; render(); setTimeout(function () { S.toast = ''; render(); }, 3200); }
    function shareLink(title, text, url) {
      if (navigator.share) { navigator.share({ title: title, text: text, url: url }).catch(function () {}); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(function () { say('Link copied'); }, function () { say(url); }); return; }
      say(url);
    }
    function applyHash() {
      var h = String(location.hash || ''), m;
      if ((m = /^#day=(\d{4}-\d\d-\d\d)$/.exec(h))) { S.tab = 'today'; S.sel = m[1]; S.weekStart = mondayOf(m[1]); }
      else if ((m = /^#team=([\w:-]+)$/.exec(h))) { S.tab = 'teams'; S.focusTeam = S.hlTeam = decodeURIComponent(m[1]); }
    }
    window.addEventListener('hashchange', function () { if (S.events.length) { applyHash(); render(); } });

    function visible(list) {
      return list.filter(function (e) {
        if (S.onlyMine && S.mine.indexOf(e.teamKey) < 0) return false;
        if (S.sport && e.sportSlug !== S.sport) return false;
        if (S.pick.length && S.pick.indexOf(e.teamKey) < 0) return false;
        if (S.ha && e.homeAway !== S.ha) return false;
        return true;
      }).sort(function (a, b) { return a.start.localeCompare(b.start) || a.teamName.localeCompare(b.teamName); });
    }
    function onDay(d) { return S.events.filter(function (e) { return e.date === d; }); }
    function mapsUrl(e) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.venue + (/Woodlands/i.test(e.venue) ? ', Hartsdale NY' : ' NY')); }
    function calUrl(key) { return (BASE || '/') + 'ics/' + (key ? key.replace(/:/g, '_') : 'all') + '.ics'; }
    function webcal(u) { return u.replace(/^https?:/, 'webcal:'); }

    function gameHtml(e) {
      var cx = e.status === 'canceled', open = S.open === e.id, mine = S.mine.indexOf(e.teamKey) >= 0, ch = cx ? null : chgOf(e);
      var was = ch && ch.kind === 'rescheduled' && ch.oldTime ? (ch.oldDate && ch.oldDate !== e.date ? 'Was ' + fmt(ch.oldDate, { month: 'short', day: 'numeric' }) + ', ' + ch.oldTime : 'Was ' + ch.oldTime) : '';
      var tag = ch ? (ch.kind === 'rescheduled' ? 'Time changed' : ch.kind === 'venue' ? 'Venue changed' : ch.kind === 'added' ? 'New' : '') : '';
      var h = '<li class="g ' + e.homeAway + (cx ? ' cx' : '') + (tag ? ' chg' : '') + '"><button class="gb" data-act="open" data-id="' + esc(e.id) + '" aria-expanded="' + open + '">' +
        '<span class="t">' + esc(e.time) + (was ? '<small class="was">' + esc(was) + '</small>' : '') + '</span>' +
        '<span><span class="who">' + (mine ? '★ ' : '') + esc(teamLabel(e)) + '</span><span class="opp">' + esc(vs(e)) + '</span>' + cdHtml(e) + wxHtml(e) + '</span>' +
        '<span class="tags"><span class="tag ' + e.homeAway + '">' + (e.homeAway === 'home' ? 'Home' : 'Away') + '</span>' + (cx ? '<span class="tag x">Canceled</span>' : '') + (tag ? '<span class="tag chg">' + tag + '</span>' : '') + '</span></button>';
      if (open) {
        h += '<div class="more"><p>' + esc(fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' })) + ' at ' + esc(e.time) + '<br>' + esc(e.venue) + (e.note ? '<br>' + esc(e.note) : '') + '</p>' +
          (cx ? '<p><strong>This game has been canceled.</strong> Check the portal for any makeup date.</p>' : '') +
          '<div class="acts">' +
          (cx ? '' : '<a class="btn fill" href="' + mapsUrl(e) + '" target="_blank" rel="noopener">Directions</a><button class="btn" data-act="ics" data-id="' + esc(e.id) + '">Add to calendar</button>') +
          '<button class="btn" data-act="share" data-id="' + esc(e.id) + '">Share</button>' +
          '<button class="btn" data-act="star" data-key="' + esc(e.teamKey) + '"><span class="star">' + (mine ? '★' : '☆') + '</span>' + (mine ? 'Following team' : 'Follow team') + '</button></div></div>';
      }
      return h + '</li>';
    }

    function header() {
      return '<div class="hero"><div class="hero-bg" aria-hidden="true"></div><div class="hero-in">' +
        '<div class="logos" role="img" aria-label="Woodlands Falcons Athletics"><img src="' + esc(ASSET.falcon) + '" alt="" width="640" height="450"><img class="wm" src="' + esc(ASSET.wordmark) + '" alt="" width="960" height="277"></div>' +
        '<p class="hero-up"><b>Updated</b>' + esc(prose(S.updatedAt)).replace(/^(.*?) at (.*)$/, '<span class="d">$1</span> <span class="tm">at $2</span>') + '</p></div></div>';
    }

    function intro() {
      return (S.stale ? '<div class="stale" role="status"><b>Saved copy.</b> You may be offline. Showing the schedule as of ' + esc(prose(S.stale)) + '. It refreshes when you reconnect.</div>' : '') +
        '<div class="intro"><h1>Woodlands Falcons Athletics</h1><p>Live game schedules for every team.</p></div>';
    }

    function hlBox(k, cls, title, rows, sig, roleLabel) {
      if (S.dis[k] === sig) return '<div class="hlre"><button class="chip" data-act="hlr" data-k="' + k + '">' + (k === 'b' ? '⚠ Show alerts' : '★ Show next up') + '</button></div>';
      var open = !!S.hlOpen[k], more = rows.length > 1;
      return '<div class="' + cls + ' hlbox" role="status"><button class="xb" data-act="hlc" data-k="' + k + '" data-sig="' + esc(sig) + '" aria-label="Close ' + roleLabel + '">×</button><b>' + title + '</b>' +
        '<ul class="' + (open ? 'open' : '') + '">' + rows.join('') + '</ul>' +
        (more ? '<button class="lnk" data-act="hlx" data-k="' + k + '" aria-expanded="' + open + '">' + (open ? 'Show less' : 'Show all (' + rows.filter(function (r) { return r.indexOf('class="sh"') < 0; }).length + ')') + '</button>' : '') + '</div>';
    }
    function banner() {
      var t = today(), cx = onDay(t).filter(function (e) { return e.status === 'canceled'; });
      var cut = Date.now() - 48 * 3600e3;
      var ch = S.changes.filter(function (c) { return Date.parse(c.at) > cut && c.kind !== 'canceled'; }).slice(0, 4);
      if (!cx.length && !ch.length) return '';
      var rows = cx.map(function (e) { return '<li>' + esc(e.time + ' ' + teamLabel(e) + ' ' + vs(e)) + '</li>'; });
      if (cx.length && ch.length) rows.push('<li class="sh">Other recent changes</li>');
      rows = rows.concat(ch.map(function (c) { return '<li>' + esc(c.text) + '</li>'; }));
      var title = cx.length ? cx.length + (cx.length === 1 ? ' game is' : ' games are') + ' canceled today' : 'Recent changes';
      return hlBox('b', 'banner', title, rows, t + '|' + cx.map(function (e) { return e.id; }).join(',') + '|' + ch.map(function (c) { return c.text; }).join('|'), 'alerts');
    }

    function stripRange() {
      var ds = S.events.map(function (e) { return e.date; }).sort(), lo = ds[0] || today(), hi = ds[ds.length - 1] || today(), t = today();
      if (t < lo) lo = t; if (t > hi) hi = t;
      return { from: mondayOf(addDays(lo, -7)), to: addDays(mondayOf(hi), 13) };
    }
    function strip() {
      var t = today(), r = stripRange(), h = '<div class="stripw"><div class="shead"><span class="smon" aria-hidden="true">' + esc(fmt(S.sel || t, { month: 'long', year: 'numeric' })) + '</span><button class="lnk" data-act="stoday">Today</button></div>' +
        '<div class="strip"><button class="wk" data-act="stripgo" data-n="-1" aria-label="Earlier days">‹</button><div class="srow" role="group" aria-label="Pick a day. Swipe sideways for more days.">';
      for (var d = r.from; d <= r.to; d = addDays(d, 1)) {
        var n = visible(onDay(d)).length;
        h += '<button class="day' + (d === t ? ' is-today' : '') + (d.slice(8) === '01' ? ' m1' : '') + '" data-act="day" data-d="' + d + '" aria-pressed="' + (d === S.sel) + '" aria-label="' + esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' }) + ', ' + n + (n === 1 ? ' game' : ' games')) + '">' +
          '<small>' + fmt(d, { weekday: 'short' }) + '</small><strong>' + parse(d).getUTCDate() + '</strong><i class="' + (n ? '' : 'none') + '"></i></button>';
      }
      return h + '</div><button class="wk" data-act="stripgo" data-n="1" aria-label="Later days">›</button></div></div>';
    }

    function mineChip() {
      return S.mine.length ? '<button class="chip" data-act="mine" aria-pressed="' + S.onlyMine + '">★ My teams</button>' : '';
    }

    function nextUp() {
      if (!S.mine.length || S.onlyMine) return '';
      var n = nowLocal(), t = today(), tm = addDays(t, 1);
      var up = S.events.filter(function (e) { return S.mine.indexOf(e.teamKey) >= 0 && e.status !== 'canceled' && e.start.slice(0, 16) >= n; })
        .sort(function (a, b) { return a.start.localeCompare(b.start); }).slice(0, 3);
      if (!up.length) return '';
      var rows = up.map(function (e) {
        return '<li><button class="nb" data-act="day" data-d="' + e.date + '"><b>' + (e.date === t ? 'Today' : e.date === tm ? 'Tomorrow' : esc(fmt(e.date, { weekday: 'short', month: 'short', day: 'numeric' }))) + '</b> ' + esc(e.time) + ' ' + esc(teamLabel(e)) + ' ' + esc(vs(e)) + '</button></li>';
      });
      return hlBox('n', 'next', 'Next up for your teams', rows, up.map(function (e) { return e.id; }).join(','), 'next up');
    }
    function fsum() {
      var p = [];
      if (S.onlyMine) p.push('My teams');
      if (S.pick.length) p.push(S.pick.length + (S.pick.length === 1 ? ' team' : ' teams'));
      if (S.ha) p.push(S.ha === 'home' ? 'Home games' : 'Away games');
      if (S.sport) p.push('One sport');
      return p.length ? '<div class="fsum" role="status">Showing: ' + esc(p.join(', ')) + '. <button class="lnk" data-act="clearf">Clear filters</button></div>' : '';
    }

    function todayTab() {
      var d = S.sel, list = visible(onDay(d)), h = banner() + nextUp() + strip();
      h += '<div class="sub"><h3>' + (d === today() ? 'Today' : esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' }))) + '</h3><span class="subr">' + mineChip() + '<button class="lnk" data-act="shareday" data-d="' + d + '">Share this day</button></span></div>' + fsum();
      if (list.length) return h + '<ul class="list">' + list.map(gameHtml).join('') + '</ul>';
      var next = S.events.filter(function (e) { return e.date > d; }), nx = visible(next)[0];
      h += '<div class="empty">' + (S.onlyMine ? 'None of your teams play ' : 'No games ') + (d === today() ? 'today' : 'on ' + esc(fmt(d, { weekday: 'long' }))) + '.' +
        (nx ? '<br><button class="btn" data-act="day" data-d="' + nx.date + '">Next: ' + esc(fmt(nx.date, { weekday: 'short', month: 'short', day: 'numeric' })) + '</button>' : '') + '</div>';
      return h;
    }

    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    function shortTeam(e) {
      var g = e.gender === 'Girls' ? 'G' : e.gender === 'Boys' ? 'B' : 'B&G';
      return g + ' ' + e.levelCode + ' ' + sportName(e.sport);
    }
    function monthBounds() {
      var m = S.events.map(function (e) { return e.date.slice(0, 7); }).sort();
      return { min: m[0] || today().slice(0, 7), max: m[m.length - 1] || today().slice(0, 7) };
    }
    function shiftMonth(ym, n) { var p = ym.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1 + n, 1)); return d.toISOString().slice(0, 7); }
    function viewToggle() {
      function b(v, l) { return '<button data-act="view" data-v="' + v + '" aria-pressed="' + (S.view === v) + '">' + l + '</button>'; }
      return '<div class="vt" role="group" aria-label="Calendar view">' + b('list', 'List') + b('grid', 'Week') + b('month', 'Month') + '</div>';
    }
    function teamIndex() {
      var by = {}, order = [];
      S.events.forEach(function (e) { if (!by[e.sportSlug]) { by[e.sportSlug] = { name: sportName(e.sport), teams: {} }; order.push(e.sportSlug); } by[e.sportSlug].teams[e.teamKey] = e.gender + ' ' + e.level; });
      order.sort(function (a, b) { return by[a].name.localeCompare(by[b].name); });
      return { by: by, order: order };
    }
    function filtersHtml() {
      function ha(v, l) { return '<button data-act="ha" data-v="' + v + '" aria-pressed="' + ((S.ha || '') === v) + '">' + l + '</button>'; }
      var h = '<div class="filters">' + mineChip() +
        '<button class="chip" data-act="panel" aria-expanded="' + S.panel + '" aria-controls="tp">' + (S.pick.length ? 'Teams: ' + S.pick.length : 'Choose teams') + ' <span aria-hidden="true">' + (S.panel ? '▴' : '▾') + '</span></button>' +
        '<span class="seg3" role="group" aria-label="Home or away">' + ha('', 'All') + ha('home', 'Home') + ha('away', 'Away') + '</span></div>';
      if (S.panel) {
        var ix = teamIndex();
        h += '<div class="panel" id="tp"><p class="note0">Pick the teams you want to see. Nothing is saved or sent anywhere.</p>' + ix.order.map(function (sp) {
          var g = ix.by[sp], keys = Object.keys(g.teams).sort();
          return '<fieldset><legend>' + sportIcon(sp) + esc(g.name) + '<button class="lnk" data-act="picksport" data-s="' + esc(sp) + '">' + (keys.every(function (k) { return S.pick.indexOf(k) >= 0; }) ? 'Unselect all' : 'Select all') + '</button></legend>' +
            keys.map(function (k) { return '<label class="ck"><input type="checkbox" data-act="pick" data-key="' + esc(k) + '"' + (S.pick.indexOf(k) >= 0 ? ' checked' : '') + '><span>' + esc(g.teams[k]) + '</span></label>'; }).join('') + '</fieldset>';
        }).join('') + '<div class="acts"><button class="btn fill" data-act="panel">Done</button><button class="btn" data-act="clearpick">Clear teams</button></div></div>';
      }
      return h + fsum();
    }
    function monthView() {
      var ym = S.month || (S.month = (S.sel || today()).slice(0, 7)), bd = monthBounds(), t = today();
      var p = ym.split('-').map(Number), first = ym + '-01', last = addDays(shiftMonth(ym, 1) + '-01', -1);
      var h = banner() + viewToggle() + '<div class="mhead"><h3>' + MONTHS[p[1] - 1] + ' ' + p[0] + '</h3><span class="arrows">' +
        '<button class="wk" data-act="mo" data-n="-1" aria-label="Previous month"' + (ym <= bd.min ? ' disabled' : '') + '>‹</button>' +
        '<button class="wk" data-act="mo" data-n="1" aria-label="Next month"' + (ym >= bd.max ? ' disabled' : '') + '>›</button></span></div>' + filtersHtml();
      h += '<div class="mcal"><table class="mt"><caption class="sr" style="position:absolute;left:-9999px">' + MONTHS[p[1] - 1] + ' ' + p[0] + ' game calendar</caption><thead><tr>' +
        WD.map(function (w) { return '<th scope="col">' + w + '</th>'; }).join('') + '</tr></thead><tbody>';
      var d = mondayOf(first);
      while (d <= last) {
        h += '<tr>';
        for (var i = 0; i < 7; i++, d = addDays(d, 1)) {
          var inM = d.slice(0, 7) === ym, list = inM ? visible(onDay(d)) : [], n = Number(d.slice(8));
          var label = fmt(d, { weekday: 'long', month: 'long', day: 'numeric' }) + (list.length ? ', ' + list.length + (list.length === 1 ? ' game' : ' games') : ', no games');
          h += '<td class="' + (inM ? '' : 'out') + '"><button class="cell' + (d === t ? ' is-today' : '') + '" data-act="cal" data-d="' + d + '" aria-pressed="' + (d === S.sel) + '" aria-label="' + esc(label) + '"><span class="n">' + n + '</span>';
          if (list.length) {
            h += '<span class="dots" aria-hidden="true">' + list.slice(0, 6).map(function (e) { return '<i class="' + (e.status === 'canceled' ? 'x' : e.homeAway === 'away' ? 'a' : '') + '"></i>'; }).join('') + '</span>';
            h += '<span class="chips" aria-hidden="true">' + list.slice(0, 3).map(function (e) {
              return '<span class="c ' + (e.status === 'canceled' ? 'x' : e.homeAway === 'away' ? 'a' : 'h') + '"><b>' + esc(e.time) + '</b> ' + esc(sportName(e.sport)) + '<small>' + esc(e.gender + ' ' + e.level) + '</small></span>';
            }).join('') + (list.length > 3 ? '<span class="more">+' + (list.length - 3) + ' more</span>' : '') + '</span>';
          }
          h += '</button></td>';
        }
        h += '</tr>';
      }
      h += '</tbody></table></div><div class="legend"><span><i></i>Home</span><span><i class="a"></i>Away</span><span><i class="x"></i>Canceled</span><span class="pr"><button class="lnk" data-act="print">Print this month</button></span></div>';
      var sd = S.sel && S.sel.slice(0, 7) === ym ? S.sel : null;
      if (sd) {
        var list2 = visible(onDay(sd));
        h += '<h3 class="dayh">' + esc(fmt(sd, { weekday: 'long', month: 'long', day: 'numeric' })) + (sd === t ? '<span class="pill">Today</span>' : '') + '</h3>';
        h += list2.length ? '<ul class="list">' + list2.map(gameHtml).join('') + '</ul>' : '<div class="empty">No games ' + (S.onlyMine || S.sport ? 'match' : 'scheduled') + ' this day.</div>';
      } else h += '<div class="empty">Tap a day to see its games.</div>';
      return h;
    }

    function weekHead() {
      return '<div class="sub"><h3>' + esc(fmt(S.weekStart, { month: 'short', day: 'numeric' }) + ' – ' + fmt(addDays(S.weekStart, 6), { month: 'short', day: 'numeric' })) + '</h3>' +
        '<span><button class="wk" data-act="wk" data-n="-7" aria-label="Previous week">‹</button><button class="wk" data-act="wk" data-n="7" aria-label="Next week">›</button></span></div>';
    }
    function weekGrid() {
      var t = today(), h = banner() + viewToggle() + weekHead() + filtersHtml() + '<div class="wgw"><div class="wgrid">', any = false;
      for (var i = 0; i < 7; i++) {
        var d = addDays(S.weekStart, i), list = visible(onDay(d));
        if (list.length) any = true;
        h += '<section class="wd' + (d === t ? ' is-today' : '') + (list.length ? '' : ' none') + '" aria-label="' + esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })) + '"><h4><span>' + fmt(d, { weekday: 'short' }) + '</span> <b>' + parse(d).getUTCDate() + '</b></h4>';
        h += list.length ? '<ul>' + list.map(function (e) {
          var cx = e.status === 'canceled';
          return '<li><button class="wc ' + (cx ? 'x' : e.homeAway === 'away' ? 'a' : 'h') + '" data-act="goday" data-d="' + d + '" data-id="' + esc(e.id) + '"><b>' + esc(e.time) + '</b> ' + esc(sportName(e.sport)) + '<small>' + esc(e.gender + ' ' + e.level) + '</small><small>' + (cx ? 'Canceled' : esc(vs(e))) + '</small></button></li>';
        }).join('') + '</ul>' : '<p class="nog">No games</p>';
        h += '</section>';
      }
      h += '</div></div>';
      if (!any) h += '<div class="empty">No games match this week.</div>';
      return h + '<p class="note">Tap a game for directions, calendar and sharing.</p>';
    }
    function weekTab() {
      if (S.view === 'month') return monthView();
      if (S.view === 'grid') return weekGrid();
      var h = banner() + viewToggle() + weekHead() + filtersHtml(), any = false;
      for (var i = 0; i < 7; i++) {
        var d = addDays(S.weekStart, i), list = visible(onDay(d));
        if (!list.length) continue; any = true;
        h += '<h3 class="dayh">' + esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })) + (d === today() ? '<span class="pill">Today</span>' : '') + '</h3><ul class="list">' + list.map(gameHtml).join('') + '</ul>';
      }
      if (!any) h += '<div class="empty">No games match this week.</div>';
      return h;
    }

    function teamsTab() {
      var by = {}, order = [];
      S.events.forEach(function (e) { if (!by[e.sportSlug]) { by[e.sportSlug] = {}; order.push(e.sportSlug); } by[e.sportSlug][e.teamKey] = e; });
      var t = today(), h = '<p class="note">Tap ☆ to follow a team. Followed teams show first in My teams, saved on this device only.</p>';
      order.sort().forEach(function (sp) {
        var keys = Object.keys(by[sp]).sort();
        h += '<h3 class="grp">' + sportIcon(sp) + '<span>' + esc(sportName(by[sp][keys[0]].sport)) + '</span></h3>';
        keys.forEach(function (k) {
          var e = by[sp][k], on = S.mine.indexOf(k) >= 0;
          var nx = S.events.filter(function (g) { return g.teamKey === k && g.date >= t && g.status !== 'canceled'; }).sort(function (a, b) { return a.start.localeCompare(b.start); })[0];
          h += '<div class="team' + (S.hlTeam === k ? ' hl' : '') + '" data-team="' + esc(k) + '"><button class="sbtn" data-act="star" data-key="' + esc(k) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Unfollow ' : 'Follow ') + esc(e.teamName) + '">' + (on ? '★' : '☆') + '</button>' +
            '<span><span class="nm">' + esc(e.gender + ' ' + e.level) + ' <button class="lnk" data-act="shareteam" data-key="' + esc(k) + '">Share</button></span><span class="nx">' + (nx ? 'Next: ' + esc(fmt(nx.date, { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + nx.time + ' ' + vs(nx)) : 'No upcoming games') + '</span></span>' +
            '<a class="btn" href="' + webcal(calUrl(k)) + '">Calendar</a></div>';
        });
      });
      return h;
    }

    function alertsTab() {
      var all = calUrl(), absAll = new URL(all, location.href).href;
      function steps(title, items) { return '<details><summary>' + title + '</summary><ol>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ol></details>'; }
      return '<div class="card"><h3>Put every game in your calendar</h3><p>No account and no sign-up. Add it once and your calendar keeps itself up to date when a game moves or is canceled.</p>' +
        '<div class="acts"><a class="btn fill" href="' + webcal(all) + '">Subscribe to all games</a><button class="btn" data-act="copy" data-u="' + esc(absAll) + '">Copy link</button></div>' +
        steps('iPhone or iPad', ['Tap <b>Subscribe to all games</b>.', 'When your phone asks, tap <b>Subscribe</b>.', 'Done. Apple Calendar refreshes within a few hours.']) +
        steps('Android or Google Calendar', ['Tap <b>Copy link</b>.', 'On a computer, open calendar.google.com and sign in.', 'Next to <b>Other calendars</b>, click <b>+</b>, then <b>From URL</b>.', 'Paste the link and click <b>Add calendar</b>. It then shows up in the Google Calendar app on your phone. Google can take up to a day to pick up changes.']) +
        steps('Outlook', ['Tap <b>Copy link</b>.', 'In Outlook, choose <b>Add calendar</b>, then <b>Subscribe from web</b>.', 'Paste the link and save.']) +
        '<p>Just one team? Open the <button class="lnk" data-act="tab" data-t="teams">Teams tab</button> and tap Calendar next to it.</p></div>' +
        '<div class="card"><h3>Text and email alerts</h3><p>Optional. The athletics portal can message you when a game changes. It asks for your phone number or email, so it is your choice.</p><div class="acts"><a class="btn" href="' + PORTAL + '" target="_blank" rel="noopener">Open the portal</a></div></div>' +
        '<div class="card"><h3>Follow by feed</h3><p>For news readers and other tools.</p><div class="acts"><a class="btn" href="' + (BASE || '/') + 'rss.xml">RSS feed</a></div></div>' +
        '<div class="card"><h3>Questions</h3><p>' + esc(CONTACT.name) + ', Athletics<br>' + esc(CONTACT.phone) + '<br>' + esc(CONTACT.email) + '</p><div class="acts"><a class="btn" href="tel:9147616052,3014">Call</a><a class="btn" href="mailto:' + esc(CONTACT.email) + '">Email</a></div></div>' +
        '<p class="note">Schedules can change. Countdowns follow the posted game time, not live updates. For the latest, see <a href="' + PORTAL + '/pages/schedule/schedule.php">woodlandsathletics.digitalsports.com</a>.</p>';
    }

    function settingsTab() {
      function ch(act, v, label, on) { return '<button class="chip" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + on + '">' + label + '</button>'; }
      function sw(act, label, on, help) { return '<div class="sw"><span><b>' + label + '</b>' + (help ? '<br><small class="hlp">' + help + '</small>' : '') + '</span><button class="chip" data-act="' + act + '" role="switch" aria-checked="' + on + '" aria-pressed="' + on + '">' + (on ? 'On' : 'Off') + '</button></div>'; }
      var h = '<div class="set"><h3>Text size</h3><p>Makes everything below the banner bigger.</p><div class="acts">' + ch('settext', '0', 'Standard', S.set.text === 0) + ch('settext', '1', 'Large', S.set.text === 1) + ch('settext', '2', 'Largest', S.set.text === 2) + '</div></div>' +
        '<div class="set"><h3>Appearance</h3><div class="acts">' + ch('setmode', 'auto', 'Match my phone', S.mode === 'auto') + ch('setmode', 'light', 'Light', S.mode === 'light') + ch('setmode', 'dark', 'Dark', S.mode === 'dark') + '</div>' +
        sw('sethc', 'High contrast', S.set.hc, 'Black text, stronger outlines, plain card backgrounds.') + sw('setrm', 'Reduce motion', RM, RM0 ? 'Your phone already asks for this.' : 'Turns off sliding and fading.') + '</div>' +
        '<div class="set"><h3>What to show</h3>' + sw('setcd', 'Countdowns', S.set.cd, 'For example “Starts in 30 min”.') + sw('setwx', 'Weather on home games', S.set.wx) +
        '<p>Calendar opens as</p><div class="acts">' + ch('view', 'list', 'List', S.view === 'list') + ch('view', 'grid', 'Week', S.view === 'grid') + ch('view', 'month', 'Month', S.view === 'month') + '</div></div>';
      var mine = S.mine.map(function (k) { return S.events.filter(function (e) { return e.teamKey === k; })[0]; }).filter(Boolean);
      h += '<div class="set"><h3>My teams</h3>' + (mine.length ? mine.map(function (e) { return '<div class="mt1"><span>' + sportIcon(e.sportSlug) + ' ' + esc(teamLabel(e)) + '</span><button class="lnk" data-act="star" data-key="' + esc(e.teamKey) + '">Remove</button></div>'; }).join('') : '<p>No teams followed yet. Tap ☆ on the Teams tab.</p>') + '</div>' +
        '<div class="set"><h3>Reset</h3><p>Clears your followed teams and these settings from this device. Nothing is sent anywhere.</p><div class="acts"><button class="btn" data-act="resetall">Reset everything</button></div></div>' +
        '<p class="note">Settings are saved on this device only. No account, no tracking.</p>';
      return h;
    }

    function printMonth() {
      var ym = S.month || (S.sel || today()).slice(0, 7), p = ym.split('-').map(Number), first = ym + '-01', last = addDays(shiftMonth(ym, 1) + '-01', -1);
      var who = S.onlyMine ? 'My teams' : S.pick.length ? S.pick.length + (S.pick.length === 1 ? ' team' : ' teams') : 'All teams';
      var rows = '', d = mondayOf(first);
      while (d <= last) {
        rows += '<tr>';
        for (var i = 0; i < 7; i++, d = addDays(d, 1)) {
          var inM = d.slice(0, 7) === ym, list = inM ? visible(onDay(d)) : [];
          rows += '<td class="' + (inM ? '' : 'o') + '"><div class="n">' + (inM ? Number(d.slice(8)) : '') + '</div>' + list.map(function (e) {
            var cx = e.status === 'canceled';
            return '<div class="e ' + (cx ? 'x' : e.homeAway) + '"><b>' + esc(e.time) + '</b> ' + esc((e.gender === 'Girls' ? 'G' : e.gender === 'Boys' ? 'B' : 'B&G') + ' ' + e.levelCode + ' ' + sportName(e.sport)) + ' ' + (e.homeAway === 'home' ? 'vs.' : '@') + ' ' + esc(school(e.opponent)) + (cx ? ' (CANCELED)' : '') + '</div>';
          }).join('') + '</td>';
        }
        rows += '</tr>';
      }
      var css = '@page{size:letter landscape;margin:.35in}*{box-sizing:border-box}body{font:9px/1.15 "Gill Sans","Gill Sans MT",Arial,sans-serif;color:#2d2926;margin:0}h1{margin:0;font-size:17px;color:#006b31}p{margin:1px 0 4px;color:#5b5752}tr{page-break-inside:avoid}table{width:100%;border-collapse:collapse;table-layout:fixed}th{background:#00843d;color:#fff;font-size:9px;padding:2px;text-transform:uppercase}td{border:1px solid #a5acaf;vertical-align:top;height:.6in;padding:1px 2px}td.o{background:#f4f5f5}.n{font-weight:700;font-size:10px}.e{margin-top:1px;padding:0 2px;border-left:4px solid #00843d;background:var(--card)}.e.away{border-left-color:var(--away-bd);background:var(--away-bg)}.e.x{border-left-color:#b3261e;text-decoration:line-through;color:var(--ink-3)}.f{margin-top:3px;font-size:8px;color:#5b5752}';
      var html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Woodlands Falcons Athletics, ' + MONTHS[p[1] - 1] + ' ' + p[0] + '</title><style>' + css + '</style></head><body><h1>Woodlands Falcons Athletics · ' + MONTHS[p[1] - 1] + ' ' + p[0] + '</h1><p>' + esc(who) + (S.ha ? ', ' + S.ha + ' games only' : '') + '. White boxes are home games, yellow are away.</p><table><thead><tr>' +
        WD.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table><div class="f">Schedule as of ' + esc(prose(S.updatedAt)) + '. Schedules can change; check greenburghcsd.org/athletics for the latest.</div></body></html>';
      var win = window.open('', '_blank');
      if (!win) { say('Allow pop-ups to print'); return; }
      win.document.open(); win.document.write(html); win.document.close(); win.focus(); setTimeout(function () { try { win.print(); } catch (e) {} }, 350);
    }

    function nav() {
      var tabs = [['today', 'Today'], ['week', 'Calendar'], ['teams', 'Teams'], ['alerts', 'Alerts'], ['settings', 'Settings']];
      return '<nav class="nav" aria-label="Athletics sections">' + tabs.map(function (t) {
        return '<button data-act="tab" data-t="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + ICON[t[0]] + t[1] + '</button>';
      }).join('') + '</nav>';
    }

    function keyOf(el) { return el.getAttribute('data-act') + '|' + (el.getAttribute('data-id') || el.getAttribute('data-d') || el.getAttribute('data-t') || el.getAttribute('data-key') || el.getAttribute('data-s') || el.getAttribute('data-v') || el.getAttribute('data-n') || ''); }
    function render() {
      RM = RM0 || S.set.rm; w.className = 'w ' + theme + (isDark() ? ' dark' : '') + (S.set.hc ? ' hc' : '') + (S.set.text ? ' tx' + S.set.text : '') + (RM ? ' rm' : '');
      var oldRow = w.querySelector ? w.querySelector('.srow') : null; if (oldRow) S.stripLeft = oldRow.scrollLeft;
      var ae = root.activeElement, keep = ae && ae.getAttribute && ae.getAttribute('data-act') ? keyOf(ae) : null;
      var body = S.tab === 'today' ? todayTab() : S.tab === 'week' ? weekTab() : S.tab === 'teams' ? teamsTab() : S.tab === 'settings' ? settingsTab() : alertsTab();
      w.innerHTML = header() + '<div class="main' + (S.tab === 'week' && (S.view === 'month' || S.view === 'grid') ? ' wide' : '') + '">' + intro() + '<div class="body' + (S.fx ? ' fx' : '') + '">' + body + '</div><div class="pad"></div>' + nav() + '</div>' + (S.toast ? '<div class="toast" role="status">' + esc(S.toast) + '</div>' : '');
      var hb = w.querySelector('.hero-bg'); if (hb) hb.style.setProperty('--bg-img', 'url("' + ASSET.bg + '")');
      parallax();
      var row = w.querySelector('.srow');
      if (row) {
        var sb = S.sel ? row.querySelector('.day[data-d="' + S.sel + '"]') : null;
        if (S.stripLeft != null && !S.stripCenter) row.scrollLeft = S.stripLeft;
        var f = row.offsetWidth ? row.getBoundingClientRect().width / row.offsetWidth : 1;
        var delta = function () { var rr = row.getBoundingClientRect(), sr = sb.getBoundingClientRect(); return ((sr.left + sr.width / 2) - (rr.left + rr.width / 2)) / f; };
        var vis = false; if (sb) { var rr0 = row.getBoundingClientRect(), sr0 = sb.getBoundingClientRect(); vis = sr0.left >= rr0.left - 1 && sr0.right <= rr0.right + 1; }
        if (sb && (S.stripCenter || !vis)) { var smooth = S.stripCenter === 'smooth' && !RM; if (smooth) row.scrollBy({ left: delta(), behavior: 'smooth' }); else { row.scrollTo({ left: row.scrollLeft + delta(), behavior: 'instant' }); row.scrollTo({ left: row.scrollLeft + delta(), behavior: 'instant' }); } }
        S.stripCenter = null; S.stripLeft = row.scrollLeft;
      }
      var mo = S.openFx ? w.querySelector('.more') : null; if (mo) mo.classList.add('pop'); S.openFx = null; S.fx = false;
      if (keep) { var els = root.querySelectorAll('[data-act]'); for (var i = 0; i < els.length; i++) { if (keyOf(els[i]) === keep) { els[i].focus({ preventScroll: true }); break; } } }
      if (S.focusTeam) { var te = root.querySelector('[data-team="' + S.focusTeam.replace(/"/g, '') + '"]'); if (te && te.scrollIntoView) te.scrollIntoView({ block: 'center' }); S.focusTeam = null; }
    }

    function saveSet() { store('gcsd-ath-set', S.set); }
    function find(id) { return S.events.filter(function (e) { return e.id === id; })[0]; }

    root.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'tab') { S.tab = b.getAttribute('data-t'); S.open = null; S.hlTeam = null; S.fx = true; }
      else if (a === 'stripgo') { var sr = w.querySelector('.srow'); if (sr) sr.scrollBy({ left: Number(b.getAttribute('data-n')) * sr.clientWidth * 0.86, behavior: RM ? 'auto' : 'smooth' }); return; }
      else if (a === 'mode') { S.mode = isDark() ? 'light' : 'dark'; store('gcsd-ath-mode', S.mode); }
      else if (a === 'setmode') { S.mode = b.getAttribute('data-v'); store('gcsd-ath-mode', S.mode); }
      else if (a === 'hlx') { var hk = b.getAttribute('data-k'); S.hlOpen[hk] = !S.hlOpen[hk]; }
      else if (a === 'hlr') { delete S.dis[b.getAttribute('data-k')]; store('gcsd-ath-hl', S.dis); }
      else if (a === 'hlc') { S.dis[b.getAttribute('data-k')] = b.getAttribute('data-sig'); store('gcsd-ath-hl', S.dis); }
      else if (a === 'settext') { S.set.text = Number(b.getAttribute('data-v')); saveSet(); }
      else if (a === 'sethc') { S.set.hc = !S.set.hc; saveSet(); }
      else if (a === 'setrm') { S.set.rm = !RM; saveSet(); }
      else if (a === 'setcd') { S.set.cd = !S.set.cd; saveSet(); }
      else if (a === 'setwx') { S.set.wx = !S.set.wx; saveSet(); }
      else if (a === 'resetall') { S.set = { text: 0, hc: false, rm: false, wx: true, cd: true }; S.mode = 'auto'; S.mine = []; S.onlyMine = false; S.dis = {}; saveSet(); store('gcsd-ath-mode', 'auto'); store('gcsd-ath-mine', []); store('gcsd-ath-hl', {}); }
      else if (a === 'stoday') { S.sel = today(); S.weekStart = mondayOf(S.sel); S.open = null; S.stripCenter = 'smooth'; }
      else if (a === 'day') { S.sel = b.getAttribute('data-d'); S.weekStart = mondayOf(S.sel); S.open = null; }
      else if (a === 'wk') { S.fx = true; var n = Number(b.getAttribute('data-n')); S.weekStart = addDays(S.weekStart, n); S.sel = addDays(S.sel || S.weekStart, n); S.open = null; }
      else if (a === 'open') { var id = b.getAttribute('data-id'); S.open = S.open === id ? null : id; if (S.open) S.openFx = id; }
      else if (a === 'cal') { S.sel = b.getAttribute('data-d'); S.weekStart = mondayOf(S.sel); S.month = S.sel.slice(0, 7); S.open = null; }
      else if (a === 'mo') { S.fx = true; S.month = shiftMonth(S.month || (S.sel || today()).slice(0, 7), Number(b.getAttribute('data-n'))); S.open = null; }
      else if (a === 'view') { S.fx = true; var vv = b.getAttribute('data-v'); S.view = vv === 'month' || vv === 'grid' ? vv : 'list'; store('gcsd-ath-view', S.view); S.open = null; if (S.view === 'month') S.month = (S.sel || today()).slice(0, 7); }
      else if (a === 'goday') { S.view = 'list'; store('gcsd-ath-view', 'list'); S.sel = b.getAttribute('data-d'); S.weekStart = mondayOf(S.sel); S.open = b.getAttribute('data-id'); }
      else if (a === 'panel') { S.panel = !S.panel; }
      else if (a === 'pick') { var pk = b.getAttribute('data-key'), pi = S.pick.indexOf(pk); if (pi < 0) S.pick.push(pk); else S.pick.splice(pi, 1); }
      else if (a === 'picksport') { var ix = teamIndex(), ks = Object.keys((ix.by[b.getAttribute('data-s')] || { teams: {} }).teams), allIn = ks.every(function (k) { return S.pick.indexOf(k) >= 0; }); S.pick = S.pick.filter(function (k) { return ks.indexOf(k) < 0; }); if (!allIn) S.pick = S.pick.concat(ks); }
      else if (a === 'clearpick') { S.pick = []; }
      else if (a === 'ha') { S.ha = b.getAttribute('data-v') || null; }
      else if (a === 'clearf') { S.pick = []; S.ha = null; S.onlyMine = false; S.sport = null; }
      else if (a === 'shareday') { var sd = b.getAttribute('data-d'); shareLink('Woodlands Falcons Athletics', 'Games on ' + fmt(sd, { weekday: 'long', month: 'long', day: 'numeric' }), pageUrl() + '#day=' + sd); return; }
      else if (a === 'shareteam') { var tk = b.getAttribute('data-key'), te2 = S.events.filter(function (x) { return x.teamKey === tk; })[0]; shareLink('Woodlands ' + (te2 ? te2.teamName : 'team'), (te2 ? te2.teamName : 'Team') + ' schedule', pageUrl() + '#team=' + encodeURIComponent(tk)); return; }
      else if (a === 'copy') { var cu = b.getAttribute('data-u'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cu).then(function () { say('Link copied'); }, function () { say(cu); }); else say(cu); return; }
      else if (a === 'print') { printMonth(); return; }
      else if (a === 'mine') { S.onlyMine = !S.onlyMine; }
      else if (a === 'sport') { S.sport = b.getAttribute('data-s') || null; }
      else if (a === 'star') { var k = b.getAttribute('data-key'), i = S.mine.indexOf(k); if (i < 0) S.mine.push(k); else S.mine.splice(i, 1); store('gcsd-ath-mine', S.mine); if (!S.mine.length) S.onlyMine = false; }
      else if (a === 'ics') {
        var e = find(b.getAttribute('data-id')); if (!e) return;
        var url = URL.createObjectURL(new Blob([icsFor(e)], { type: 'text/calendar' })), l = document.createElement('a');
        l.href = url; l.download = 'Woodlands-' + e.date + '.ics'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); return;
      }
      else if (a === 'share') {
        var g = find(b.getAttribute('data-id')); if (!g) return;
        shareLink(teamLabel(g), teamLabel(g) + ' ' + vs(g) + ', ' + fmt(g.date, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + g.time + ', ' + g.venue, pageUrl() + '#day=' + g.date); return;
      }
      render();
    });

    var scrollTick = false;
    root.addEventListener('scroll', function (ev) {
      var row = ev.target; if (!row || !row.classList || !row.classList.contains('srow') || scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(function () {
        scrollTick = false; S.stripLeft = row.scrollLeft;
        var mid = row.scrollLeft + row.clientWidth / 2, ds = row.querySelectorAll('.day'), pick = ds[0];
        for (var i = 0; i < ds.length; i++) { if (ds[i].offsetLeft + ds[i].offsetWidth / 2 >= mid) { pick = ds[i]; break; } }
        var lab = w.querySelector('.smon'); if (lab && pick) lab.textContent = fmt(pick.getAttribute('data-d'), { month: 'long', year: 'numeric' });
      });
    }, true);

    load();
    setInterval(load, 5 * 60 * 1000);
    setInterval(tickClock, 30 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
  }

  function init() { var hosts = document.querySelectorAll('[data-gcsd-athletics]'); for (var i = 0; i < hosts.length; i++) if (!hosts[i].__gcsd) { hosts[i].__gcsd = 1; mount(hosts[i]); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.GCSDAthletics = { mount: mount, init: init };
})();
