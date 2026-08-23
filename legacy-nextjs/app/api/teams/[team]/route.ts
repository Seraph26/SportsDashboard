import { NextResponse } from "next/server";
import {
  getAvailableSeasons,
  getTeamBySlug,
  getTeamGames,
  getTeamStandings,
} from "@lib/teamData";
import { getCurrentSeasonYearForTeam } from "@lib/seasonUtils";

type RouteContext = {
  params: Promise<{
    team: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { team: teamParam } = await context.params;
    const team = getTeamBySlug(teamParam);

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const seasonParam = searchParams.get("season");

    const parsedSeason = seasonParam ? Number(seasonParam) : NaN;
    const season =
      Number.isFinite(parsedSeason) && parsedSeason > 0
        ? parsedSeason
        : getCurrentSeasonYearForTeam(team);

    const [{ games, record }, standings, availableSeasons] = await Promise.all([
      getTeamGames(team, season),
      getTeamStandings(team, season),
      getAvailableSeasons(team, season),
    ]);

    return NextResponse.json({
      team: {
        slug: team.slug,
        name: team.name,
        sport: team.sport,
        espnTeamId: team.espnTeamId,
        logo: team.logo,
        website: team.website,
      },
      season,
      availableSeasons,
      games,
      record,
      standings,
    });
  } catch (error) {
    console.error("Failed to load team data:", error);

    return NextResponse.json(
      { error: "Failed to load team data" },
      { status: 500 },
    );
  }
}