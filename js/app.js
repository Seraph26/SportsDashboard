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
import { mountCountdown, nextGameInfo } from "./countdown.js";
import { getGameSummary, summaryHeader, teamStatRows, playerGroups, timeline } from "./gameDetails.js";
import { getTeamNews } from "./news.js";

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
  /* #/games/<sport>/<league>/<eventId> -- the league is in the URL because it is
     not derivable for soccer, where a club's games move between divisions. */
  if (parts[0] === "games" && parts[1] && parts[2] && parts[3]) {
    return { name: "game", sport: parts[1], league: parts[2], eventId: parts[3] };
  }
  return { name: "home" };
}

/* The dashboard. Each team gets a column of three cards -- the team panel with
   its countdown, its headlines, and its stream links -- matching the original
   app/page.tsx. That page was server-rendered and had every team's games and
   news in hand before it emitted any HTML; here the shell is painted first and
   the three async pieces fill in, because a static page that waits for a dozen
   ESPN probes before showing anything is a worse trade than one that fills in. */
const MASTER_STREAM_URL = "https://fmhy.net/video#live-sports";

function renderHome() {
  document.body.dataset.view = "home";
  document.title = "Roger's Teams";
  app.innerHTML = `
    <header class="page-head page-head--home">
      <h1 class="home-title">Roger&apos;s Teams</h1>
    </header>
    <div class="board">
      ${teamList
        .map(
          (team) => `
        <div class="col" data-team="${escapeHtml(team.key)}">
          <section class="card card--team" style="--accent:${team.accent}">
            <img class="card__watermark" src="${escapeHtml(team.logo)}" alt="" aria-hidden="true" loading="lazy" />
            <div class="card__body">
              <a class="team-link" href="#/teams/${escapeHtml(team.key)}">${escapeHtml(team.name)}</a>
              <div class="countdown" data-countdown></div>
            </div>
          </section>

          <section class="card">
            <h2 class="card__label">Latest News</h2>
            <div class="stack" data-news><p class="card__note">Loading&hellip;</p></div>
          </section>

          <section class="card">
            <h2 class="card__label">Live Streams</h2>
            <div class="stack">
              ${(team.streams || [])
                .map(
                  (s) => `
                <a class="tile" href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(s.label)}</a>`
                )
                .join("")}
              ${
                team.website
                  ? `<a class="tile tile--site" href="${escapeHtml(team.website)}" target="_blank" rel="noreferrer noopener">Official site</a>`
                  : ""
              }
            </div>
          </section>
        </div>`
        )
        .join("")}
    </div>

    <div class="board-foot">
      <section class="card card--master">
        <h2 class="card__label">Live Streams</h2>
        <a class="tile tile--master" href="${MASTER_STREAM_URL}" target="_blank" rel="noreferrer noopener">MASTER STREAM LINKS</a>
      </section>
    </div>`;

  fillDashboard();
}

/* Countdown and headlines for every column. Each team is independent, so one
   team's ESPN failure leaves the other three counting down. */
