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

export async function getTeamStats(team, season, { signal } = {}) {
  const key = `${team.key}:${season ?? "current"}`;
  if (cache.has(key)) return cache.get(key);

  const league = team.league === "soccer"
    ? (team.soccerLeagues && team.soccerLeagues[0]) || "eng.2"
    : team.path;
  const path = `${team.sport}/${league}/teams/${team.teamId}/statistics`;

  const res = await fetch(espnUrl(path, { season }), {
    signal,
    headers: { Accept: "application/json" },
  });
  /* A season with no statistics yet is a 404 here, not an empty payload -- the
     NFL's 2026 stats 404 all through preseason while 2025 returns fine. That is
     the same "current season is legitimately empty" case the schedule page
     handles, so it is reported rather than thrown, and the caller falls back a
     year exactly as the schedule does. */
  if (res.status === 404) {
    const miss = { categories: [], supported: false, missing: true, record: "", seasonLabel: "" };
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
    /* Distinguishes "this league has no stats" from "this season has none" for
       the caller, without it having to know which leagues those are. */
    supported: categories.length > 0,
    record: data?.team?.recordSummary || "",
    seasonLabel: data?.requestedSeason?.displayName || data?.season?.displayName || "",
  };
  cache.set(key, result);
  return result;
}
