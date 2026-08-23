/* W-L-T from a list of ESPN events. This is the original lib/nflUtils.ts
   generalised: the logic turned out to be league-independent once scores are
   read correctly, and soccer draws land in the T column for free. */

/* ESPN's competitor.score is an object, not a number. Reading it as a number
   was the original app's score-parsing bug: team.score is {value, displayValue}
   and only .value is numeric. Older payloads occasionally give a bare string,
   so both are handled. */
export function scoreValue(competitor) {
  const score = competitor?.score;
  if (score === null || score === undefined) return null;
  if (typeof score === "number") return score;
  if (typeof score === "string") {
    const n = Number(score);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof score.value === "number") return score.value;
  const n = Number(score.displayValue);
  return Number.isFinite(n) ? n : null;
}

export function scoreDisplay(competitor) {
  const score = competitor?.score;
  if (score === null || score === undefined) return null;
  if (typeof score === "object") return score.displayValue ?? String(score.value ?? "");
  return String(score);
}

export function competition(game) {
  return game?.competitions?.[0] || null;
}

export function isCompleted(game) {
  return Boolean(competition(game)?.status?.type?.completed);
}

export function sides(game, teamId) {
  const comp = competition(game);
  if (!comp?.competitors) return { us: null, them: null, home: null, away: null };
  const home = comp.competitors.find((c) => c.homeAway === "home") || null;
  const away = comp.competitors.find((c) => c.homeAway === "away") || null;
  const us = comp.competitors.find((c) => String(c.team?.id) === String(teamId)) || null;
  const them = comp.competitors.find((c) => c !== us) || null;
  return { us, them, home, away };
}

export function getTeamRecord(games, teamId) {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const game of games || []) {
    if (!isCompleted(game)) continue;
    const { us, them } = sides(game, teamId);
    if (!us || !them) continue;
    const ours = scoreValue(us);
    const theirs = scoreValue(them);
    if (ours === null || theirs === null) continue;
    if (ours > theirs) wins += 1;
    else if (ours < theirs) losses += 1;
    else ties += 1;
  }

  return { wins, losses, ties, text: `${wins}-${losses}-${ties}` };
}
