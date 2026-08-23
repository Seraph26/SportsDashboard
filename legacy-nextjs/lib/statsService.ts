import { type TeamConfig } from "@lib/teamConfig";

export type StatsColumn = {
  key: string;
  label: string;
  numeric?: boolean;
  align?: "left" | "right" | "center";
};

export type StatsRow = {
  playerId: string;
  playerName: string;
  jersey?: string;
  position?: string;
  values: Record<string, string | number | null>;
};

export type StatsSection = {
  key: string;
  title: string;
  columns: StatsColumn[];
  rows: StatsRow[];
};

export type TeamStatsResult = {
  team: TeamConfig;
  season: number;
  sections: StatsSection[];
  hasStats: boolean;
};

type ESPNLeagueConfig = {
  sport: string;
  league: string;
};

type KnownLeague = "nfl" | "mlb" | "ncaab" | "soccer";

type NormalizedRosterPlayer = {
  id: string;
  name: string;
  jersey?: string;
  position?: string;
};

type AthleteRowAccumulator = {
  playerId: string;
  playerName: string;
  jersey?: string;
  position?: string;
  values: Record<string, string | number | null>;
};

type GroupCandidate = {
  title: string;
  labels: string[];
  athletes: any[];
};

function getTeamLeague(team: TeamConfig): KnownLeague | null {
  const league = (team as { league?: unknown }).league;

  if (
    league === "nfl" ||
    league === "mlb" ||
    league === "ncaab" ||
    league === "soccer"
  ) {
    return league;
  }

  return null;
}

function getLeagueConfig(team: TeamConfig): ESPNLeagueConfig | null {
  const league = getTeamLeague(team);

  switch (league) {
    case "nfl":
      return {
        sport: "football",
        league: "nfl",
      };
    case "mlb":
      return {
        sport: "baseball",
        league: "mlb",
      };
    case "ncaab":
      return {
        sport: "basketball",
        league: "mens-college-basketball",
      };
    case "soccer":
      return {
        sport: "soccer",
        league: "eng.2",
      };
    default:
      return null;
  }
}

