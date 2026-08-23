# Sports Dashboard field guide

Everything learned building this, kept in the repository so it survives losing
any account, machine or chat history. A styled version of this document is also
published as a Claude artifact; this file is the copy that matters.

Written 2026-08-23. Site: `https://seraph26.github.io/SportsDashboard/`.
Worker: `https://sportsdashboard.seraph0226.workers.dev`.

See also [README.md](README.md) for the architecture, [MIGRATION.md](MIGRATION.md)
for moving accounts, and [legacy-nextjs/RECOVERY.md](legacy-nextjs/RECOVERY.md)
for the original this was rebuilt from.

---

## The one rule that would have saved the most time

**"ESPN does not have it" almost always means "this ESPN endpoint does not have
it."** Every apparent data gap in this project turned out to be a different
parameter, a different season type, or a different host — never actually
missing. The endpoint returns `200` with a short list, so it looks like fact
rather than configuration.

Before concluding data does not exist, try: another `seasontype`, the
`fixture=true` flag, ESPN's core API on `sports.core.api.espn.com`, and the
`/apis/v2/` prefix.

---

## The four teams

Adding a team is a change to `js/teamConfig.js` and nothing else.

| Team | League | ESPN id | Season year means | Verified |
|---|---|---|---|---|
| New York Jets | NFL | 20 | the calendar year | `2024` → 2024-09-10 to 2025-01-05 |
| New York Mets | MLB | 21 | the calendar year | `2026` → 166 events, 130 final |
| Wrexham AFC | Soccer | 352 | the year the campaign **starts** | `2024` → 2024-08-10 to 2025-05-03 |
| Providence Friars | NCAAB | 2507 | the year the campaign **ends** | `2025` → 2024-11-05 to 2025-03-12 |

Soccer and college basketball use **opposite** conventions, which is why they
cannot share a `seasonLabel`. Getting one wrong labels the schedule with the
wrong season while showing entirely correct games — invisible unless you check
the dates, which is what the right-hand column is for.

The old project's config listed the Mets as id `25`. `21` is the one that
returns their schedule.

---

## Traps, all measured

### Browser-shaped user agents get 403'd

Akamai allowlists honest client UAs and blocks anything claiming to be a browser
without the TLS fingerprint to match. On one URL: `curl/8.7.1`,
`python-requests/2.31.0` and `Go-http-client/2.0` all return **200**; a full
Chrome UA, no UA at all, and `Mozilla/5.0 (compatible; SportsDashboard/1.0)` all
return **403**.

The instinct on a 403 is to look more like a browser. That is the thing being
blocked. The worker sends `curl/8.7.1` deliberately — do not "fix" it.

### Most of a season hides behind parameters

The schedule endpoint returns only whichever season type ESPN currently
considers live, and for soccer only matches already played.

- **`fixture=true`** (soccer): the plain call returned 2 Wrexham matches; this
  returns the other 44, unplayed, with no scores. Neither is the season; the
  union is.
- **`seasontype=1|2|3`**: preseason / regular / postseason. In August the Jets'
  plain call returned 3 preseason games and none of the 17 regular ones, and
  Providence's 2026-27 season looked empty until `seasontype=2` returned 10.

Ask for every season type and merge, deduping on event id.

### Preseason is on the schedule but not in the record

A 3-0 August is not part of a season, and ESPN's own standings do not count it.
Events carry `seasonType: {id:"1", name:"Preseason"}`; `getTeamRecord` skips
them and cards show a `PRE` tag.

### competitor.score is an object, not a number

It is `{value, displayValue}`. Reading it as a number yields `NaN` and every
record silently comes out `0-0-0`. `js/record.js` is the only place that parses
it.

### A bad team id is never a 404

A bogus id returns **400** for NFL and MLB, and **500** for soccer. A
`res.status === 404` branch in the worker is dead code and will never fire —
this was gotten wrong once, shipped, and caught by the regression suite.

### Every league returns a different game summary

| | boxscore.teams | boxscore.players | scoring |
|---|---|---|---|
| NFL | yes | yes | `scoringPlays` |
| MLB | yes | yes | none |
| Soccer | yes | **none** | `keyEvents` |

Soccer's `keyEvents` also carries cards and substitutions, so a 1-1 match returns
thirty of them — the heading says "Key Events", not "Scoring". They carry **no
running score**, unlike NFL scoring plays, and name players under
`participants`, not `athletesInvolved`, which silently drops every name until
checked against the payload.

### Team statistics have three different absences

- **Soccer**: `site.api` returns `200` with `results:{}` in every season. The
  **core API** has 112 stats for the same team. Use
  `sports.core.api.espn.com/v2/sports/soccer/leagues/{league}/seasons/{year}/types/1/teams/{id}/statistics`.
- **A season not yet played**: **404**, not an empty payload. The NFL's 2026
  stats 404 all through preseason while `seasontype=1` returns them.
- **MLB**: no per-game figures at all, so that column would be all em-dashes.

ESPN also emits a per-game value for rate stats — completion percentage 63.4 with
a "per game" of 63.886. Only counting stats should show that column.

