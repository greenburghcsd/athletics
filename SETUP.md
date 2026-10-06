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
