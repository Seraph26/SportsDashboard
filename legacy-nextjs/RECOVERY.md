# The original Next.js dashboard

This is the Next.js 16 App Router version this project was rebuilt from,
recovered on 2026-08-23 from a zip on a USB drive after a desktop crash
destroyed the working session. It does not run as part of the site and nothing
deploys from here — it is kept because it is the specification for what the
static rebuild was meant to carry over, and the rebuild dropped most of it
silently.

It is committed rather than left on a local disk so it survives the next crash
and travels with the repository.

## What was taken from it

Everything now in the live dashboard that was not in the first static rebuild:
the navy board titled "Roger's Teams", per-team countdowns, headlines, live
stream links, official-site links, game detail pages, the stats and standings
tabs, and player pages. See the git log from `759f0c0` onwards.

## What could not be taken

- **`lib/newsService.ts`** read Google News RSS server-side. That does not port
  to a static site: Google sends no CORS headers, and answers 503 to
  Cloudflare's address ranges, so neither the browser nor the worker can read
  it. News now comes from ESPN's own `/news?team=` endpoint.
- **Player pages** found their player among rows inside
  `/teams/{id}/statistics`. ESPN no longer returns an athletes block there in
  any of the four leagues, so those pages are built from `/teams/{id}/roster`
  instead — richer, but not per-season.
- **`lib/eflService.ts`** pointed at `eng.4/teams/1052`, which is League Two and
  not Wrexham's team id. It never worked; cup fixtures are handled properly in
  the rebuild.

## Known dead files

These are zero bytes in the archive and nothing imports them. They are kept as
recovered rather than deleted, so that this folder is exactly what came off the
USB:

    components/CountdownTimer.tsx
    components/LiveTicker.tsx
    components/ScheduleTable.tsx
    components/TeamCard.tsx
    lib/espnApi.ts
    lib/storage.ts
    public/alert.mp3

`LiveTicker.tsx` is the interesting one: the news ticker was not built on it.
It was rendered inline in `app/page.tsx`, and this file is an abandoned earlier
attempt.

## Running it

Not supported here, and not required for anything. It needs Node and a
`npm install`; `node_modules/` and `.next/` were excluded from the commit.
