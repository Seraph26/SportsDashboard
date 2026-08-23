/* Time until the next game, ticking once a second -- the original
   components/TeamCardCountdown.tsx.

   Four states, same as the original: a game in progress, a countdown, "starting
   soon" once the clock runs out but before ESPN flips the status, and nothing
   scheduled. The third state matters more than it looks: kickoff time and the
   status change are minutes apart, and without it the card sits at 0:00:00. */

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
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
    return { opponent: opponentName(live, teamId), date: live.date || null, isLive: true };
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
      el.innerHTML = '<div class="cd cd--live">Game in progress</div>';
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

  paint();

  /* Tick every second whenever a countdown is on screen. The displayed value
     changes every second even for a fixture weeks out, so throttling this would
     just freeze the number at whatever it read on page load. Live and
     nothing-scheduled are static, so they do not need a timer at all. */
  if (!info.isLive && info.opponent && info.date) {
    timer = setInterval(paint, 1000);
  }

  return function stop() {
    clearInterval(timer);
  };
}
