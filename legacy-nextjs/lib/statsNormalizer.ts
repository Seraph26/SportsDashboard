import type { TeamConfig } from "@lib/teamConfig";

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

type RawStat = {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  value?: string | number | null;
  displayValue?: string | number | null;
};

type RawCategory = {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  stats?: RawStat[];
  labels?: string[];
  names?: string[];
  displayNames?: string[];
  abbreviations?: string[];
  athletes?: any[];
};

function titleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function humanizeStatLabel(stat: RawStat, fallbackKey: string) {
  return (
    stat.shortDisplayName ||
    stat.displayName ||
    stat.abbreviation ||
    stat.name ||
    titleCase(fallbackKey)
  );
}

function normalizeStatKey(stat: RawStat, index: number) {
  return (
    stat.name ||
    stat.abbreviation ||
    stat.shortDisplayName ||
    stat.displayName ||
    `stat_${index}`
  )
    .toString()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "")
    .toLowerCase();
}

function normalizeStatValue(stat: RawStat) {
  if (stat.displayValue !== undefined && stat.displayValue !== null) {
    return stat.displayValue;
  }
  if (stat.value !== undefined && stat.value !== null) {
    return stat.value;
  }
  return null;
}

function buildAggregateSection(category: RawCategory, index: number): StatsSection | null {
  const rawStats = Array.isArray(category.stats) ? category.stats : [];
  if (!rawStats.length) return null;

  const columns: StatsColumn[] = rawStats.map((stat, statIndex) => {
    const key = normalizeStatKey(stat, statIndex);
    return {
      key,
      label: humanizeStatLabel(stat, key),
      numeric: true,
      align: "right",
    };
  });

  const values: Record<string, string | number | null> = {};
  rawStats.forEach((stat, statIndex) => {
    const key = normalizeStatKey(stat, statIndex);
    values[key] = normalizeStatValue(stat);
  });

  const sectionTitle =
    category.displayName ||
    category.shortDisplayName ||
    category.name ||
    `Category ${index + 1}`;

  return {
    key: `aggregate_${sectionTitle.toLowerCase().replace(/\s+/g, "_")}_${index}`,
    title: titleCase(sectionTitle),
    columns,
    rows: [
      {
        playerId: `team_${index}`,
        playerName: "Team",
        values,
      },
    ],
  };
}

function buildAthleteSection(category: RawCategory, index: number): StatsSection | null {
  const athletes = Array.isArray(category.athletes) ? category.athletes : [];
  if (!athletes.length) return null;

  const rawStats = Array.isArray(category.stats) ? category.stats : [];
  const columns: StatsColumn[] = rawStats.map((stat, statIndex) => {
    const key = normalizeStatKey(stat, statIndex);
    return {
      key,
      label: humanizeStatLabel(stat, key),
      numeric: true,
      align: "right",
    };
  });

  const rows: StatsRow[] = athletes.map((athlete: any, athleteIndex: number) => {
    const athleteStats = Array.isArray(athlete.stats) ? athlete.stats : [];
    const values: Record<string, string | number | null> = {};

    columns.forEach((column, statIndex) => {
      const athleteStat = athleteStats[statIndex];
      values[column.key] =
        athleteStat?.displayValue ??
        athleteStat?.value ??
        null;
    });

    return {
      playerId:
        athlete?.athlete?.id?.toString() ||
        athlete?.id?.toString() ||
        `athlete_${index}_${athleteIndex}`,
      playerName:
        athlete?.athlete?.displayName ||
        athlete?.displayName ||
        "Unknown Player",
      jersey: athlete?.athlete?.jersey || athlete?.jersey,
      position:
        athlete?.athlete?.position?.abbreviation ||
        athlete?.position?.abbreviation ||
        athlete?.position,
      values,
    };
  });

  const sectionTitle =
    category.displayName ||
    category.shortDisplayName ||
    category.name ||
    `Category ${index + 1}`;

  return {
    key: `players_${sectionTitle.toLowerCase().replace(/\s+/g, "_")}_${index}`,
    title: titleCase(sectionTitle),
    columns,
    rows,
  };
}

export function normalizeTeamStats(
  payload: any,
  team: TeamConfig,
  season: number
): TeamStatsResult {
  const categories: RawCategory[] =
    payload?.results?.stats?.categories ||
    payload?.stats?.categories ||
    [];

  const sections: StatsSection[] = [];

  categories.forEach((category, index) => {
    const athleteSection = buildAthleteSection(category, index);
    if (athleteSection && athleteSection.rows.length > 0) {
      sections.push(athleteSection);
      return;
    }

    const aggregateSection = buildAggregateSection(category, index);
    if (aggregateSection && aggregateSection.rows.length > 0) {
      sections.push(aggregateSection);
    }
  });

  return {
    team,
    season,
    sections,
    hasStats: sections.some((section) => section.rows.length > 0),
  };
}