export function getTeamRecord(games: any[], teamId: string) {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const game of games) {
    const competition = game?.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    const completed = competition?.status?.type?.completed;

    if (!completed || competitors.length < 2) continue;

    const team = competitors.find(
      (c: any) => String(c?.team?.id) === String(teamId)
    );

    const opponent = competitors.find(
      (c: any) => String(c?.team?.id) !== String(teamId)
    );

    if (!team || !opponent) continue;

    const teamScore = Number(team?.score?.value);
    const opponentScore = Number(opponent?.score?.value);

    if (!Number.isFinite(teamScore) || !Number.isFinite(opponentScore)) {
      continue;
    }

    if (teamScore > opponentScore) wins += 1;
    else if (teamScore < opponentScore) losses += 1;
    else ties += 1;
  }

  return `${wins}-${losses}-${ties}`;
}