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
  function fmt(iso, o) { return parse(iso).toLocaleDateString(LOC(), Object.assign({ timeZone: 'UTC' }, o)); }
  function tmOf(iso) { var h = +iso.slice(11, 13), m = iso.slice(14, 16); return (h % 12 || 12) + (m === '00' ? '' : ':' + m) + '\u00a0' + (h < 12 ? 'AM' : 'PM'); }
  function tm(e) { return tmOf(e.start); }
  function oldTm(x) { var m = /^(\d{1,2})(?::(\d\d))?\s*([AP]M)$/i.exec(String(x || '').trim()); return m ? m[1] + (m[2] && m[2] !== '00' ? ':' + m[2] : '') + '\u00a0' + m[3].toUpperCase() : String(x || ''); }
  function proseParts(iso) {
    var d = new Date(iso), p = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return { d: d.toLocaleDateString(LOC(), { timeZone: TZ, month: 'long', day: 'numeric' }), t: tmOf('0000-00-00T' + p.hour + ':' + p.minute) };
  }
  function prose(iso) { var q = proseParts(iso); return T('{d} at {t}', { d: q.d, t: q.t }); }
  function sportName(s) { return LANG === 'es' ? (SP_ES[s] || s) : s.replace(/\bAnd\b/, 'and'); }
  function genName(g) { return LANG === 'es' ? (GEN_ES[g] || g) : g; }
  function lvName(l) { return LANG === 'es' ? (LV_ES[l] || l) : l; }
  function genLvl(e) { return LANG === 'es' ? lvName(e.level) + ' de ' + genName(e.gender) : e.gender + ' ' + e.level; }
  function school(n) { if (/^Multiple Teams/i.test(n)) return n.replace(/^Multiple Teams/i, T('Multiple Teams')); return n.replace(/\s+(Middle\/High School|Jr\.\/Sr\. High School|High School|Central School District|School District)$/i, ''); }
  function teamLabel(e) { return LANG === 'es' ? sportName(e.sport) + ' ' + genLvl(e) : e.gender + ' ' + e.level + ' ' + sportName(e.sport); }
  function vs(e) { return (e.homeAway === 'home' ? T('vs.') : T('at')) + ' ' + school(e.opponent); }
  function atT(t) { return LANG === 'es' ? (/^1(:\d\d)?\s/.test(t) ? 'a la ' : 'a las ') + t : 'at ' + t; }
  function store(key, val) {
    try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; }
  }

  /* ---------- language (English default; Spanish when the phone or the reader asks for it) ---------- */
  var LANG = 'en';
  var ES = {
    'Loading the schedule…': 'Cargando el calendario…',
    'The schedule is taking a moment to load. Please try again, or open the {link}.': 'El calendario está tardando en cargar. Inténtalo de nuevo o abre el {link}.',
    'full schedule': 'calendario completo',
    'Today': 'Hoy', 'Tomorrow': 'Mañana', 'Calendar': 'Calendario', 'Teams': 'Equipos', 'Alerts': 'Alertas', 'Settings': 'Ajustes',
    'Athletics sections': 'Secciones de deportes',
    'Live game schedules for every team.': 'Calendario de juegos al día para todos los equipos.',
    'Updated': 'Actualizado',
    'Saved copy.': 'Copia guardada.',
    'You may be offline. Showing the schedule as of {when}. It refreshes when you reconnect.': 'Es posible que no tengas conexión. Mostrando el calendario del {when}. Se actualiza cuando vuelvas a conectarte.',
    '⚠ Show alerts': '⚠ Mostrar alertas', '★ Show next up': '★ Mostrar próximos juegos',
    'Close alerts': 'Cerrar alertas', 'Close next up': 'Cerrar próximos juegos',
    'Show less': 'Mostrar menos', 'Show all ({n})': 'Mostrar todo ({n})',
    '{n} game is canceled today': '{n} juego cancelado hoy', '{n} games are canceled today': '{n} juegos cancelados hoy',
    'Recent changes': 'Cambios recientes', 'Other recent changes': 'Otros cambios recientes',
    '{label}: now at {t}': '{label}: ahora a las {t}', '{label}: now at {t}, was {old}': '{label}: ahora a las {t} (antes: {old})',
    '{label}: new venue, {venue}': '{label}: nueva sede, {venue}',
    '{label}: added to the schedule': '{label}: agregado al calendario', '{label}: removed from the schedule': '{label}: quitado del calendario',
    'Earlier days': 'Días anteriores', 'Later days': 'Días siguientes',
    'Pick a day. Swipe sideways for more days.': 'Elige un día. Desliza hacia los lados para ver más días.',
    '{n} game': '{n} juego', '{n} games': '{n} juegos', 'no games': 'sin juegos',
    '★ My teams': '★ Mis equipos', 'My teams': 'Mis equipos',
    'Next up for your teams': 'Próximos juegos de tus equipos',
    'Showing: {list}.': 'Mostrando: {list}.', 'Clear filters': 'Quitar filtros',
    '{n} team': '{n} equipo', '{n} teams': '{n} equipos',
    'Home games': 'Juegos de local', 'Away games': 'Juegos de visitante', 'Home games only': 'Solo juegos de local', 'Away games only': 'Solo juegos de visitante', 'One sport': 'Un deporte',
    'Varsity': 'Varsity', 'JV': 'JV', 'Modified': 'Modificado',
    'Home': 'Local', 'Away': 'Visitante', 'Canceled': 'Cancelado',
    'Time changed': 'Cambio de hora', 'Venue changed': 'Cambio de sede', 'New': 'Nuevo', 'Playoff': 'Playoff',
    'Was {x}': 'Antes: {x}',
    'Share this day': 'Compartir este día',
    'Starts in {d}': 'Empieza en {d}', 'Starting now': 'Empieza ahora', 'Underway': 'En juego', 'Earlier today': 'Más temprano hoy',
    '{h} hr': '{h} h', '{m} min': '{m} min',
    '{t}°F · {p}% chance of rain': '{t}°F · {p}% de probabilidad de lluvia',
    'None of your teams play today.': 'Ninguno de tus equipos juega hoy.', 'None of your teams play on {day}.': 'Ninguno de tus equipos juega el {day}.',
    'No games today.': 'No hay juegos hoy.', 'No games on {day}.': 'No hay juegos el {day}.',
    'Next: {x}': 'Siguiente: {x}',
    'No games match this week.': 'No hay juegos que coincidan esta semana.',
    'No games match this day.': 'No hay juegos que coincidan este día.', 'No games scheduled this day.': 'No hay juegos programados este día.',
    'Tap a day to see its games.': 'Toca un día para ver sus juegos.',
    'Calendar view': 'Vista del calendario', 'List': 'Lista', 'Week': 'Semana', 'Month': 'Mes',
    'Filter by sport': 'Filtrar por deporte', 'All sports': 'Todos los deportes', 'Level': 'Nivel', 'All levels': 'Todos',
    'Choose teams': 'Elegir equipos', 'Teams: {n}': 'Equipos: {n}', 'Home or away': 'Local o visitante', 'All': 'Todos',
    'Pick the teams you want to see. Nothing is saved or sent anywhere.': 'Elige los equipos que quieres ver. No se guarda ni se envía nada.',
    'Select all': 'Seleccionar todo', 'Unselect all': 'Quitar selección', 'Done': 'Listo', 'Clear teams': 'Quitar equipos',
    'Previous month': 'Mes anterior', 'Next month': 'Mes siguiente', 'Previous week': 'Semana anterior', 'Next week': 'Semana siguiente',
    '{month} game calendar': 'Calendario de juegos de {month}', '+{n} more': '+{n} más',
    'Print this month': 'Imprimir este mes', 'Print': 'Imprimir',
    'No games': 'Sin juegos',
    'Tap a game for directions, calendar and sharing.': 'Toca un juego para ver cómo llegar, añadirlo al calendario y compartirlo.',
    'Tap ☆ to follow a team. Followed teams show first in My teams, saved on this device only.': 'Toca ☆ para seguir un equipo. Los equipos que sigues aparecen primero en Mis equipos y se guardan solo en este dispositivo.',
    'Unfollow {x}': 'Dejar de seguir {x}', 'Follow {x}': 'Seguir {x}',
    'No upcoming games': 'No hay próximos juegos', 'Share': 'Compartir',
    'Directions': 'Cómo llegar', 'Tickets': 'Boletos', 'Watch live': 'Ver en vivo', 'Add to calendar': 'Añadir al calendario', 'Following team': 'Siguiendo', 'Follow team': 'Seguir equipo',
    'This game has been canceled.': 'Este juego fue cancelado.', 'Check the portal for any makeup date.': 'Consulta el portal por si hay fecha de reposición.',
    '{d} at {t}': '{d}, {t}',
    'Learn more': 'Más información', 'Playoffs and brackets': 'Playoffs y llaves', 'Open': 'Abrir',
    'Falcons in the news': 'Los Falcons en las noticias', 'Follow the Falcons elsewhere': 'Sigue a los Falcons en otros sitios',
    'day': 'día', 'days': 'días',
    'Keep it on your home screen': 'Tenlo en tu pantalla de inicio', 'No download needed.': 'No necesitas descargar nada.', 'Got it': 'Entendido', 'Dismiss': 'Descartar',
    'Tap the <b>Share</b> button, then <b>Add to Home Screen</b>.': 'Toca el botón <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.',
    'Open the browser menu (<b>⋮</b>), then tap <b>Add to Home screen</b>.': 'Abre el menú del navegador (<b>⋮</b>) y toca <b>Añadir a la pantalla de inicio</b>.',
    'Put every game in your calendar': 'Pon todos los juegos en tu calendario',
    'No account and no sign-up. Add it once and your calendar keeps itself up to date when a game moves or is canceled.': 'Sin cuenta y sin registrarte. Agrégalo una vez y tu calendario se mantiene al día cuando un juego cambia de horario o se cancela.',
    'Subscribe to all games': 'Suscribirme a todos los juegos', 'Copy link': 'Copiar enlace',
    'Reminders: {list}.': 'Recordatorios: {list}.', 'none': 'ninguno', ' and ': ' y ', 'Change in Settings': 'Cambiar en Ajustes',
    'iPhone or iPad': 'iPhone o iPad',
    'Tap <b>Subscribe to all games</b>.': 'Toca <b>Suscribirme a todos los juegos</b>.',
    'When your phone asks, tap <b>Subscribe</b>.': 'Cuando tu teléfono te pregunte, toca <b>Suscribirse</b>.',
    'Done. Apple Calendar refreshes within a few hours.': 'Listo. El Calendario de Apple se actualiza en unas horas.',
    'Android or Google Calendar': 'Android o Google Calendar',
    'Tap <b>Copy link</b>.': 'Toca <b>Copiar enlace</b>.',
    'On a computer, open calendar.google.com and sign in.': 'En una computadora, abre calendar.google.com e inicia sesión.',
    'Next to <b>Other calendars</b>, click <b>+</b>, then <b>From URL</b>.': 'Junto a <b>Otros calendarios</b>, haz clic en <b>+</b> y luego en <b>Desde URL</b>.',
    'Paste the link and click <b>Add calendar</b>. It then shows up in the Google Calendar app on your phone. Google can take up to a day to pick up changes.': 'Pega el enlace y haz clic en <b>Añadir calendario</b>. Después aparecerá en la app de Google Calendar en tu teléfono. Google puede tardar hasta un día en reflejar los cambios.',
    'Outlook': 'Outlook',
    'In Outlook, choose <b>Add calendar</b>, then <b>Subscribe from web</b>.': 'En Outlook, elige <b>Agregar calendario</b> y luego <b>Suscribirse desde la web</b>.',
    'Paste the link and save.': 'Pega el enlace y guarda.',
    'Just one team? Open the {link} and tap Calendar next to it.': '¿Solo un equipo? Abre la {link} y toca Calendario junto al equipo.',
    'Teams tab': 'pestaña Equipos',
    'Text and email alerts': 'Alertas por mensaje y correo',
    'Optional. The athletics portal can message you when a game changes. It asks for your phone number or email, so it is your choice.': 'Opcional. El portal de deportes puede avisarte cuando cambie un juego. Te pide tu número de teléfono o correo, así que tú decides.',
    'Open the portal': 'Abrir el portal',
    'Follow by feed': 'Seguir por feed', 'For news readers and other tools.': 'Para lectores de noticias y otras herramientas.', 'RSS feed': 'Feed RSS',
    'Questions': 'Preguntas', '{name}, Athletics': '{name}, Deportes', 'Call': 'Llamar', 'Email': 'Correo',
    'Schedules can change. Countdowns follow the posted game time, not live updates. For the latest, see {link}.': 'Los calendarios pueden cambiar. Las cuentas regresivas siguen la hora publicada del juego, no actualizaciones en vivo. Para lo más reciente, visita {link}.',
    'Text size': 'Tamaño del texto', 'Makes everything below the banner bigger.': 'Agranda todo lo que está debajo del banner.',
    'Standard': 'Estándar', 'Large': 'Grande', 'Largest': 'Más grande',
    'Appearance': 'Apariencia', 'Auto': 'Automático', 'Light': 'Claro', 'Dark': 'Oscuro',
    'High contrast': 'Alto contraste', 'Black text, stronger outlines, plain card backgrounds.': 'Texto negro, bordes más marcados y fondos lisos.',
    'Reduce motion': 'Reducir movimiento', 'Your phone already asks for this.': 'Tu teléfono ya lo pide.', 'Turns off sliding and fading.': 'Desactiva los deslizamientos y desvanecimientos.',
    'Get change alerts': 'Recibe avisos de cambios',
    'Subscribe to the calendar and your phone updates games when the schedule changes.': 'Suscríbete al calendario y tu teléfono actualiza los juegos cuando cambie el horario.',
    'Show me how': 'Muéstrame cómo',
    'Add to home screen': 'Añadir a la pantalla de inicio', 'It opens like an app, with nothing to download.': 'Se abre como una app, sin descargar nada.',
    'What to show': 'Qué mostrar', 'Countdowns': 'Cuentas regresivas', 'For example “Starts in 30 min”.': 'Por ejemplo, “Empieza en 30 min”.',
    'Weather on home games': 'Clima en los juegos de local', 'Calendar opens as': 'El calendario se abre en',
    'Game reminders': 'Recordatorios de juegos', 'Your calendar app alerts you before each game. Pick up to two.': 'Tu app de calendario te avisa antes de cada juego. Elige hasta dos.',
    'None': 'Ninguno', '30 min': '30 min', '1 hour': '1 hora', '2 hours': '2 horas', 'Alert': 'Aviso', 'Second alert': 'Segundo aviso',
    'At time of game': 'A la hora del juego', '1 day before': '1 día antes', '2 days before': '2 días antes', '1 hour before': '1 hora antes', '2 hours before': '2 horas antes', '{n} minutes before': '{n} minutos antes',
    'Changing this later? Subscribe again from the Alerts tab, then remove the old calendar. Google Calendar may use its own default alert instead.': '¿Quieres cambiarlo después? Vuelve a suscribirte desde la pestaña Alertas y elimina el calendario anterior. Google Calendar puede usar su propio aviso predeterminado.',
    'Remove': 'Quitar', 'No teams followed yet. Tap ☆ on the Teams tab.': 'Aún no sigues ningún equipo. Toca ☆ en la pestaña Equipos.',
    'Reset': 'Restablecer', 'Clears your followed teams and these settings from this device. Nothing is sent anywhere.': 'Borra tus equipos y estos ajustes de este dispositivo. No se envía nada a ningún lugar.',
    'Reset everything': 'Restablecer todo',
    'Settings are saved on this device only. No account, no tracking.': 'Los ajustes se guardan solo en este dispositivo. Sin cuenta y sin rastreo.',
    'Language': 'Idioma',
    'Allow pop-ups to print': 'Permite las ventanas emergentes para imprimir', 'Link copied': 'Enlace copiado',
    'Games on {d}': 'Juegos del {d}', '{label} schedule': 'Calendario de {label}', '{label} {vs}, {d} at {t}, {venue}': '{label} {vs}, {d}, {t}, {venue}',
    'week of {d}': 'semana del {d}', 'All teams': 'Todos los equipos', 'No games this week for this view.': 'No hay juegos esta semana en esta vista.',
    'Schedule as of {when}. Schedules can change; check greenburghcsd.org/athletics for the latest.': 'Calendario del {when}. Los calendarios pueden cambiar; consulta greenburghcsd.org/athletics para lo más reciente.',
    'White boxes are home games, yellow are away.': 'Los recuadros blancos son juegos de local y los amarillos, de visitante.',
    'Multiple Teams': 'Varios equipos',
    'Support the team': 'Apoya al equipo', 'Schedule presented by {x}': 'Calendario presentado por {x}', 'Powered by {x}': 'Desarrollado por {x}',
    'Games today': 'Juegos de hoy', 'No games today': 'No hay juegos hoy', 'Coming up': 'Próximamente', 'Full schedule: {u}': 'Calendario completo: {u}',
    'vs.': 'vs.', 'at': 'en'
  };
  var SP_ES = { 'Cross Country': 'Cross country', 'Football': 'Fútbol americano', 'Soccer': 'Fútbol', 'Swimming And Diving': 'Natación y clavados', 'Swimming and Diving': 'Natación y clavados', 'Tennis': 'Tenis', 'Volleyball': 'Voleibol', 'Basketball': 'Baloncesto', 'Baseball': 'Béisbol', 'Softball': 'Sóftbol', 'Lacrosse': 'Lacrosse', 'Track': 'Atletismo', 'Track And Field': 'Atletismo', 'Indoor Track': 'Atletismo bajo techo', 'Winter Track': 'Atletismo de invierno', 'Golf': 'Golf', 'Bowling': 'Boliche', 'Fencing': 'Esgrima', 'Flag Football': 'Fútbol bandera', 'Wrestling': 'Lucha', 'Cheerleading': 'Porristas', 'Gymnastics': 'Gimnasia', 'Field Hockey': 'Hockey sobre césped', 'Ice Hockey': 'Hockey sobre hielo', 'Hockey': 'Hockey', 'Rugby': 'Rugby', 'Badminton': 'Bádminton', 'Unified Basketball': 'Baloncesto unificado' };
  var GEN_ES = { 'Boys': 'chicos', 'Girls': 'chicas', 'Boys & Girls': 'chicos y chicas', 'Coed': 'mixto', 'Co-ed': 'mixto' };
  var LV_ES = { 'Varsity': 'Varsity', 'Junior Varsity': 'Junior Varsity', 'Modified': 'Modificado' };
  function T(k, v) {
    var s = LANG === 'es' && ES[k] !== undefined ? ES[k] : k;
    return v ? s.replace(/\{(\w+)\}/g, function (m, n) { return v[n] !== undefined ? v[n] : m; }) : s;
  }
  function LOC() { return LANG === 'es' ? 'es-US' : 'en-US'; }
  function pick(o, k) { return o && (o[k + '_' + LANG] || o[k]) || ''; }
  function lang0(host) {
    var a = host && host.getAttribute('data-lang'), s = null; try { s = JSON.parse(localStorage.getItem('gcsd-ath-lang') || 'null'); } catch (e) {}
    if (a === 'es' || a === 'en') return s === 'es' || s === 'en' ? s : a;
    if (s === 'es' || s === 'en') return s;
    var n = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return /^es/i.test(n) ? 'es' : 'en';
  }

  /* ---------- reminders (minutes before a game; same menu idea as Apple Calendar) ---------- */
  var REM = [0, 15, 30, 60, 120, 1440, 2880];
  function remLabel(m) { return m === 0 ? T('At time of game') : m === 1440 ? T('1 day before') : m === 2880 ? T('2 days before') : m === 60 ? T('1 hour before') : m === 120 ? T('2 hours before') : T('{n} minutes before', { n: m }); }
  function remCode(list) { var l = list.slice().sort(function (a, b) { return b - a; }); return l.length ? 'r' + l.join('-') : ''; }
  function remTrigger(m) { return m === 0 ? 'PT0M' : m % 1440 === 0 ? '-P' + m / 1440 + 'D' : m % 60 === 0 ? '-PT' + m / 60 + 'H' : '-PT' + m + 'M'; }

  /* ---------- single-game calendar file ---------- */
  function icsFor(e, rem) {
    function loc(s) { return s.replace(/[-:]/g, '').slice(0, 15); }
    var end = e.endKnown === false ? (function () { var d = new Date(e.start + 'Z'); d.setUTCMinutes(d.getUTCMinutes() + 90); return d.toISOString().slice(0, 19); })() : e.end;
    function t(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,'); }
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GCSD//Woodlands Athletics//EN', 'BEGIN:VEVENT',
      'UID:' + e.id + '@athletics.greenburghcsd.org', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
      'DTSTART;TZID=America/New_York:' + loc(e.start), 'DTEND;TZID=America/New_York:' + loc(end),
      'SUMMARY:' + t(teamLabel(e) + ' ' + vs(e)), 'LOCATION:' + t(e.venue)].concat((rem || []).reduce(function (a, m) { return a.concat(['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + t(teamLabel(e) + ' ' + vs(e)), 'TRIGGER:' + remTrigger(m), 'END:VALARM']); }, []), ['END:VEVENT', 'END:VCALENDAR']).join('\r\n');
  }

  /* ---------- styles (inside the shadow root, so Edlio's CSS cannot touch them) ---------- */
  var CSS = [
    ':host{display:block;all:initial;display:block}',
    '*{box-sizing:border-box}',
    '.w{--green:#00843d;--green-dk:#006b31;--green-lt:#6cc24a;--green-10:#e8f4ed;--green-20:#cfe8d9;--gray:#a5acaf;--gray-10:#f4f5f5;--gray-30:#dcdfe0;--ink:#2d2926;--ink-2:#5b5752;--yellow:#fecb00;--red:#b3261e;--red-10:#fbeceb;',
    '--bg:#fff;--card:#fff;--mus:#7a5800;--away-bg:#fff8d6;--away-bd:#e3c030;--home-bg:#f2f9f5;--home-bd:#a9d4bb;--x-bd:#e7aaa5;--red-ink:#7a1a14;--ink-3:#6b6762;',
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
    '.out .cell{background:var(--gray-10);color:#5b5752}.w.dark .out .cell{color:#b5bdb8}',
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
    '.ck input{width:26px;height:26px;accent-color:var(--green)}',
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
    '.gb>span{min-width:0}.tx1 .gb,.tx2 .gb{grid-template-columns:auto minmax(0,1fr)!important}.tx1 .tags,.tx2 .tags{grid-column:1/-1;flex-direction:row;flex-wrap:wrap;justify-content:flex-start;align-items:center}',
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
    '.team>span{min-width:0}.tx1 .team,.tx2 .team{grid-template-columns:44px minmax(0,1fr)}.tx1 .team .btn,.tx2 .team .btn{grid-column:2;justify-self:start;margin-bottom:6px}.seg{flex-wrap:wrap}.w{overflow-wrap:anywhere}',
    '.sbtn{width:44px;height:44px;border:0;background:none;font-size:26px;color:var(--ink-3);border-radius:50%}',
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
    '.nav{grid-template-columns:repeat(5,minmax(0,1fr))}.nav button{min-width:0;padding:0 1px}.tx1 .nav{zoom:.92}.tx2 .nav{zoom:.8}@media (max-width:340px){.nav button{font-size:10px!important}}',
    '.set{margin:12px 16px;padding:14px;border:1.5px solid var(--gray-30);border-radius:12px;display:grid;gap:10px}',
    '.set h3{margin:0;font-size:17px}.set p{margin:0;color:var(--ink-2);font-size:15px}',
    '.set .acts .chip{min-height:44px}',
    '.set .chip[aria-pressed=true]{background:var(--green);border-color:var(--green);color:#fff}',
    '.card .small{font-size:13.5px}',
    '.sel{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;border-top:1px solid var(--gray-30)}.sel select{min-height:44px;font:inherit;color:var(--green-dk);background:transparent;border:0;text-align:right;max-width:60%}.set .small{font-size:13px}',
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
    '.spirit .strip .wk{color:#fff}',
    '.spirit .day{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22);color:#fff}',
    '.spirit .day small{color:#cfe8d9}',
    '.spirit .day i{background:var(--yellow)}',
    '.spirit .day[aria-pressed=true]{background:var(--yellow);border-color:var(--yellow);color:#2d2926}',
    '.spirit .day[aria-pressed=true] small{color:#2d2926}.spirit .day[aria-pressed=true] i{background:#2d2926}',
    '.spirit .day.is-today:not([aria-pressed=true]){border-color:var(--yellow);box-shadow:none}',
    '.spirit .sub h3,.spirit .dayh{text-transform:uppercase;letter-spacing:.04em}',
    '.foot,.sp,.pw{text-align:center;font-size:13px;color:var(--ink-3);margin:10px 16px}.pw{font-size:12px}.sp a,.pw a{color:inherit}',
    '.w.dsp{--bg:#0b3d24;background:#0b3d24;color:#fff;height:100vh;overflow:hidden;padding:2.2vh 2.5vw;font-size:min(.95vw,1.75vh);cursor:none;display:flex;flex-direction:column}',
    '.dsp .dh{display:flex;justify-content:space-between;align-items:center;gap:2vw}.dsp .dl{display:flex;align-items:center;gap:2vw}.dsp .dl img{height:11vh;width:auto}',
    '.dsp h1{margin:0;font-size:3.6em;font-weight:900;letter-spacing:-.01em}.dsp .dl p{margin:.2em 0 0;font-size:2em;color:#cfe8d9}',
    '.dsp .dc{font-size:4.4em;font-weight:800;color:#fecb00;white-space:nowrap}',
    '.dsp .ds{display:flex;align-items:baseline;gap:1.6vw;margin:2.4vh 0 1.6vh;border-bottom:.25em solid #00843d;padding-bottom:.6vh}.dsp .ds h2{margin:0;font-size:3em;text-transform:uppercase;letter-spacing:.05em;color:#fff}.dsp .ds span{font-size:2.2em;color:#cfe8d9}',
    '.dsp .dgrid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(5,1fr);grid-auto-flow:column;gap:1.4vh 1.6vw}',
    '.dsp .dgrid.one{grid-template-columns:1fr;grid-auto-flow:row;align-content:start;grid-template-rows:repeat(5,minmax(0,17vh))}',
    '@media (max-width:1199px){.dsp .dgrid{grid-template-columns:1fr;grid-template-rows:repeat(6,1fr)}}',
    '.dsp .dr{display:flex;align-items:center;gap:1.4vw;background:#12482e;border-left:.5em solid #6cc24a;border-radius:.6em;padding:.5em 1em}.dsp .dr.a{border-left-color:#f2c94c;background:#2a2410}.dsp .dr.x{border-left-color:#ff8f86;background:#3a1b19}.dsp .dr.past{opacity:.55}',
    '.dsp .dt{font-size:2.5em;font-weight:800;min-width:4.4em;white-space:nowrap}.dsp .dr.a .dt{color:#f2c94c}.dsp .dr.x .dt,.dsp .dr.x .dw{color:#ff8f86;text-decoration:line-through}',
    '.dsp .dm{flex:1;min-width:0;display:flex;flex-direction:column}.dsp .dw{font-size:1.95em;font-weight:700;line-height:1.15}.dsp .dv{font-size:1.5em;color:#cfe8d9;line-height:1.2}',
    '.dsp .dg{font-size:1.2em;font-weight:800;text-transform:uppercase;letter-spacing:.06em;border:.15em solid currentColor;border-radius:99px;padding:.15em .7em;white-space:nowrap}.dsp .dr.h .dg{color:#7fd05a}.dsp .dr.a .dg{color:#f2c94c}.dsp .dr.x .dg{color:#ff8f86}',
    '.dsp .dempty{flex:1;display:flex;align-items:center;justify-content:center;font-size:4em;color:#cfe8d9}',
    '.dsp .df{display:flex;justify-content:space-between;align-items:center;margin-top:1.6vh;font-size:1.4em;color:#cfe8d9}.dsp .dd{display:flex;gap:.6em}.dsp .dd i{width:.8em;height:.8em;border-radius:50%;background:#34403b}.dsp .dd i.on{background:#fecb00}',
    '.spirit .sub h3.wr{text-transform:none;letter-spacing:-.01em}.langb{position:absolute;z-index:3;top:8px;right:8px;font-size:12px;font-weight:600;color:#fff;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.35);padding:3px 9px;border-radius:999px;backdrop-filter:blur(6px)}',
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
    '}',
    /* ---- polish pass: calmer, rounder, glass tab bar, grouped settings (Apple-style) ---- */
    '.w{--bg:#f5f6f6}.w.dark{--bg:#0b100e;--card:#161d1a}',
    '.w.hc{--bg:#fff}.w.hc.dark{--bg:#000}',
    '.nav{bottom:10px;margin:0 12px 10px;padding:4px;border:0;border-radius:30px;background:rgba(255,255,255,.88);-webkit-backdrop-filter:saturate(1.8) blur(20px);backdrop-filter:saturate(1.8) blur(20px);box-shadow:0 10px 32px rgba(0,0,0,.16),0 0 0 .5px rgba(0,0,0,.08)}',
    '.w.dark .nav{background:rgba(26,34,30,.84);box-shadow:0 10px 32px rgba(0,0,0,.5),0 0 0 .5px rgba(255,255,255,.12)}',
    '.nav button{min-height:54px;border-radius:24px;font-size:11.5px}',
    '.nav button[aria-current=page],.spirit .nav button[aria-current=page]{box-shadow:none;background:var(--green-10);color:var(--green-dk)}',
    '.w.hc .nav{background:var(--card);box-shadow:0 0 0 2px var(--ink)}',
    '.pad{height:96px}',
    '.card,.set{border:0;border-radius:20px;background:var(--card);box-shadow:0 1px 2px rgba(0,0,0,.05),0 0 0 .5px var(--gray-30)}',
    '.panel,.next,.banner,.empty,.stale{border-radius:18px}',
    '.spirit .g{border-radius:18px;border-width:1px;border-left-width:5px;margin:10px 0}',
    '.day{border-radius:16px;border-width:1px}',
    '.btn{border:0;background:var(--green-10);color:var(--green-dk);border-radius:999px;min-height:44px;padding:0 18px}',
    '.btn.fill{background:var(--green);color:#fff}',
    '.chip{border:0;background:var(--gray-10);color:var(--ink);font-weight:600}',
    '.chip[aria-pressed=true]{background:var(--green);color:#fff}',
    '.vt,.seg{display:flex;gap:2px;padding:2px;border-radius:12px;background:var(--gray-10);border:0}',
    '.vt{margin:12px 16px 2px}',
    '.vt button,.seg .chip{flex:1;border:0;background:transparent;border-radius:10px;min-height:38px;padding:0 8px;font-weight:600;font-size:14.5px;color:var(--ink-2)}',
    '.vt button[aria-pressed=true],.set .seg .chip[aria-pressed=true]{background:var(--card);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.18),0 0 0 .5px rgba(0,0,0,.05)}',
    '.w.dark .vt button[aria-pressed=true],.w.dark .set .seg .chip[aria-pressed=true]{background:#2c3631}',
    '.seg3{border:0;background:var(--gray-10);padding:2px;gap:2px;border-radius:12px}',
    '.seg3 button{border-radius:10px;color:var(--ink-2)}',
    '.seg3 button[aria-pressed=true]{background:var(--card);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.18)}',
    '.w.dark .seg3 button[aria-pressed=true]{background:#2c3631}',
    '.tg{flex:none;width:51px;height:31px;min-height:0;padding:0;border:0;border-radius:16px;background:#b4bab7;position:relative;transition:background .2s ease}',
    '.tg::after{content:"";position:absolute;top:2px;left:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.3);transition:transform .22s cubic-bezier(.3,1.3,.5,1)}',
    '.tg[aria-checked=true]{background:var(--green)}.tg[aria-checked=true]::after{transform:translateX(20px)}',
    '.w.dark .tg:not([aria-checked=true]){background:#4a5550}',
    '.sw{border-top:1px solid var(--gray-30);padding:6px 0}.sw:first-of-type{border-top:0}.hlp{color:var(--ink-2)}',
    '.intro{border-bottom:0;padding:18px 20px 6px}.intro h1{font-size:28px;font-weight:800;letter-spacing:-.02em}.intro p{margin:2px 0 0;color:var(--ink-2)}',
    '.sub h3{letter-spacing:-.01em}',
    '.toast{background:rgba(30,30,30,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}',
    '@media (max-width:420px){.intro h1{font-size:26px}}',
    '.scroll{display:flex;gap:8px;overflow-x:auto;padding:10px 16px 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}.scroll::-webkit-scrollbar{display:none}',
    '.scroll .chip{flex:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;min-height:40px}.scroll .chip .si{width:20px;height:20px}',
    '.filters2{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:6px 16px}',
    '.tag.po{background:var(--yellow);border:1.5px solid #2d2926;color:#2d2926}',
    '.cdn{display:flex;align-items:center;gap:14px;margin:12px 16px 12px;padding:14px 16px;border-radius:20px;background:#0b3d2b;color:#fff}',
    '.cdn .cn{display:flex;flex-direction:column;align-items:center;min-width:64px;line-height:1}.cdn .cn b{font-size:40px;font-weight:800;color:var(--yellow);letter-spacing:-.02em}.cdn .cn span{font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-top:2px}',
    '.cdn .cl{display:grid;gap:8px;font-size:16px;font-weight:700}.cdn .cl .btn{background:var(--yellow);color:#2d2926;justify-self:start;min-height:40px}',
    '.sect{margin:18px 20px 8px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3)}.card.lst{display:block;padding:0;overflow:hidden}.card.lst .row{display:flex;flex-direction:column;gap:2px;padding:12px 16px;text-decoration:none;color:var(--ink);border-top:1px solid var(--line,rgba(128,128,128,.25))}.card.lst .row:first-child{border-top:0}.card.lst .row b{font-size:15px;font-weight:600}.card.lst .row span{font-size:13px;color:var(--ink-3)}.card.lst .row:after{content:none}',
    '.card.lk{grid-template-columns:1fr auto;align-items:center}.card.lk h3{font-size:16px}'
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
    LANG = lang0(host);
    var theme = host.getAttribute('data-theme') === 'classic' ? 'classic' : 'spirit';
    var todayOverride = host.getAttribute('data-today');
    var DISPLAY = host.hasAttribute('data-display') || /[?&]display(=1|=true|&|$)/.test(location.search);
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = '<style>' + CSS + '</style><div class="w ' + theme + '"><p class="loading">' + T('Loading the schedule…') + '</p></div>';
    var w = root.querySelector('.w');
    var S = { events: [], updatedAt: '', changes: [], tab: 'today', sel: null, weekStart: null, open: null, mine: store('gcsd-ath-mine') || [], onlyMine: false, sport: null, lv: null, fw: null, view: (function () { var v = store('gcsd-ath-view'); return v === 'month' || v === 'grid' ? v : 'list'; })(), month: null, pick: [], ha: null, panel: false, stale: null, weather: null, toast: '', focusTeam: null, mode: (function () { var m = store('gcsd-ath-mode'); return m === 'dark' || m === 'light' ? m : 'auto'; })(), dis: store('gcsd-ath-hl') || {}, hlOpen: {}, cfg: window.GCSD_ATHLETICS_CONFIG || {}, set: (function () { var o = store('gcsd-ath-set') || {}; var rm = Array.isArray(o.rem) ? o.rem.filter(function (m) { return REM.indexOf(m) >= 0; }).slice(0, 2) : [60]; return { rem: rm, text: o.text === 1 || o.text === 2 ? o.text : 0, hc: !!o.hc, rm: !!o.rm, wx: o.wx !== false, cd: o.cd !== false }; })() };
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

    /* optional settings file (config.json next to the schedule): ticket, live-stream and playoff links, countdowns. Missing file = none of it shows. */
    function safeUrl(u) { return /^https:\/\//i.test(String(u || '')) ? String(u) : ''; }
    function loadCfg() {
      if (window.GCSD_ATHLETICS_CONFIG) return;
      fetch(host.getAttribute('data-config') || (BASE + 'config.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (c) { S.cfg = c || {}; if (S.events.length) render(); }).catch(function () {});
    }
    function cfgLink(k) { var c = (S.cfg && S.cfg[k]) || {}, u = safeUrl(c.url); return u ? { url: u, label: String(pick(c, 'label')).slice(0, 40) } : null; }
    function isPlayoff(e) { return /\bplay-?offs?\b|\bsectionals?\b|\bsemi-?finals?\b|\bquarter-?finals?\b|\bfinals?\b/i.test((e.note || '') + ' ' + (e.opponent || '')); }
    function cdnCards() {
      var t = today(), list = (S.cfg && Array.isArray(S.cfg.countdowns) ? S.cfg.countdowns : []).slice(0, 3), h = '';
      list.forEach(function (c) {
        if (!c || !/^\d{4}-\d\d-\d\d$/.test(c.date || '') || !pick(c, 'label')) return;
        if (c.from && /^\d{4}-\d\d-\d\d$/.test(c.from) && t < c.from) return;
        var n = Math.round((parse(c.date) - parse(t)) / 864e5); if (n < 0) return;
        var u = safeUrl(c.url);
        h += '<div class="cdn" role="status"><div class="cn"><b>' + (n === 0 ? T('Today') : n) + '</b><span>' + (n === 0 ? '' : n === 1 ? T('day') : T('days')) + '</span></div><div class="cl"><span>' + esc(String(pick(c, 'label')).slice(0, 90)) + '</span>' + (u ? '<a class="btn" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(String(pick(c, 'link_text') || T('Learn more')).slice(0, 30)) + '</a>' : '') + '</div></div>';
      });
      return h;
    }
    function cfgList(k, n) { var a = (S.cfg && S.cfg[k]) || []; return Array.isArray(a) ? a.filter(function (x) { return x && safeUrl(x.url); }).slice(0, n) : []; }
    function a2hsSteps() {
      var ua = navigator.userAgent || '', ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      return ios ? T('Tap the <b>Share</b> button, then <b>Add to Home Screen</b>.') : T('Open the browser menu (<b>⋮</b>), then tap <b>Add to Home screen</b>.');
    }
    function a2hs() {
      var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
      if (standalone || store('gcsd-ath-a2hs') || !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '')) return '';
      return '<div class="card lk a2"><div><h3 aria-level="2">' + T('Keep it on your home screen') + '</h3><p class="small">' + a2hsSteps() + ' ' + T('No download needed.') + '</p></div><button class="btn" data-act="a2x" aria-label="' + T('Dismiss') + '">' + T('Got it') + '</button></div>';
    }
    function extraLinks() {
      var h = '', po = cfgLink('playoffs');
      if (po) h += '<div class="card lk"><h3 aria-level="2">' + esc(po.label || T('Playoffs and brackets')) + '</h3><div class="acts"><a class="btn" href="' + esc(po.url) + '" target="_blank" rel="noopener">' + T('Open') + '</a></div></div>';
      var bo = cfgLink('boosters');
      if (bo) h += '<div class="card lk"><h3 aria-level="2">' + esc(bo.label || T('Support the team')) + '</h3><div class="acts"><a class="btn" href="' + esc(bo.url) + '" target="_blank" rel="noopener">' + T('Open') + '</a></div></div>';
      var nw = cfgList('news', 5);
      if (nw.length) h += '<div class="sect">' + T('Falcons in the news') + '</div><div class="card lst">' + nw.map(function (x) {
        return '<a class="row" href="' + esc(x.url) + '" target="_blank" rel="noopener"><b>' + esc(String(pick(x, 'title')).slice(0, 140)) + '</b><span>' + esc(String(x.source || '').slice(0, 40)) + (x.date ? ' · ' + esc(String(x.date).slice(0, 20)) : '') + '</span></a>';
      }).join('') + '</div>';
      var fl = cfgList('follow', 8);
      if (fl.length) h += '<div class="sect">' + T('Follow the Falcons elsewhere') + '</div><div class="card lst">' + fl.map(function (x) {
        return '<a class="row" href="' + esc(x.url) + '" target="_blank" rel="noopener"><b>' + esc(String(pick(x, 'label')).slice(0, 40)) + '</b><span>' + esc(String(pick(x, 'note')).slice(0, 60)) + '</span></a>';
      }).join('') + '</div>';
      return h + a2hs();
    }
    function foot() {
      var sp = cfgLink('sponsor'), pw = cfgLink('powered'), h = '';
      if (sp && sp.label) h += '<p class="sp">' + T('Schedule presented by {x}', { x: '<a href="' + esc(sp.url) + '" target="_blank" rel="noopener">' + esc(sp.label) + '</a>' }) + '</p>';
      if (pw && pw.label) h += '<p class="pw">' + T('Powered by {x}', { x: '<a href="' + esc(pw.url) + '" target="_blank" rel="noopener">' + esc(pw.label) + '</a>' }) + '</p>';
      return h;
    }
    /* ---------- lobby display (add ?display=1 or data-display): big, hands-free, rotating ---------- */
    function dspPages() {
      var t = today(), n = nowLocal(), PS = window.innerWidth >= 1200 ? 10 : 6, pages = [], seen = 0;
      for (var i = 0; i < 10 && seen < 4; i++) {
        var d = addDays(t, i), list = S.events.filter(function (e) { return e.date === d; }).sort(function (a, b) { return a.start.localeCompare(b.start) || a.teamName.localeCompare(b.teamName); });
        if (!list.length) { if (i === 0) pages.push({ d: d, rows: [] }); continue; }
        seen++;
        for (var k = 0; k < list.length; k += PS) pages.push({ d: d, rows: list.slice(k, k + PS) });
      }
      return pages;
    }
    function displayHtml() {
      var pages = dspPages(), t = today(), n = nowLocal();
      if (!pages.length) return '<div class="dh"><h1>Woodlands Falcons Athletics</h1></div><p class="dempty">' + T('No games today') + '</p>';
      var pg = pages[S.dpage % pages.length], isT = pg.d === t, now = tmOf(n.slice(0, 10) + 'T' + n.slice(11, 16));
      var rows = pg.rows.map(function (e) {
        var cx = e.status === 'canceled', past = e.date === t && e.start.slice(0, 16) < addMins(n, -150);
        return '<div class="dr ' + (cx ? 'x' : e.homeAway === 'home' ? 'h' : 'a') + (past ? ' past' : '') + '"><b class="dt">' + esc(tm(e)) + '</b><div class="dm"><span class="dw">' + esc(teamLabel(e)) + '</span><span class="dv">' + esc(vs(e)) + '</span></div><span class="dg">' + esc(T(cx ? 'Canceled' : e.homeAway === 'home' ? 'Home' : 'Away')) + '</span></div>';
      }).join('');
      var dots = pages.map(function (x, i) { return '<i class="' + (i === S.dpage % pages.length ? 'on' : '') + '"></i>'; }).join('');
      return '<div class="dh"><div class="dl"><img src="' + esc(ASSET.falcon) + '" alt=""><div><h1>Woodlands Falcons Athletics</h1><p>' + esc(fmt(t, { weekday: 'long', month: 'long', day: 'numeric' })) + '</p></div></div><div class="dc">' + esc(now) + '</div></div>' +
        '<div class="ds"><h2>' + esc(isT ? T('Games today') : T('Coming up')) + '</h2><span>' + (isT ? '' : esc(fmt(pg.d, { weekday: 'long', month: 'long', day: 'numeric' }))) + '</span></div>' +
        (pg.rows.length ? '<div class="dgrid' + (pg.rows.length <= 5 ? ' one' : '') + '">' + rows + '</div>' : '<p class="dempty">' + T('No games today') + '</p>') +
        '<div class="df"><span>' + esc(T('Full schedule: {u}', { u: 'greenburghcsd.org/athletics' })) + '</span><span class="dd">' + dots + '</span></div>';
    }
    function addMins(local, m) { var d = new Date(local + ':00Z'); d.setUTCMinutes(d.getUTCMinutes() + m); return d.toISOString().slice(0, 16); }
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
        if (!S.events.length) w.innerHTML = '<p class="loading">' + T('The schedule is taking a moment to load. Please try again, or open the {link}.', { link: '<a href="' + PORTAL + '/pages/schedule/schedule.php">' + T('full schedule') + '</a>' }) + '</p>';
      });
    }


    /* ---------- clock-based helpers (America/New_York) ---------- */
    function nowLocal() {
      var o = host.getAttribute('data-now'); if (o) return o;
      var p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute;
    }
    function minsBetween(a, b) { return Math.round((Date.parse(b + 'Z') - Date.parse(a + 'Z')) / 60000); }
    function dur(m) { return m >= 60 ? T('{h} hr', { h: Math.floor(m / 60) }) + (m % 60 ? ' ' + T('{m} min', { m: m % 60 }) : '') : T('{m} min', { m: m }); }
    // Soft, schedule-based wording only: we have no live scores or delay information.
    function cdText(start, end, endKnown, date) {
      if (date !== today()) return '';
      var m = minsBetween(nowLocal(), start.slice(0, 16));
      if (m > 180) return '';
      if (m > 0) return T('Starts in {d}', { d: dur(m) });
      var len = endKnown === false ? 90 : Math.min(240, Math.max(60, minsBetween(start.slice(0, 16), end.slice(0, 16)) || 90));
      if (-m === 0) return T('Starting now');
      return -m <= len ? T('Underway') : T('Earlier today');
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
      return '<span class="wx' + (h.p != null && h.p >= 50 ? ' wet' : '') + '">' + (h.p != null ? T('{t}°F · {p}% chance of rain', { t: h.t, p: h.p }) : h.t + '°F') + '</span>';
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
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(function () { say(T('Link copied')); }, function () { say(url); }); return; }
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
        if (S.lv && e.levelCode !== S.lv) return false;
        return true;
      }).sort(function (a, b) { return a.start.localeCompare(b.start) || a.teamName.localeCompare(b.teamName); });
    }
    function onDay(d) { return S.events.filter(function (e) { return e.date === d; }); }
    function mapsUrl(e) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.venue + (/Woodlands/i.test(e.venue) ? ', Hartsdale NY' : ' NY')); }
    function calUrl(key) { var c = remCode(S.set.rem); return (BASE || '/') + 'ics/' + (key ? key.replace(/:/g, '_') : 'all') + (c ? '.' + c : '') + '.ics'; }
    function webcal(u) { return u.replace(/^https?:/, 'webcal:'); }

    function gameHtml(e) {
      var cx = e.status === 'canceled', open = S.open === e.id, mine = S.mine.indexOf(e.teamKey) >= 0, ch = cx ? null : chgOf(e);
      var was = ch && ch.kind === 'rescheduled' && ch.oldTime ? (ch.oldDate && ch.oldDate !== e.date ? T('Was {x}', { x: fmt(ch.oldDate, { month: 'short', day: 'numeric' }) + ', ' + oldTm(ch.oldTime) }) : T('Was {x}', { x: oldTm(ch.oldTime) })) : '';
      var tag = ch ? (ch.kind === 'rescheduled' ? T('Time changed') : ch.kind === 'venue' ? T('Venue changed') : ch.kind === 'added' ? T('New') : '') : '';
      var h = '<li class="g ' + e.homeAway + (cx ? ' cx' : '') + (tag ? ' chg' : '') + '"><button class="gb" data-act="open" data-id="' + esc(e.id) + '" aria-expanded="' + open + '">' +
        '<span class="t">' + esc(tm(e)) + (was ? '<small class="was">' + esc(was) + '</small>' : '') + '</span>' +
        '<span><span class="who">' + (mine ? '★ ' : '') + esc(teamLabel(e)) + '</span><span class="opp">' + esc(vs(e)) + '</span>' + cdHtml(e) + wxHtml(e) + '</span>' +
        '<span class="tags"><span class="tag ' + e.homeAway + '">' + (e.homeAway === 'home' ? T('Home') : T('Away')) + '</span>' + (cx ? '<span class="tag x">' + T('Canceled') + '</span>' : '') + (!cx && isPlayoff(e) ? '<span class="tag po">' + T('Playoff') + '</span>' : '') + (tag ? '<span class="tag chg">' + tag + '</span>' : '') + '</span></button>';
      if (open) {
        h += '<div class="more"><p>' + esc(T('{d} at {t}', { d: fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' }), t: tm(e) })) + '<br>' + esc(e.venue) + (e.note ? '<br>' + esc(e.note) : '') + '</p>' +
          (cx ? '<p><strong>' + T('This game has been canceled.') + '</strong> ' + T('Check the portal for any makeup date.') + '</p>' : '') +
          '<div class="acts">' +
          (cx ? '' : '<a class="btn fill" href="' + mapsUrl(e) + '" target="_blank" rel="noopener">' + T('Directions') + '</a>' + (e.homeAway === 'home' && cfgLink('tickets') ? '<a class="btn" href="' + esc(cfgLink('tickets').url) + '" target="_blank" rel="noopener">' + esc(cfgLink('tickets').label || T('Tickets')) + '</a>' : '') + (e.homeAway === 'home' && cfgLink('live') ? '<a class="btn" href="' + esc(cfgLink('live').url) + '" target="_blank" rel="noopener">' + esc(cfgLink('live').label || T('Watch live')) + '</a>' : '') + '<button class="btn" data-act="ics" data-id="' + esc(e.id) + '">' + T('Add to calendar') + '</button>') +
          '<button class="btn" data-act="share" data-id="' + esc(e.id) + '">' + T('Share') + '</button>' +
          '<button class="btn" data-act="star" data-key="' + esc(e.teamKey) + '"><span class="star">' + (mine ? '★' : '☆') + '</span>' + (mine ? T('Following team') : T('Follow team')) + '</button></div></div>';
      }
      return h + '</li>';
    }

    function header() {
      return '<div class="hero"><div class="hero-bg" aria-hidden="true"></div><button class="langb" data-act="setlang" data-v="' + (LANG === 'es' ? 'en' : 'es') + '" lang="' + (LANG === 'es' ? 'en' : 'es') + '">' + (LANG === 'es' ? 'English' : 'Español') + '</button><div class="hero-in">' +
        '<div class="logos" role="img" aria-label="Woodlands Falcons Athletics"><img src="' + esc(ASSET.falcon) + '" alt="" width="640" height="450"><img class="wm" src="' + esc(ASSET.wordmark) + '" alt="" width="960" height="277"></div>' +
        '<p class="hero-up"><b>' + T('Updated') + '</b>' + (function () { var q = proseParts(S.updatedAt); return '<span class="d">' + esc(q.d) + '</span>' + (LANG === 'es' ? '<span class="tm">, ' + esc(q.t) + '</span>' : ' <span class="tm">at ' + esc(q.t) + '</span>'); })() + '</p></div></div>';
    }

    function intro() {
      return (S.stale ? '<div class="stale" role="status"><b>' + T('Saved copy.') + '</b> ' + esc(T('You may be offline. Showing the schedule as of {when}. It refreshes when you reconnect.', { when: prose(S.stale) })) + '</div>' : '') +
        '<div class="intro"><h1>Woodlands Falcons Athletics</h1><p>' + T('Live game schedules for every team.') + '</p></div>';
    }

    function hlBox(k, cls, title, rows, sig, roleLabel) {
      if (S.dis[k] === sig) return '<div class="hlre"><button class="chip" data-act="hlr" data-k="' + k + '">' + (k === 'b' ? T('⚠ Show alerts') : T('★ Show next up')) + '</button></div>';
      var open = !!S.hlOpen[k], more = rows.length > 1;
      return '<div class="' + cls + ' hlbox" role="status"><button class="xb" data-act="hlc" data-k="' + k + '" data-sig="' + esc(sig) + '" aria-label="' + T('Close ' + roleLabel) + '">×</button><b>' + title + '</b>' +
        '<ul class="' + (open ? 'open' : '') + '">' + rows.join('') + '</ul>' +
        (more ? '<button class="lnk" data-act="hlx" data-k="' + k + '" aria-expanded="' + open + '">' + (open ? T('Show less') : T('Show all ({n})', { n: rows.filter(function (r) { return r.indexOf('class="sh"') < 0; }).length })) + '</button>' : '') + '</div>';
    }
    function chText(c) {
      if (LANG !== 'es') return c.text;
      var e = find(c.id); if (!e) return c.text;
      var lab = teamLabel(e) + ' ' + vs(e);
      if (c.kind === 'rescheduled') { var m = /\(was (\d{4}-\d\d-\d\d) ([^)]+)\)/.exec(c.text || ''); return m ? T('{label}: now at {t}, was {old}', { label: lab, t: tm(e), old: oldTm(m[2]) }) : T('{label}: now at {t}', { label: lab, t: tm(e) }); }
      if (c.kind === 'venue') return T('{label}: new venue, {venue}', { label: lab, venue: e.venue });
      if (c.kind === 'added') return T('{label}: added to the schedule', { label: lab });
      if (c.kind === 'removed') return T('{label}: removed from the schedule', { label: lab });
      return c.text;
    }
    function banner() {
      var t = today(), cx = onDay(t).filter(function (e) { return e.status === 'canceled'; });
      var cut = Date.now() - 48 * 3600e3;
      var ch = S.changes.filter(function (c) { return Date.parse(c.at) > cut && c.kind !== 'canceled'; }).slice(0, 4);
      if (!cx.length && !ch.length) return '';
      var rows = cx.map(function (e) { return '<li>' + esc(tm(e) + ' ' + teamLabel(e) + ' ' + vs(e)) + '</li>'; });
      if (cx.length && ch.length) rows.push('<li class="sh">' + T('Other recent changes') + '</li>');
      rows = rows.concat(ch.map(function (c) { return '<li>' + esc(chText(c)) + '</li>'; }));
      var title = cx.length ? T(cx.length === 1 ? '{n} game is canceled today' : '{n} games are canceled today', { n: cx.length }) : T('Recent changes');
      return hlBox('b', 'banner', title, rows, t + '|' + cx.map(function (e) { return e.id; }).join(',') + '|' + ch.map(function (c) { return c.text; }).join('|'), 'alerts');
    }

    function stripRange() {
      var ds = S.events.map(function (e) { return e.date; }).sort(), lo = ds[0] || today(), hi = ds[ds.length - 1] || today(), t = today();
      if (t < lo) lo = t; if (t > hi) hi = t;
      return { from: mondayOf(addDays(lo, -7)), to: addDays(mondayOf(hi), 13) };
    }
    function strip() {
      var t = today(), r = stripRange(), h = '<div class="stripw"><div class="shead"><span class="smon" aria-hidden="true">' + esc(fmt(S.sel || t, { month: 'long', year: 'numeric' })) + '</span><button class="lnk" data-act="stoday">' + T('Today') + '</button></div>' +
        '<div class="strip"><button class="wk" data-act="stripgo" data-n="-1" aria-label="' + T('Earlier days') + '">‹</button><div class="srow" role="group" aria-label="' + T('Pick a day. Swipe sideways for more days.') + '">';
      for (var d = r.from; d <= r.to; d = addDays(d, 1)) {
        var n = visible(onDay(d)).length;
        h += '<button class="day' + (d === t ? ' is-today' : '') + (d.slice(8) === '01' ? ' m1' : '') + '" data-act="day" data-d="' + d + '" aria-pressed="' + (d === S.sel) + '" aria-label="' + esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' }) + ', ' + T(n === 1 ? '{n} game' : '{n} games', { n: n })) + '">' +
          '<small>' + fmt(d, { weekday: 'short' }) + '</small><strong>' + parse(d).getUTCDate() + '</strong><i class="' + (n ? '' : 'none') + '"></i></button>';
      }
      return h + '</div><button class="wk" data-act="stripgo" data-n="1" aria-label="' + T('Later days') + '">›</button></div></div>';
    }

    function mineChip() {
      return S.mine.length ? '<button class="chip" data-act="mine" aria-pressed="' + S.onlyMine + '">' + T('★ My teams') + '</button>' : '';
    }

    function nextUp() {
      if (!S.mine.length || S.onlyMine) return '';
      var n = nowLocal(), t = today(), tmw = addDays(t, 1);
      var up = S.events.filter(function (e) { return S.mine.indexOf(e.teamKey) >= 0 && e.status !== 'canceled' && e.start.slice(0, 16) >= n; })
        .sort(function (a, b) { return a.start.localeCompare(b.start); }).slice(0, 3);
      if (!up.length) return '';
      var rows = up.map(function (e) {
        return '<li><button class="nb" data-act="day" data-d="' + e.date + '"><b>' + (e.date === t ? T('Today') : e.date === tmw ? T('Tomorrow') : esc(fmt(e.date, { weekday: 'short', month: 'short', day: 'numeric' }))) + '</b> ' + esc(tm(e)) + ' ' + esc(teamLabel(e)) + ' ' + esc(vs(e)) + '</button></li>';
      });
      return hlBox('n', 'next', T('Next up for your teams'), rows, up.map(function (e) { return e.id; }).join(','), 'next up');
    }
    function fsum() {
      var p = [];
      if (S.onlyMine) p.push(T('My teams'));
      if (S.pick.length) p.push(T(S.pick.length === 1 ? '{n} team' : '{n} teams', { n: S.pick.length }));
      if (S.ha) p.push(T(S.ha === 'home' ? 'Home games' : 'Away games'));
      if (S.sport) p.push(T('One sport'));
      if (S.lv) p.push(T({ V: 'Varsity', JV: 'JV', MOD: 'Modified' }[S.lv]));
      return p.length ? '<div class="fsum" role="status">' + esc(T('Showing: {list}.', { list: p.join(', ') })) + ' <button class="lnk" data-act="clearf">' + T('Clear filters') + '</button></div>' : '';
    }

    function todayTab() {
      var d = S.sel, list = visible(onDay(d)), h = banner() + cdnCards() + nextUp() + strip() + sportChips();
      h += '<div class="sub"><h3 aria-level="2">' + (d === today() ? T('Today') : esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' }))) + '</h3><span class="subr"><button class="lnk" data-act="shareday" data-d="' + d + '">' + T('Share this day') + '</button></span></div>' + fsum();
      if (list.length) return h + '<ul class="list">' + list.map(gameHtml).join('') + '</ul>';
      var next = S.events.filter(function (e) { return e.date > d; }), nx = visible(next)[0];
      h += '<div class="empty">' + esc(d === today() ? T(S.onlyMine ? 'None of your teams play today.' : 'No games today.') : T(S.onlyMine ? 'None of your teams play on {day}.' : 'No games on {day}.', { day: fmt(d, { weekday: 'long' }) })) +
        (nx ? '<br><button class="btn" data-act="day" data-d="' + nx.date + '">' + esc(T('Next: {x}', { x: fmt(nx.date, { weekday: 'short', month: 'short', day: 'numeric' }) })) + '</button>' : '') + '</div>';
      return h;
    }

    function monthLabel(ym) { return fmt(ym + '-01', { month: 'long', year: 'numeric' }); }
    function WDn() { return [5, 6, 7, 8, 9, 10, 11].map(function (d) { return fmt('2026-01-' + (d < 10 ? '0' + d : d), { weekday: 'short' }); }); }
    function shortTeam(e) {
      var g = e.gender === 'Girls' ? (LANG === 'es' ? 'Ch' : 'G') : e.gender === 'Boys' ? (LANG === 'es' ? 'Co' : 'B') : (LANG === 'es' ? 'Ch/Co' : 'B&G');
      return g + ' ' + e.levelCode + ' ' + sportName(e.sport);
    }
    function monthBounds() {
      var m = S.events.map(function (e) { return e.date.slice(0, 7); }).sort();
      return { min: m[0] || today().slice(0, 7), max: m[m.length - 1] || today().slice(0, 7) };
    }
    function shiftMonth(ym, n) { var p = ym.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1 + n, 1)); return d.toISOString().slice(0, 7); }
    function viewToggle() {
      function b(v, l) { return '<button data-act="view" data-v="' + v + '" aria-pressed="' + (S.view === v) + '">' + l + '</button>'; }
      return '<div class="vt" role="group" aria-label="' + T('Calendar view') + '">' + b('list', T('List')) + b('grid', T('Week')) + b('month', T('Month')) + '</div>';
    }
    function teamIndex() {
      var by = {}, order = [];
      S.events.forEach(function (e) { if (!by[e.sportSlug]) { by[e.sportSlug] = { name: sportName(e.sport), teams: {} }; order.push(e.sportSlug); } by[e.sportSlug].teams[e.teamKey] = genLvl(e); });
      order.sort(function (a, b) { return by[a].name.localeCompare(by[b].name); });
      return { by: by, order: order };
    }
    function sportChips() {
      var ix = teamIndex(), h = '<div class="scroll" role="group" aria-label="' + T('Filter by sport') + '">' + mineChip() +
        '<button class="chip" data-act="sport" data-s="" aria-pressed="' + (!S.sport) + '">' + T('All sports') + '</button>';
      ix.order.forEach(function (sp) { h += '<button class="chip" data-act="sport" data-s="' + esc(sp) + '" aria-pressed="' + (S.sport === sp) + '">' + sportIcon(sp) + esc(ix.by[sp].name) + '</button>'; });
      return h + '</div>';
    }
    function filtersHtml() {
      function ha(v, l) { return '<button data-act="ha" data-v="' + v + '" aria-pressed="' + ((S.ha || '') === v) + '">' + l + '</button>'; }
      function lvb(v, l) { return '<button data-act="lv" data-v="' + v + '" aria-pressed="' + ((S.lv || '') === v) + '">' + l + '</button>'; }
      var h = sportChips() + '<div class="filters2"><span class="seg3" role="group" aria-label="' + T('Level') + '">' + lvb('', T('All levels')) + lvb('V', T('Varsity')) + lvb('JV', T('JV')) + lvb('MOD', T('Modified')) + '</span></div><div class="filters2">' +
        '<button class="chip" data-act="panel" aria-expanded="' + S.panel + '" aria-controls="tp">' + (S.pick.length ? T('Teams: {n}', { n: S.pick.length }) : T('Choose teams')) + ' <span aria-hidden="true">' + (S.panel ? '▴' : '▾') + '</span></button>' +
        '<span class="seg3" role="group" aria-label="' + T('Home or away') + '">' + ha('', T('All')) + ha('home', T('Home')) + ha('away', T('Away')) + '</span></div>';
      if (S.panel) {
        var ix = teamIndex();
        h += '<div class="panel" id="tp"><p class="note0">' + T('Pick the teams you want to see. Nothing is saved or sent anywhere.') + '</p>' + ix.order.map(function (sp) {
          var g = ix.by[sp], keys = Object.keys(g.teams).sort();
          return '<fieldset><legend>' + sportIcon(sp) + esc(g.name) + '<button class="lnk" data-act="picksport" data-s="' + esc(sp) + '">' + (keys.every(function (k) { return S.pick.indexOf(k) >= 0; }) ? T('Unselect all') : T('Select all')) + '</button></legend>' +
            keys.map(function (k) { return '<label class="ck"><input type="checkbox" data-act="pick" data-key="' + esc(k) + '"' + (S.pick.indexOf(k) >= 0 ? ' checked' : '') + '><span>' + esc(g.teams[k]) + '</span></label>'; }).join('') + '</fieldset>';
        }).join('') + '<div class="acts"><button class="btn fill" data-act="panel">' + T('Done') + '</button><button class="btn" data-act="clearpick">' + T('Clear teams') + '</button></div></div>';
      }
      return h + fsum();
    }
    function monthView() {
      var ym = S.month || (S.month = (S.sel || today()).slice(0, 7)), bd = monthBounds(), t = today();
      var p = ym.split('-').map(Number), first = ym + '-01', last = addDays(shiftMonth(ym, 1) + '-01', -1);
      var h = banner() + viewToggle() + '<div class="mhead"><h3 aria-level="2">' + esc(monthLabel(ym)) + '</h3><span class="arrows">' +
        '<button class="wk" data-act="mo" data-n="-1" aria-label="' + T('Previous month') + '"' + (ym <= bd.min ? ' disabled' : '') + '>‹</button>' +
        '<button class="wk" data-act="mo" data-n="1" aria-label="' + T('Next month') + '"' + (ym >= bd.max ? ' disabled' : '') + '>›</button></span></div>' + filtersHtml();
      h += '<div class="mcal"><table class="mt"><caption class="sr" style="position:absolute;left:-9999px">' + esc(T('{month} game calendar', { month: monthLabel(ym) })) + '</caption><thead><tr>' +
        WDn().map(function (w) { return '<th scope="col">' + w + '</th>'; }).join('') + '</tr></thead><tbody>';
      var d = mondayOf(first);
      while (d <= last) {
        h += '<tr>';
        for (var i = 0; i < 7; i++, d = addDays(d, 1)) {
          var inM = d.slice(0, 7) === ym, list = inM ? visible(onDay(d)) : [], n = Number(d.slice(8));
          var label = fmt(d, { weekday: 'long', month: 'long', day: 'numeric' }) + (list.length ? ', ' + T(list.length === 1 ? '{n} game' : '{n} games', { n: list.length }) : ', ' + T('no games'));
          h += '<td class="' + (inM ? '' : 'out') + '"><button class="cell' + (d === t ? ' is-today' : '') + '" data-act="cal" data-d="' + d + '" aria-pressed="' + (d === S.sel) + '" aria-label="' + esc(label) + '"><span class="n">' + n + '</span>';
          if (list.length) {
            h += '<span class="dots" aria-hidden="true">' + list.slice(0, 6).map(function (e) { return '<i class="' + (e.status === 'canceled' ? 'x' : e.homeAway === 'away' ? 'a' : '') + '"></i>'; }).join('') + '</span>';
            h += '<span class="chips" aria-hidden="true">' + list.slice(0, 3).map(function (e) {
              return '<span class="c ' + (e.status === 'canceled' ? 'x' : e.homeAway === 'away' ? 'a' : 'h') + '"><b>' + esc(tm(e)) + '</b> ' + esc(sportName(e.sport)) + '<small>' + esc(genLvl(e)) + '</small></span>';
            }).join('') + (list.length > 3 ? '<span class="more">' + T('+{n} more', { n: list.length - 3 }) + '</span>' : '') + '</span>';
          }
          h += '</button></td>';
        }
        h += '</tr>';
      }
      h += '</tbody></table></div><div class="legend"><span><i></i>' + T('Home') + '</span><span><i class="a"></i>' + T('Away') + '</span><span><i class="x"></i>' + T('Canceled') + '</span><span class="pr"><button class="lnk" data-act="print">' + T('Print this month') + '</button></span></div>';
      var sd = S.sel && S.sel.slice(0, 7) === ym ? S.sel : null;
      if (sd) {
        var list2 = visible(onDay(sd));
        h += '<h3 aria-level="2" class="dayh">' + esc(fmt(sd, { weekday: 'long', month: 'long', day: 'numeric' })) + (sd === t ? '<span class="pill">' + T('Today') + '</span>' : '') + '</h3>';
        h += list2.length ? '<ul class="list">' + list2.map(gameHtml).join('') + '</ul>' : '<div class="empty">' + T(S.onlyMine || S.sport ? 'No games match this day.' : 'No games scheduled this day.') + '</div>';
      } else h += '<div class="empty">' + T('Tap a day to see its games.') + '</div>';
      return h;
    }

    function weekHead() {
      var a = S.weekStart, z = addDays(a, 6), same = a.slice(0, 7) === z.slice(0, 7), md = { month: 'short', day: 'numeric' }, dd = { day: 'numeric' };
      var rng = same ? (LANG === 'es' ? fmt(a, dd) + ' – ' + fmt(z, md) : fmt(a, md) + ' – ' + fmt(z, dd)) : fmt(a, md) + ' – ' + fmt(z, md);
      return '<div class="sub"><h3 aria-level="2" class="wr">' + esc(rng) + '</h3>' +
        '<span><button class="lnk" data-act="printweek">' + T('Print') + '</button> <button class="wk" data-act="wk" data-n="-7" aria-label="' + T('Previous week') + '">‹</button><button class="wk" data-act="wk" data-n="7" aria-label="' + T('Next week') + '">›</button></span></div>';
    }
    function weekGrid() {
      var t = today(), h = banner() + viewToggle() + weekHead() + filtersHtml() + '<div class="wgw"><div class="wgrid">', any = false;
      for (var i = 0; i < 7; i++) {
        var d = addDays(S.weekStart, i), list = visible(onDay(d));
        if (list.length) any = true;
        h += '<section class="wd' + (d === t ? ' is-today' : '') + (list.length ? '' : ' none') + '" aria-label="' + esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })) + '"><h4 aria-level="3"><span>' + fmt(d, { weekday: 'short' }) + '</span> <b>' + parse(d).getUTCDate() + '</b></h4>';
        h += list.length ? '<ul>' + list.map(function (e) {
          var cx = e.status === 'canceled';
          return '<li><button class="wc ' + (cx ? 'x' : e.homeAway === 'away' ? 'a' : 'h') + '" data-act="goday" data-d="' + d + '" data-id="' + esc(e.id) + '"><b>' + esc(tm(e)) + '</b> ' + esc(sportName(e.sport)) + '<small>' + esc(genLvl(e)) + '</small><small>' + (cx ? T('Canceled') : esc(vs(e))) + '</small></button></li>';
        }).join('') + '</ul>' : '<p class="nog">' + T('No games') + '</p>';
        h += '</section>';
      }
      h += '</div></div>';
      if (!any) h += '<div class="empty">' + T('No games match this week.') + '</div>';
      return h + '<p class="note">' + T('Tap a game for directions, calendar and sharing.') + '</p>';
    }
    function weekTab() {
      if (S.view === 'month') return monthView();
      if (S.view === 'grid') return weekGrid();
      var h = banner() + viewToggle() + weekHead() + filtersHtml(), any = false;
      for (var i = 0; i < 7; i++) {
        var d = addDays(S.weekStart, i), list = visible(onDay(d));
        if (!list.length) continue; any = true;
        h += '<h3 aria-level="2" class="dayh">' + esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })) + (d === today() ? '<span class="pill">' + T('Today') + '</span>' : '') + '</h3><ul class="list">' + list.map(gameHtml).join('') + '</ul>';
      }
      if (!any) h += '<div class="empty">' + T('No games match this week.') + '</div>';
      return h;
    }

    function teamsTab() {
      var by = {}, order = [];
      S.events.forEach(function (e) { if (!by[e.sportSlug]) { by[e.sportSlug] = {}; order.push(e.sportSlug); } by[e.sportSlug][e.teamKey] = e; });
      var t = today(), h = '<p class="note">' + T('Tap ☆ to follow a team. Followed teams show first in My teams, saved on this device only.') + '</p>';
      order.sort().forEach(function (sp) {
        var keys = Object.keys(by[sp]).sort();
        h += '<h3 aria-level="2" class="grp">' + sportIcon(sp) + '<span>' + esc(sportName(by[sp][keys[0]].sport)) + '</span></h3>';
        keys.forEach(function (k) {
          var e = by[sp][k], on = S.mine.indexOf(k) >= 0;
          var nx = S.events.filter(function (g) { return g.teamKey === k && g.date >= t && g.status !== 'canceled'; }).sort(function (a, b) { return a.start.localeCompare(b.start); })[0];
          h += '<div class="team' + (S.hlTeam === k ? ' hl' : '') + '" data-team="' + esc(k) + '"><button class="sbtn" data-act="star" data-key="' + esc(k) + '" aria-pressed="' + on + '" aria-label="' + esc(T(on ? 'Unfollow {x}' : 'Follow {x}', { x: teamLabel(e) })) + '">' + (on ? '★' : '☆') + '</button>' +
            '<span><span class="nm">' + esc(genLvl(e)) + ' <button class="lnk" data-act="shareteam" data-key="' + esc(k) + '">' + T('Share') + '</button></span><span class="nx">' + (nx ? esc(T('Next: {x}', { x: fmt(nx.date, { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + tm(nx) + ' ' + vs(nx) })) : T('No upcoming games')) + '</span></span>' +
            '<a class="btn" href="' + webcal(calUrl(k)) + '">' + T('Calendar') + '</a></div>';
        });
      });
      return h;
    }

    function alertsTab() {
      var all = calUrl(), absAll = new URL(all, location.href).href;
      function steps(title, items) { return '<details><summary>' + T(title) + '</summary><ol>' + items.map(function (i) { return '<li>' + T(i) + '</li>'; }).join('') + '</ol></details>'; }
      return '<div class="card"><h3 aria-level="2">' + T('Put every game in your calendar') + '</h3><p>' + T('No account and no sign-up. Add it once and your calendar keeps itself up to date when a game moves or is canceled.') + '</p>' +
        '<div class="acts"><a class="btn fill" href="' + webcal(all) + '">' + T('Subscribe to all games') + '</a><button class="btn" data-act="copy" data-u="' + esc(absAll) + '">' + T('Copy link') + '</button></div>' +
        '<p class="small">' + T('Reminders: {list}.', { list: S.set.rem.length ? S.set.rem.slice().sort(function (x, y) { return y - x; }).map(function (m) { return remLabel(m).toLowerCase(); }).join(T(' and ')) : T('none') }) + ' <button class="lnk" data-act="tab" data-t="settings">' + T('Change in Settings') + '</button></p>' +
        steps('iPhone or iPad', ['Tap <b>Subscribe to all games</b>.', 'When your phone asks, tap <b>Subscribe</b>.', 'Done. Apple Calendar refreshes within a few hours.']) +
        steps('Android or Google Calendar', ['Tap <b>Copy link</b>.', 'On a computer, open calendar.google.com and sign in.', 'Next to <b>Other calendars</b>, click <b>+</b>, then <b>From URL</b>.', 'Paste the link and click <b>Add calendar</b>. It then shows up in the Google Calendar app on your phone. Google can take up to a day to pick up changes.']) +
        steps('Outlook', ['Tap <b>Copy link</b>.', 'In Outlook, choose <b>Add calendar</b>, then <b>Subscribe from web</b>.', 'Paste the link and save.']) +
        '<p>' + T('Just one team? Open the {link} and tap Calendar next to it.', { link: '<button class="lnk" data-act="tab" data-t="teams">' + T('Teams tab') + '</button>' }) + '</p></div>' +
        '<div class="card"><h3 aria-level="2">' + T('Text and email alerts') + '</h3><p>' + T('Optional. The athletics portal can message you when a game changes. It asks for your phone number or email, so it is your choice.') + '</p><div class="acts"><a class="btn" href="' + PORTAL + '" target="_blank" rel="noopener">' + T('Open the portal') + '</a></div></div>' +
        '<div class="card"><h3 aria-level="2">' + T('Follow by feed') + '</h3><p>' + T('For news readers and other tools.') + '</p><div class="acts"><a class="btn" href="' + (BASE || '/') + 'rss.xml">' + T('RSS feed') + '</a></div></div>' +
        '<div class="card"><h3 aria-level="2">' + T('Questions') + '</h3><p>' + esc(T('{name}, Athletics', { name: CONTACT.name })) + '<br>' + esc(CONTACT.phone) + '<br>' + esc(CONTACT.email) + '</p><div class="acts"><a class="btn" href="tel:9147616052,3014">' + T('Call') + '</a><a class="btn" href="mailto:' + esc(CONTACT.email) + '">' + T('Email') + '</a></div></div>' +
        '<p class="note">' + T('Schedules can change. Countdowns follow the posted game time, not live updates. For the latest, see {link}.', { link: '<a href="' + PORTAL + '/pages/schedule/schedule.php">woodlandsathletics.digitalsports.com</a>' }) + '</p>';
    }

    function settingsTab() {
      function ch(act, v, label, on) { return '<button class="chip" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + on + '">' + (act === 'setlang' ? label : T(label)) + '</button>'; }
      function sw(act, label, on, help) { label = T(label); return '<div class="sw"><span><b>' + label + '</b>' + (help ? '<br><small class="hlp">' + T(help) + '</small>' : '') + '</span><button class="tg" data-act="' + act + '" role="switch" aria-checked="' + on + '" aria-label="' + label + '"></button></div>'; }
      var h = '<div class="set"><h3 aria-level="2">' + T('Language') + '</h3><div class="seg" role="group">' + ch('setlang', 'en', 'English', LANG === 'en') + ch('setlang', 'es', 'Español', LANG === 'es') + '</div></div>' +
        '<div class="set"><h3 aria-level="2">' + T('Text size') + '</h3><p>' + T('Makes everything below the banner bigger.') + '</p><div class="seg" role="group">' + ch('settext', '0', 'Standard', S.set.text === 0) + ch('settext', '1', 'Large', S.set.text === 1) + ch('settext', '2', 'Largest', S.set.text === 2) + '</div></div>' +
        '<div class="set"><h3 aria-level="2">' + T('Appearance') + '</h3><div class="seg" role="group">' + ch('setmode', 'auto', 'Auto', S.mode === 'auto') + ch('setmode', 'light', 'Light', S.mode === 'light') + ch('setmode', 'dark', 'Dark', S.mode === 'dark') + '</div>' +
        sw('sethc', 'High contrast', S.set.hc, 'Black text, stronger outlines, plain card backgrounds.') + sw('setrm', 'Reduce motion', RM, RM0 ? 'Your phone already asks for this.' : 'Turns off sliding and fading.') + '</div>' +
        '<div class="set"><h3 aria-level="2">' + T('Get change alerts') + '</h3><p>' + T('Subscribe to the calendar and your phone updates games when the schedule changes.') + ' <button class="lnk" data-act="tab" data-t="alerts">' + T('Show me how') + '</button></p></div>' +
        '<div class="set"><h3 aria-level="2">' + T('Add to home screen') + '</h3><p>' + a2hsSteps() + ' ' + T('It opens like an app, with nothing to download.') + '</p></div>' +
        '<div class="set"><h3 aria-level="2">' + T('What to show') + '</h3>' + sw('setcd', 'Countdowns', S.set.cd, 'For example “Starts in 30 min”.') + sw('setwx', 'Weather on home games', S.set.wx) +
        '<p>' + T('Calendar opens as') + '</p><div class="seg" role="group">' + ch('view', 'list', 'List', S.view === 'list') + ch('view', 'grid', 'Week', S.view === 'grid') + ch('view', 'month', 'Month', S.view === 'month') + '</div></div>';
      var presets = [[[], T('None')], [[30], T('30 min')], [[60], T('1 hour')], [[120], T('2 hours')]];
      function opt(m, sel) { return '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + (m === '' ? T('None') : remLabel(m)) + '</option>'; }
      function sel(i) { var cur = S.set.rem.slice().sort(function (a, b) { return b - a; })[i]; cur = cur === undefined ? '' : cur; return '<label class="sel"><span>' + T(i ? 'Second alert' : 'Alert') + '</span><select data-act="setrem" data-i="' + i + '">' + opt('', cur) + REM.map(function (m) { return opt(m, cur); }).join('') + '</select></label>'; }
      h += '<div class="set"><h3 aria-level="2">' + T('Game reminders') + '</h3><p>' + T('Your calendar app alerts you before each game. Pick up to two.') + '</p><div class="seg" role="group">' + presets.map(function (p) { return '<button class="chip" data-act="setrempre" data-v="' + p[0].join(',') + '" aria-pressed="' + (remCode(S.set.rem) === remCode(p[0])) + '">' + p[1] + '</button>'; }).join('') + '</div>' + sel(0) + sel(1) +
        '<p class="small">' + T('Changing this later? Subscribe again from the Alerts tab, then remove the old calendar. Google Calendar may use its own default alert instead.') + '</p></div>';
      var mine = S.mine.map(function (k) { return S.events.filter(function (e) { return e.teamKey === k; })[0]; }).filter(Boolean);
      h += '<div class="set"><h3 aria-level="2">' + T('My teams') + '</h3>' + (mine.length ? mine.map(function (e) { return '<div class="mt1"><span>' + sportIcon(e.sportSlug) + ' ' + esc(teamLabel(e)) + '</span><button class="lnk" data-act="star" data-key="' + esc(e.teamKey) + '">' + T('Remove') + '</button></div>'; }).join('') : '<p>' + T('No teams followed yet. Tap ☆ on the Teams tab.') + '</p>') + '</div>' +
        '<div class="set"><h3 aria-level="2">' + T('Reset') + '</h3><p>' + T('Clears your followed teams and these settings from this device. Nothing is sent anywhere.') + '</p><div class="acts"><button class="btn" data-act="resetall">' + T('Reset everything') + '</button></div></div>' +
        '<p class="note">' + T('Settings are saved on this device only. No account, no tracking.') + '</p>';
      return h;
    }

    function openPrint(html) {
      var win = window.open('', '_blank');
      if (!win) { say(T('Allow pop-ups to print')); return; }
      win.document.open(); win.document.write(html); win.document.close(); win.focus(); setTimeout(function () { try { win.print(); } catch (e) {} }, 350);
    }
    function printWeek() {
      var ws = S.weekStart, we = addDays(ws, 6), body = '', any = false;
      var who = S.onlyMine ? T('My teams') : S.pick.length ? T(S.pick.length === 1 ? '{n} team' : '{n} teams', { n: S.pick.length }) : S.sport ? T('One sport') : T('All teams');
      for (var i = 0; i < 7; i++) {
        var d = addDays(ws, i), list = visible(onDay(d)); if (!list.length) continue; any = true;
        body += '<h2>' + esc(fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })) + '</h2><table>' + list.map(function (e) {
          var cx = e.status === 'canceled';
          return '<tr class="' + (cx ? 'x' : e.homeAway) + '"><td class="t">' + esc(tm(e)) + '</td><td><b>' + esc(teamLabel(e)) + '</b><br>' + esc(vs(e)) + '</td><td>' + esc(e.venue) + '</td><td class="h">' + T(cx ? 'Canceled' : e.homeAway === 'home' ? 'Home' : 'Away').toUpperCase() + '</td></tr>';
        }).join('') + '</table>';
      }
      if (!any) body = '<p>' + T('No games this week for this view.') + '</p>';
      var css = '@page{size:letter portrait;margin:.5in}*{box-sizing:border-box}body{font:12px/1.3 "Gill Sans","Gill Sans MT",Arial,sans-serif;color:#2d2926;margin:0}h1{margin:0;font-size:20px;color:#006b31}p{margin:2px 0 8px;color:#5b5752}h2{margin:14px 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #006b31;padding-bottom:2px}table{width:100%;border-collapse:collapse}td{padding:5px 6px;border-bottom:1px solid #dcdfe0;vertical-align:top}td.t{width:62px;font-weight:700}td.h{width:70px;text-align:right;font-weight:700;font-size:10.5px;letter-spacing:.05em}tr.home td.t,tr.home td.h{color:#006b31}tr.away td.t,tr.away td.h{color:#7a5800}tr.x td{color:#7a1a14}tr.x td.t,tr.x b{text-decoration:line-through}tr{page-break-inside:avoid}.f{margin-top:14px;font-size:10.5px;color:#5b5752}';
      openPrint('<!doctype html><html lang="' + LANG + '"><head><meta charset="utf-8"><title>Woodlands Falcons Athletics, ' + esc(T('week of {d}', { d: fmt(ws, { month: 'short', day: 'numeric' }) })) + '</title><style>' + css + '</style></head><body><h1>Woodlands Falcons Athletics</h1><p>' + esc(fmt(ws, { month: 'long', day: 'numeric' }) + ' – ' + fmt(we, { month: 'long', day: 'numeric', year: 'numeric' })) + ' · ' + esc(who) + '</p>' + body + '<div class="f">' + esc(T('Schedule as of {when}. Schedules can change; check greenburghcsd.org/athletics for the latest.', { when: prose(S.updatedAt) })) + '</div></body></html>');
    }
    function printMonth() {
      var ym = S.month || (S.sel || today()).slice(0, 7), p = ym.split('-').map(Number), first = ym + '-01', last = addDays(shiftMonth(ym, 1) + '-01', -1);
      var who = S.onlyMine ? T('My teams') : S.pick.length ? T(S.pick.length === 1 ? '{n} team' : '{n} teams', { n: S.pick.length }) : T('All teams');
      var rows = '', d = mondayOf(first);
      while (d <= last) {
        rows += '<tr>';
        for (var i = 0; i < 7; i++, d = addDays(d, 1)) {
          var inM = d.slice(0, 7) === ym, list = inM ? visible(onDay(d)) : [];
          rows += '<td class="' + (inM ? '' : 'o') + '"><div class="n">' + (inM ? Number(d.slice(8)) : '') + '</div>' + list.map(function (e) {
            var cx = e.status === 'canceled';
            return '<div class="e ' + (cx ? 'x' : e.homeAway) + '"><b>' + esc(tm(e)) + '</b> ' + esc(shortTeam(e)) + ' ' + (e.homeAway === 'home' ? T('vs.') : '@') + ' ' + esc(school(e.opponent)) + (cx ? ' (' + T('Canceled').toUpperCase() + ')' : '') + '</div>';
          }).join('') + '</td>';
        }
        rows += '</tr>';
      }
      var css = '@page{size:letter landscape;margin:.35in}*{box-sizing:border-box}body{font:9px/1.15 "Gill Sans","Gill Sans MT",Arial,sans-serif;color:#2d2926;margin:0}h1{margin:0;font-size:17px;color:#006b31}p{margin:1px 0 4px;color:#5b5752}tr{page-break-inside:avoid}table{width:100%;border-collapse:collapse;table-layout:fixed}th{background:#00843d;color:#fff;font-size:9px;padding:2px;text-transform:uppercase}td{border:1px solid #a5acaf;vertical-align:top;height:.6in;padding:1px 2px}td.o{background:#f4f5f5}.n{font-weight:700;font-size:10px}.e{margin-top:1px;padding:0 2px;border-left:4px solid #00843d;background:var(--card)}.e.away{border-left-color:var(--away-bd);background:var(--away-bg)}.e.x{border-left-color:#b3261e;text-decoration:line-through;color:var(--ink-3)}.f{margin-top:3px;font-size:8px;color:#5b5752}';
      var html = '<!doctype html><html lang="' + LANG + '"><head><meta charset="utf-8"><title>Woodlands Falcons Athletics, ' + esc(monthLabel(ym)) + '</title><style>' + css + '</style></head><body><h1>Woodlands Falcons Athletics · ' + esc(monthLabel(ym)) + '</h1><p>' + esc(who) + (S.ha ? ', ' + T(S.ha === 'home' ? 'Home games only' : 'Away games only') : '') + '. ' + T('White boxes are home games, yellow are away.') + '</p><table><thead><tr>' +
        WDn().map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table><div class="f">' + esc(T('Schedule as of {when}. Schedules can change; check greenburghcsd.org/athletics for the latest.', { when: prose(S.updatedAt) })) + '</div></body></html>';
      var win = window.open('', '_blank');
      if (!win) { say(T('Allow pop-ups to print')); return; }
      win.document.open(); win.document.write(html); win.document.close(); win.focus(); setTimeout(function () { try { win.print(); } catch (e) {} }, 350);
    }

    function nav() {
      var tabs = [['today', T('Today')], ['week', T('Calendar')], ['teams', T('Teams')], ['alerts', T('Alerts')], ['settings', T('Settings')]];
      return '<nav class="nav" aria-label="' + T('Athletics sections') + '">' + tabs.map(function (t) {
        return '<button data-act="tab" data-t="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + ICON[t[0]] + t[1] + '</button>';
      }).join('') + '</nav>';
    }

    function keyOf(el) { return el.getAttribute('data-act') + '|' + (el.getAttribute('data-id') || el.getAttribute('data-d') || el.getAttribute('data-t') || el.getAttribute('data-key') || el.getAttribute('data-s') || el.getAttribute('data-v') || el.getAttribute('data-n') || ''); }
    function render() {
      if (DISPLAY) { w.setAttribute('lang', LANG); w.className = 'w dsp dark ' + theme; w.innerHTML = displayHtml(); return; }
      w.setAttribute('lang', LANG); RM = RM0 || S.set.rm; w.className = 'w ' + theme + (isDark() ? ' dark' : '') + (S.set.hc ? ' hc' : '') + (S.set.text ? ' tx' + S.set.text : '') + (RM ? ' rm' : '');
      var oldRow = w.querySelector ? w.querySelector('.srow') : null; if (oldRow) S.stripLeft = oldRow.scrollLeft;
      var ae = root.activeElement, keep = ae && ae.getAttribute && ae.getAttribute('data-act') ? keyOf(ae) : null;
      var body = S.tab === 'today' ? todayTab() : S.tab === 'week' ? weekTab() : S.tab === 'teams' ? teamsTab() : S.tab === 'settings' ? settingsTab() : alertsTab();
      w.innerHTML = header() + '<div class="main' + (S.tab === 'week' && (S.view === 'month' || S.view === 'grid') ? ' wide' : '') + '">' + intro() + '<div class="body' + (S.fx ? ' fx' : '') + '">' + body + (S.tab === 'today' || S.tab === 'week' ? extraLinks() : '') + foot() + '</div><div class="pad"></div>' + nav() + '</div>' + (S.toast ? '<div class="toast" role="status">' + esc(S.toast) + '</div>' : '');
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

    root.addEventListener('change', function (ev) {
      var t = ev.target; if (!t || t.getAttribute('data-act') !== 'setrem') return;
      var vals = root.querySelectorAll('[data-act=setrem]'), l = [];
      for (var i = 0; i < vals.length; i++) { var v = vals[i].value; if (v !== '') { v = Number(v); if (l.indexOf(v) < 0) l.push(v); } }
      S.set.rem = l; saveSet(); render();
    });
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
      else if (a === 'setrempre') { var rv = b.getAttribute('data-v'); S.set.rem = rv ? rv.split(',').map(Number) : []; saveSet(); }
      else if (a === 'settext') { S.set.text = Number(b.getAttribute('data-v')); saveSet(); }
      else if (a === 'sethc') { S.set.hc = !S.set.hc; saveSet(); }
      else if (a === 'setrm') { S.set.rm = !RM; saveSet(); }
      else if (a === 'setcd') { S.set.cd = !S.set.cd; saveSet(); }
      else if (a === 'setwx') { S.set.wx = !S.set.wx; saveSet(); }
      else if (a === 'resetall') { S.set = { rem: [60], text: 0, hc: false, rm: false, wx: true, cd: true }; S.mode = 'auto'; S.mine = []; S.onlyMine = false; S.dis = {}; saveSet(); store('gcsd-ath-mode', 'auto'); store('gcsd-ath-mine', []); store('gcsd-ath-hl', {}); }
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
      else if (a === 'setlang') { var nl = b.getAttribute('data-v'); LANG = nl === 'es' ? 'es' : 'en'; store('gcsd-ath-lang', LANG); S.fx = false; }
      else if (a === 'a2x') { store('gcsd-ath-a2hs', 1); }
      else if (a === 'lv') { S.lv = b.getAttribute('data-v') || null; }
      else if (a === 'ha') { S.ha = b.getAttribute('data-v') || null; }
      else if (a === 'clearf') { S.pick = []; S.ha = null; S.onlyMine = false; S.sport = null; S.lv = null; }
      else if (a === 'shareday') { var sd = b.getAttribute('data-d'); shareLink('Woodlands Falcons Athletics', T('Games on {d}', { d: fmt(sd, { weekday: 'long', month: 'long', day: 'numeric' }) }), pageUrl() + '#day=' + sd); return; }
      else if (a === 'shareteam') { var tk = b.getAttribute('data-key'), te2 = S.events.filter(function (x) { return x.teamKey === tk; })[0]; shareLink('Woodlands ' + (te2 ? teamLabel(te2) : 'team'), T('{label} schedule', { label: te2 ? teamLabel(te2) : 'Team' }), pageUrl() + '#team=' + encodeURIComponent(tk)); return; }
      else if (a === 'copy') { var cu = b.getAttribute('data-u'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cu).then(function () { say(T('Link copied')); }, function () { say(cu); }); else say(cu); return; }
      else if (a === 'print') { printMonth(); return; }
      else if (a === 'printweek') { printWeek(); return; }
      else if (a === 'mine') { S.onlyMine = !S.onlyMine; }
      else if (a === 'sport') { S.sport = b.getAttribute('data-s') || null; }
      else if (a === 'star') { var k = b.getAttribute('data-key'), i = S.mine.indexOf(k); if (i < 0) S.mine.push(k); else S.mine.splice(i, 1); store('gcsd-ath-mine', S.mine); if (!S.mine.length) S.onlyMine = false; }
      else if (a === 'ics') {
        var e = find(b.getAttribute('data-id')); if (!e) return;
        var url = URL.createObjectURL(new Blob([icsFor(e, S.set.rem)], { type: 'text/calendar' })), l = document.createElement('a');
        l.href = url; l.download = 'Woodlands-' + e.date + '.ics'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); return;
      }
      else if (a === 'share') {
        var g = find(b.getAttribute('data-id')); if (!g) return;
        shareLink(teamLabel(g), T('{label} {vs}, {d} at {t}, {venue}', { label: teamLabel(g), vs: vs(g), d: fmt(g.date, { weekday: 'long', month: 'long', day: 'numeric' }), t: tm(g), venue: g.venue }), pageUrl() + '#day=' + g.date); return;
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

    loadCfg();
    load();
    if (DISPLAY) { S.dpage = 0; setInterval(function () { S.dpage++; if (S.events.length) render(); }, 12000); setInterval(function () { if (today() !== S.dayAtLoad && S.dayAtLoad) location.reload(); S.dayAtLoad = today(); }, 60000); S.dayAtLoad = today(); }
    setInterval(load, 5 * 60 * 1000);
    setInterval(tickClock, 30 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
  }

  function init() { var hosts = document.querySelectorAll('[data-gcsd-athletics]'); for (var i = 0; i < hosts.length; i++) if (!hosts[i].__gcsd) { hosts[i].__gcsd = 1; mount(hosts[i]); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.GCSDAthletics = { mount: mount, init: init };
})();
