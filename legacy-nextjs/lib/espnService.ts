type ESPNCompetitor = {
  id?: string;
  homeAway?: "home" | "away";
  winner?: boolean;
  score?:
    | string
    | number
    | {
        value?: string | number;
        displayValue?: string | number;
      };
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
  records?: Array<{
    name?: string;
    summary?: string;
  }>;
};

type ESPNCompetition = {
  id?: string;
  date?: string;
  status?: {
    type?: {
      completed?: boolean;
      detail?: string;
      shortDetail?: string;
      state?: string;
    };
  };
  competitors?: ESPNCompetitor[];
  venue?: {
    fullName?: string;
    address?: {
      city?: string;
      state?: string;
    };
  };
  broadcasts?: Array<{
    names?: string[];
  }>;
};

type ESPNEvent = {
  id: string;
  date: string;
  name?: string;
  shortName?: string;
  season?: {
    year?: number;
    type?: number;
  };
  competitions?: ESPNCompetition[];
};

export type TeamGame = {
  id: string;
  date: string;
  opponent: string;
  opponentAbbreviation: string;
  opponentLogo?: string;
  homeAway: "home" | "away";
  teamScore: number | null;
  opponentScore: number | null;
  result: "W" | "L" | "T" | "Upcoming";
  status: string;
  displayName: string;
  venue?: string;
  isLive: boolean;
  isCompleted: boolean;
};

export type TeamRecordSummary = {
  wins: number;
  losses: number;
  ties: number;
  summary: string;
};

export type StandingsRow = {
  teamId: string;
  name: string;
  abbreviation: string;
  logo?: string;
  wins: number;
  losses: number;
  ties: number;
  pct: string;
  gamesBack?: string;
  pointsFor?: string;
  pointsAgainst?: string;
};

export type TeamStandings = {
  groupName: string;
  rows: StandingsRow[];
};

type ESPNStandingsStat = {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  description?: string;
  abbreviation?: string;
  type?: string;
  value?: number | string;
  displayValue?: string;
};

type ESPNStandingsEntry = {
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    logos?: Array<{ href?: string }>;
    logo?: string;
  };
  stats?: ESPNStandingsStat[];
};

type ESPNStandingsGroup = {
  name?: string;
  abbreviation?: string;
  standings?: {
    entries?: ESPNStandingsEntry[];
  };
};

type ESPNStandingsResponse = {
  children?: ESPNStandingsGroup[];
  standings?: {
    entries?: ESPNStandingsEntry[];
  };
};

type ESPNSummaryCompetitor = {
  id?: string;
  homeAway?: "home" | "away";
  winner?: boolean;
  score?: string | number;
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
  records?: Array<{
    summary?: string;
  }>;
};

type ESPNLeaderAthlete = {
  athlete?: {
    id?: string;
    displayName?: string;
    shortName?: string;
  };
  displayValue?: string;
  value?: number | string;
};

type ESPNSummaryPersonRef = {
  athlete?: {
    id?: string;
    displayName?: string;
    shortName?: string;
  };
  displayName?: string;
  shortName?: string;
  fullName?: string;
  name?: string;
};

type ESPNSummaryPlayRef = {
  id?: string;
  text?: string;
  shortText?: string;
  type?: {
    id?: string | number;
    text?: string;
    name?: string;
    abbreviation?: string;
  };
  typeId?: string | number;
  typeText?: string;
  awayScore?: number;
  homeScore?: number;
  period?: {
    number?: number;
    displayValue?: string;
  };
  clock?: {
    displayValue?: string;
  };
  time?: {
    displayValue?: string;
  };
  minute?: number | string;
  scoringPlay?: boolean;
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
  athletes?: ESPNSummaryPersonRef[];
  participants?: ESPNSummaryPersonRef[];
  player?: ESPNSummaryPersonRef;
};

