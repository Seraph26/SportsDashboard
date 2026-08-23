export async function getNFLTeamGames(teamId: string, season?: number) {
  const url = season
    ? `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule?season=${season}&seasontype=2`
    : `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/schedule`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  const data = (await res.json()) as { events?: any[] };

  return data.events ?? [];
}