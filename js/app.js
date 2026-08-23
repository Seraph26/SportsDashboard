/* Router and pages.

   The Next.js version used file routes -- /teams/[team] and /teams/[team]/[year].
   GitHub Pages serves static files and has no rewrite rules, so a deep link to
   /teams/jets/2024 would 404 on refresh. Hash routes have the same shape, need
   no server, and survive a reload:

     #/                      dashboard
     #/teams/jets            team page, current season
     #/teams/jets/2024       season page */

import { teamList, getTeam } from "./teamConfig.js";
import { getTeamGames, getAvailableSeasons, currentSeason } from "./teamData.js";
import { getTeamRecord } from "./record.js";
import { renderGames, mountScoreboard } from "./scoreboard.js";

const app = document.getElementById("app");
let teardown = null;      /* stops the previous page's poll */
let navToken = 0;         /* discards responses from a page we already left */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function parseRoute() {
  const raw = (location.hash || "#/").replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "teams" && parts[1]) {
    return { name: "team", team: parts[1], year: parts[2] ? Number(parts[2]) : null };
  }
  return { name: "home" };
}

function renderHome() {
  document.title = "Sports Dashboard";
  app.innerHTML = `
    <header class="page-head">
      <h1>Sports Dashboard</h1>
      <p class="sub">Schedules, scores and records, live from ESPN.</p>
    </header>
    <div class="team-grid">
      ${teamList
        .map(
          (team) => `
        <a class="team-card" href="#/teams/${team.key}" style="--accent:${team.accent}">
          <img class="team-card__logo" src="${escapeHtml(team.logo)}" alt="" loading="lazy" />
          <span class="team-card__name">${escapeHtml(team.name)}</span>
          <span class="team-card__league">${escapeHtml(leagueLabel(team.league))}</span>
        </a>`
        )
        .join("")}
    </div>`;
}

function leagueLabel(league) {
  return { nfl: "NFL", mlb: "MLB", ncaab: "NCAA Basketball", soccer: "Soccer" }[league] || league;
}

function seasonNav(team, seasons, activeYear) {
  if (!seasons.length) return "";
  return `
    <nav class="seasons" aria-label="Season">
      ${seasons
        .map((year) => {
          const active = Number(activeYear) === year;
          return `<a class="season${active ? " season--active" : ""}"
                     href="#/teams/${team.key}/${year}"
                     ${active ? 'aria-current="page"' : ""}>${escapeHtml(team.seasonLabel(year))}</a>`;
        })
        .join("")}
    </nav>`;
}

async function renderTeam(route) {
  const token = ++navToken;
  const team = getTeam(route.team);
  if (!team) {
    app.innerHTML = `<p class="empty">Unknown team: ${escapeHtml(route.team)}. <a href="#/">Back to Dashboard</a></p>`;
    return;
  }

  const current = currentSeason(team.league);
  /* let/reassigned rather than const: an out-of-season league can send us back a
     year, see the fallback below. */
  let year = route.year || current;

  document.title = `${team.name} — ${team.seasonLabel(year)}`;

  app.innerHTML = `
    <header class="page-head page-head--team" style="--accent:${team.accent}">
      <a class="back" href="#/">&larr; Back to Dashboard</a>
      <div class="team-title">
        <img class="team-title__logo" src="${escapeHtml(team.logo)}" alt="" />
        <div>
          <h1>${escapeHtml(team.name)}</h1>
          <p class="sub" id="record">${escapeHtml(team.seasonLabel(year))} Season</p>
        </div>
      </div>
      <div id="season-nav"></div>
    </header>
    <div id="schedule"><p class="loading">Loading schedule&hellip;</p></div>`;

  const scheduleEl = document.getElementById("schedule");

  /* Seasons and games are independent, so they go out together rather than the
     schedule waiting on a dozen probe requests. */
  const seasonsPromise = getAvailableSeasons(team.key).catch(() => []);

  let games;
  try {
    games = await getTeamGames(team.key, year);
    /* Between campaigns the current season exists as a number but has no
       schedule posted yet -- in August, college basketball 2026-27 is real and
       empty. Showing "no games found" under this season would be technically
       true and useless, so fall back to the last one that was played. Only for
       the implicit current season; an explicit #/teams/x/2030 stays empty,
       because the visitor asked for that year specifically. */
    if (!games.length && !route.year) {
      const previous = await getTeamGames(team.key, year - 1);
      if (previous.length) {
        year -= 1;
        games = previous;
      }
    }
  } catch (err) {
    if (token !== navToken) return;
    scheduleEl.innerHTML = `<p class="empty">Could not load the schedule. ${escapeHtml(err.message)}</p>`;
    games = null;
  }

  if (token !== navToken) return;

  if (games) {
    const record = getTeamRecord(games, team.teamId);
    const label = `${team.seasonLabel(year)} Season`;
    /* Re-set here as well as before the fetch, because the fallback above may
       have moved the year since the heading was first written. */
    document.title = `${team.name} — ${team.seasonLabel(year)}`;
    document.getElementById("record").textContent = record.wins + record.losses + record.ties
      ? `${label} (${record.text})`
      : label;
    const showWeek = team.league === "nfl";
    scheduleEl.innerHTML = renderGames(games, team.teamId, { showWeek });

    /* Only a season still being played has anything to poll for. */
    const board = mountScoreboard({
      container: scheduleEl,
      teamKey: team.key,
      teamId: team.teamId,
      season: year,
      live: year === current,
      showWeek,
    });
    board.start(games);
    teardown = board.stop;
  }

  const seasons = await seasonsPromise;
  if (token !== navToken) return;
  /* The season being viewed always gets a button, even if the probe missed it. */
  const all = [...new Set([...seasons, year])].sort((a, b) => b - a);
  document.getElementById("season-nav").innerHTML = seasonNav(team, all, year);
}

function route() {
  if (teardown) {
    teardown();
    teardown = null;
  }
  const r = parseRoute();
  window.scrollTo(0, 0);
  if (r.name === "team") renderTeam(r);
  else renderHome();
}

window.addEventListener("hashchange", route);
route();
