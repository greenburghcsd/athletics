// Loads the saved .psv captures into the same shape the live fetcher will produce.
import { readFileSync } from 'node:fs';

export function loadJsonFixture(path, year = 2026) {
  return readFileSync(path, 'utf8').trim().split('\n').map((line) => {
    const [id, start, end, title, description] = line.split('|');
    const [md, st] = start.split(' ');
    return { id: Number(id), start: `${year}-${md}T${st}:00`, end: `${year}-${md}T${end}:00`, title, description };
  });
}

export function loadHtmlFixture(path) {
  const canceled = new Set(), seenInHtml = new Set(), location = {}, htmlRows = [], opponent = {};
  const year = 2026, mon = { January:1, February:2, March:3, April:4, May:5, June:6, July:7, August:8, September:9, October:10, November:11, December:12 };
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    const [id, day, time, name, text] = line.split('|');
    const n = Number(id);
    seenInHtml.add(n);
    const dm = day.match(/^(\w+) (\d+)/);
    htmlRows.push({ id: n, date: `${year}-${String(mon[dm[1]]).padStart(2, '0')}-${String(dm[2]).padStart(2, '0')}`, time, name, text });
    opponent[n] = text.replace(/^(vs|@)\s+/i, '').split(' @ ')[0];
    if (/\((canceled|cancelled)\)/i.test(name)) canceled.add(n);
    const loc = text.split(' @ ').pop();
    if (text.includes(' @ ') && loc) location[n] = loc;
  }
  return { canceled, seenInHtml, location, htmlRows, opponent };
}
