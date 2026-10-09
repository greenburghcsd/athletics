// Adds an hourly forecast for the Woodlands campus to data/schedule.json.
// Fetched here, on the server side, so a visitor's phone never contacts the weather service.
// Failures are silent: no forecast simply means no weather chip on the page.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const FILE = new URL('../data/schedule.json', import.meta.url).pathname;
export const CAMPUS = { lat: 41.02, lon: -73.8 }; // Woodlands Middle/High School, Hartsdale NY (forecast grids are coarse, so approximate is fine)
const URL_ = (c) => `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m,precipitation_probability&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=7`;

// -> { "2026-10-06T16": { t: 52, p: 20 }, ... }  (local campus time, hour resolution)
export function parseForecast(j) {
  const h = j && j.hourly;
  if (!h || !Array.isArray(h.time) || !Array.isArray(h.temperature_2m)) throw new Error('forecast: unexpected shape');
  const out = {};
  h.time.forEach((t, i) => {
    const temp = h.temperature_2m[i], pop = (h.precipitation_probability || [])[i];
    if (typeof temp !== 'number') return;
    out[String(t).slice(0, 13)] = { t: Math.round(temp), p: typeof pop === 'number' ? Math.round(pop) : null };
  });
  if (!Object.keys(out).length) throw new Error('forecast: empty');
  return out;
}

export async function addWeather({ file = FILE, fetchImpl = fetch, log = console.log } = {}) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  try {
    const r = await fetchImpl(URL_(CAMPUS), { headers: { 'user-agent': 'GCSD-Athletics/1.0 (greenburghcsd.org)' } });
    if (!r.ok) throw new Error(`forecast ${r.status}`);
    data.weather = { place: 'Woodlands campus', at: new Date().toISOString(), hours: parseForecast(await r.json()) };
    const tmp = file + '.tmp'; writeFileSync(tmp, JSON.stringify(data)); renameSync(tmp, file);
    log(`weather: ${Object.keys(data.weather.hours).length} hours`);
    return true;
  } catch (err) { log('weather unavailable:', err.message); return false; }
}

if (process.argv[1] === new URL(import.meta.url).pathname) addWeather().then(() => process.exit(0));
