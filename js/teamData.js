/* The layer between pages and ESPN. Pages ask for "this team's games" and
   "which seasons exist" without knowing which league they are in. */

import { getTeam } from "./teamConfig.js";
import {
  getNFLTeamGames,
  getMLBTeamGames,
  getNCAABTeamGames,
  getSoccerTeamGames,
} from "./espnService.js";

/* Schedules are immutable once a season is over and change slowly while it is
   running, so a request for the same season twice in a session is served from
   here. The live scoreboard poll deliberately bypasses this (see refresh()). */
const cache = new Map();
const cacheKey = (team, season) => `${team}:${season ?? "current"}`;

/* Which season is "now". The three leagues disagree about what a season year
   even means, and getting this wrong shows the previous campaign under this
   campaign's heading:
     NFL, MLB    a single calendar year; 2026 is the 2026 season.
     soccer      the year the campaign STARTS; 2024 is 2024-25.
     NCAAB       the year the campaign ENDS; 2025 is 2024-25.
   All three roll over in August, which is why the month test is shared. */
export function currentSeason(league, now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); /* 0-based, so 7 is August */
  const newCampaign = month >= 7;
  if (league === "soccer") return newCampaign ? year : year - 1;
  if (league === "ncaab") return newCampaign ? year + 1 : year;
  return year;
}

/* Same event can arrive from two calls -- a soccer tie from both the played and
   the fixture list, a game from two season types -- so merges dedupe on id. */