type ESPNSummaryResponse = {
  header?: {
    competitions?: ESPNCompetition[];
  };
  boxscore?: {
    teams?: Array<{
      team?: {
        id?: string;
        abbreviation?: string;
        displayName?: string;
        shortDisplayName?: string;
        logo?: string;
        logos?: Array<{ href?: string }>;
      };
      statistics?: Array<{
        name?: string;
        label?: string;
        displayValue?: string;
      }>;
    }>;
    players?: Array<{
      team?: {
        id?: string;
        abbreviation?: string;
        displayName?: string;
        shortDisplayName?: string;
        logo?: string;
        logos?: Array<{ href?: string }>;
      };
      statistics?: Array<{
        name?: string;
        keys?: string[];
        labels?: string[];
        athletes?: Array<{
          athlete?: {
            id?: string;
            displayName?: string;
            shortName?: string;
          };
          stats?: Array<string | number | null>;
        }>;
      }>;
    }>;
    form?: Array<{
      displayOrder?: number;
      team?: {
        id?: string;
        abbreviation?: string;
        displayName?: string;
        shortDisplayName?: string;
        logo?: string;
        logos?: Array<{ href?: string }>;
      };
      items?: Array<{
        label?: string;
        displayValue?: string;
        value?: string | number;
      }>;
    }>;
  };
  leaders?: Array<{
    team?: {
      id?: string;
      abbreviation?: string;
      displayName?: string;
      shortDisplayName?: string;
      logo?: string;
      logos?: Array<{ href?: string }>;
    };
    leaders?: Array<{
      name?: string;
      displayName?: string;
      shortDisplayName?: string;
      abbreviation?: string;
      leaders?: ESPNLeaderAthlete[];
    }>;
  }>;
  scoringPlays?: Array<ESPNSummaryPlayRef>;
  plays?: Array<ESPNSummaryPlayRef>;
  keyEvents?: Array<ESPNSummaryPlayRef>;
  commentary?: Array<ESPNSummaryPlayRef>;
  drives?: {
    previous?: Array<{
      id?: string;
      description?: string;
      offensivePlays?: number;
      yards?: number;
      result?: string;
      team?: {
        id?: string;
        abbreviation?: string;
        displayName?: string;
        logo?: string;
        logos?: Array<{ href?: string }>;
      };
      end?: {
        period?: {
          number?: number;
          displayValue?: string;
        };
        clock?: {
          displayValue?: string;
        };
      };
      plays?: Array<ESPNSummaryPlayRef>;
    }>;
  };
};

type ScoreboardResponse = {
  events?: ESPNEvent[];
};

export type GameTeamSummary = {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  homeAway: "home" | "away";
  score: string;
  record?: string;
};

export type GameStatLine = {
  label: string;
  value: string;
};

export type GameTeamStatSection = {
  team: GameTeamSummary;
  stats: GameStatLine[];
};

export type GamePlayerStatSection = {
  team: GameTeamSummary;
  groups: Array<{
    title: string;
    labels: string[];
    rows: Array<{
      athlete: string;
      values: string[];
    }>;
  }>;
};

export type GamePlayItem = {
  id: string;
  text: string;
  period?: string;
  clock?: string;
  awayScore?: string;
  homeScore?: string;
  teamAbbreviation?: string;
  teamLogo?: string;
  isScoringPlay?: boolean;
};

export type GameDetailResult = {
  id: string;
  date: string;
  status: string;
  isLive: boolean;
  isCompleted: boolean;
  venue?: string;
  broadcast?: string;
  teams: GameTeamSummary[];
  teamStats: GameTeamStatSection[];
  playerStats: GamePlayerStatSection[];
  scoringPlays: GamePlayItem[];
  playByPlay: GamePlayItem[];
};

const ESPN_SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_STANDINGS_BASE = "https://site.api.espn.com/apis/v2/sports";

async function fetchJson<T>(url: string, revalidate = 3600): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate },
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getCompetitorLogo(competitor: ESPNCompetitor | undefined): string | undefined {
  return competitor?.team?.logo || competitor?.team?.logos?.[0]?.href || undefined;
}

function parseSafeNumber(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (
      trimmed === "" ||
      trimmed === "-" ||
      trimmed.toLowerCase() === "nan" ||
      trimmed.toLowerCase() === "null" ||
      trimmed.toLowerCase() === "undefined"
    ) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === "object") {
    const maybeObject = value as {
      value?: unknown;
      displayValue?: unknown;
    };

    const fromValue = parseSafeNumber(maybeObject.value);
    if (fromValue != null) return fromValue;

    const fromDisplayValue = parseSafeNumber(maybeObject.displayValue);
    if (fromDisplayValue != null) return fromDisplayValue;
  }

  return null;
}

function parseCompetitorScore(competitor: ESPNCompetitor | undefined): number | null {
  if (!competitor) return null;
  return parseSafeNumber(competitor.score);
}

