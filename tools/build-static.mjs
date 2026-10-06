// Builds the static site into ./site from data/schedule.json: widget, header art, schedule, calendars and RSS.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { buildIcs } from '../src/ics.mjs';
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
writeFileSync(OUT + 'ics/all.ics', buildIcs(data.events, { name: 'Woodlands Falcons Athletics', updatedAt: data.updatedAt }));
writeFileSync(OUT + 'rss.xml', buildRss(data.events, { name: 'Woodlands Falcons Athletics: Games & Updates', selfPath: '/rss.xml', updatedAt: data.updatedAt, today }));
const teams = new Map(data.events.map((e) => [e.teamKey, e.teamName]));
for (const [key, name] of teams) {
  const f = key.replace(/:/g, '_'), ev = data.events.filter((e) => e.teamKey === key);
  writeFileSync(OUT + `ics/${f}.ics`, buildIcs(ev, { name: `Woodlands ${name}`, updatedAt: data.updatedAt }));
  writeFileSync(OUT + `rss/${f}.xml`, buildRss(ev, { name: `Woodlands ${name}`, selfPath: `/rss/${f}.xml`, updatedAt: data.updatedAt, today, teamKey: key }));
}
writeFileSync(OUT + '.nojekyll', '');
console.log(`built ${data.events.length} events, ${teams.size} teams`);
