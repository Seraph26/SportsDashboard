import Link from "next/link";
import type { TeamConfig } from "@lib/teamConfig";

type StandingsStat = {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  description?: string;
  value?: string | number;
  displayValue?: string | number;
};

type StandingsEntry = {
  team?: {
    id?: string | number;
    uid?: string;
    name?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
    logo?: string;
    logos?: Array<{ href?: string }>;
  };
  stats?: StandingsStat[];
  note?: {
    text?: string;
  };
};

type StandingsGroup = {
  name?: string;
  displayName?: string;
  headers?: string[];
  standings?: StandingsEntry[];
  entries?: StandingsEntry[];
};

type TeamPageProps = {
  team: TeamConfig;
  seasons: number[];
  selectedSeason: number;
  games: unknown[];
  standings?: unknown[];
};

type NormalizedGameTeam = {
  name: string;
  shortName: string;
  score: string;
  logo: string;
};

type NormalizedGame = {
  id: string;
  date: string;
  status: string;
  detail: string;
  homeTeam: NormalizedGameTeam;
  awayTeam: NormalizedGameTeam;
};

function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getTeamSlug(team: TeamConfig): string {
  return team.slug;
}

function normalizeText(value: string | undefined | null) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function getTeamAliases(team: TeamConfig) {
  switch (team.slug) {
    case "jets":
      return ["newyorkjets", "jets", "nyj"];
    case "mets":
      return ["newyorkmets", "mets", "nym"];
    case "providence":
      return ["providencefriars", "providence", "friars", "prov"];
    case "wrexham":
      return ["wrexham", "wrex"];
    default:
      return [normalizeText(team.name), normalizeText(team.slug)];
  }
}

function standingsEntryMatchesTeam(entry: StandingsEntry, team: TeamConfig) {
  const entryTeam = entry.team ?? {};
  const aliases = getTeamAliases(team);
  const entryId = normalizeText(toText(entryTeam.id));
  const entryName = normalizeText(
    toText(entryTeam.displayName || entryTeam.shortDisplayName || entryTeam.name),
  );
  const entryAbbreviation = normalizeText(toText(entryTeam.abbreviation));

  return (
    entryId === normalizeText(team.espnTeamId) ||
    aliases.some(
      (alias) =>
        entryName === alias ||
        entryName.includes(alias) ||
        entryAbbreviation === alias,
    )
  );
}

function formatDate(dateValue: unknown): string {
  const raw = toText(dateValue);
  if (!raw) return "TBD";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getNestedTeam(record: Record<string, unknown>, side: "home" | "away"): Record<string, unknown> {
  if (record[`${side}Team`] && typeof record[`${side}Team`] === "object") {
    return record[`${side}Team`] as Record<string, unknown>;
  }

  if (record.teams && typeof record.teams === "object") {
    const teams = record.teams as Record<string, unknown>;
    if (teams[side] && typeof teams[side] === "object") {
      return teams[side] as Record<string, unknown>;
    }
  }

  return {};
}

function getTeamDisplayName(teamRecord: Record<string, unknown>, fallback: string): string {
  return toText(
    teamRecord.shortName ??
      teamRecord.displayName ??
      teamRecord.name,
    fallback,
  );
}

function getTeamLogo(teamRecord: Record<string, unknown>, fallback = ""): string {
  return toText(
    teamRecord.logo ??
      (Array.isArray(teamRecord.logos)
        ? (teamRecord.logos[0] as { href?: string } | undefined)?.href
        : undefined),
    fallback,
  );
}

function getGameId(game: unknown): string {
  if (!game || typeof game !== "object") return "";
  const record = game as Record<string, unknown>;
  return toText(record.gameId ?? record.id);
}

function getGameDate(game: unknown): string {
  if (!game || typeof game !== "object") return "";
  const record = game as Record<string, unknown>;
  return toText(record.date);
}

function getGameStatus(game: unknown): string {
  if (!game || typeof game !== "object") return "";
  const record = game as Record<string, unknown>;
  return toText(record.status ?? record.state ?? record.detail, "Scheduled");
}

function getGameDetail(game: unknown): string {
  if (!game || typeof game !== "object") return "";
  const record = game as Record<string, unknown>;
  return toText(record.detail);
}

function normalizeGame(game: unknown): NormalizedGame {
  const record = (game && typeof game === "object" ? game : {}) as Record<string, unknown>;
  const homeRecord = getNestedTeam(record, "home");
  const awayRecord = getNestedTeam(record, "away");

  return {
    id: getGameId(record),
    date: getGameDate(record),
    status: getGameStatus(record),
    detail: getGameDetail(record),
    homeTeam: {
      name: toText(homeRecord.name, "Home"),
      shortName: getTeamDisplayName(homeRecord, "Home"),
      score: toText(homeRecord.score, "-"),
      logo: getTeamLogo(homeRecord),
    },
    awayTeam: {
      name: toText(awayRecord.name, "Away"),
      shortName: getTeamDisplayName(awayRecord, "Away"),
      score: toText(awayRecord.score, "-"),
      logo: getTeamLogo(awayRecord),
    },
  };
}

function sortGamesDescending(games: unknown[]): NormalizedGame[] {
  return [...games]
    .map(normalizeGame)
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });
}

