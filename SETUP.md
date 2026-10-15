# Woodlands Athletics: GitHub Pages setup

One-time setup, about 10 minutes. Use a district-owned GitHub account or organization, not a personal one.

1. Create a new **public** repository (for example `athletics`) under the district account.
2. Upload everything in this folder, keeping the structure, including the hidden `.github` folder.
3. In the repository: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
4. Go to the **Actions** tab, choose **Refresh athletics schedule**, and press **Run workflow**. The first run takes 2 to 3 minutes.
5. Your site address is `https://<account>.github.io/<repository>/`. Open it to see the widget, and open `.../schedule.json` to see the data.
6. In Edlio, paste this into an Embed Code section (use your own address):

```html
<div data-gcsd-athletics data-theme="spirit"
     data-src="https://<account>.github.io/<repository>/schedule.json"
     data-assets="https://<account>.github.io/<repository>/hdr/"></div>
<script src="https://<account>.github.io/<repository>/widget.js"></script>
```

## How it stays current
- Every 10 minutes (best effort; GitHub can run late) the workflow reads the portal, checks the result, and republishes.
- If a pull looks wrong (no games, a big drop in games, portal down), it keeps the last good schedule.
- **Run workflow** forces an immediate refresh, for example after a last-minute cancellation.

## Things to know
- GitHub pauses scheduled workflows in a public repository after 60 days with no repository activity. Any commit, or pressing Run workflow once, turns it back on.
- The portal asks scrapers to wait 10 seconds between requests. The job does, so a run takes a couple of minutes. Do not shorten it.
- The portal has not been reached from this environment, so the first real run is the real test. If it fails, the Actions log shows why and the site keeps serving the seed data in `data/schedule.json`.
- Calendar subscriptions live at `.../ics/all.ics` and per team in `.../ics/`. RSS is `.../rss.xml` and per team in `.../rss/`.

## Weather chip
The refresh job also asks a free forecast service (Open-Meteo) for the Woodlands campus forecast and saves it into `schedule.json`, so visitors' phones never contact the weather service. If that step fails, the page simply shows no weather chip. Check the "Add the weather forecast" step in the Actions log after the first run.

## Optional links and countdowns (assets/config.json)
Edit `assets/config.json` in the repo; leave a value empty to hide it. Only https links are used.
- `tickets`: GoFan link (adds a Tickets button on home games)
- `live`: livestream link (adds Watch live on home games)
- `playoffs`: bracket/tournament page (adds a link card)
- `countdowns`: e.g. `[{"label":"Winter sports sign-up opens","date":"2026-11-02","url":"https://www.greenburghcsd.org","cta":"Sign up"}]`

### Follow list and news (also in config.json)
- `follow`: up to 8 `{label, note, url}` entries shown as "Follow the Falcons elsewhere".
- `news`: up to 5 hand-approved `{title, source, date, url}` entries shown as "Falcons in the news". Headline and link only; empty = section hidden.

### Spanish and language
The widget shows Spanish automatically when a phone is set to Spanish, and anyone can switch with the pill in the top corner or in Settings. The choice is remembered on that device. Text in `config.json` can have a Spanish version: add `label_es`, `note_es`, `title_es` or `link_text_es` next to the English field (for example `"label": "Winter sports sign-up opens", "label_es": "Abren las inscripciones de deportes de invierno"`). Without a Spanish field, the English text is used.
Note: calendar subscription feeds and the RSS feed are still English; the single-game "Add to calendar" file follows the chosen language.

## Lobby display mode
Open `assets/display.html` (or add `?display=1` to the page) on a hallway TV. It rotates games today and coming up every 12 seconds and reloads daily.

## Optional config links
In `config.json`, `boosters`, `sponsor` and `powered` each take `{ "label": "...", "url": "https://..." }` (https only). Leave blank to hide.

## Weekly poster page
`/poster.html` draws the "This Week's Events" poster in the browser from the latest `schedule.json`, so it is never older than the last refresh. Buttons: previous/next week, English/Español, **Print poster (11 × 8.5)** and **Check for updates** (re-reads the data on the spot). It also re-checks every 5 minutes and when the tab comes back into view.
- Public poster (default): canceled games are hidden. `/poster.html?view=internal` shows canceled games and a data-as-of line. The internal link is not shown anywhere on the page; share it only with staff.
- `?lang=es` opens in Spanish, `?date=2026-10-05` picks a week. Sundays open the coming week.
- To print: Letter, Landscape, Margins None, Background graphics on, or choose Save as PDF.
- A change that is not showing yet: press **Run workflow** on the Refresh athletics schedule action, wait about a minute, then press Check for updates.

## Share preview and icons
- `assets/og.jpg` (1200×630) is the preview image when the link is texted or posted. The `og:` tags in `assets/demo.html` point to `https://greenburghcsd.github.io/athletics/og.jpg`; change both URLs if the address changes. Previews are per page, not per game.
- Sport icons come from Tabler Icons (MIT license), embedded in `widget.js`.

## Protecting the widget
- `LICENSE` and the header at the top of `assets/widget.js` state that it is licensed to Greenburgh CSD only.
- The Actions build minifies `widget.js` with esbuild before publishing, so the live file is compact and its names are scrambled. The readable source stays in `assets/widget.js`. If esbuild fails to install, the site still publishes, unminified.
- The widget only runs on approved hosts: greenburghcsd.org (and subdomains), greenburghcsd.github.io, firemakerllc.com, localhost. Anywhere else it shows a notice pointing to greenburghcsd.org/athletics. To approve another address (for example a new Edlio domain), add it to the `LICENSED` list near the bottom of `assets/widget.js`.
- Remember this is a deterrent, not a lock: browser code can always be read. The real protection is the license plus the data pipeline staying in your repo.
