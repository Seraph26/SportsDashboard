/* One game, rendered as "Away @ Home" with scores, status and date -- the
   original components/GameCard.tsx. */

import { competition, sides, scoreDisplay, scoreValue, isCompleted } from "./record.js";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function teamLogo(competitor) {
  return (
    competitor?.team?.logos?.[0]?.href ||
    competitor?.team?.logo ||
    ""
  );
}

function outcomeFor(game, teamId) {
  if (!isCompleted(game)) return "";
  const { us, them } = sides(game, teamId);
  const ours = scoreValue(us);
  const theirs = scoreValue(them);
  if (ours === null || theirs === null) return "";
  if (ours > theirs) return "win";
  if (ours < theirs) return "loss";
  return "tie";
}

function sideMarkup(competitor, { leading }) {
  if (!competitor) return "";
  const logo = teamLogo(competitor);
  const score = scoreDisplay(competitor);
  return `
    <div class="side${leading ? " side--leading" : ""}">
      ${logo ? `<img class="side__logo" src="${escapeHtml(logo)}" alt="" loading="lazy" />` : ""}
      <span class="side__name">${escapeHtml(competitor.team?.displayName || competitor.team?.name || "TBD")}</span>
      <span class="side__score">${score === null ? "" : escapeHtml(score)}</span>
    </div>`;
}

/* showWeek: ESPN stamps a week number on MLB and college basketball events too,
   where it is an internal scheduling artefact and reads as nonsense ("WEEK 13"
   on a March baseball game). Only the NFL asks for it. */
export function renderGameCard(game, teamId, { showWeek = false } = {}) {
  const comp = competition(game);
  const { home, away } = sides(game, teamId);
  const status = comp?.status?.type;
  const live = status?.state === "in";
  const outcome = outcomeFor(game, teamId);

  const homeScore = scoreValue(home);
  const awayScore = scoreValue(away);
  const decided = isCompleted(game) && homeScore !== null && awayScore !== null;

  const date = game?.date ? new Date(game.date) : null;
  const dateText = date && !Number.isNaN(+date) ? dateFmt.format(date) : "";
  const timeText = date && !Number.isNaN(+date) && !isCompleted(game) ? timeFmt.format(date) : "";

  /* status.type.shortDetail already reads the way a scoreboard should -- "Final",
     "FT", "Q3 4:21", or the kickoff time -- so it is used verbatim rather than
     rebuilt from state. */
  const statusText = status?.shortDetail || status?.description || "";

  return `
    <article class="game${outcome ? ` game--${outcome}` : ""}${live ? " game--live" : ""}">
      <header class="game__meta">
        <span class="game__date">${escapeHtml(dateText)}${timeText ? ` &middot; ${escapeHtml(timeText)}` : ""}</span>
        ${showWeek && game?.week?.text ? `<span class="game__week">${escapeHtml(game.week.text)}</span>` : ""}
      </header>
      <div class="game__sides">
        ${sideMarkup(away, { leading: decided && awayScore > homeScore })}
        ${sideMarkup(home, { leading: decided && homeScore > awayScore })}
      </div>
      <footer class="game__status">
        ${live ? '<span class="dot" aria-hidden="true"></span>' : ""}
        <span>${escapeHtml(statusText)}</span>
        ${outcome ? `<span class="game__outcome">${outcome === "win" ? "W" : outcome === "loss" ? "L" : "T"}</span>` : ""}
      </footer>
    </article>`;
}
