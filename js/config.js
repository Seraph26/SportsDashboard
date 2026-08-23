/* Where ESPN requests go.

   The dashboard can talk to ESPN two ways:

   1. Directly. ESPN's site.api answers with Access-Control-Allow-Origin: *,
      so the browser can fetch it with no server involved at all. This is what
      happens when WORKER_BASE is empty, and it is what makes the site work the
      moment it lands on GitHub Pages, before any Cloudflare setup exists.

   2. Through the Cloudflare Worker in worker/src/index.js, which caches at the
      edge and keeps our ESPN traffic behind one origin we control. Set
      WORKER_BASE to the deployed worker URL to switch everything over.

   Nothing else in the app knows which mode is active -- espnService.js builds
   every URL through espnUrl() below. */

export const WORKER_BASE = "https://sportsdashboard.seraph0226.workers.dev";

/* ESPN paths are passed through unchanged, so a worker request looks like
   https://<worker>/espn/football/nfl/teams/20/schedule?season=2025 and the
   direct request is the same path under site.api.espn.com. Keeping them
   identical is what lets the toggle be a single constant. */
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
/* Standings live on a different ESPN API prefix. The worker exposes it as
   /espn2/ rather than /espn/, so both modes need to know which one a path wants
   -- pass { api: "v2" } for standings and nothing for everything else. */
const ESPN_BASE_V2 = "https://site.api.espn.com/apis/v2/sports";
/* The core API is a different ESPN service on a different host, carrying things
   site.api does not -- soccer team statistics, for one. */
const ESPN_BASE_CORE = "https://sports.core.api.espn.com/v2/sports";

const BASES = { site: ESPN_BASE, v2: ESPN_BASE_V2, core: ESPN_BASE_CORE };
const PREFIXES = { site: "espn", v2: "espn2", core: "espncore" };

export function espnUrl(path, params = {}, { api = "site" } = {}) {
  const clean = path.replace(/^\//, "");
  const base = WORKER_BASE
    ? `${WORKER_BASE.replace(/\/$/, "")}/${PREFIXES[api] || PREFIXES.site}/${clean}`
    : `${BASES[api] || BASES.site}/${clean}`;
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}
