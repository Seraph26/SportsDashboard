import type { TeamConfig } from "@lib/teamConfig";

export function getCurrentSeasonYearForSport(sport: TeamConfig["sport"], now = new Date()): number {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan, 11 = Dec

  switch (sport) {
    case "nfl":
      // NFL season starts in late summer / early fall.
      // Jan-Jul still belong to the previous season.
      return month >= 7 ? year : year - 1;

    case "ncaab":
      // College basketball season starts in Nov.
      // Jan-Oct still belong to the previous season.
      return month >= 10 ? year : year - 1;

    case "soccer":
      // European soccer season generally starts in Aug.
      // Jan-Jul still belong to the previous season.
      return month >= 7 ? year : year - 1;

    case "mlb":
      // MLB season is effectively tied to the calendar year.
      return year;

    default:
      return year;
  }
}

export function getCurrentSeasonYearForTeam(team: TeamConfig, now = new Date()): number {
  return getCurrentSeasonYearForSport(team.sport, now);
}

export function getSeasonLinksForTeam(team: TeamConfig, selectedSeason: number, count = 8): number[] {
  const currentSeason = getCurrentSeasonYearForTeam(team);
  const startSeason = Math.max(currentSeason, selectedSeason);

  return Array.from({ length: count }, (_, index) => startSeason - index);
}