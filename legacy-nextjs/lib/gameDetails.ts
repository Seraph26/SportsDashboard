import { teamConfig } from "@lib/teamConfig";

export type GameDetailsTeam = {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logo: string;
  score: string;
  record?: string;
  homeAway: "home" | "away";
  winner?: boolean;
};

export type GameDetailsStat = {
  label: string;
  homeValue: string;
  awayValue: string;
};

export type GameDetailsPlayerStatRow = {
  athleteId: string;
  athleteName: string;
  stats: string[];
};

export type GameDetailsPlayerStatGroup = {
  name: string;
  headers: string[];
  rows: GameDetailsPlayerStatRow[];
};

export type GameDetailsPlayerStatsTeam = {
  teamId: string;
  teamName: string;
  groups: GameDetailsPlayerStatGroup[];
};

export type GameDetailsScoringPlay = {
  period: string;
  clock: string;
  teamAbbreviation?: string;
  text: string;
  scoreValue?: string;
};

export type GameDetailsDrive = {
  title: string;
  plays: GameDetailsScoringPlay[];
};

export type GameDetailsPlay = {
  id: string;
  period: string;
  clock: string;
  teamAbbreviation?: string;
  text: string;
  homeScore?: string;
  awayScore?: string;
};

export type GameDetails = {
  gameId: string;
  sport: string;
  league: string;
  name: string;
  shortName: string;
  date: string;
  status: string;
  detail: string;
  venue?: string;
  attendance?: string;
  teams: {
    home: GameDetailsTeam;
    away: GameDetailsTeam;
  };
  teamStats: GameDetailsStat[];
  playerStats: GameDetailsPlayerStatsTeam[];
  scoringSummary: GameDetailsDrive[];
  plays: GameDetailsPlay[];
};

type LeagueSettings = {
  sport: string;
  league: string;
};

