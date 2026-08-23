import { teamConfig, type TeamConfig } from "@lib/teamConfig";

export type StandingsRow = {
  rank: number;
  teamId: string;
  teamName: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  ties: number;
  percentage: string;
  gamesBack?: string;
  pointsFor?: number;
  pointsAgainst?: number;
};

export type StandingsGroup = {
  name: string;
  rows: StandingsRow[];
};

type LeagueSettings = {
  sport: string;
  league: string;
  group?: string;
};

const leagueSettings = {
  nfl: {
    sport: "football",
    league: "nfl",
    group: "9",
  },
  mlb: {
    sport: "baseball",
    league: "mlb",
  },
  soccer: {
    sport: "soccer",
    league: "eng.2",
  },
  ncaab: {
    sport: "basketball",
    league: "mens-college-basketball",
  },
} satisfies Record<string, LeagueSettings>;

type KnownLeague = keyof typeof leagueSettings;

type RawStat = {
  name?: string;
  shortDisplayName?: string;
  displayValue?: string;
  value?: number | string;
};

type RawStandingsEntry = {
  team?: {
    id?: string | number;
    displayName?: string;
    shortDisplayName?: string;
    name?: string;
    abbreviation?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
  stats?: RawStat[];
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toDisplayString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function getStatValue(
  stats: RawStat[] | undefined,
  names: string[],
): { value?: number | string; displayValue?: string } {
  if (!Array.isArray(stats)) return {};

  const found = stats.find((stat: RawStat) => {
    const statName = stat.name?.toLowerCase() ?? "";
    return names.some((name) => statName === name.toLowerCase());
  });

  if (!found) return {};

  return {
    value: found.value,
    displayValue: found.displayValue,
  };
}

function flattenStandingsEntries(node: unknown): RawStandingsEntry[] {
  if (!node || typeof node !== "object") return [];

  if (Array.isArray(node)) {
    return node.flatMap((item) => flattenStandingsEntries(item));
  }

  const record = node as Record<string, unknown>;

  if (record.team && typeof record.team === "object" && Array.isArray(record.stats)) {
    return [record as RawStandingsEntry];
  }

  const results: RawStandingsEntry[] = [];

  for (const value of Object.values(record)) {
    results.push(...flattenStandingsEntries(value));
  }

  return results;
}

function normalizeStandingsEntries(entries: RawStandingsEntry[]): StandingsRow[] {
  return entries
    .map((entry: RawStandingsEntry, index: number) => {
      const team = entry?.team ?? {};
      const stats = Array.isArray(entry?.stats) ? entry.stats : [];

      const wins = getStatValue(stats, ["wins", "win"]).value;
      const losses = getStatValue(stats, ["losses", "loss"]).value;
      const ties = getStatValue(stats, ["ties", "tie", "draws", "draw"]).value;
      const pct = getStatValue(stats, ["winpercent", "pointspercent", "percentage"]);
      const gamesBack = getStatValue(stats, ["gamesback", "gb"]).displayValue;
      const pointsFor = getStatValue(stats, ["pointsfor", "runsfor", "goalsfor", "points"]).value;
      const pointsAgainst = getStatValue(
        stats,
        ["pointsagainst", "runsagainst", "goalsagainst"],
      ).value;
      const rankStat = stats.find((s: RawStat) => s?.name === "rank");

      return {
        rank: toNumber(rankStat?.value, index + 1),
        teamId: String(team.id ?? ""),
        teamName: team.displayName ?? team.shortDisplayName ?? team.name ?? "Unknown Team",
        abbreviation: team.abbreviation ?? "",
        logo: team.logos?.[0]?.href ?? team.logo ?? "",
        wins: toNumber(wins),
        losses: toNumber(losses),
        ties: toNumber(ties),
        percentage: pct.displayValue ?? toDisplayString(pct.value, "0.000"),
        gamesBack: gamesBack || undefined,
        pointsFor: pointsFor !== undefined ? toNumber(pointsFor) : undefined,
        pointsAgainst: pointsAgainst !== undefined ? toNumber(pointsAgainst) : undefined,
      };
    })
    .filter((row: StandingsRow) => row.teamId.length > 0);
}

function extractStandingsGroups(raw: unknown): StandingsGroup[] {
  const record = (raw ?? {}) as Record<string, unknown>;
  const groups: StandingsGroup[] = [];

  const topChildren = Array.isArray((record as { children?: unknown }).children)
    ? ((record as { children?: unknown[] }).children ?? [])
    : [];

  for (const child of topChildren) {
    const childRecord = child as Record<string, unknown>;
    const childStandings = childRecord.standings as Record<string, unknown> | undefined;
    const entries = flattenStandingsEntries(childStandings?.entries);

    if (entries.length > 0) {
      groups.push({
        name:
          typeof childRecord.name === "string"
            ? childRecord.name
            : typeof childRecord.abbreviation === "string"
              ? childRecord.abbreviation
              : "Standings",
        rows: normalizeStandingsEntries(entries),
      });
    }
  }

  const standingsRecord = record.standings as Record<string, unknown> | undefined;
  const standingsChildren = Array.isArray(standingsRecord?.children)
    ? (standingsRecord.children as unknown[])
    : [];

  for (const child of standingsChildren) {
    const childRecord = child as Record<string, unknown>;
    const entries = flattenStandingsEntries(childRecord.entries);

    if (entries.length > 0) {
      groups.push({
        name:
          typeof childRecord.name === "string"
            ? childRecord.name
            : typeof childRecord.abbreviation === "string"
              ? childRecord.abbreviation
              : "Standings",
        rows: normalizeStandingsEntries(entries),
      });
    }
  }

  if (groups.length > 0) {
    return groups;
  }

  const entries = flattenStandingsEntries(standingsRecord?.entries ?? record.entries ?? record);
  if (entries.length > 0) {
    return [
      {
        name: "Standings",
        rows: normalizeStandingsEntries(entries),
      },
    ];
  }

  return [];
}

function filterToRelevantGroups(groups: StandingsGroup[], teamId: string): StandingsGroup[] {
  const matching = groups.filter((group) =>
    group.rows.some((row) => row.teamId === teamId),
  );

  return matching.length > 0 ? matching : groups;
}

function getTeamLeague(team: TeamConfig): KnownLeague | null {
  const league = (team as { league?: unknown }).league;
  if (typeof league === "string" && league in leagueSettings) {
    return league as KnownLeague;
  }
  return null;
}

export async function getStandings(
  team: TeamConfig,
  season?: number,
): Promise<StandingsGroup[]> {
  const knownLeague = getTeamLeague(team);
  if (!knownLeague) {
    return [];
  }

  const settings: LeagueSettings = leagueSettings[knownLeague];
  const params = new URLSearchParams();

  if (settings.group) {
    params.set("group", settings.group);
  }

  if (season) {
    params.set("season", String(season));
  }

  const query = params.toString();
  const url = `https://site.api.espn.com/apis/v2/sports/${settings.sport}/${settings.league}/standings${
    query ? `?${query}` : ""
  }`;

  try {
    const response = await fetch(url, {
      next: {
        revalidate: season ? 60 * 60 * 6 : 60 * 5,
      },
    });

    if (!response.ok) {
      return [];
    }

    const raw = await response.json();
    const groups = extractStandingsGroups(raw);
    return filterToRelevantGroups(groups, (team as { teamId?: string }).teamId ?? "");
  } catch {
    return [];
  }
}

export function isSupportedStandingsLeague(team: TeamConfig): boolean {
  return getTeamLeague(team) !== null;
}

export function getAllTeams(): TeamConfig[] {
  return Array.isArray(teamConfig) ? teamConfig : Object.values(teamConfig);
}