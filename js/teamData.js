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

async function fetchGames(team, season, opts = {}) {
  switch (team.league) {
    case "nfl": {
      /* A season is regular season plus whatever postseason exists. Asking for
         both and concatenating means a playoff run shows up without the page
         having to know whether there was one. */
      const regular = await getNFLTeamGames(team.teamId, season, { seasonType: 2, ...opts });
      if (!season) return regular;
      let post = [];
      try {
        post = await getNFLTeamGames(team.teamId, season, { seasonType: 3, ...opts });
      } catch {
        /* Postseason is optional; a failure here should not lose the regular
           season we already have. */
      }
      return [...regular, ...post].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    case "mlb":
      return getMLBTeamGames(team.teamId, season, opts);
    case "ncaab":
      return getNCAABTeamGames(team.teamId, season, opts);
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

      /* Cups are separate competitions on separate paths, so a club between
         league rounds looks like it has no fixtures at all unless they are
         merged in. Failures are swallowed: a missing cup must not take the
         league schedule with it, and most seasons most cups are empty. */
      for (const cup of team.soccerCups || []) {
        try {
          const ties = await getSoccerTeamGames(team.teamId, season, { league: cup, ...opts });
          for (const tie of ties) tie.leaguePath = cup;
          games = games.concat(ties);
        } catch {
          /* no cup run this season, or ESPN has nothing filed */
        }
      }

      return games.sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const found = [];
  let misses = 0;

  for (let year = start; year >= (team.firstSeason || start - max) && found.length < max; year--) {
    let games = [];
    try {
      games = await getTeamGames(team.key, year, { signal });
    } catch {
      games = [];
    }
    if (games.length) {
      found.push(year);
      misses = 0;
    } else if (found.length) {
      /* Only count misses once we have started finding seasons, so an upcoming
         season with no schedule posted yet does not end the search. */
      misses += 1;
      if (misses >= 2) break;
    }
  }
  return found;
}
