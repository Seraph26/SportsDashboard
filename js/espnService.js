/* All ESPN API access. Exports keep the names the original Next.js app used:
   getNFLTeamGames, getMLBTeamGames, getNCAABTeamGames, getSoccerTeamGames.

   Every one of them returns a plain array of ESPN event objects, already
   sorted. ESPN does not sort them for us -- Wrexham's 2025 schedule comes back
   starting at a May 2026 fixture -- so sorting happens here rather than being
   rediscovered in each caller. */

import { espnUrl } from "./config.js";

async function fetchSchedule(path, params, { signal } = {}) {
  const res = await fetch(espnUrl(path, params), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`ESPN ${res.status} for ${path}`);
  }
  const data = await res.json();
  const events = Array.isArray(data.events) ? data.events : [];
  return events
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* NFL and MLB take seasontype: 2 is the regular season, 3 the postseason, 1
   preseason. Asking for a postseason a team did not reach returns an empty list
   and not an error -- the Jets' 2024 seasontype=3 is empty because they missed
   the playoffs, which is a legitimate answer, not a failure. */

export function getNFLTeamGames(teamId, season, { seasonType = 2, signal } = {}) {
  return fetchSchedule(`football/nfl/teams/${teamId}/schedule`, {
    season,
    seasontype: season ? seasonType : undefined,
  }, { signal });
}

export function getMLBTeamGames(teamId, season, { signal } = {}) {
  return fetchSchedule(`baseball/mlb/teams/${teamId}/schedule`, { season }, { signal });
}

export function getNCAABTeamGames(teamId, season, { signal } = {}) {
  return fetchSchedule(
    `basketball/mens-college-basketball/teams/${teamId}/schedule`,
    { season },
    { signal }
  );
}

/* Soccer has no single league path for a club that moves between divisions, so
   the caller passes the division to try. teamData walks the candidate list. */
export function getSoccerTeamGames(teamId, season, { league = "eng.2", signal } = {}) {
  return fetchSchedule(`soccer/${league}/teams/${teamId}/schedule`, { season }, { signal });
}
