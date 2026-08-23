/* The list of games, plus the live refresh -- components/LiveScoreboard.tsx.

   Refresh rules, unchanged from the original in intent:
     - only the current season polls; a finished season is static and polling it
       is pure waste
     - 15 second interval
   and two rules the Next.js version did not have:
     - polling stops while the tab is hidden and does one immediate catch-up
       refresh when it comes back, because a background tab that keeps firing
       fetches every 15 seconds for hours is the kind of thing that gets an
       origin rate-limited
     - polling only runs while a game is actually in progress or about to be */

import { renderGameCard } from "./gameCard.js";
import { getTeamGames } from "./teamData.js";
import { competition } from "./record.js";

const POLL_MS = 15000;
/* Start polling this long before the first scheduled game so a page left open
   picks the game up on its own. */
const PREGAME_LEAD_MS = 30 * 60 * 1000;

function anyLive(games) {
  return games.some((g) => competition(g)?.status?.type?.state === "in");
}

function startsSoon(games, now = Date.now()) {
  return games.some((g) => {
    const state = competition(g)?.status?.type?.state;
    if (state !== "pre") return false;
    const t = new Date(g.date).getTime();
    return Number.isFinite(t) && t - now < PREGAME_LEAD_MS && t > now - 6 * 60 * 60 * 1000;
  });
}

export function shouldPoll(games) {
  return anyLive(games) || startsSoon(games);
}

/* Which card "now" points at, as an index into the rendered list. A 166-game
   baseball season is a lot of scrolling to find today, and "latest" means
   different things depending on where in the season you are:

     a game in progress    that one, obviously
     mid-season            the next one still to play, which is the boundary
                           between results above and fixtures below
     season over           the last one played

   Returns -1 when there is nothing to point at. */
export function latestGameIndex(games, now = Date.now()) {
  if (!games || !games.length) return -1;

  const live = games.findIndex((g) => competition(g)?.status?.type?.state === "in");
  if (live !== -1) return live;

  const next = games.findIndex((g) => {
    const state = competition(g)?.status?.type?.state;
    if (state === "post") return false;
    const t = new Date(g.date).getTime();
    return Number.isFinite(t) && t > now;
  });
  if (next !== -1) return next;

  for (let i = games.length - 1; i >= 0; i -= 1) {
    if (competition(games[i])?.status?.type?.completed) return i;
  }
  return -1;
}

export function renderGames(games, teamId, { showWeek = false, team = null } = {}) {
  if (!games.length) {
    return '<p class="empty">No games found for this season.</p>';
  }
  return `<div class="games">${games
    .map((g) => renderGameCard(g, teamId, { showWeek, team }))
    .join("")}</div>`;
}

/* Returns a stop() function. Callers must call it when navigating away or the
   old page's timer keeps writing into a container that is no longer on screen. */
export function mountScoreboard({ container, teamKey, teamId, season, live, showWeek = false, team = null }) {
  let timer = null;
  let stopped = false;

  async function refresh() {
    if (stopped) return;
    try {
      const games = await getTeamGames(teamKey, season, { refresh: true });
      if (stopped) return;
      container.innerHTML = renderGames(games, teamId, { showWeek, team });
      schedule(games);
    } catch {
      /* A failed poll is not worth destroying the schedule already on screen
         over -- keep what is rendered and try again on the next tick. */
      schedule(null);
    }
  }

  function schedule(games) {
    clearTimeout(timer);
    if (stopped || !live) return;
    if (document.hidden) return; /* resumed by the visibility handler below */
    if (games && !shouldPoll(games)) return;
    timer = setTimeout(refresh, POLL_MS);
  }

  function onVisibility() {
    if (stopped || !live) return;
    if (!document.hidden) refresh();
    else clearTimeout(timer);
  }

  document.addEventListener("visibilitychange", onVisibility);

  return {
    start(games) {
      if (live) schedule(games);
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
