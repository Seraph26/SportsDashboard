/* Time until the next game, ticking once a second -- the original
   components/TeamCardCountdown.tsx.

   Four states, same as the original: a game in progress, a countdown, "starting
   soon" once the clock runs out but before ESPN flips the status, and nothing
   scheduled. The third state matters more than it looks: kickoff time and the
   status change are minutes apart, and without it the card sits at 0:00:00. */

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

/* Below two days this is the original's H:MM:SS, which is what you want for a
   game tonight. Above it, that format stops being a countdown and starts being
   a number: Providence's next game read "1684:56:30". Past two days it says
   days and hours instead, and the seconds stop mattering -- see the tick
   interval in mountCountdown. */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));

  if (ms >= TWO_DAYS_MS) {
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    return `${days}d ${String(hours).padStart(2, "0")}h`;
  }

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/* Which game the card should be counting toward: a live one if there is one,
   otherwise the next future fixture. Mirrors getDashboardGameInfo. */
export function nextGameInfo(games, teamId, now = Date.now()) {
  if (!games || !games.length) return { opponent: null, date: null, isLive: false };

  const live = games.find((g) => g.competitions?.[0]?.status?.type?.state === "in");
  if (live) {
    /* A game in progress is the whole reason to have this open, so the card
       carries the score and the clock rather than the word "live". */
    const comp = live.competitions[0];
    const ours = comp.competitors?.find((c) => String(c.team?.id) === String(teamId));
    const theirs = comp.competitors?.find((c) => c !== ours);
    const num = (c) => {
      const s = c?.score;
      if (s === null || s === undefined) return null;
      return typeof s === "object" ? s.value ?? Number(s.displayValue) : Number(s);
    };
    return {
      opponent: opponentName(live, teamId),
      date: live.date || null,
      isLive: true,
      status: comp.status?.type?.shortDetail || comp.status?.type?.description || "",
      us: num(ours),
      them: num(theirs),
      href: live.id ? String(live.id) : null,
    };
  }

  const next = games
    .filter((g) => {
      const state = g.competitions?.[0]?.status?.type?.state;
      if (state === "post") return false;
      const t = new Date(g.date).getTime();
      return Number.isFinite(t) && t > now;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (!next) return { opponent: null, date: null, isLive: false };
  return { opponent: opponentName(next, teamId), date: next.date || null, isLive: false };
}

/* Who we are playing, and where. ESPN's shortName is the whole matchup
   ("NYJ @ TEN"), so naming the opponent means finding the competitor that is
   not us -- which needs the team id, not just the event. "vs" and "at" come
   from our own homeAway, so a glance at the card says whether it is a home
   game; the original only ever said "vs". */
function opponentName(game, teamId) {
  const comp = game?.competitions?.[0];
  const competitors = comp?.competitors || [];
  const us = competitors.find((c) => String(c.team?.id) === String(teamId));
  const them = competitors.find((c) => c !== us);
  const name = them?.team?.displayName || them?.team?.name;
  if (!name) return game?.shortName || null;
  return `${us?.homeAway === "away" ? "at" : "vs"} ${name}`;
}

/* Renders into el and returns stop(). The caller owns the teardown, same
   contract as mountScoreboard. */
export function mountCountdown(el, info) {
  let timer = null;

  function paint() {
    if (info.isLive) {
      const haveScore = Number.isFinite(info.us) && Number.isFinite(info.them);
      el.innerHTML = `
        <div class="cd cd--live"><span class="cd__dot" aria-hidden="true"></span>${
          haveScore ? `${escapeHtml(String(info.us))}&ndash;${escapeHtml(String(info.them))}` : "Live now"
        }</div>
        ${info.status ? `<div class="cd__opp">${escapeHtml(info.status)}</div>` : ""}
        ${info.opponent ? `<div class="cd__opp">${escapeHtml(info.opponent)}</div>` : ""}`;
      return;
    }
    const target = info.date ? new Date(info.date).getTime() : null;
    if (!Number.isFinite(target) || !info.opponent) {
      el.innerHTML = '<div class="cd cd--none">No upcoming game scheduled</div>';
      return;
    }
    const remaining = target - Date.now();
    if (remaining <= 0) {
      el.innerHTML = '<div class="cd cd--soon">Starting soon&hellip;</div>';
      return;
    }
    el.innerHTML = `
      <div class="cd cd--count">Next game in ${formatCountdown(remaining)}</div>
      <div class="cd__opp">${escapeHtml(info.opponent)}</div>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[ch]));
  }

  /* Tick as often as the display actually changes, and no more. Under two days
     that is every second; past it the format is days and hours, so a per-second
     repaint would redraw an identical string 3,600 times an hour. A self
     scheduling timeout rather than an interval, so a countdown that crosses the
     two-day line speeds up on its own. Live and nothing-scheduled are static
     and need no timer at all. */
  function schedule() {
    const remaining = new Date(info.date).getTime() - Date.now();
    timer = setTimeout(() => {
      paint();
      schedule();
    }, remaining >= TWO_DAYS_MS ? 60000 : 1000);
  }

  paint();
  if (!info.isLive && info.opponent && info.date) schedule();

  return function stop() {
    clearTimeout(timer);
  };
}