### Standings need a group, and do not share columns

College basketball standings return all of Division I — **6 MB** to render a
table of eleven teams. `group=4` is Providence's Big East at 202 KB; the
conference id comes from the team's own payload (`groups.id`).

Soccer returns one flat block; NFL and MLB nest conferences under `children[]`.
Walk the tree and treat anything with `entries` as a group.

ESPN answers for stats the sport does not have — baseball came back with a draws
column of zeros and a "points" of −6.0 — so columns are defined per league.

### The athletes block is gone from statistics

The original built player pages by finding an id among player rows inside
`/teams/{id}/statistics`. That payload now carries team totals only, in all four
leagues. Player pages are built from `/teams/{id}/roster` instead — richer, but
not per-season, which is why the Roster tab has no season links.

### Wrexham's league path changes by season, and cups are separate

ESPN files each season under the division actually played, so `eng.2` returns
zero events for 2024 — they were in `eng.3`. Wrong division is a `200` with an
empty list, not an error, which is why `teamData` probes rather than catches.

Cup ties live on their own paths (`eng.league_cup`, `eng.fa`, `eng.trophy`), so
a club between league rounds looks fixture-less unless they are merged in. Cup
slugs are **words, not numbers**, so a path pattern of `[a-z]{3}\.\d+` silently
excludes every cup.

### Events are not sorted, and empty is not an error

Wrexham's 2025 schedule comes back starting at a May 2026 fixture, so
`espnService` sorts on the way in. Out-of-range seasons return an empty list
rather than an error, which is what makes `getAvailableSeasons` able to probe
safely.

### Google News blocks Cloudflare by address

The original read Google News RSS server-side. It sends no CORS headers, so a
browser cannot fetch it, and it answers **503** to Cloudflare's ranges, so
proxying fails too. Every user agent returns 200 from a residential IP — the
block is by address, so no header tweak reaches it. News comes from ESPN's own
`/news?team=` endpoint, which is genuinely team-filtered and sends CORS.

---

## Worker contract

A narrow, cached, read-only proxy. Two ESPN hosts, three request prefixes, nine
path shapes, seven query parameters.

| Request | Status |
|---|---|
| Allowed origin, allowlisted path | 200, ACAO echoes the single asking origin, `Vary: Origin` |
| `/health` | 200 — the only endpoint that answers without an origin |
| No origin, or one not on the list | 403 (includes `seraph26.github.io.evil.com`) |
| Anything but GET | 405 (OPTIONS → 204) |
| NBA, traversal, wrong prefix for the path | 404 |
| Upstream 4xx | relayed with its own status |
| Upstream 5xx or network failure | 502 |

**Prefixes**: `/espn/` → `site.api.espn.com/apis/site/v2/sports`, `/espn2/` →
the same host's `/apis/v2/sports` (standings), `/espncore/` →
`sports.core.api.espn.com/v2/sports` (soccer statistics).

**Params**: `season`, `seasontype`, `team`, `limit`, `event`, `group`,
`fixture` — each matched against `/^[\w.-]{1,16}$/`.

**Cache**: 15 s current season, 6 h explicit past season, 15 min news and
standings. Keyed on the upstream URL, so both origins share one entry.

**If the site moves**, add the new origin to `ALLOWED_ORIGINS` or every request
403s. See [MIGRATION.md](MIGRATION.md).

---

## Editing the worker

Delete by **anchor, never by line range**, and diff the function list before and
after:

```bash
diff <(grep -oE "^(async )?function [a-zA-Z]+" before.js) \
     <(grep -oE "^(async )?function [a-zA-Z]+" worker/src/index.js)
```

A brace-balance check passes when whole functions vanish. Removing the Google
News code by line range also removed `allowedOrigin`, `corsHeaders` and `json`;
every request threw error 1101 and the site was down — schedules included, not
just news.

---

## Routes

```
#/                                dashboard
#/teams/jets                      current season schedule
#/teams/jets/2024                 a specific season
#/teams/jets/stats                season team statistics
#/teams/jets/standings            league table
#/teams/jets/roster               roster
#/teams/jets/player/4685247       one player
#/games/football/nfl/401671696    one game
```

The game route carries its league because it is not derivable for soccer — a
promoted club's games are filed under whichever division they played, so
`teamData` tags each game with the league that answered.

---

## Known limits

- **Two records, both correct.** Wrexham's schedule counts the cup defeat
  (`0-1-2`); the Standings tab shows the league table without it. Different
  competitions.
- **A bogus soccer id reads as 502**, because ESPN returns 500 for one.
  Unreachable from the app, since `teamConfig` is hardcoded.
- **The roster is not per-season**, so that tab has no season links.
- **`serve.ps1` hardcodes its root.** Traversal was tested and is *not*
  exploitable — HTTP.sys rejects encoded `..` before the script sees it.
- **Season discovery is chatty** — up to 12 sequential probes per team page, in
  parallel with the schedule fetch. The strongest argument for the edge cache.
- **No test suite.** With no `node` on the machine there is no runner;
  verification is live HTTP probes and browser checks.
