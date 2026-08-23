export async function getNCAABTeamGames(teamId: string, season?: number) {
  const url = season
    ? `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${teamId}/schedule?season=${season}`
    : `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${teamId}/schedule`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  const data = (await res.json()) as { events?: any[] };

  return data.events ?? [];
}