function parseRecordSummary(summary?: string): TeamRecordSummary {
  if (!summary) {
    return {
      wins: 0,
      losses: 0,
      ties: 0,
      summary: "0-0",
    };
  }

  const parts = summary.split("-").map((part) => Number(part.trim()));
  const wins = Number.isFinite(parts[0]) ? parts[0] : 0;
  const losses = Number.isFinite(parts[1]) ? parts[1] : 0;
  const ties = Number.isFinite(parts[2]) ? parts[2] : 0;

  return {
    wins,
    losses,
    ties,
    summary: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
  };
}

function inferPct(wins: number, losses: number, ties: number): string {
  const total = wins + losses + ties;
  if (total === 0) return ".000";

  const pct = (wins + ties * 0.5) / total;
  return pct.toFixed(3).replace(/^0/, "");
}

function matchesTeamIdentifier(competitor: ESPNCompetitor, teamId: string): boolean {
  const normalizedTeamId = teamId.toLowerCase().trim();
  const competitorId = competitor.id?.toLowerCase().trim();
  const teamIdentifier = competitor.team?.id?.toLowerCase().trim();
  const abbreviation = competitor.team?.abbreviation?.toLowerCase().trim();

  return (
    competitorId === normalizedTeamId ||
    teamIdentifier === normalizedTeamId ||
    abbreviation === normalizedTeamId
  );
}

function eventIncludesTeam(event: ESPNEvent, teamId: string): boolean {
  return (event.competitions?.[0]?.competitors ?? []).some((competitor) =>
    matchesTeamIdentifier(competitor, teamId),
  );
}

function isCompetitionLive(competition: ESPNCompetition | undefined): boolean {
  const state = competition?.status?.type?.state?.toLowerCase();
  const shortDetail = competition?.status?.type?.shortDetail?.toLowerCase() || "";
  const detail = competition?.status?.type?.detail?.toLowerCase() || "";

  return (
    state === "in" ||
    shortDetail.includes("live") ||
    detail.includes("live") ||
    shortDetail.includes("quarter") ||
    shortDetail.includes("half") ||
    shortDetail.includes("inning") ||
    shortDetail.includes("period") ||
    shortDetail.includes("top ") ||
    shortDetail.includes("bot ") ||
    shortDetail.includes("bottom ") ||
    shortDetail.includes("mid ")
  );
}

function mapEventToTeamGame(event: ESPNEvent, teamId: string): TeamGame | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];

  const team = competitors.find((c) => matchesTeamIdentifier(c, teamId));
  const opponent = competitors.find((c) => c !== team);

  if (!team || !opponent) return null;

  const isCompleted =
    competition?.status?.type?.completed === true ||
    competition?.status?.type?.state === "post";

  const isLive = !isCompleted && isCompetitionLive(competition);

  const teamScore = parseCompetitorScore(team);
  const opponentScore = parseCompetitorScore(opponent);

  let result: TeamGame["result"] = "Upcoming";

  if (isCompleted) {
    if (teamScore != null && opponentScore != null) {
      if (teamScore > opponentScore) result = "W";
      else if (teamScore < opponentScore) result = "L";
      else result = "T";
    } else if (team.winner === true) {
      result = "W";
    } else if (opponent.winner === true) {
      result = "L";
    } else {
      result = "T";
    }
  }

  return {
    id: event.id,
    date: event.date,
    opponent:
      opponent.team?.displayName ||
      opponent.team?.shortDisplayName ||
      "Unknown Opponent",
    opponentAbbreviation: opponent.team?.abbreviation || "UNK",
    opponentLogo: getCompetitorLogo(opponent),
    homeAway: team.homeAway || "home",
    teamScore,
    opponentScore,
    result,
    status:
      competition?.status?.type?.shortDetail ||
      competition?.status?.type?.detail ||
      "Scheduled",
    displayName: event.name || event.shortName || "Game",
    venue: competition?.venue?.fullName,
    isLive,
    isCompleted,
  };
}

function sortGamesDescending(games: TeamGame[]): TeamGame[] {
  return [...games].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;

    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return bTime - aTime;
  });
}

function getCurrentSeasonYearForSport(
  sport: "nfl" | "mlb" | "ncaab" | "soccer",
  now = new Date(),
): number {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (sport) {
    case "nfl":
      return month >= 7 ? year : year - 1;
    case "ncaab":
      return month >= 10 ? year : year - 1;
    case "soccer":
      return month >= 7 ? year : year - 1;
    case "mlb":
    default:
      return year;
  }
}

