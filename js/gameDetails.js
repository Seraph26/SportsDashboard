/* One game in full -- the original's /games/[sport]/[league]/[gameId] page,
   backed by ESPN's summary endpoint.

   The leagues do not agree on what a game summary contains, and asking for the
   union would mean four code paths. What they share is a boxscore with team
   totals; past that it is feature detection:

     NFL     boxscore.teams, boxscore.players, scoringPlays
     MLB     boxscore.teams, boxscore.players
     soccer  boxscore.teams, keyEvents        (no players block at all)

   So every section renders only if its block is present, and a league that
   gains one later starts showing it without a code change. */

import { espnUrl } from "./config.js";

export async function getGameSummary(sport, league, eventId, { signal } = {}) {
  const res = await fetch(espnUrl(`${sport}/${league}/summary`, { event: eventId }), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ESPN ${res.status} for summary ${eventId}`);
  return res.json();
}

function text(value, fallback = "") {
  return value === null || value === undefined ? fallback : String(value);
}

/* The header pair. ESPN puts scores on the competition's competitors, and the
   summary's own header block, depending on league -- header.competitions is the
   one that is populated everywhere. */
export function summaryHeader(payload) {
  const comp = payload?.header?.competitions?.[0];
  const competitors = comp?.competitors || [];
  const side = (which) => {
    const c = competitors.find((x) => x.homeAway === which);
    if (!c) return null;
    return {
      id: text(c.team?.id),
      name: c.team?.displayName || c.team?.name || c.team?.shortDisplayName || "TBD",
      abbrev: c.team?.abbreviation || "",
      logo: c.team?.logos?.[0]?.href || c.team?.logo || "",
      score: c.score === undefined || c.score === null ? null : text(c.score),
      record: c.record?.[0]?.displayValue || c.records?.[0]?.summary || "",
      winner: Boolean(c.winner),
    };
  };
  const status = comp?.status?.type;
  return {
    home: side("home"),
    away: side("away"),
    statusText: status?.shortDetail || status?.description || "",
    completed: Boolean(status?.completed),
    live: status?.state === "in",
    date: comp?.date || payload?.header?.competitions?.[0]?.date || null,
    venue: payload?.gameInfo?.venue?.fullName || "",
    location: [payload?.gameInfo?.venue?.address?.city, payload?.gameInfo?.venue?.address?.state]
      .filter(Boolean)
      .join(", "),
    attendance: payload?.gameInfo?.attendance || null,
    league: payload?.header?.league?.name || "",
  };
}

/* Team totals, pivoted into rows of label / away / home so the two sides can be
   read against each other. ESPN gives each team its own parallel list; they are
   keyed by stat name rather than position, because the lists are not guaranteed
   to be the same length or order. */
export function teamStatRows(payload, homeId, awayId) {
  const teams = payload?.boxscore?.teams || [];
  const byId = (id) => teams.find((t) => text(t.team?.id) === text(id));
  const home = byId(homeId)?.statistics || [];
  const away = byId(awayId)?.statistics || [];
  if (!home.length && !away.length) return [];

  const order = [];
  const seen = new Set();
  for (const list of [away, home]) {
    for (const stat of list) {
      const key = stat.name || stat.label;
      if (key && !seen.has(key)) {
        seen.add(key);
        order.push({ key, label: stat.label || stat.name });
      }
    }
  }

  const pick = (list, key) => {
    const found = list.find((s) => (s.name || s.label) === key);
    return found ? text(found.displayValue, "—") : "—";
  };

  return order.map(({ key, label }) => ({
    label,
    away: pick(away, key),
    home: pick(home, key),
  }));
}

/* Player tables, one group per stat category per team (passing, rushing,
   batting...). Soccer has no players block, which is why callers must handle an
   empty array rather than assume one table per team. */
export function playerGroups(payload) {
  const players = payload?.boxscore?.players || [];
  return players
    .map((teamBlock) => ({
      team: teamBlock.team?.displayName || teamBlock.team?.name || "",
      logo: teamBlock.team?.logo || teamBlock.team?.logos?.[0]?.href || "",
      groups: (teamBlock.statistics || [])
        .map((group) => ({
          name: group.name || group.text || "",
          labels: group.labels || [],
          descriptions: group.descriptions || [],
          rows: (group.athletes || [])
            .map((a) => ({
              id: text(a.athlete?.id),
              name: a.athlete?.displayName || a.athlete?.shortName || "",
              position: a.athlete?.position?.abbreviation || "",
              stats: a.stats || [],
            }))
            .filter((row) => row.name),
        }))
        .filter((group) => group.rows.length),
    }))
    .filter((block) => block.groups.length);
}

/* Scoring plays (NFL) and key events (soccer) are the same shape of thing --
   a timeline of the moments that mattered -- but not the same content, and the
   heading has to say which. scoringPlays really is only scores; keyEvents also
   carries cards and substitutions, so a 1-1 match returns thirty of them and
   calling that "Scoring" would be a lie. Hence the label travels with the list. */
export function timeline(payload) {
  const scoring = payload?.scoringPlays;
  if (Array.isArray(scoring) && scoring.length) {
    return { label: "Scoring", items: scoring.map((p) => ({
      when: p.clock?.displayValue
        ? `${p.period?.displayValue || ""} ${p.clock.displayValue}`.trim()
        : p.period?.displayValue || "",
      teamLogo: p.team?.logo || "",
      text: p.text || p.type?.text || "",
      score: `${text(p.awayScore, "")}-${text(p.homeScore, "")}`,
    })) };
  }

  const key = payload?.keyEvents;
  if (Array.isArray(key) && key.length) {
    const items = key
      .filter((e) => e.type?.text)
      .map((e) => {
        /* Soccer names its people under participants, not athletesInvolved, and
           writes a better line than we could assemble: shortText is
           "Luca Kjerrumgaard Goal - Header". Fall back to type plus names only
           when there is no prose. */
        const who = (e.participants || [])
          .map((p) => p.athlete?.displayName)
          .filter(Boolean)
          .join(", ");
        return {
          when: e.clock?.displayValue || "",
          teamLogo: e.team?.logo || "",
          text: e.shortText || [e.type?.text, who].filter(Boolean).join(" — "),
          team: e.team?.displayName || "",
          /* Soccer key events carry no running score at all -- unlike NFL
             scoringPlays -- so there is nothing to put in this column. The
             score is inside the event text where ESPN wrote it. */
          score: "",
          scoring: Boolean(e.scoringPlay),
        };
      });
    return { label: "Key Events", items };
  }

  return { label: "", items: [] };
}
