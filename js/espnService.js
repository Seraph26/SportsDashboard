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

export function getMLBTeamGames(teamId, season, { seasonType, signal } = {}) {
  return fetchSchedule(
    `baseball/mlb/teams/${teamId}/schedule`,
    { season, seasontype: season ? seasonType : undefined },
    { signal },
  );
}

export function getNCAABTeamGames(teamId, season, { seasonType, signal } = {}) {
  return fetchSchedule(
    `basketball/mens-college-basketball/teams/${teamId}/schedule`,
    { season, seasontype: season ? seasonType : undefined },
    { signal }
  );
}

/* Soccer has no single league path for a club that moves between divisions, so
   the caller passes the division to try. teamData walks the candidate list.

   fixture: ESPN splits a soccer season across two answers from this same URL.
   The plain call returns only matches already played -- two, in August of a
   Championship season -- and `fixture=true` returns only the ones still to come,
   44 of them, with no scores. Neither is the season; the union is. This is
   undocumented and is the reason the schedule looked empty from September
   onward. It is a no-op for the other three leagues, which answer identically
   either way. */
export function getSoccerTeamGames(teamId, season, { league = "eng.2", fixture = false, signal } = {}) {
  return fetchSchedule(
    `soccer/${league}/teams/${teamId}/schedule`,
    { season, fixture: fixture ? "true" : undefined },
    { signal },
  );
}
