/* Roster and player pages.

   The original read player rows out of /teams/{id}/statistics and rendered a
   PlayerHeader from whichever row matched the id. That source is gone: ESPN's
   statistics payload carries team totals only now, with no athletes block in
   any of the four leagues. The roster endpoint carries more than the old rows
   did anyway -- headshot, jersey, position, college, experience, status -- so
   player pages are built from that instead.

   ESPN groups the NFL roster into offense / defense / special teams and returns
   a flat list for everyone else. Both arrive as athletes[]; the difference is
   whether each element is a group or a player, which is what hasGroups tests. */

import { espnUrl } from "./config.js";

const cache = new Map();

function rosterPath(team) {
  const league = team.league === "soccer"
    ? (team.soccerLeagues && team.soccerLeagues[0]) || "eng.2"
    : team.path;
  return `${team.sport}/${league}/teams/${team.teamId}/roster`;
}

function normalizePlayer(a) {
  return {
    id: String(a.id ?? ""),
    name: a.displayName || a.fullName || "",
    shortName: a.shortName || "",
    jersey: a.jersey || "",
    position: a.position?.displayName || a.position?.name || "",
    positionAbbrev: a.position?.abbreviation || "",
    height: a.displayHeight || "",
    weight: a.displayWeight || "",
    age: a.age ?? null,
    birthPlace: [a.birthPlace?.city, a.birthPlace?.state, a.birthPlace?.country]
      .filter(Boolean)
      .join(", "),
    college: a.college?.name || "",
    experience: a.experience?.years ?? null,
    status: a.status?.name || "",
    headshot: a.headshot?.href || "",
    /* ESPN's own player card -- the one thing a roster row cannot show that a
       reader might actually want next. */
    link: (a.links || []).find((l) => (l.rel || []).includes("playercard"))?.href || "",
  };
}

export async function getRoster(team, { signal } = {}) {
  if (cache.has(team.key)) return cache.get(team.key);

  const res = await fetch(espnUrl(rosterPath(team)), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ESPN ${res.status} for roster`);

  const data = await res.json();
  const raw = Array.isArray(data.athletes) ? data.athletes : [];
  const hasGroups = raw.length > 0 && Array.isArray(raw[0]?.items);

  const groups = hasGroups
    ? raw.map((g) => ({
        name: g.position ? titleCase(g.position) : g.text || "",
        players: (g.items || []).map(normalizePlayer).filter((p) => p.name),
      }))
    : [{ name: "", players: raw.map(normalizePlayer).filter((p) => p.name) }];

  const result = { groups: groups.filter((g) => g.players.length) };
  cache.set(team.key, result);
  return result;
}

function titleCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/* Finding one player means loading the roster, which is the same request the
   roster tab makes and is cached, so a player page costs nothing extra when you
   arrive from the list. */
export async function getPlayer(team, playerId, opts) {
  const roster = await getRoster(team, opts);
  for (const group of roster.groups) {
    const found = group.players.find((p) => p.id === String(playerId));
    if (found) return found;
  }
  return null;
}