function getRecordSummary(games: NormalizedGame[], teamName: string) {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const game of games) {
    const homeScore = toNumber(game.homeTeam.score);
    const awayScore = toNumber(game.awayTeam.score);

    if (homeScore == null || awayScore == null) continue;

    const isHome = game.homeTeam.name === teamName || game.homeTeam.shortName === teamName;
    const isAway = game.awayTeam.name === teamName || game.awayTeam.shortName === teamName;

    if (!isHome && !isAway) continue;

    const teamScore = isHome ? homeScore : awayScore;
    const opponentScore = isHome ? awayScore : homeScore;

    if (teamScore > opponentScore) wins += 1;
    else if (teamScore < opponentScore) losses += 1;
    else ties += 1;
  }

  const total = wins + losses + ties;
  const pct = total > 0 ? (wins + ties * 0.5) / total : 0;

  return {
    wins,
    losses,
    ties,
    pct: total > 0 ? pct.toFixed(3).replace(/^0/, "") : ".000",
    hasPlayedGames: total > 0,
  };
}

function getStandingsEntries(standings: unknown[] | undefined): StandingsEntry[] {
  if (!Array.isArray(standings)) return [];

  for (const group of standings as StandingsGroup[]) {
    const entries = Array.isArray(group?.standings)
      ? group.standings
      : Array.isArray(group?.entries)
        ? group.entries
        : [];

    if (entries.length > 0) {
      return entries;
    }
  }

  return [];
}

function getStandingsColumns(entries: StandingsEntry[]) {
  const preferred = ["W", "L", "T", "PCT", "GB", "PTS", "DIFF"];

  const labels = new Map<string, string>();

  for (const entry of entries) {
    const stats = Array.isArray(entry.stats) ? entry.stats : [];
    for (const stat of stats) {
      const key =
        toText(stat.shortDisplayName) ||
        toText(stat.abbreviation) ||
        toText(stat.name) ||
        toText(stat.displayName);

      if (!key) continue;
      if (!labels.has(key)) {
        labels.set(
          key,
          toText(stat.shortDisplayName) ||
            toText(stat.abbreviation) ||
            toText(stat.displayName) ||
            toText(stat.name),
        );
      }
    }
  }

  const all = Array.from(labels.entries()).map(([key, label]) => ({ key, label }));

  const orderedPreferred = preferred
    .map((target) => all.find((item) => item.key.toUpperCase() === target))
    .filter((item): item is { key: string; label: string } => Boolean(item));

  const remainder = all.filter(
    (item) => !preferred.some((target) => item.key.toUpperCase() === target),
  );

  return [...orderedPreferred, ...remainder].slice(0, 6);
}

function getStandingStatValue(entry: StandingsEntry, key: string): string {
  const stats = Array.isArray(entry.stats) ? entry.stats : [];

  const match = stats.find((stat) => {
    const candidate =
      toText(stat.shortDisplayName) ||
      toText(stat.abbreviation) ||
      toText(stat.name) ||
      toText(stat.displayName);

    return candidate.toUpperCase() === key.toUpperCase();
  });

  if (!match) return "—";
  return toText(match.displayValue ?? match.value, "—");
}

