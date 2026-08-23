/* Team headlines.

   The original Next.js app read Google News RSS server-side. That does not port
   to a static site twice over: Google sends no CORS headers, so a browser can
   never fetch it, and Google answers 503 to Cloudflare's address ranges, so
   proxying it through the worker fails too (every user agent works from a
   residential IP -- the block is by address).

   ESPN's own news endpoint solves both. It is genuinely team-filtered
   (?team=352 returns Wrexham stories, not Championship stories), it sits on the
   host espnService already uses, and it sends CORS -- so news works in direct
   mode as well, unlike everything the worker was originally widened for.

   Shape: { articles: [ { headline, description, published, links: { web: { href } } } ] } */

import { espnUrl } from "./config.js";
import { getTeam } from "./teamConfig.js";

const LIMIT = 6;
const cache = new Map();

/* Which league path carries a team's news. Soccer is the awkward one: news
   lives under a division, and unlike schedules there is no empty-list-probe to
   fall back on, so the club's current division is used. */
function newsPath(team) {
  switch (team.league) {
    case "nfl":
      return "football/nfl/news";
    case "mlb":
      return "baseball/mlb/news";
    case "ncaab":
      return "basketball/mens-college-basketball/news";
    case "soccer":
      return `soccer/${(team.soccerLeagues && team.soccerLeagues[0]) || "eng.2"}/news`;
    default:
      return null;
  }
}

function normalize(article) {
  const title = article?.headline || article?.title || "";
  const url = article?.links?.web?.href || article?.links?.mobile?.href || "";
  if (!title || !url) return null;
  return {
    title,
    url,
    source: article?.byline || undefined,
    publishedAt: article?.published || undefined,
  };
}

/* Returns an array of items, or null when the fetch failed. The dashboard shows
   those two states differently -- "no headlines" and "could not load" are
   different things and only one of them is worth retrying. */
export async function getTeamNews(teamKey, { signal } = {}) {
  if (cache.has(teamKey)) return cache.get(teamKey);

  const team = getTeam(teamKey);
  const path = team && newsPath(team);
  if (!path) return null;

  try {
    const res = await fetch(espnUrl(path, { team: team.teamId, limit: LIMIT }), {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = (Array.isArray(data.articles) ? data.articles : [])
      .map(normalize)
      .filter(Boolean);
    cache.set(teamKey, items);
    return items;
  } catch {
    /* Headlines are the least important thing on the dashboard; a failure here
       must not take the countdown or the schedule down with it. */
    return null;
  }
}
