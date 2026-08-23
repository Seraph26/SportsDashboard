import {
  getMLBStandings,
  getMLBTeamGames,
  getNCAABStandings,
  getNCAABTeamGames,
  getNFLStandings,
  getNFLTeamGames,
  getSoccerStandings,
  getSoccerTeamGames,
  type TeamGame,
  type TeamRecordSummary,
  type TeamStandings,
} from "@lib/espnService";
import { teamConfig, type TeamConfig } from "@lib/teamConfig";
import { getCurrentSeasonYearForTeam, getSeasonLinksForTeam } from "@lib/seasonUtils";

export type TeamSeasonData = {
  team: TeamConfig;
  season: number;
  games: TeamGame[];
  record: TeamRecordSummary | null;
  standings: TeamStandings[];
  availableSeasons: number[];
};

export function getAllTeams(): TeamConfig[] {
  return teamConfig;
}

export function getTeamBySlug(slug: string): TeamConfig | undefined {
  return teamConfig.find((team) => team.slug === slug);
}

export async function getTeamGames(team: TeamConfig, season?: number) {
  switch (team.sport) {
    case "nfl":
      return getNFLTeamGames(team.espnTeamId, season);
    case "mlb":
      return getMLBTeamGames(team.espnTeamId, season);
    case "ncaab":
      return getNCAABTeamGames(team.espnTeamId, season);
    case "soccer":
      return getSoccerTeamGames(team.espnTeamId, season);
    default:
      return { games: [], record: null };
  }
}

export async function getTeamStandings(team: TeamConfig, season?: number) {
  switch (team.sport) {
    case "nfl":
      return getNFLStandings(season);
    case "mlb":
      return getMLBStandings(season);
    case "ncaab":
      return getNCAABStandings(season);
    case "soccer":
      return getSoccerStandings(season);
    default:
      return [];
  }
}

function getSportLeaguePath(team: TeamConfig): { sport: string; league: string } {
  switch (team.sport) {
    case "nfl":
      return { sport: "football", league: "nfl" };
    case "mlb":
      return { sport: "baseball", league: "mlb" };
    case "ncaab":
      return { sport: "basketball", league: "mens-college-basketball" };
    case "soccer":
      return { sport: "soccer", league: "eng.2" };
    default:
      return { sport: "football", league: "nfl" };
  }
}

async function getStrictSeasonGameCount(team: TeamConfig, season: number): Promise<number> {
  const { sport, league } = getSportLeaguePath(team);
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${team.espnTeamId}/schedule?season=${season}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return 0;

    const data = (await res.json()) as {
      events?: Array<{ id?: string }>;
    };

    return data.events?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function getAvailableSeasons(team: TeamConfig, selectedSeason?: number): Promise<number[]> {
  const currentSeason = getCurrentSeasonYearForTeam(team);
  const candidateSeasons = getSeasonLinksForTeam(team, selectedSeason ?? currentSeason, 8);

  const counts = await Promise.all(
    candidateSeasons.map(async (season) => ({
      season,
      count: await getStrictSeasonGameCount(team, season),
    })),
  );

  return counts
    .filter((entry) => entry.count > 0)
    .map((entry) => entry.season)
    .sort((a, b) => b - a);
}

export async function getTeamSeasonData(
  team: TeamConfig,
  season: number,
): Promise<TeamSeasonData> {
  const [{ games, record }, standings, availableSeasons] = await Promise.all([
    getTeamGames(team, season),
    getTeamStandings(team, season),
    getAvailableSeasons(team, season),
  ]);

  return {
    team,
    season,
    games,
    record,
    standings,
    availableSeasons,
  };
}