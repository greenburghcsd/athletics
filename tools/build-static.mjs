// Builds the static site into ./site from data/schedule.json: widget, header art, schedule, calendars and RSS.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { buildIcs, reminderCombos, reminderCode } from '../src/ics.mjs';
import { buildRss } from '../src/rss.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = ROOT + 'site/';
const data = JSON.parse(readFileSync(ROOT + 'data/schedule.json', 'utf8'));
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT + 'ics', { recursive: true }); mkdirSync(OUT + 'rss', { recursive: true });
cpSync(ROOT + 'assets/', OUT, { recursive: true });
writeFileSync(OUT + 'index.html', readFileSync(OUT + 'demo.html', 'utf8'));
writeFileSync(OUT + 'schedule.json', JSON.stringify(data));
writeFileSync(OUT + 'changes.json', JSON.stringify(data.changes || []));
const combos = reminderCombos();
const writeIcs = (stem, ev, name) => { for (const c of combos) writeFileSync(OUT + `ics/${stem}${c.length ? '.' + reminderCode(c) : ''}.ics`, buildIcs(ev, { name, updatedAt: data.updatedAt, alarms: c })); };
writeIcs('all', data.events, 'Woodlands Falcons Athletics');
writeFileSync(OUT + 'rss.xml', buildRss(data.events, { name: 'Woodlands Falcons Athletics: Games & Updates', selfPath: '/rss.xml', updatedAt: data.updatedAt, today }));
const teams = new Map(data.events.map((e) => [e.teamKey, e.teamName]));
for (const [key, name] of teams) {
  const f = key.replace(/:/g, '_'), ev = data.events.filter((e) => e.teamKey === key);
  writeIcs(f, ev, `Woodlands ${name}`);
  writeFileSync(OUT + `rss/${f}.xml`, buildRss(ev, { name: `Woodlands ${name}`, selfPath: `/rss/${f}.xml`, updatedAt: data.updatedAt, today, teamKey: key }));
}
mkdirSync(OUT + 'poster', { recursive: true });
cpSync(ROOT + 'src/poster.mjs', OUT + 'poster/poster.mjs'); cpSync(ROOT + 'src/print.mjs', OUT + 'poster/print.mjs'); // live poster page runs the same layout code in the browser
writeFileSync(OUT + '.nojekyll', '');
console.log(`built ${data.events.length} events, ${teams.size} teams`);