const leagueSettings = {
  nfl: {
    sport: "football",
    league: "nfl",
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

type TeamRecord = {
  summary?: string;
};

type BoxscoreTeamStat = {
  label?: string;
  name?: string;
  displayName?: string;
  displayValue?: string | number;
  value?: string | number;
};

type BoxscoreTeam = {
  team?: {
    id?: string | number;
  };
  statistics?: BoxscoreTeamStat[];
};

type BoxscorePlayerAthlete = {
  id?: string | number;
  displayName?: string;
  shortName?: string;
  fullName?: string;
};

type BoxscorePlayerRow = {
  athlete?: BoxscorePlayerAthlete;
  stats?: unknown[];
};

type BoxscorePlayerGroup = {
  name?: string;
  labels?: unknown[];
  athletes?: BoxscorePlayerRow[];
};

type BoxscorePlayerTeam = {
  team?: {
    id?: string | number;
    displayName?: string;
    shortDisplayName?: string;
  };
  statistics?: BoxscorePlayerGroup[];
};

function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function getTeamRecord(teamBlock: any): string | undefined {
  const records: TeamRecord[] = Array.isArray(teamBlock?.records) ? teamBlock.records : [];
  const summary = records.find((record: TeamRecord) => typeof record?.summary === "string")?.summary;
  return typeof summary === "string" ? summary : undefined;
}

function normalizeCompetitor(competitor: any): GameDetailsTeam {
  const team = competitor?.team ?? {};

  return {
    id: toText(team.id),
    name: toText(team.displayName, "Unknown Team"),
    shortName: toText(team.shortDisplayName || team.name || team.displayName, "Unknown Team"),
    abbreviation: toText(team.abbreviation),
    logo: toText(team.logo || team.logos?.[0]?.href),
    score: toText(competitor?.score, "0"),
    record: getTeamRecord(competitor),
    homeAway: competitor?.homeAway === "home" ? "home" : "away",
    winner: competitor?.winner === true,
  };
}

function normalizeTeamStats(boxscore: any, homeTeamId: string, awayTeamId: string): GameDetailsStat[] {
  const teams: BoxscoreTeam[] = Array.isArray(boxscore?.teams) ? boxscore.teams : [];
  const homeStats =
    teams.find((item: BoxscoreTeam) => toText(item?.team?.id) === homeTeamId)?.statistics ?? [];
  const awayStats =
    teams.find((item: BoxscoreTeam) => toText(item?.team?.id) === awayTeamId)?.statistics ?? [];

  const statMap = new Map<string, GameDetailsStat>();

  for (const stat of awayStats) {
    const label = toText(stat?.label || stat?.name || stat?.displayName);
    if (!label) continue;

    statMap.set(label, {
      label,
      awayValue: toText(stat?.displayValue || stat?.value, "—"),
      homeValue: "—",
    });
  }

  for (const stat of homeStats) {
    const label = toText(stat?.label || stat?.name || stat?.displayName);
    if (!label) continue;

    const existing = statMap.get(label);
    if (existing) {
      existing.homeValue = toText(stat?.displayValue || stat?.value, "—");
    } else {
      statMap.set(label, {
        label,
        awayValue: "—",
        homeValue: toText(stat?.displayValue || stat?.value, "—"),
      });
    }
  }

  return Array.from(statMap.values());
}

function normalizePlayerStats(boxscore: any): GameDetailsPlayerStatsTeam[] {
  const players: BoxscorePlayerTeam[] = Array.isArray(boxscore?.players) ? boxscore.players : [];

  return players.map((teamBlock: BoxscorePlayerTeam) => {
    const teamName =
      toText(teamBlock?.team?.displayName) ||
      toText(teamBlock?.team?.shortDisplayName) ||
      "Team";

    const groups: GameDetailsPlayerStatGroup[] = (Array.isArray(teamBlock?.statistics)
      ? teamBlock.statistics
      : []
    ).map((group: BoxscorePlayerGroup) => {
      const headers = Array.isArray(group?.labels)
        ? group.labels.map((label: unknown) => toText(label))
        : [];

      const rows: GameDetailsPlayerStatRow[] = (
        Array.isArray(group?.athletes) ? group.athletes : []
      ).map((athleteBlock: BoxscorePlayerRow) => ({
        athleteId: toText(athleteBlock?.athlete?.id),
        athleteName: toText(
          athleteBlock?.athlete?.displayName ||
            athleteBlock?.athlete?.shortName ||
            athleteBlock?.athlete?.fullName,
          "Unknown Player",
        ),
        stats: Array.isArray(athleteBlock?.stats)
          ? athleteBlock.stats.map((value: unknown) => toText(value, "—"))
          : [],
      }));

      return {
        name: toText(group?.name, "Stats"),
        headers,
        rows,
      };
    });

    return {
      teamId: toText(teamBlock?.team?.id),
      teamName,
      groups,
    };
  });
}

function normalizeScoringSummary(scoringPlays: any): GameDetailsDrive[] {
  const drives = Array.isArray(scoringPlays) ? scoringPlays : [];

  return drives.map((drive: any) => ({
    title: toText(drive?.headline || drive?.title || drive?.period?.displayValue || "Scoring"),
    plays: Array.isArray(drive?.plays)
      ? drive.plays.map((play: any) => ({
          period: toText(play?.period?.displayValue || play?.period?.number, "—"),
          clock: toText(play?.clock?.displayValue, "—"),
          teamAbbreviation: toText(play?.team?.abbreviation),
          text: toText(play?.text, "Scoring play"),
          scoreValue: toText(
            play?.awayScore != null && play?.homeScore != null
              ? `${play.awayScore}-${play.homeScore}`
              : "",
          ),
        }))
      : [],
  }));
}

function normalizePlays(playsRaw: any): GameDetailsPlay[] {
  const items = Array.isArray(playsRaw) ? playsRaw : [];

  return items.map((play: any, index: number) => ({
    id: toText(play?.id, String(index)),
    period: toText(play?.period?.displayValue || play?.period?.number, "—"),
    clock: toText(play?.clock?.displayValue, "—"),
    teamAbbreviation: toText(play?.team?.abbreviation),
    text: toText(play?.text, "Play"),
    homeScore: play?.homeScore != null ? toText(play.homeScore) : undefined,
    awayScore: play?.awayScore != null ? toText(play.awayScore) : undefined,
  }));
}

async function fetchJson(url: string, revalidateSeconds = 30): Promise<any | null> {
  try {
    const response = await fetch(url, {
      next: {
        revalidate: revalidateSeconds,
      },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function inferLeagueSettingsFromPayload(raw: any): LeagueSettings | null {
  const candidates = [
    raw?.leagues?.[0],
    raw?.header?.league,
    raw?.header?.sports?.[0],
    raw?.header?.competitions?.[0]?.league,
    raw?.gamepackageJSON?.header?.league,
    raw?.gamepackageJSON?.leagues?.[0],
  ];

  for (const candidate of candidates) {
    const sportSlug =
      candidate?.sport?.slug ??
      raw?.header?.sports?.[0]?.slug ??
      raw?.gamepackageJSON?.header?.sports?.[0]?.slug;

    const leagueSlug =
      candidate?.slug ??
      raw?.header?.league?.slug ??
      raw?.header?.competitions?.[0]?.league?.slug ??
      raw?.gamepackageJSON?.header?.league?.slug;

    if (typeof sportSlug === "string" && typeof leagueSlug === "string") {
      return {
        sport: sportSlug,
        league: leagueSlug,
      };
    }
  }

  return null;
}

function getCompetitionFromPayload(summaryRaw: any, gameRaw: any) {
  return (
    summaryRaw?.header?.competitions?.[0] ??
    summaryRaw?.competitions?.[0] ??
    gameRaw?.gamepackageJSON?.header?.competitions?.[0] ??
    gameRaw?.header?.competitions?.[0] ??
    null
  );
}

async function fetchSummaryByLeague(settings: LeagueSettings, gameId: string) {
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${settings.sport}/${settings.league}/summary?event=${gameId}`;
  return fetchJson(summaryUrl, 30);
}

async function fetchCoreByLeague(settings: LeagueSettings, gameId: string) {
  const gameUrl = `https://cdn.espn.com/core/${settings.league}/game?xhr=1&gameId=${gameId}`;
  const playByPlayUrl = `https://cdn.espn.com/core/${settings.league}/playbyplay?xhr=1&gameId=${gameId}`;

  const [gameRaw, playRaw] = await Promise.all([
    fetchJson(gameUrl, 30),
    fetchJson(playByPlayUrl, 30),
  ]);

  return {
    gameRaw,
    playRaw,
  };
}

async function fetchByKnownLeague(settings: LeagueSettings, gameId: string) {
  const [summaryRaw, core] = await Promise.all([
    fetchSummaryByLeague(settings, gameId),
    fetchCoreByLeague(settings, gameId),
  ]);

  return {
    summaryRaw,
    gameRaw: core.gameRaw,
    playRaw: core.playRaw,
    settings,
  };
}

function hasUsableCompetition(summaryRaw: any, gameRaw: any) {
  const competition = getCompetitionFromPayload(summaryRaw, gameRaw);
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
  return competitors.length >= 2;
}

export async function getGameDetails(
  gameId: string,
  knownLeague?: KnownLeague,
): Promise<GameDetails | null> {
  void teamConfig;

  const tried = new Set<string>();
  const orderedSettings: LeagueSettings[] = [];

  if (knownLeague && leagueSettings[knownLeague]) {
    orderedSettings.push(leagueSettings[knownLeague]);
  }

  for (const settings of Object.values(leagueSettings)) {
    const key = `${settings.sport}:${settings.league}`;
    if (tried.has(key)) continue;
    tried.add(key);
    orderedSettings.push(settings);
  }

  let summaryRaw: any | null = null;
  let gameRaw: any | null = null;
  let playRaw: any | null = null;
  let resolvedSettings: LeagueSettings | null = null;

  for (const settings of orderedSettings) {
    const attempt = await fetchByKnownLeague(settings, gameId);

    if (hasUsableCompetition(attempt.summaryRaw, attempt.gameRaw)) {
      summaryRaw = attempt.summaryRaw;
      gameRaw = attempt.gameRaw;
      playRaw = attempt.playRaw;
      resolvedSettings =
        inferLeagueSettingsFromPayload(attempt.summaryRaw) ||
        inferLeagueSettingsFromPayload(attempt.gameRaw) ||
        settings;
      break;
    }
  }

  if (!summaryRaw && !gameRaw) {
    return null;
  }

  const competition = getCompetitionFromPayload(summaryRaw, gameRaw);
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];

  if (competitors.length < 2) {
    return null;
  }

  const normalizedTeams: GameDetailsTeam[] = competitors.map((competitor: any) =>
    normalizeCompetitor(competitor),
  );

  const home = normalizedTeams.find((team: GameDetailsTeam) => team.homeAway === "home");
  const away = normalizedTeams.find((team: GameDetailsTeam) => team.homeAway === "away");

  if (!home || !away) {
    return null;
  }

  const boxscore =
    summaryRaw?.boxscore ??
    gameRaw?.gamepackageJSON?.boxscore ??
    gameRaw?.boxscore ??
    null;

  const scoringSummary =
    summaryRaw?.scoringPlays ??
    gameRaw?.gamepackageJSON?.scoringPlays ??
    [];

  const plays =
    summaryRaw?.plays ??
    playRaw?.gamepackageJSON?.plays ??
    gameRaw?.gamepackageJSON?.plays ??
    [];

  const venue =
    competition?.venue?.fullName ||
    competition?.venue?.address?.city ||
    gameRaw?.gamepackageJSON?.gameinfo?.venue?.fullName ||
    undefined;

  const attendance =
    gameRaw?.gamepackageJSON?.gameinfo?.attendance != null
      ? toText(gameRaw.gamepackageJSON.gameinfo.attendance)
      : undefined;

  const settings = resolvedSettings ?? {
    sport: "sports",
    league: "unknown",
  };

  return {
    gameId,
    sport: settings.sport,
    league: settings.league,
    name: toText(
      summaryRaw?.header?.competitions?.[0]?.name ||
        summaryRaw?.header?.headline ||
        competition?.name,
      "Game",
    ),
    shortName: toText(
      summaryRaw?.header?.competitions?.[0]?.shortName ||
        competition?.shortName,
      "Game",
    ),
    date: toText(competition?.date),
    status: toText(
      competition?.status?.type?.description ||
        competition?.status?.type?.name ||
        "Status Unknown",
    ),
    detail: toText(
      competition?.status?.type?.detail ||
        competition?.status?.type?.shortDetail ||
        "",
    ),
    venue,
    attendance,
    teams: {
      home,
      away,
    },
    teamStats: normalizeTeamStats(boxscore, home.id, away.id),
    playerStats: normalizePlayerStats(boxscore),
    scoringSummary: normalizeScoringSummary(scoringSummary),
    plays: normalizePlays(plays),
  };
}