function getSportCodeForCurrentSeason(
  sport: string,
  league: string,
): "nfl" | "mlb" | "ncaab" | "soccer" {
  if (sport === "football" && league === "nfl") return "nfl";
  if (sport === "baseball" && league === "mlb") return "mlb";
  if (sport === "basketball" && league === "mens-college-basketball") return "ncaab";
  return "soccer";
}

function dedupeEvents(events: ESPNEvent[]): ESPNEvent[] {
  const seen = new Set<string>();
  const result: ESPNEvent[] = [];

  for (const event of events) {
    const key = event.id || `${event.date}-${event.shortName || event.name || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(event);
  }

  return result;
}

function formatEspnDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

async function fetchScheduleResponse(
  sport: string,
  league: string,
  teamId: string,
  season?: number,
) {
  const seasonParam = season ? `?season=${season}` : "";
  const url = `${ESPN_SITE_BASE}/${sport}/${league}/teams/${teamId}/schedule${seasonParam}`;

  type ScheduleResponse = {
    events?: ESPNEvent[];
    team?: {
      record?: {
        items?: Array<{
          summary?: string;
        }>;
      };
    };
  };

  const currentYear = new Date().getFullYear();
  const revalidate = season == null || season >= currentYear - 1 ? 30 : 3600;

  const data = await fetchJson<ScheduleResponse>(url, revalidate);
  return { data, url };
}

async function fetchScoreboardEventsForDate(
  sport: string,
  league: string,
  teamId: string,
  date: Date,
): Promise<ESPNEvent[]> {
  const dateStr = formatEspnDate(date);
  const url = `${ESPN_SITE_BASE}/${sport}/${league}/scoreboard?dates=${dateStr}`;
  const data = await fetchJson<ScoreboardResponse>(url, 30);

  return (data?.events ?? []).filter((event) => eventIncludesTeam(event, teamId));
}

async function fetchCurrentSeasonScoreboardEvents(
  sport: string,
  league: string,
  teamId: string,
): Promise<ESPNEvent[]> {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 10);

  const totalDays = 160;
  const events: ESPNEvent[] = [];

  for (let offset = 0; offset <= totalDays; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);

    const dayEvents = await fetchScoreboardEventsForDate(sport, league, teamId, day);
    if (dayEvents.length > 0) {
      events.push(...dayEvents);
    }
  }

  return dedupeEvents(events);
}

async function getTeamGamesBySport(
  sport: string,
  league: string,
  teamId: string,
  season?: number,
): Promise<{ games: TeamGame[]; record: TeamRecordSummary | null }> {
  const primary = await fetchScheduleResponse(sport, league, teamId, season);
  const fallback = await fetchScheduleResponse(sport, league, teamId);

  const sportCode = getSportCodeForCurrentSeason(sport, league);
  const currentSeason = getCurrentSeasonYearForSport(sportCode);
  const treatAsCurrentSeason = season == null || season === currentSeason;

  let scoreboardEvents: ESPNEvent[] = [];
  if (treatAsCurrentSeason) {
    scoreboardEvents = await fetchCurrentSeasonScoreboardEvents(sport, league, teamId);
  }

  const mergedEvents = dedupeEvents([
    ...(primary.data?.events ?? []),
    ...(fallback.data?.events ?? []),
    ...scoreboardEvents,
  ]);

  const games = sortGamesDescending(
    mergedEvents
      .map((event) => mapEventToTeamGame(event, teamId))
      .filter((game): game is TeamGame => game !== null),
  );

  const summary =
    primary.data?.team?.record?.items?.[0]?.summary ||
    fallback.data?.team?.record?.items?.[0]?.summary;

  const record = summary ? parseRecordSummary(summary) : null;

  return { games, record };
}

function statAliases(input: string[]): string[] {
  return input.map((value) => value.toLowerCase().replace(/[^a-z0-9]/g, ""));
}

function getStatDisplayValue(
  stats: ESPNStandingsStat[] | undefined,
  names: string[],
): string | undefined {
  if (!stats?.length) return undefined;

  const normalizedTargets = statAliases(names);

  const match = stats.find((stat) => {
    const candidates = [
      stat.name,
      stat.displayName,
      stat.shortDisplayName,
      stat.description,
      stat.abbreviation,
      stat.type,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, ""));

    return candidates.some((candidate) => normalizedTargets.includes(candidate));
  });

  if (!match) return undefined;

  if (match.displayValue != null && match.displayValue !== "") {
    return match.displayValue;
  }

  if (match.value != null && String(match.value) !== "") {
    return String(match.value);
  }

  return undefined;
}

function getStatNumber(stats: ESPNStandingsStat[] | undefined, names: string[]): number {
  const value = getStatDisplayValue(stats, names);
  const parsed = parseSafeNumber(value);
  return parsed ?? 0;
}

function mapStandingsEntries(entries: ESPNStandingsEntry[] | undefined): StandingsRow[] {
  if (!entries?.length) return [];

  return entries
    .map((entry) => {
      const wins = getStatNumber(entry.stats, ["wins", "win", "w"]);
      const losses = getStatNumber(entry.stats, ["losses", "loss", "l"]);
      const ties = getStatNumber(entry.stats, ["ties", "tie", "draws", "draw", "t", "d"]);

      return {
        teamId: entry.team?.id || "",
        name:
          entry.team?.displayName ||
          entry.team?.shortDisplayName ||
          "Unknown Team",
        abbreviation: entry.team?.abbreviation || "UNK",
        logo: entry.team?.logo || entry.team?.logos?.[0]?.href || undefined,
        wins,
        losses,
        ties,
        pct:
          getStatDisplayValue(entry.stats, [
            "winPercent",
            "winPercentage",
            "pointsPercent",
            "percentage",
            "pct",
          ]) || inferPct(wins, losses, ties),
        gamesBack: getStatDisplayValue(entry.stats, [
          "gamesBack",
          "gb",
          "pointsBehind",
          "ptsBehind",
        ]),
        pointsFor: getStatDisplayValue(entry.stats, [
          "pointsFor",
          "pf",
          "runsFor",
          "goalsFor",
          "points scored",
        ]),
        pointsAgainst: getStatDisplayValue(entry.stats, [
          "pointsAgainst",
          "pa",
          "runsAgainst",
          "goalsAgainst",
          "points allowed",
        ]),
      };
    })
    .filter((row) => row.teamId);
}

async function getStandingsBySport(
  sport: string,
  league: string,
  season?: number,
): Promise<TeamStandings[]> {
  const params = new URLSearchParams();
  if (season) {
    params.set("season", String(season));
  }

  const url = `${ESPN_STANDINGS_BASE}/${sport}/${league}/standings${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const data = await fetchJson<ESPNStandingsResponse>(url);
  if (!data) return [];

  if (data.children?.length) {
    const groups = data.children
      .map((child) => ({
        groupName: child.name || child.abbreviation || "Standings",
        rows: mapStandingsEntries(child.standings?.entries),
      }))
      .filter((group) => group.rows.length > 0);

    if (groups.length > 0) {
      return groups;
    }
  }

  const rows = mapStandingsEntries(data.standings?.entries);
  if (!rows.length) return [];

  return [
    {
      groupName: "Standings",
      rows,
    },
  ];
}

function normalizeGameTeam(
  competitor: ESPNSummaryCompetitor | undefined,
): GameTeamSummary | null {
  if (!competitor?.team) return null;

  return {
    id: competitor.team.id || "",
    name:
      competitor.team.displayName ||
      competitor.team.shortDisplayName ||
      "Unknown Team",
    abbreviation: competitor.team.abbreviation || "UNK",
    logo: competitor.team.logo || competitor.team.logos?.[0]?.href || undefined,
    homeAway: competitor.homeAway || "home",
    score: competitor.score != null ? String(competitor.score) : "—",
    record: competitor.records?.[0]?.summary,
  };
}

function normalizePlayItem(play: ESPNSummaryPlayRef): GamePlayItem {
  const clock =
    play.clock?.displayValue ||
    play.time?.displayValue ||
    (play.minute != null ? `${play.minute}'` : undefined);

  return {
    id:
      play.id ||
      `${play.text || play.shortText || "play"}-${clock || ""}-${play.period?.number || ""}`,
    text: play.text || play.shortText || "No description available.",
    period:
      play.period?.displayValue ||
      (play.period?.number != null ? `P${play.period.number}` : undefined),
    clock,
    awayScore:
      play.awayScore != null && Number.isFinite(play.awayScore)
        ? String(play.awayScore)
        : undefined,
    homeScore:
      play.homeScore != null && Number.isFinite(play.homeScore)
        ? String(play.homeScore)
        : undefined,
    teamAbbreviation: play.team?.abbreviation,
    teamLogo: play.team?.logo || play.team?.logos?.[0]?.href || undefined,
    isScoringPlay: isSoccerScoringEvent(play),
  };
}

function dedupePlays(plays: GamePlayItem[]): GamePlayItem[] {
  const seen = new Set<string>();
  const result: GamePlayItem[] = [];

  for (const play of plays) {
    const key = `${play.id}|${play.text}|${play.clock}|${play.period}|${play.teamAbbreviation}|${play.awayScore}|${play.homeScore}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(play);
  }

  return result;
}

function buildLeaderFallbackPlayerStats(
  leaders: ESPNSummaryResponse["leaders"] | undefined,
  teams: GameTeamSummary[],
): GamePlayerStatSection[] {
  if (!leaders?.length) return [];

  return leaders
    .map((leaderBlock) => {
      const teamSummary =
        teams.find((team) => team.id === leaderBlock.team?.id) || {
          id: leaderBlock.team?.id || "",
          name:
            leaderBlock.team?.displayName ||
            leaderBlock.team?.shortDisplayName ||
            "Unknown Team",
          abbreviation: leaderBlock.team?.abbreviation || "UNK",
          logo: leaderBlock.team?.logo || leaderBlock.team?.logos?.[0]?.href || undefined,
          homeAway: "home" as const,
          score: "—",
          record: undefined,
        };

      const groups =
        leaderBlock.leaders
          ?.map((leaderGroup) => {
            const rows =
              leaderGroup.leaders?.map((leader, rowIndex) => ({
                athlete:
                  leader.athlete?.displayName ||
                  leader.athlete?.shortName ||
                  `Player ${rowIndex + 1}`,
                values: [leader.displayValue || String(leader.value ?? "—")],
              })) ?? [];

            return {
              title:
                leaderGroup.displayName ||
                leaderGroup.shortDisplayName ||
                leaderGroup.name ||
                leaderGroup.abbreviation ||
                "Leaders",
              labels: ["Stat"],
              rows,
            };
          })
          .filter((group) => group.rows.length > 0) ?? [];

      return {
        team: teamSummary,
        groups,
      };
    })
    .filter((section) => section.groups.length > 0);
}

function isSoccerScoringEvent(play: ESPNSummaryPlayRef): boolean {
  const text = `${play.text || ""} ${play.shortText || ""}`.toLowerCase();
  const typeText = `${play.type?.text || ""} ${play.type?.name || ""} ${play.typeText || ""}`.toLowerCase();

  return (
    play.scoringPlay === true ||
    text.includes("goal") ||
    text.includes("penalty scored") ||
    text.includes("own goal") ||
    typeText.includes("goal")
  );
}

function getPlayPeople(play: ESPNSummaryPlayRef): string[] {
  const refs = [
    ...(play.athletes ?? []),
    ...(play.participants ?? []),
    ...(play.player ? [play.player] : []),
  ];

  const names = refs
    .map(
      (ref) =>
        ref.athlete?.displayName ||
        ref.athlete?.shortName ||
        ref.displayName ||
        ref.shortName ||
        ref.fullName ||
        ref.name,
    )
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(names));
}

function buildSoccerEventFallbackPlayerStats(
  sourcePlays: ESPNSummaryPlayRef[],
  teams: GameTeamSummary[],
): GamePlayerStatSection[] {
  if (!sourcePlays.length) return [];

  const teamMap = new Map<
    string,
    {
      team: GameTeamSummary;
      players: Map<string, { goals: number; yellows: number; reds: number }>;
    }
  >();

  for (const team of teams) {
    teamMap.set(team.id || team.abbreviation, {
      team,
      players: new Map(),
    });
  }

  for (const play of sourcePlays) {
    const names = getPlayPeople(play);
    if (!names.length) continue;

    const text = `${play.text || ""} ${play.shortText || ""}`.toLowerCase();
    const eventType = `${play.type?.text || ""} ${play.type?.name || ""} ${play.typeText || ""}`.toLowerCase();

    const teamKey =
      play.team?.id ||
      teams.find((team) => team.abbreviation === play.team?.abbreviation)?.id ||
      teams.find((team) => team.abbreviation === play.team?.abbreviation)?.abbreviation ||
      "";

    const bucket = teamMap.get(teamKey);
    if (!bucket) continue;

    const isGoal =
      text.includes("goal") ||
      text.includes("penalty scored") ||
      text.includes("own goal") ||
      eventType.includes("goal");
    const isYellow = text.includes("yellow") || eventType.includes("yellow");
    const isRed = text.includes("red card") || eventType.includes("red");

    if (!isGoal && !isYellow && !isRed) continue;

    for (const name of names) {
      const current = bucket.players.get(name) || { goals: 0, yellows: 0, reds: 0 };
      if (isGoal) current.goals += 1;
      if (isYellow) current.yellows += 1;
      if (isRed) current.reds += 1;
      bucket.players.set(name, current);
    }
  }

  return Array.from(teamMap.values())
    .map((entry) => {
      const rows = Array.from(entry.players.entries()).map(([athlete, values]) => ({
        athlete,
        values: [String(values.goals), String(values.yellows), String(values.reds)],
      }));

      return {
        team: entry.team,
        groups: rows.length
          ? [
              {
                title: "Match Events",
                labels: ["Goals", "YC", "RC"],
                rows,
              },
            ]
          : [],
      };
    })
    .filter((section) => section.groups.length > 0);
}

export async function getGameDetail(
  sport: string,
  league: string,
  eventId: string,
): Promise<GameDetailResult | null> {
  const url = `${ESPN_SITE_BASE}/${sport}/${league}/summary?event=${eventId}`;
  const data = await fetchJson<ESPNSummaryResponse>(url, 15);

  if (!data) return null;

  const competition = data.header?.competitions?.[0];
  if (!competition) return null;

  const teams =
    (competition.competitors ?? [])
      .map((competitor) => normalizeGameTeam(competitor as ESPNSummaryCompetitor))
      .filter((team): team is GameTeamSummary => team !== null);

  const isCompleted =
    competition.status?.type?.completed === true ||
    competition.status?.type?.state === "post";

  const isLive = !isCompleted && isCompetitionLive(competition);

  const boxscoreTeamStats =
    data.boxscore?.teams?.map((teamBlock) => ({
      team: {
        id: teamBlock.team?.id || "",
        name:
          teamBlock.team?.displayName ||
          teamBlock.team?.shortDisplayName ||
          "Unknown Team",
        abbreviation: teamBlock.team?.abbreviation || "UNK",
        logo: teamBlock.team?.logo || teamBlock.team?.logos?.[0]?.href || undefined,
        homeAway:
          teams.find((team) => team.id === teamBlock.team?.id)?.homeAway || "home",
        score: teams.find((team) => team.id === teamBlock.team?.id)?.score || "—",
        record: teams.find((team) => team.id === teamBlock.team?.id)?.record,
      },
      stats:
        teamBlock.statistics?.map((stat) => ({
          label: stat.label || stat.name || "Stat",
          value: stat.displayValue || "—",
        })) ?? [],
    })) ?? [];

  const formTeamStats =
    data.boxscore?.form?.map((formBlock) => ({
      team:
        teams.find((team) => team.id === formBlock.team?.id) || {
          id: formBlock.team?.id || "",
          name:
            formBlock.team?.displayName ||
            formBlock.team?.shortDisplayName ||
            "Unknown Team",
          abbreviation: formBlock.team?.abbreviation || "UNK",
          logo: formBlock.team?.logo || formBlock.team?.logos?.[0]?.href || undefined,
          homeAway: "home" as const,
          score: "—",
          record: undefined,
        },
      stats:
        formBlock.items?.map((item) => ({
          label: item.label || "Form",
          value: item.displayValue || (item.value != null ? String(item.value) : "—"),
        })) ?? [],
    })) ?? [];

  const teamStats =
    boxscoreTeamStats.some((section) => section.stats.length > 0)
      ? boxscoreTeamStats
      : formTeamStats;

  const boxscorePlayerStats =
    data.boxscore?.players?.map((playerBlock) => ({
      team: {
        id: playerBlock.team?.id || "",
        name:
          playerBlock.team?.displayName ||
          playerBlock.team?.shortDisplayName ||
          "Unknown Team",
        abbreviation: playerBlock.team?.abbreviation || "UNK",
        logo: playerBlock.team?.logo || playerBlock.team?.logos?.[0]?.href || undefined,
        homeAway:
          teams.find((team) => team.id === playerBlock.team?.id)?.homeAway || "home",
        score: teams.find((team) => team.id === playerBlock.team?.id)?.score || "—",
        record: teams.find((team) => team.id === playerBlock.team?.id)?.record,
      },
      groups:
        playerBlock.statistics?.map((group) => ({
          title: group.name || "Players",
          labels: group.labels ?? [],
          rows:
            group.athletes?.map((athleteRow) => ({
              athlete:
                athleteRow.athlete?.displayName ||
                athleteRow.athlete?.shortName ||
                "Unknown Player",
              values: athleteRow.stats?.map((value) => String(value ?? "—")) ?? [],
            })) ?? [],
        })) ?? [],
    })) ?? [];

  const leaderFallbackPlayerStats = buildLeaderFallbackPlayerStats(data.leaders, teams);

  const soccerEventSource = [...(data.keyEvents ?? []), ...(data.commentary ?? [])];

  const soccerEventFallbackPlayerStats = buildSoccerEventFallbackPlayerStats(
    soccerEventSource,
    teams,
  );

  const playerStats =
    boxscorePlayerStats.some((section) =>
      section.groups.some((group) => group.rows.length > 0),
    )
      ? boxscorePlayerStats
      : leaderFallbackPlayerStats.length > 0
        ? leaderFallbackPlayerStats
        : soccerEventFallbackPlayerStats;

  const directPlays = data.plays?.map((play) => normalizePlayItem(play)) ?? [];
  const keyEventPlays = data.keyEvents?.map((play) => normalizePlayItem(play)) ?? [];
  const commentaryPlays = data.commentary?.map((play) => normalizePlayItem(play)) ?? [];
  const drivePlays =
    data.drives?.previous?.flatMap(
      (drive) => drive.plays?.map((play) => normalizePlayItem(play)) ?? [],
    ) ?? [];

  const combinedPlays = dedupePlays([
    ...directPlays,
    ...keyEventPlays,
    ...commentaryPlays,
    ...drivePlays,
  ]);

  const explicitScoringPlays =
    data.scoringPlays?.map((play) =>
      normalizePlayItem({
        ...play,
        scoringPlay: true,
      }),
    ) ?? [];

  const inferredScoringPlays = combinedPlays.filter((play) => play.isScoringPlay);

  const scoringPlays = dedupePlays(
    explicitScoringPlays.length > 0 ? explicitScoringPlays : inferredScoringPlays,
  );

  const playByPlay = [...combinedPlays].sort((a, b) => {
    const aClock = a.clock || "";
    const bClock = b.clock || "";
    return bClock.localeCompare(aClock);
  });

  const broadcast =
    competition.broadcasts?.flatMap((item) => item.names ?? []).join(", ") || undefined;

  return {
    id: eventId,
    date: competition.date || "",
    status:
      competition.status?.type?.shortDetail ||
      competition.status?.type?.detail ||
      "Scheduled",
    isLive,
    isCompleted,
    venue: competition.venue?.fullName,
    broadcast,
    teams,
    teamStats,
    playerStats,
    scoringPlays,
    playByPlay,
  };
}

export async function getNFLTeamGames(teamId: string, season?: number) {
  return getTeamGamesBySport("football", "nfl", teamId, season);
}

export async function getMLBTeamGames(teamId: string, season?: number) {
  return getTeamGamesBySport("baseball", "mlb", teamId, season);
}

export async function getNCAABTeamGames(teamId: string, season?: number) {
  return getTeamGamesBySport("basketball", "mens-college-basketball", teamId, season);
}

export async function getSoccerTeamGames(teamId: string, season?: number) {
  return getTeamGamesBySport("soccer", "eng.2", teamId, season);
}

export async function getNFLStandings(season?: number) {
  return getStandingsBySport("football", "nfl", season);
}

export async function getMLBStandings(season?: number) {
  return getStandingsBySport("baseball", "mlb", season);
}

export async function getNCAABStandings(season?: number) {
  return getStandingsBySport("basketball", "mens-college-basketball", season);
}

export async function getSoccerStandings(season?: number) {
  return getStandingsBySport("soccer", "eng.2", season);
}