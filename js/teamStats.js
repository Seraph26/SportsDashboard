/* Season team statistics -- the original's /teams/[team]/stats page.

   ESPN nests these as results.stats.categories[], each category holding a flat
   list of stats with both a season total and a per-game figure.

   Soccer has none. The endpoint answers 200 with results:{} for Wrexham in every
   season tried, so this is not an outage to retry or a season that has not
   started -- ESPN simply does not publish team statistics for that league. The
   page says so rather than showing an empty table, because "nothing here" and
   "nothing exists here" are different messages. */

import { espnUrl } from "./config.js";

const cache = new Map();

/* A stat that is already an average, a rate or a percentage has no meaningful
   per-game value. Matched on the label because ESPN does not flag it. */
function isRate(label) {
  return /percentage|per game|average|\bavg\b|ratio|rating|\bpct\b|per attempt|yards per/i.test(label);
}

export async function getTeamStats(team, season, { seasonType, signal } = {}) {
  const key = `${team.key}:${season ?? "current"}:${seasonType ?? "any"}`;
  if (cache.has(key)) return cache.get(key);

  /* Soccer goes to the core API instead. site.api answers 200 with an empty
     results:{} for every soccer season tried, while the core API has a full set
     -- expected goals, accurate passes, big chances, ratings. Different host,
     different URL shape, and the season is a path segment rather than a query
     parameter. */
  if (team.league === "soccer") return getSoccerStats(team, season, key, { signal });

  const path = `${team.sport}/${team.path}/teams/${team.teamId}/statistics`;

  const res = await fetch(espnUrl(path, { season, seasontype: seasonType }), {
    signal,
    headers: { Accept: "application/json" },
  });
  /* A season with no statistics yet is a 404 here, not an empty payload -- the
     NFL's 2026 stats 404 all through preseason while 2025 returns fine. That is
     the same "current season is legitimately empty" case the schedule page
     handles, so it is reported rather than thrown, and the caller falls back a
     year exactly as the schedule does. */
  if (res.status === 404) {
    const miss = {
      categories: [],
      supported: false,
      missing: true,
      preseason: false,
      record: "",
      seasonLabel: "",
    };
    cache.set(key, miss);
    return miss;
  }
  if (!res.ok) throw new Error(`ESPN ${res.status} for team statistics`);

  const data = await res.json();
  const categories = (data?.results?.stats?.categories || []).map((cat) => ({
    name: cat.displayName || cat.name || "",
    stats: (cat.stats || []).map((s) => {
      const label = s.displayName || s.shortDisplayName || s.name || "";
      return {
        label,
        abbrev: s.shortDisplayName || s.abbreviation || "",
        value: s.displayValue ?? (s.value === undefined ? "" : String(s.value)),
        /* ESPN emits a per-game figure for every stat, including ones that are
           already rates -- completion percentage comes back as 63.4 with a
           "per game" of 63.886, which means nothing. Only counting stats get
           the column. */
        perGame: isRate(label) ? "" : s.perGameDisplayValue ?? "",
        description: s.description || "",
      };
    }).filter((s) => s.label),
  })).filter((cat) => cat.stats.length);

  const result = {
    categories,
    missing: false,
    preseason: Number(seasonType) === 1,
    /* Distinguishes "this league has no stats" from "this season has none" for
       the caller, without it having to know which leagues those are. */
    supported: categories.length > 0,
    record: data?.team?.recordSummary || "",
    seasonLabel: data?.requestedSeason?.displayName || data?.season?.displayName || "",
  };
  cache.set(key, result);
  return result;
}

/* Soccer, via the core API. The shape differs from site.api: categories hang
   off splits rather than results.stats, and there is no per-game figure at all,
   so that column never appears for a soccer team. Season type 1 is the only one
   these are filed under. */
async function getSoccerStats(team, season, cacheKey, { signal } = {}) {
  const league = (team.soccerLeagues && team.soccerLeagues[0]) || "eng.2";
  const year = season || new Date().getUTCFullYear();
  const path = `soccer/leagues/${league}/seasons/${year}/types/1/teams/${team.teamId}/statistics`;

  const res = await fetch(espnUrl(path, {}, { api: "core" }), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) {
    const miss = {
      categories: [],
      supported: false,
      missing: true,
      preseason: false,
      record: "",
      seasonLabel: "",
    };
    cache.set(cacheKey, miss);
    return miss;
  }
  if (!res.ok) throw new Error(`ESPN ${res.status} for soccer statistics`);

  const data = await res.json();
  const categories = (data?.splits?.categories || [])
    .map((cat) => ({
      name: cat.displayName || cat.name || "",
      stats: (cat.stats || [])
        .map((s) => ({
          label: s.displayName || s.shortDisplayName || s.name || "",
          abbrev: s.shortDisplayName || s.abbreviation || "",
          value: s.displayValue ?? (s.value === undefined ? "" : String(s.value)),
          perGame: "",
          description: s.description || "",
        }))
        .filter((s) => s.label),
    }))
    .filter((cat) => cat.stats.length);

  const result = {
    categories,
    missing: false,
    preseason: false,
    supported: categories.length > 0,
    record: "",
    seasonLabel: "",
  };
  cache.set(cacheKey, result);
  return result;
}
