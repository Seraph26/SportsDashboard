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

export function espnUrl(path, params = {}) {
  const base = WORKER_BASE
    ? `${WORKER_BASE.replace(/\/$/, "")}/espn/${path.replace(/^\//, "")}`
    : `${ESPN_BASE}/${path.replace(/^\//, "")}`;
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}
