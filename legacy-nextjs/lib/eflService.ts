export async function getWrexhamGames(season?: number) {
  const url = season
    ? `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.4/teams/1052/schedule?season=${season}`
    : `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.4/teams/1052/schedule`;

  const res = await fetch(url, { cache: "no-store" });
  const data: any = await res.json();

  return data.events || [];
}