function mergeGames(...lists) {
  const seen = new Map();
  for (const list of lists) {
    for (const game of list || []) {
      const key = game?.id ?? `${game?.date}-${game?.shortName}`;
      if (!seen.has(key)) seen.set(key, game);
    }
  }
  return [...seen.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* One extra call that is allowed to come back empty or fail. Preseason,
   postseason and cup runs are all optional in exactly this way, and none of
   them should be able to take the regular season down with it. */
async function optional(fn) {
  try {
    return await fn();
  } catch {
    return [];
  }
}

async function fetchGames(team, season, opts = {}) {
  switch (team.league) {
    case "nfl": {
      /* A season is preseason plus regular season plus whatever postseason
         exists. Asking for each and merging means a playoff run shows up
         without the page having to know whether there was one -- and preseason
         shows up at all, which it did not before: the Jets played three games
         in August that the schedule simply omitted. */
      const regular = await getNFLTeamGames(team.teamId, season, { seasonType: 2, ...opts });
      if (!season) return regular;
      const pre = await optional(() =>
        getNFLTeamGames(team.teamId, season, { seasonType: 1, ...opts }),
      );
      const post = await optional(() =>
        getNFLTeamGames(team.teamId, season, { seasonType: 3, ...opts }),
      );
      return mergeGames(pre, regular, post);
    }
    case "mlb": {
      const regular = await getMLBTeamGames(team.teamId, season, { seasonType: 2, ...opts });
      if (!season) return regular;
      /* Spring training, same idea as the NFL's preseason. */
      const pre = await optional(() =>
        getMLBTeamGames(team.teamId, season, { seasonType: 1, ...opts }),
      );
      return mergeGames(pre, regular);
    }
    case "ncaab": {
      /* The plain call returns only whichever season type ESPN currently
         considers live, which in August is none of them -- Providence's 2026-27
         schedule is invisible without asking for the regular season by name,
         even though the games are filed and dated. */
      const plain = await getNCAABTeamGames(team.teamId, season, opts);
      if (!season) return plain;
      const regular = await optional(() =>
        getNCAABTeamGames(team.teamId, season, { seasonType: 2, ...opts }),
      );
      const post = await optional(() =>
        getNCAABTeamGames(team.teamId, season, { seasonType: 3, ...opts }),
      );
      return mergeGames(plain, regular, post);
    }
    case "soccer": {
      /* Try each division the club could have been in that season and keep the
         first with fixtures. The wrong division answers 200 with an empty list,
         which is why this is a loop and not a try/catch. */
      const leagues = team.soccerLeagues || ["eng.2"];
      let league = null;
      let games = [];
      for (const candidate of leagues) {
        games = await getSoccerTeamGames(team.teamId, season, { league: candidate, ...opts });
        if (games.length) {
          league = candidate;
          break;
        }
      }
      if (!league) return [];
      /* Which division answered is not recoverable from the event itself, and a
         game detail link needs it -- the summary endpoint is per league.
         Tagging here is the only place that still knows. */
      for (const game of games) game.leaguePath = league;

      /* The other half of the season. ESPN answers this same URL with results
         only, or -- given fixture=true -- with the remaining fixtures only. A
         Championship season in August is two played and forty-four to come, and
         without this the schedule stopped at the last result. */
      const upcoming = await optional(() =>
        getSoccerTeamGames(team.teamId, season, { league, fixture: true, ...opts }),
      );
      for (const game of upcoming) game.leaguePath = league;
      games = mergeGames(games, upcoming);

      /* Cups are separate competitions on separate paths, so a club between
         league rounds looks like it has no fixtures at all unless they are
         merged in. Both halves again, and most cups are empty for most clubs in
         most seasons, which is why every one of these may fail quietly. */
      for (const cup of team.soccerCups || []) {
        const played = await optional(() =>
          getSoccerTeamGames(team.teamId, season, { league: cup, ...opts }),
        );
        const toCome = await optional(() =>
          getSoccerTeamGames(team.teamId, season, { league: cup, fixture: true, ...opts }),
        );
        for (const tie of [...played, ...toCome]) tie.leaguePath = cup;
        games = mergeGames(games, played, toCome);
      }

      return games;
    }
    default:
      throw new Error(`Unknown league: ${team.league}`);
  }
}

export async function getTeamGames(teamKey, season, { refresh = false, signal } = {}) {
  const team = getTeam(teamKey);
  if (!team) throw new Error(`Unknown team: ${teamKey}`);
  const key = cacheKey(team.key, season);
  if (!refresh && cache.has(key)) return cache.get(key);
  const games = await fetchGames(team, season, { signal });
  cache.set(key, games);
  return games;
}

/* Which seasons actually have data. The original app carried a hardcoded list;
   this probes instead, walking back from the current season and stopping after
   two consecutive empty years so a team that simply did not play one season
   does not truncate the whole list. Out-of-range years answer with an empty
   event list rather than an error, which is what makes probing safe. */
export async function getAvailableSeasons(teamKey, { max = 12, signal } = {}) {
  const team = getTeam(teamKey);
  if (!team) throw new Error(`Unknown team: ${teamKey}`);

  const start = currentSeason(team.league);
  const oldest = team.firstSeason || start - max;

  const remembered = readSeasons(team.key);
  if (remembered) return remembered;

  /* Probe the whole window at once rather than walking back a year at a time.
     Sequentially this was up to twelve round trips before the season buttons
     appeared -- the schedule beside them had long since rendered. They are
     independent questions, so they go together; the edge cache means the cost
     upstream is the same either way.

     The stop-after-two-misses rule from the sequential version is applied to
     the results afterwards, so the behaviour is unchanged: a team that simply
     did not play one season does not truncate the list, but a long empty tail
     does not extend it. */
  const years = [];
  for (let year = start; year >= oldest && years.length < max; year -= 1) years.push(year);

  const probes = await Promise.all(
    years.map(async (year) => {
      try {
        const games = await getTeamGames(team.key, year, { signal });
        return { year, hasGames: games.length > 0 };
      } catch {
        return { year, hasGames: false };
      }
    }),
  );

  const found = [];
  let misses = 0;
  for (const { year, hasGames } of probes) {
    if (hasGames) {
      found.push(year);
      misses = 0;
    } else if (found.length) {
      misses += 1;
      if (misses >= 2) break;
    }
  }

  writeSeasons(team.key, found);
  return found;
}

/* Which seasons a team has is close to immutable -- one new entry a year -- so
   it survives a reload rather than costing a dozen requests again. Kept short
   enough that a season appearing mid-week still shows up, and wrapped because
   localStorage throws in private windows and when the quota is full. */
const SEASONS_KEY = "sd:seasons:v1";
const SEASONS_TTL_MS = 12 * 60 * 60 * 1000;

function readSeasons(teamKey) {
  try {
    const all = JSON.parse(localStorage.getItem(SEASONS_KEY) || "{}");
    const entry = all[teamKey];
    if (!entry || Date.now() - entry.at > SEASONS_TTL_MS) return null;
    return Array.isArray(entry.years) && entry.years.length ? entry.years : null;
  } catch {
    return null;
  }
}

function writeSeasons(teamKey, years) {
  if (!years.length) return;
  try {
    const all = JSON.parse(localStorage.getItem(SEASONS_KEY) || "{}");
    all[teamKey] = { years, at: Date.now() };
    localStorage.setItem(SEASONS_KEY, JSON.stringify(all));
  } catch {
    /* Private window, or the quota is full. The probe still works. */
  }
}