export function TeamPage({
  team,
  seasons,
  selectedSeason,
  games,
  standings,
}: TeamPageProps) {
  const teamSlug = getTeamSlug(team);
  const teamName = team.name;
  const normalizedGames = sortGamesDescending(games);
  const recordSummary = getRecordSummary(normalizedGames, teamName);
  const standingsEntries = getStandingsEntries(standings);
  const standingsColumns = getStandingsColumns(standingsEntries);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-4">
          {team.logo ? (
            <img
              src={team.logo}
              alt={`${team.name} logo`}
              className="h-14 w-14 rounded-full bg-neutral-900 object-contain p-1"
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{teamName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-400">
              <span className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1">
                Season {selectedSeason}
              </span>
              {recordSummary.hasPlayedGames ? (
                <span className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1">
                  {recordSummary.wins}-{recordSummary.losses}
                  {recordSummary.ties > 0 ? `-${recordSummary.ties}` : ""} ({recordSummary.pct})
                </span>
              ) : null}
              <span className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1">
                {normalizedGames.length} games
              </span>
            </div>
          </div>
        </div>
      </header>

      {seasons.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Seasons
          </h2>
          <div className="flex flex-wrap gap-2">
            {seasons.map((season) => {
              const isActive = season === selectedSeason;

              return (
                <Link
                  key={season}
                  href={`/teams/${teamSlug}/${season}`}
                  className={`rounded-md border px-3 py-2 text-sm transition ${
                    isActive
                      ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
                      : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500"
                  }`}
                >
                  {season}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {standingsEntries.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-white">Standings</h2>
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-900 text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Team</th>
                    {standingsColumns.map((column) => (
                      <th key={column.key} className="px-4 py-3 text-right font-medium">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standingsEntries.map((entry, index) => {
                    const entryTeam = entry.team ?? {};
                    const entryTeamId = toText(entryTeam.id);
                    const isCurrentTeam = standingsEntryMatchesTeam(entry, team);

                    return (
                      <tr
                        key={`${entryTeamId || index}`}
                        className={`border-t border-neutral-800 ${
                          isCurrentTeam ? "bg-cyan-500/10" : "bg-neutral-950"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {getTeamLogo(entryTeam as Record<string, unknown>) ? (
                              <img
                                src={getTeamLogo(entryTeam as Record<string, unknown>)}
                                alt={`${toText(entryTeam.displayName || entryTeam.name, "Team")} logo`}
                                className="h-6 w-6 object-contain"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <div className={isCurrentTeam ? "font-semibold text-cyan-200" : "font-medium text-white"}>
                                {toText(
                                  entryTeam.shortDisplayName ||
                                    entryTeam.displayName ||
                                    entryTeam.name,
                                  "Team",
                                )}
                              </div>
                              {entry.note?.text ? (
                                <div className="text-xs text-neutral-500">{entry.note.text}</div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        {standingsColumns.map((column) => (
                          <td key={column.key} className="px-4 py-3 text-right text-neutral-200">
                            {getStandingStatValue(entry, column.key)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Games</h2>

        {normalizedGames.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-6 text-neutral-400">
            No games were found for this season.
          </div>
        ) : (
          <div className="space-y-3">
            {normalizedGames.map((game, index) => {
              const dateText = formatDate(game.date);

              const content = (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 transition hover:border-neutral-600">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-neutral-400">{dateText}</div>
                    <div className="text-sm text-neutral-400">{game.detail || game.status}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {game.awayTeam.logo ? (
                          <img
                            src={game.awayTeam.logo}
                            alt={`${game.awayTeam.shortName} logo`}
                            className="h-7 w-7 object-contain"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-neutral-800" />
                        )}
                        <span className="truncate font-medium text-white">{game.awayTeam.shortName}</span>
                      </div>
                      <span className="text-lg font-semibold text-white">{game.awayTeam.score}</span>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {game.homeTeam.logo ? (
                          <img
                            src={game.homeTeam.logo}
                            alt={`${game.homeTeam.shortName} logo`}
                            className="h-7 w-7 object-contain"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-neutral-800" />
                        )}
                        <span className="truncate font-medium text-white">{game.homeTeam.shortName}</span>
                      </div>
                      <span className="text-lg font-semibold text-white">{game.homeTeam.score}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-neutral-500">{game.status}</div>
                </div>
              );

              return game.id ? (
                <Link key={game.id} href={`/games/${game.id}`} className="block">
                  {content}
                </Link>
              ) : (
                <div key={`${selectedSeason}-${index}`}>{content}</div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default TeamPage;