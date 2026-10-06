/*! Woodlands Falcons Athletics widget. Paste into an Edlio embed:
 *  <div data-gcsd-athletics data-theme="classic"></div>
 *  <script src=".../widget.js"></script>
 *  data-theme: "classic" (conservative) or "spirit" (lightly expressive). Data comes from schedule.json next to this file. */
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
    'font:16px/1.4 "Gill Sans","Gill Sans MT","Open Sans",Arial,sans-serif;color:var(--ink);background:#fff;position:relative}',
    '.main{max-width:760px;margin:0 auto}',
    'button{font:inherit;color:inherit;cursor:pointer}',
    'a{color:var(--green-dk)}',
    ':focus-visible{outline:3px solid var(--ink);outline-offset:2px}',
    '.hero{container-type:inline-size;position:relative;overflow:hidden;background:#0b3d24;border-bottom:3px solid var(--green)}',
    '.hero-bg{position:absolute;left:0;right:0;top:-18px;bottom:-18px;background:#0b3d24 var(--bg-img) center/cover no-repeat;will-change:transform}',
    '.hero-in{position:relative;display:flex;flex-direction:column;align-items:center;--h:clamp(62px,17cqw,150px);padding:calc(var(--h) * .2) 16px calc(var(--h) * .14)}',
    '.logos{display:flex;align-items:center;justify-content:center;gap:calc(var(--h) * .07)}',
    '.hero-in img{display:block;height:var(--h);width:auto;flex:none;max-width:none}',
    '.hero-in img.wm{height:calc(var(--h) * .66)}',
    '.hero-up{margin:calc(var(--h) * .1) 0 0;text-align:center;color:#fff;font-size:clamp(12px,1.2cqw + 6px,15px);line-height:1.3;text-shadow:0 1px 3px rgba(0,0,0,.65)}',
    '.hero-up .tm{white-space:nowrap}',
    '.hero-up b{display:inline;margin-right:.45em;font-size:.82em;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#fff;opacity:.8}',
    '.spirit .hero{border-bottom:6px solid var(--yellow)}',
    '.intro{padding:14px 16px 12px;border-bottom:1.5px solid var(--gray-30)}',
    '.intro h1{margin:0;font-size:20px;line-height:1.2}',
    '.intro p{margin:3px 0 0;font-size:14px;color:var(--ink-2)}',
    '.hd{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;padding:14px 16px 12px;border-bottom:3px solid var(--green)}',
    '.hd h2{margin:0;font-size:19px;line-height:1.15}',
    '.hd .up{font-size:13px;color:var(--ink-2);white-space:nowrap}',
    '.banner{margin:12px 16px 12px;padding:10px 12px;border-radius:8px;background:var(--red-10);border:1.5px solid var(--red);color:#7a1a14;font-size:15px}',
    '.banner b{display:block}',
    '.banner ul{margin:4px 0 0;padding-left:18px}',
    '.strip{display:grid;grid-template-columns:auto repeat(7,1fr) auto;gap:4px;align-items:stretch;padding:12px 8px 4px}',
    '.wk{border:0;background:none;width:32px;font-size:22px;color:var(--green-dk);border-radius:8px}',
    '.day{border:1.5px solid var(--gray-30);background:#fff;border-radius:10px;padding:6px 0 7px;min-height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;line-height:1.1}',
    '.day small{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-2)}',
    '.day strong{font-size:18px}',
    '.day i{display:block;height:5px;width:5px;border-radius:50%;background:var(--green);margin-top:2px}',
    '.day i.none{background:transparent}',
    '.day[aria-pressed=true]{background:var(--green);border-color:var(--green);color:#fff}',
    '.day[aria-pressed=true] small{color:#fff}',
    '.day[aria-pressed=true] i{background:#fff}',
    '.day.is-today:not([aria-pressed=true]){border-color:var(--green);box-shadow:inset 0 0 0 1px var(--green)}',
    '.sub{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 16px 4px}',
    '.sub h3{margin:0;font-size:17px}',
    '.chip{border:1.5px solid var(--gray);background:#fff;border-radius:999px;min-height:40px;padding:0 14px;font-size:14px;font-weight:600}',
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
    '.tag.away{background:#fff;border:1.5px solid var(--gray);color:var(--ink)}',
    '.tag.x{background:var(--red-10);border:1.5px solid var(--red);color:var(--red)}',
    '.g.cx .t,.g.cx .who,.g.cx .opp{text-decoration:line-through;color:#6b6762}',
    '.more{padding:0 0 14px 82px;display:grid;gap:10px}',
    '.more p{margin:0;font-size:15px;color:var(--ink-2)}',
    '.acts{display:flex;flex-wrap:wrap;gap:8px}',
    '.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border-radius:10px;border:2px solid var(--green);background:#fff;color:var(--green-dk);font-weight:700;font-size:15px;text-decoration:none}',
    '.btn.fill{background:var(--green);color:#fff}',
    '.star{font-size:20px;line-height:1;margin-right:6px}',
    '.empty{margin:18px 16px;padding:18px;border-radius:12px;background:var(--gray-10);font-size:17px}',
    '.empty .btn{margin-top:12px}',
    '.dayh{margin:0;padding:16px 16px 6px;font-size:16px;display:flex;align-items:center;gap:8px}',
    '.pill{background:var(--yellow);color:var(--ink);font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding:2px 8px;border-radius:999px}',
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
    '.nav{position:sticky;bottom:0;display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border-top:1.5px solid var(--gray-30);box-shadow:0 -4px 14px rgba(0,0,0,.06);z-index:2}',
    '.nav button{border:0;background:none;min-height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12.5px;font-weight:700;color:var(--ink-2)}',
    '.nav svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
    '.nav button[aria-current=page]{color:var(--green-dk);box-shadow:inset 0 3px 0 var(--green)}',
    '.loading{padding:30px 16px;color:var(--ink-2)}',

    /* lightly expressive look */
    '.spirit .hd{background:var(--green);color:#fff;border-bottom:6px solid var(--yellow);padding:18px 16px 14px}',
    '.spirit .hd h2{font-size:24px;text-transform:uppercase;letter-spacing:.03em;font-weight:900}',
    '.spirit .hd .up{color:#d8efe2}',
    '.spirit .strip{background:#0b3d2b;padding:12px 8px 12px;margin-top:0}',
    '.spirit .wk{color:#fff}',
    '.spirit .day{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22);color:#fff}',
    '.spirit .day small{color:#cfe8d9}',
    '.spirit .day i{background:var(--yellow)}',
    '.spirit .day[aria-pressed=true]{background:var(--yellow);border-color:var(--yellow);color:var(--ink)}',
    '.spirit .day[aria-pressed=true] small{color:var(--ink)}.spirit .day[aria-pressed=true] i{background:var(--ink)}',
    '.spirit .day.is-today:not([aria-pressed=true]){border-color:var(--yellow);box-shadow:none}',
    '.spirit .sub h3,.spirit .dayh{text-transform:uppercase;letter-spacing:.04em}',
    '.spirit .g{margin:8px 0;border:1.5px solid var(--gray-30);border-left:6px solid var(--gray);border-radius:10px;padding:0 12px}',
    '.spirit .g.home{border-left-color:var(--green)}',
    '.spirit .g.cx{border-left-color:var(--red)}',
    '.spirit .gb{padding:12px 0}',
    '.spirit .t{font-size:19px}',
    '.spirit .more{padding-left:82px}',
    '.spirit .day i.none{background:transparent}',
    '.spirit .nav button[aria-current=page]{box-shadow:inset 0 4px 0 var(--yellow);color:var(--green-dk)}',
    '.spirit .grp{color:var(--green-dk)}',
    '@media (max-width:420px){.intro h1{font-size:18px}.gb{grid-template-columns:66px 1fr auto}.spirit .t{font-size:18px}.team .btn{min-height:40px;padding:0 10px;font-size:14px}.strip{grid-template-columns:26px repeat(7,1fr) 26px;gap:3px;padding-inline:4px}.wk{width:26px}.day{min-height:54px}.day strong{font-size:17px}.more{padding-left:0}}',
    '@media (prefers-reduced-motion:no-preference){.g{transition:background .15s}}'
  ].join('\n');

  var ICON = {
    today: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/></svg>',
    week: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    teams: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z"/></svg>',
    alerts: '<svg viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/></svg>'
  };

  /* ---------- the widget ---------- */
  function mount(host) {
    var theme = host.getAttribute('data-theme') === 'spirit' ? 'spirit' : 'classic';
    var todayOverride = host.getAttribute('data-today');
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = '<style>' + CSS + '</style><div class="w ' + theme + '"><p class="loading">Loading the schedule…</p></div>';
    var w = root.querySelector('.w');
    var S = { events: [], updatedAt: '', changes: [], tab: 'today', sel: null, weekStart: null, open: null, mine: store('gcsd-ath-mine') || [], onlyMine: false, sport: null, fw: null };
    var today = function () { return todayOverride || nyToday(); };
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
        S.events = d.events; S.updatedAt = d.updatedAt; S.changes = d.changes || [];
        if (first) { S.weekStart = mondayOf(today()); S.sel = today(); }
        render();
      }).catch(function () {
        if (!S.events.length) w.innerHTML = '<p class="loading">The schedule is taking a moment to load. Please try again, or open the <a href="' + PORTAL + '/pages/schedule/schedule.php">full schedule</a>.</p>';
      });
    }

    function visible(list) {
      return list.filter(function (e) {
        if (S.onlyMine && S.mine.indexOf(e.teamKey) < 0) return false;
        if (S.sport && e.sportSlug !== S.sport) return false;
        return true;
      }).sort(function (a, b) { return a.start.localeCompare(b.start) || a.teamName.localeCompare(b.teamName); });
    }
    function onDay(d) { return S.events.filter(function (e) { return e.date === d; }); }
    function mapsUrl(e) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.venue + (/Woodlands/i.test(e.venue) ? ', Hartsdale NY' : ' NY')); }
    function calUrl(key) { return (BASE || '/') + 'ics/' + (key ? key.replace(/:/g, '_') : 'all') + '.ics'; }
    function webcal(u) { return u.replace(/^https?:/, 'webcal:'); }

    function gameHtml(e) {
      var cx = e.status === 'canceled', open = S.open === e.id, mine = S.mine.indexOf(e.teamKey) >= 0;
      var h = '<li class="g ' + e.homeAway + (cx ? ' cx' : '') + '"><button class="gb" data-act="open" data-id="' + esc(e.id) + '" aria-expanded="' + open + '">' +
        '<span class="t">' + esc(e.time) + '</span><span><span class="who">' + (mine ? '★ ' : '') + esc(teamLabel(e)) + '</span><span class="opp">' + esc(vs(e)) + '</span></span>' +
        '<span class="tags"><span class="tag ' + e.homeAway + '">' + (e.homeAway === 'home' ? 'Home' : 'Away') + '</span>' + (cx ? '<span class="tag x">Canceled</span>' : '') + '</span></button>';
      if (open) {
        h += '<div class="more"><p>' + esc(fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' })) + ' at ' + esc(e.time) + '<br>' + esc(e.venue) + (e.note ? '<br>' + esc(e.note) : '') + '</p>' +
          (cx ? '<p><strong>This game has been canceled.</strong> Check the portal for any makeup date.</p>' : '') +
          '<div class="acts">' +
          (cx ? '' : '<a class="btn fill" href="' + mapsUrl(e) + '" target="_blank" rel="noopener">Directions</a><button class="btn" data-act="ics" data-id="' + esc(e.id) + '">Add to calendar</button>') +
          (navigator.share ? '<button class="btn" data-act="share" data-id="' + esc(e.id) + '">Share</button>' : '') +
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
      return '<div class="intro"><h1>Woodlands Falcons Athletics</h1><p>Live game schedules for every team.</p></div>';
    }

    function banner() {
      var t = today(), cx = onDay(t).filter(function (e) { return e.status === 'canceled'; });
      var cut = Date.now() - 48 * 3600e3;
      var ch = S.changes.filter(function (c) { return Date.parse(c.at) > cut && c.kind !== 'canceled'; }).slice(0, 4);
      if (!cx.length && !ch.length) return '';
      var h = '<div class="banner" role="status">';
      if (cx.length) h += '<b>' + cx.length + (cx.length === 1 ? ' game is' : ' games are') + ' canceled today</b><ul>' + cx.map(function (e) { return '<li>' + esc(e.time + ' ' + teamLabel(e) + ' ' + vs(e)) + '</li>'; }).join('') + '</ul>';
      if (ch.length) h += '<b>' + (cx.length ? 'Other recent changes' : 'Recent changes') + '</b><ul>' + ch.map(function (c) { return '<li>' + esc(c.text) + '</li>'; }).join('') + '</ul>';
      return h + '</div>';
    }

    function strip() {
      var t = today(), h = '<div class="strip"><button class="wk" data-act="wk" data-n="-7" aria-label="Previous week">‹</button>';
      for (var i = 0; i < 7; i++) {
        var d = addDays(S.weekStart, i), n = visible(onDay(d)).length;
        h += '<button class="day' + (d === t ? ' is-today' : '') + '" data-act="day" data-d="' + d + '" aria-pressed="' + (d === S.sel) + '" aria-label="' + esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' }) + ', ' + n + ' games') + '">' +
          '<small>' + fmt(d, { weekday: 'short' }) + '</small><strong>' + parse(d).getUTCDate() + '</strong><i class="' + (n ? '' : 'none') + '"></i></button>';
      }
      return h + '<button class="wk" data-act="wk" data-n="7" aria-label="Next week">›</button></div>';
    }

    function mineChip() {
      return S.mine.length ? '<button class="chip" data-act="mine" aria-pressed="' + S.onlyMine + '">★ My teams</button>' : '';
    }

    function todayTab() {
      var d = S.sel, list = visible(onDay(d)), h = banner() + strip();
      h += '<div class="sub"><h3>' + (d === today() ? 'Today' : esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' }))) + '</h3>' + mineChip() + '</div>';
      if (list.length) return h + '<ul class="list">' + list.map(gameHtml).join('') + '</ul>';
      var next = S.events.filter(function (e) { return e.date > d; }), nx = visible(next)[0];
      h += '<div class="empty">' + (S.onlyMine ? 'None of your teams play ' : 'No games ') + (d === today() ? 'today' : 'on ' + esc(fmt(d, { weekday: 'long' }))) + '.' +
        (nx ? '<br><button class="btn" data-act="day" data-d="' + nx.date + '">Next: ' + esc(fmt(nx.date, { weekday: 'short', month: 'short', day: 'numeric' })) + '</button>' : '') + '</div>';
      return h;
    }

    function weekTab() {
      var sports = [], seen = {};
      S.events.forEach(function (e) { if (!seen[e.sportSlug]) { seen[e.sportSlug] = 1; sports.push([e.sportSlug, sportName(e.sport)]); } });
      sports.sort(function (a, b) { return a[1].localeCompare(b[1]); });
      var h = banner() + '<div class="sub"><h3>' + esc(fmt(S.weekStart, { month: 'short', day: 'numeric' }) + ' – ' + fmt(addDays(S.weekStart, 6), { month: 'short', day: 'numeric' })) + '</h3>' +
        '<span><button class="wk" data-act="wk" data-n="-7" aria-label="Previous week">‹</button><button class="wk" data-act="wk" data-n="7" aria-label="Next week">›</button></span></div>';
      h += '<div class="filters">' + mineChip() + '<button class="chip" data-act="sport" data-s="" aria-pressed="' + !S.sport + '">All sports</button>' +
        sports.map(function (s) { return '<button class="chip" data-act="sport" data-s="' + s[0] + '" aria-pressed="' + (S.sport === s[0]) + '">' + esc(s[1]) + '</button>'; }).join('') + '</div>';
      var any = false;
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
        h += '<h3 class="grp">' + esc(sportName(by[sp][keys[0]].sport)) + '</h3>';
        keys.forEach(function (k) {
          var e = by[sp][k], on = S.mine.indexOf(k) >= 0;
          var nx = S.events.filter(function (g) { return g.teamKey === k && g.date >= t && g.status !== 'canceled'; }).sort(function (a, b) { return a.start.localeCompare(b.start); })[0];
          h += '<div class="team"><button class="sbtn" data-act="star" data-key="' + esc(k) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Unfollow ' : 'Follow ') + esc(e.teamName) + '">' + (on ? '★' : '☆') + '</button>' +
            '<span><span class="nm">' + esc(e.gender + ' ' + e.level) + '</span><span class="nx">' + (nx ? 'Next: ' + esc(fmt(nx.date, { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + nx.time + ' ' + vs(nx)) : 'No upcoming games') + '</span></span>' +
            '<a class="btn" href="' + webcal(calUrl(k)) + '">Calendar</a></div>';
        });
      });
      return h;
    }

    function alertsTab() {
      return '<div class="card"><h3>Get every game in your calendar</h3><p>Subscribe once and your phone updates itself when a game moves or is canceled. Updates can take a few hours to reach some calendar apps.</p><div class="acts"><a class="btn fill" href="' + webcal(calUrl()) + '">Subscribe to all games</a></div><p>For one team, open the Teams tab.</p></div>' +
        '<div class="card"><h3>Text and email alerts</h3><p>Sign up on the athletics portal to get a message when a game changes.</p><div class="acts"><a class="btn fill" href="' + PORTAL + '" target="_blank" rel="noopener">Open the portal</a></div></div>' +
        '<div class="card"><h3>Follow by feed</h3><p>For news readers and other tools.</p><div class="acts"><a class="btn" href="' + (BASE || '/') + 'rss.xml">RSS feed</a></div></div>' +
        '<div class="card"><h3>Questions</h3><p>' + esc(CONTACT.name) + ', Athletics<br>' + esc(CONTACT.phone) + '<br>' + esc(CONTACT.email) + '</p><div class="acts"><a class="btn" href="tel:9147616052,3014">Call</a><a class="btn" href="mailto:' + esc(CONTACT.email) + '">Email</a></div></div>' +
        '<p class="note">Schedules can change. For the latest, see <a href="' + PORTAL + '/pages/schedule/schedule.php">woodlandsathletics.digitalsports.com</a>.</p>';
    }

    function nav() {
      var tabs = [['today', 'Today'], ['week', 'Week'], ['teams', 'Teams'], ['alerts', 'Alerts']];
      return '<nav class="nav" aria-label="Athletics sections">' + tabs.map(function (t) {
        return '<button data-act="tab" data-t="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + ICON[t[0]] + t[1] + '</button>';
      }).join('') + '</nav>';
    }

    function render() {
      var keep = root.activeElement && root.activeElement.getAttribute ? root.activeElement.getAttribute('data-act') + '|' + (root.activeElement.getAttribute('data-id') || root.activeElement.getAttribute('data-d') || root.activeElement.getAttribute('data-t') || '') : null;
      var body = S.tab === 'today' ? todayTab() : S.tab === 'week' ? weekTab() : S.tab === 'teams' ? teamsTab() : alertsTab();
      w.innerHTML = header() + '<div class="main">' + intro() + body + '<div class="pad"></div>' + nav() + '</div>';
      var hb = w.querySelector('.hero-bg'); if (hb) hb.style.setProperty('--bg-img', 'url("' + ASSET.bg + '")');
      parallax();
      if (keep) { var els = root.querySelectorAll('[data-act]'); for (var i = 0; i < els.length; i++) { var k = els[i].getAttribute('data-act') + '|' + (els[i].getAttribute('data-id') || els[i].getAttribute('data-d') || els[i].getAttribute('data-t') || ''); if (k === keep) { els[i].focus({ preventScroll: true }); break; } } }
    }

    function find(id) { return S.events.filter(function (e) { return e.id === id; })[0]; }

    root.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'tab') { S.tab = b.getAttribute('data-t'); S.open = null; }
      else if (a === 'day') { S.sel = b.getAttribute('data-d'); S.weekStart = mondayOf(S.sel); S.open = null; }
      else if (a === 'wk') { var n = Number(b.getAttribute('data-n')); S.weekStart = addDays(S.weekStart, n); S.sel = addDays(S.sel || S.weekStart, n); S.open = null; }
      else if (a === 'open') { var id = b.getAttribute('data-id'); S.open = S.open === id ? null : id; }
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
        navigator.share({ title: teamLabel(g), text: teamLabel(g) + ' ' + vs(g) + ', ' + fmt(g.date, { weekday: 'long', month: 'long', day: 'numeric' }) + ' at ' + g.time + ', ' + g.venue }).catch(function () {}); return;
      }
      render();
    });

    load();
    setInterval(load, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
  }

  function init() { var hosts = document.querySelectorAll('[data-gcsd-athletics]'); for (var i = 0; i < hosts.length; i++) if (!hosts[i].__gcsd) { hosts[i].__gcsd = 1; mount(hosts[i]); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.GCSDAthletics = { mount: mount, init: init };
})();