function fillDashboard() {
  const token = ++navToken;
  const stoppers = [];
  teardown = () => {
    for (const stop of stoppers) stop();
  };

  for (const team of teamList) {
    const col = app.querySelector(`.col[data-team="${team.key}"]`);
    if (!col) continue;

    getTeamGames(team.key, currentSeason(team.league))
      .then((games) => {
        if (token !== navToken) return;
        const el = col.querySelector("[data-countdown]");
        if (el) stoppers.push(mountCountdown(el, nextGameInfo(games, team.teamId)));
      })
      .catch(() => {
        if (token !== navToken) return;
        const el = col.querySelector("[data-countdown]");
        if (el) el.innerHTML = '<div class="cd cd--none">Schedule unavailable</div>';
      });

    getTeamNews(team.key).then((items) => {
      if (token !== navToken) return;
      const el = col.querySelector("[data-news]");
      if (!el) return;
      if (items === null) {
        el.innerHTML = '<p class="card__note">Headlines unavailable right now.</p>';
        return;
      }
      if (!items.length) {
        el.innerHTML = '<p class="card__note">No headlines today.</p>';
        return;
      }
      el.innerHTML = items
        .slice(0, 3)
        .map(
          (item) => `
        <a class="tile tile--news" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer noopener">
          <span class="tile__title">${escapeHtml(item.title)}</span>
          ${item.source ? `<span class="tile__src">${escapeHtml(item.source)}</span>` : ""}
        </a>`
        )
        .join("");
    });
  }
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
  document.body.dataset.view = "team";
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
          ${
            team.website
              ? `<a class="team-site" href="${escapeHtml(team.website)}" target="_blank" rel="noreferrer noopener">Official site &nearr;</a>`
              : ""
          }
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
    scheduleEl.innerHTML = renderGames(games, team.teamId, { showWeek, team });

    /* Only a season still being played has anything to poll for. */
    const board = mountScoreboard({
      container: scheduleEl,
      teamKey: team.key,
      teamId: team.teamId,
      season: year,
      live: year === current,
      showWeek,
      team,
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

/* One game in full. Sections appear only when the league actually provides
   them, so the same page serves an NFL box score, an MLB one, and a soccer
   match with neither a players block nor scoring plays. */
async function renderGame(route) {
  const token = ++navToken;
  document.body.dataset.view = "team";
  document.title = "Game";

  app.innerHTML = `
    <header class="page-head page-head--game">
      <a class="back" href="#/">&larr; Back to Dashboard</a>
    </header>
    <div id="game"><p class="loading">Loading game&hellip;</p></div>`;

  const host = document.getElementById("game");

  let payload;
  try {
    payload = await getGameSummary(route.sport, route.league, route.eventId);
  } catch (err) {
    if (token !== navToken) return;
    host.innerHTML = `<p class="empty">Could not load this game. ${escapeHtml(err.message)}</p>`;
    return;
  }
  if (token !== navToken) return;

  const head = summaryHeader(payload);
  if (!head.home || !head.away) {
    host.innerHTML = '<p class="empty">ESPN has no summary for this game.</p>';
    return;
  }

  document.title = `${head.away.name} at ${head.home.name}`;

  const when = head.date ? new Date(head.date) : null;
  const whenText =
    when && !Number.isNaN(+when)
      ? when.toLocaleString(undefined, {
          weekday: "short", month: "short", day: "numeric",
          hour: "numeric", minute: "2-digit",
        })
      : "";

  const rows = teamStatRows(payload, head.home.id, head.away.id);
  const groups = playerGroups(payload);
  const events = timeline(payload);

  host.innerHTML = `
    <section class="gh">
      <div class="gh__meta">
        ${[head.league, whenText, head.venue, head.location].filter(Boolean).map((x) => `<span>${escapeHtml(x)}</span>`).join("")}
      </div>
      <div class="gh__teams">
        ${gameSide(head.away)}
        <div class="gh__status">
          ${head.live ? '<span class="dot" aria-hidden="true"></span>' : ""}
          <span>${escapeHtml(head.statusText)}</span>
        </div>
        ${gameSide(head.home)}
      </div>
    </section>

    ${
      events.items.length
        ? `<section class="gsec">
             <h2 class="gsec__title">${escapeHtml(events.label)}</h2>
             <ol class="tl">
               ${events.items
                 .map(
                   (e) => `
                 <li class="tl__item${e.scoring ? " tl__item--score" : ""}">
                   <span class="tl__when">${escapeHtml(e.when)}</span>
                   <span class="tl__text">${escapeHtml(e.text)}${e.team ? ` <span class="tl__team">${escapeHtml(e.team)}</span>` : ""}</span>
                   <span class="tl__score">${escapeHtml(e.score)}</span>
                 </li>`
                 )
                 .join("")}
             </ol>
           </section>`
        : ""
    }

    ${
      rows.length
        ? `<section class="gsec">
             <h2 class="gsec__title">Team Stats</h2>
             <div class="tblwrap">
               <table class="tbl">
                 <thead>
                   <tr>
                     <th>Stat</th>
                     <th class="num">${escapeHtml(head.away.abbrev || head.away.name)}</th>
                     <th class="num">${escapeHtml(head.home.abbrev || head.home.name)}</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${rows
                     .map(
                       (r) => `
                     <tr>
                       <td>${escapeHtml(r.label)}</td>
                       <td class="num">${escapeHtml(r.away)}</td>
                       <td class="num">${escapeHtml(r.home)}</td>
                     </tr>`
                     )
                     .join("")}
                 </tbody>
               </table>
             </div>
           </section>`
        : ""
    }

    ${groups.map(playerBlock).join("")}

    ${
      !rows.length && !groups.length && !events.items.length
        ? '<p class="empty">ESPN has no box score for this game yet.</p>'
        : ""
    }`;
}

function gameSide(side) {
  return `
    <div class="gh__side${side.winner ? " gh__side--win" : ""}">
      ${side.logo ? `<img class="gh__logo" src="${escapeHtml(side.logo)}" alt="" loading="lazy" />` : ""}
      <div class="gh__name">${escapeHtml(side.name)}</div>
      ${side.record ? `<div class="gh__rec">${escapeHtml(side.record)}</div>` : ""}
      <div class="gh__score">${side.score === null ? "" : escapeHtml(side.score)}</div>
    </div>`;
}

function playerBlock(block) {
  return `
    <section class="gsec">
      <h2 class="gsec__title">${escapeHtml(block.team)}</h2>
      ${block.groups
        .map(
          (group) => `
        <h3 class="gsec__sub">${escapeHtml(group.name)}</h3>
        <div class="tblwrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Player</th>
                ${group.labels.map((l) => `<th class="num">${escapeHtml(l)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${group.rows
                .map(
                  (row) => `
                <tr>
                  <td>${escapeHtml(row.name)}${row.position ? ` <span class="pos">${escapeHtml(row.position)}</span>` : ""}</td>
                  ${group.labels.map((_, i) => `<td class="num">${escapeHtml(row.stats[i] ?? "—")}</td>`).join("")}
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
        )
        .join("")}
    </section>`;
}

function route() {
  if (teardown) {
    teardown();
    teardown = null;
  }
  const r = parseRoute();
  window.scrollTo(0, 0);
  if (r.name === "team") renderTeam(r);
  else if (r.name === "game") renderGame(r);
  else renderHome();
}

window.addEventListener("hashchange", route);
route();
