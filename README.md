# Sports Dashboard

Schedules, scores and records for the Jets, Mets, Wrexham and Providence, read
live from ESPN's public API. Static site — no build step, no framework, no
`node` required to work on it.

Rebuilt from a Next.js 16 App Router version. The architecture, file roles and
ESPN usage carried over; the server did not, because nothing here needed one.

## How it deploys

Same pipeline as the Lost Ark dashboard:

- **Site** — repo root is the site. Pushing to `main` runs
  `.github/workflows/pages.yml` and GitHub Pages serves it. Push = deploy.
- **Worker** — `worker/src/index.js`, entry point set by the root
  `wrangler.toml`. Once Cloudflare Workers Builds is connected to the repo, the
  same push deploys it.

## The worker is optional

`js/config.js` has one constant, `WORKER_BASE`. Empty (the default) means the
browser calls ESPN directly — ESPN answers `Access-Control-Allow-Origin: *`, so
this works with no Cloudflare account involved at all, and the site is fully
functional the moment Pages serves it.

Setting `WORKER_BASE` to the deployed worker URL routes every request through
`worker/src/index.js` instead, which adds edge caching (a season schedule is
identical for every visitor, and drawing one page fires a dozen season probes)
and puts our ESPN traffic behind one origin we control. Nothing else in the app
changes; every URL is built by `espnUrl()`.

The worker only forwards `GET`, only to `site.api.espn.com`, only for the four
leagues' schedule paths, and only for origins in `ALLOWED_ORIGINS`. **If the
site ever moves — custom domain, account rename, Cloudflare Pages — add the new
origin there or every request 403s.**


## Documentation

    FIELD-GUIDE.md              every measured ESPN quirk, the worker contract,
                                and the rule that saves the most time
    MIGRATION.md                what breaks when this moves to another account
    legacy-nextjs/RECOVERY.md   the Next.js original this was rebuilt from

## Routes

Hash routes, not paths. GitHub Pages has no rewrite rules, so `/teams/jets/2024`
would 404 on a refresh; `#/teams/jets/2024` survives a reload and needs no
server.

    #/                          dashboard
    #/teams/jets                current season schedule
    #/teams/jets/2024           a specific season
    #/teams/jets/stats          season team statistics
    #/teams/jets/standings      league table
    #/teams/jets/roster         roster
    #/teams/jets/player/4685247 one player
    #/games/football/nfl/401671696   one game

## Files

    index.html          shell
    styles.css
    js/config.js        ESPN vs worker; the one constant that switches modes
    js/teamConfig.js    every team; adding one is a change to this file only
    js/espnService.js   the four ESPN calls, one per league
    js/teamData.js      league-agnostic getTeamGames / getAvailableSeasons
    js/record.js        score parsing and W-L-T
    js/gameCard.js      one game
    js/scoreboard.js    the list, plus the 15s live poll
    js/news.js          team headlines from ESPN's news endpoint
    js/countdown.js     next-game countdown on the dashboard
    js/gameDetails.js   one game: box score, player tables, scoring timeline
    js/teamStats.js     season team statistics
    js/standings.js     league tables
    js/roster.js        roster and player pages
    js/app.js           router and pages
    worker/src/index.js Cloudflare proxy

## Things ESPN does that cost time to rediscover

- **`competitor.score` is an object**, `{value, displayValue}`, not a number.
  Reading it as a number silently yields `NaN` and every record comes out
  `0-0-0`. `record.js` is the only place that parses it.
- **Season year means a different thing per league.** NFL and MLB use the
  calendar year. Soccer uses the year the campaign *starts* (`2024` = 2024-25).
  College basketball uses the year it *ends* (`2025` = 2024-25). These are
  opposite conventions and getting one wrong labels the schedule with the wrong
  season while showing entirely correct games — the failure is invisible unless
  you check the dates.
- **Wrexham's league path changes by season.** ESPN files each season under the
  division actually played, so `eng.2` returns *zero events* for 2024 (they were
  in `eng.3`). Wrong division is a `200` with an empty list, not an error, which
  is why `teamData` probes the list in `soccerLeagues` instead of catching.
- **Events are not sorted by date.** Wrexham's 2025 schedule starts at a May 2026
  fixture. `espnService` sorts everything on the way in.
- **Out-of-range seasons return an empty list, not an error.** That is what makes
  `getAvailableSeasons` able to probe safely.
- **ESPN's edge 403s browser-shaped user agents from non-browsers.** Akamai
  allowlists honest client UAs — `curl/8.7.1`, `python-requests/2.31.0` and
  `Go-http-client/2.0` all return `200` — and blocks anything that claims to be
  a browser without the TLS fingerprint to match. A full Chrome UA, no UA at
  all, and the half-browser `Mozilla/5.0 (compatible; SportsDashboard/1.0)` the
  worker originally sent are all `403`. **Do not "fix" the worker by making its
  UA more browser-like; that is the thing being blocked.** It sends `curl/8.7.1`
  deliberately. Real browsers calling ESPN directly are unaffected — this only
  bites server-side callers, which is why the bug appeared the moment the worker
  went live and never in direct mode.
- **Google News blocks Cloudflare, so news comes from ESPN.** The original
  Next.js app read Google News RSS server-side. That does not port twice over:
  Google sends no CORS headers, so a browser cannot fetch it, and Google answers
  `503` to Cloudflare's address ranges, so proxying it through the worker fails
  too. Every user agent returns `200` from a residential IP — the block is by
  address, not user agent, so no header tweak reaches it. ESPN's own
  `/news?team=` endpoint is genuinely team-filtered (`team=352` returns Wrexham
  stories, not Championship stories), sits on the host already allowlisted, and
  sends CORS, so news works with the worker switched off too.
- **A team's *current* season can legitimately be empty.** In August, college
  basketball's 2026-27 exists as a season number with no schedule posted. The
  team page falls back to the last season actually played rather than showing an
  empty list under a heading that is technically correct.


## Tests

There is no `node` here, so the browser is the test runner. Serve the folder and
open <http://localhost:8777/tests.html>; the tab title reports the result.

    39 assertions, no network, deterministic

They cover the pure functions, which is where every bug so far has actually
been: score parsing, the three season-year conventions, the countdown format,
which game "now" points at, and the per-league game-summary shapes. Rendering
and network paths are still checked by hand.

## Local development

There is no `node` on the dev machine. Serve the folder over HTTP — ES modules
will not load from `file://`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

then open <http://localhost:8777>. That origin is already in the worker's
`ALLOWED_ORIGINS`.