function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function toNullableValue(value: unknown): string | number | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function humanizeKey(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSeasonValue(team: TeamConfig, season?: number): number {
  if (typeof season === "number" && Number.isFinite(season)) {
    return season;
  }

  const teamSeason = (team as { season?: unknown }).season;
  if (typeof teamSeason === "number" && Number.isFinite(teamSeason)) {
    return teamSeason;
  }

  return new Date().getFullYear();
}

function normalizeRosterPlayer(raw: any): NormalizedRosterPlayer {
  const athlete = raw?.athlete ?? raw ?? {};

  return {
    id: toText(athlete?.id),
    name: toText(
      athlete?.displayName || athlete?.shortName || athlete?.fullName,
      "Unknown Player",
    ),
    jersey: toText(athlete?.jersey) || undefined,
    position: toText(
      athlete?.position?.abbreviation || athlete?.position?.displayName || athlete?.position?.name,
    ) || undefined,
  };
}

function buildColumnsFromLabels(labels: string[]): StatsColumn[] {
  return [
    {
      key: "playerName",
      label: "Player",
      align: "left",
    },
    ...labels.map((label, index) => ({
      key: `stat_${index}`,
      label: label || `Stat ${index + 1}`,
      align: "right" as const,
      numeric: false,
    })),
  ];
}

function normalizeGroup(
  group: GroupCandidate,
  fallbackKey: string,
): StatsSection | null {
  const labels = Array.isArray(group.labels)
    ? group.labels.map((label) => toText(label)).filter(Boolean)
    : [];

  const rows: StatsRow[] = Array.isArray(group.athletes)
    ? group.athletes.map((athleteBlock: any) => {
        const player = normalizeRosterPlayer(athleteBlock?.athlete);
        const rawStats = Array.isArray(athleteBlock?.stats) ? athleteBlock.stats : [];

        const values: Record<string, string | number | null> = {};
        rawStats.forEach((value: unknown, index: number) => {
          values[`stat_${index}`] = toNullableValue(value);
        });

        return {
          playerId: player.id || `${fallbackKey}-${player.name}`,
          playerName: player.name,
          jersey: player.jersey,
          position: player.position,
          values,
        };
      })
    : [];

  if (rows.length === 0) {
    return null;
  }

  return {
    key: fallbackKey,
    title: group.title || "Stats",
    columns: buildColumnsFromLabels(labels),
    rows,
  };
}

function extractStatisticGroups(raw: any): GroupCandidate[] {
  const boxscorePlayers = Array.isArray(raw?.players) ? raw.players : [];
  const groups: GroupCandidate[] = [];

  for (const teamBlock of boxscorePlayers) {
    const teamName = toText(
      teamBlock?.team?.displayName || teamBlock?.team?.shortDisplayName,
      "Team",
    );

    const statistics = Array.isArray(teamBlock?.statistics) ? teamBlock.statistics : [];
    for (const statGroup of statistics) {
      groups.push({
        title: `${teamName} ${toText(statGroup?.name, "Stats")}`.trim(),
        labels: Array.isArray(statGroup?.labels) ? statGroup.labels.map((x: unknown) => toText(x)) : [],
        athletes: Array.isArray(statGroup?.athletes) ? statGroup.athletes : [],
      });
    }
  }

  return groups;
}

async function fetchJson(url: string, revalidateSeconds = 300): Promise<any | null> {
  try {
    const response = await fetch(url, {
      next: {
        revalidate: revalidateSeconds,
      },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

function getTeamId(team: TeamConfig): string {
  const possible =
    (team as { teamId?: unknown }).teamId ??
    (team as { id?: unknown }).id;

  return toText(possible);
}

export async function getTeamStats(
  team: TeamConfig,
  season?: number,
): Promise<TeamStatsResult> {
  const leagueConfig = getLeagueConfig(team);
  const resolvedSeason = getSeasonValue(team, season);

  if (!leagueConfig) {
    return {
      team,
      season: resolvedSeason,
      sections: [],
      hasStats: false,
    };
  }

  const teamId = getTeamId(team);
  if (!teamId) {
    return {
      team,
      season: resolvedSeason,
      sections: [],
      hasStats: false,
    };
  }

  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${leagueConfig.sport}/${leagueConfig.league}/teams/${teamId}/statistics?season=${resolvedSeason}`;
  const coreUrl = `https://site.api.espn.com/apis/site/v2/sports/${leagueConfig.sport}/${leagueConfig.league}/teams/${teamId}/statistics`;

  const [summaryRaw, coreRaw] = await Promise.all([
    fetchJson(summaryUrl, 60 * 60 * 6),
    fetchJson(coreUrl, 60 * 60 * 6),
  ]);

  const raw = summaryRaw ?? coreRaw;

  if (!raw) {
    return {
      team,
      season: resolvedSeason,
      sections: [],
      hasStats: false,
    };
  }

  const sections: StatsSection[] = [];

  const athleteGroups = extractStatisticGroups(raw?.results ?? raw?.splits ?? raw?.athletes ?? raw?.boxscore ?? raw);
  athleteGroups.forEach((group, index) => {
    const section = normalizeGroup(group, `group_${index}`);
    if (section) {
      sections.push(section);
    }
  });

  const splitCategories = Array.isArray(raw?.splits?.categories) ? raw.splits.categories : [];
  for (let i = 0; i < splitCategories.length; i += 1) {
    const category = splitCategories[i];
    const stats = Array.isArray(category?.stats) ? category.stats : [];
    if (stats.length === 0) continue;

    const rowValues: Record<string, string | number | null> = {};
    const columns: StatsColumn[] = [
      {
        key: "playerName",
        label: "Category",
        align: "left",
      },
    ];

    stats.forEach((stat: any, statIndex: number) => {
      const key = `stat_${statIndex}`;
      columns.push({
        key,
        label: toText(stat?.displayName || stat?.name, humanizeKey(key)),
        align: "right",
      });
      rowValues[key] = toNullableValue(stat?.displayValue ?? stat?.value);
    });

    sections.push({
      key: `category_${i}`,
      title: toText(category?.displayName || category?.name, "Team Stats"),
      columns,
      rows: [
        {
          playerId: `category_${i}`,
          playerName: toText(category?.displayName || category?.name, "Totals"),
          values: rowValues,
        },
      ],
    });
  }

  return {
    team,
    season: resolvedSeason,
    sections,
    hasStats: sections.length > 0,
  };
}