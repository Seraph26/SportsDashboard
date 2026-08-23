/* League tables -- the original's standingsService plus StandingsTable.

   ESPN returns two different shapes from the same endpoint. Soccer is flat: one
   standings block with every club in it. The NFL nests, with conferences and
   divisions under children[], each carrying its own standings block. Rather
   than branch per league, the tree is walked and every block that has entries
   becomes a named group -- flat payloads simply yield one group.

   College basketball needs the group parameter. Without it the endpoint returns
   all of Division I: 6 MB for a table of eleven teams. Providence's conference
   id lives in teamConfig as standingsGroup. */

import { espnUrl } from "./config.js";

const cache = new Map();

/* Columns per league, in the order that league's readers expect them. ESPN
   sends thirty-odd stats per entry and will happily answer for stats the sport
   does not have -- baseball returns a ties column of zeros and a "points" of
   -6.0, neither of which means anything in baseball. A union of all four sports
   therefore produces a table with nonsense in it, so each league names its own. */
const COLUMNS_BY_LEAGUE = {
  soccer: [
    { name: "gamesPlayed", label: "GP" },
    { name: "wins", label: "W" },
    { name: "ties", label: "D" },
    { name: "losses", label: "L" },
    { name: "pointDifferential", label: "GD" },
    { name: "points", label: "Pts" },
  ],
  nfl: [
    { name: "wins", label: "W" },
    { name: "losses", label: "L" },
    { name: "ties", label: "T" },
    { name: "winPercent", label: "PCT" },
    { name: "pointDifferential", label: "+/-" },
    { name: "streak", label: "Streak" },
  ],
  mlb: [
    { name: "wins", label: "W" },
    { name: "losses", label: "L" },
    { name: "winPercent", label: "PCT" },
    { name: "gamesBehind", label: "GB" },
    { name: "pointDifferential", label: "RD" },
    { name: "streak", label: "Streak" },
  ],
  ncaab: [
    { name: "wins", label: "W" },
    { name: "losses", label: "L" },
    { name: "winPercent", label: "PCT" },
    { name: "gamesBehind", label: "GB" },
    { name: "streak", label: "Streak" },
  ],
};

const ALL_COLUMNS = Object.values(COLUMNS_BY_LEAGUE).flat();

function standingsPath(team) {
  const league = team.league === "soccer"
    ? (team.soccerLeagues && team.soccerLeagues[0]) || "eng.2"
    : team.path;
  return `${team.sport}/${league}/standings`;
}

/* Depth-first through children[], collecting anything with entries. The name
   comes from the node that owns the block, not the block itself, because ESPN
   labels the block "overall" everywhere. */
function collectGroups(node, inheritedName = "") {
  if (!node || typeof node !== "object") return [];
  const name = node.name || node.displayName || inheritedName;
  const groups = [];

  const entries = node.standings?.entries;
  if (Array.isArray(entries) && entries.length) {
    groups.push({ name, entries: entries.map(normalizeEntry) });
  }

  for (const child of node.children || []) {
    groups.push(...collectGroups(child, name));
  }
  return groups;
}

function normalizeEntry(entry) {
  const stats = entry.stats || [];
  const by = (key) => stats.find((s) => s.name === key);
  const cells = {};
  for (const col of ALL_COLUMNS) {
    const stat = by(col.name);
    if (stat) cells[col.name] = stat.displayValue ?? String(stat.value ?? "");
  }
  const rank = by("rank") || by("playoffSeed");
  return {
    id: String(entry.team?.id ?? ""),
    name: entry.team?.displayName || entry.team?.name || "",
    abbrev: entry.team?.abbreviation || "",
    logo: entry.team?.logos?.[0]?.href || entry.team?.logo || "",
    rank: rank ? Number(rank.value ?? rank.displayValue) || null : null,
    cells,
  };
}

export async function getStandings(team, season, { signal } = {}) {
  const key = `${team.key}:${season ?? "current"}`;
  if (cache.has(key)) return cache.get(key);

  const params = { season };
  if (team.standingsGroup) params.group = team.standingsGroup;

  const res = await fetch(espnUrl(standingsPath(team), params, { api: "v2" }), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ESPN ${res.status} for standings`);

  const data = await res.json();
  const groups = collectGroups(data);

  /* This league's columns, minus any the payload did not actually fill. */
  const wanted = COLUMNS_BY_LEAGUE[team.league] || COLUMNS_BY_LEAGUE.nfl;
  const used = wanted.filter((col) =>
    groups.some((g) => g.entries.some((e) => e.cells[col.name] !== undefined)),
  );

  for (const group of groups) {
    group.entries.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }

  const result = { groups, columns: used };
  cache.set(key, result);
  return result;
}
