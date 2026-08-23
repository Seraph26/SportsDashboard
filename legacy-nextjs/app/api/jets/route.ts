import { getNFLTeamGames } from "@lib/espnService";

export async function GET() {
  const { games, record } = await getNFLTeamGames("20");

  return Response.json({
    record,
    games: games.slice(0, 5),
  });
}