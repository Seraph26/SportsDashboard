"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TeamSeasonData } from "@lib/teamData";
import { getCurrentSeasonYearForTeam } from "@lib/seasonUtils";
import LiveSeasonAutoRefresh from "@components/LiveSeasonAutoRefresh";

type TeamSeasonPageProps = {
  data: TeamSeasonData;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getResultClasses(result: string, isLive: boolean) {
  if (isLive) {
    return "bg-red-600/20 text-red-300 border border-red-500/40";
  }

  switch (result) {
    case "W":
      return "bg-green-600/20 text-green-300 border border-green-500/30";
    case "L":
      return "bg-red-600/20 text-red-300 border border-red-500/30";
    case "T":
      return "bg-yellow-600/20 text-yellow-300 border border-yellow-500/30";
    default:
      return "bg-slate-700/40 text-slate-200 border border-slate-600/40";
  }
}

function getRouteInfoForSport(sport: TeamSeasonData["team"]["sport"]) {
  switch (sport) {
    case "nfl":
      return { sport: "football", league: "nfl" };
    case "mlb":
      return { sport: "baseball", league: "mlb" };
    case "ncaab":
      return { sport: "basketball", league: "mens-college-basketball" };
    case "soccer":
      return { sport: "soccer", league: "eng.2" };
    default:
      return null;
  }
}

function getGamesHeaderRecordText(record: TeamSeasonData["record"]) {
  if (!record) return null;
  return `${record.wins}/${record.losses}${record.ties > 0 ? `/${record.ties}` : ""}`;
}

function normalizeText(value: string | undefined | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function getTeamAliases(team: TeamSeasonData["team"]) {
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

function rowMatchesCurrentTeam(
  row: TeamSeasonData["standings"][number]["rows"][number],
  team: TeamSeasonData["team"],
) {
  const aliases = getTeamAliases(team);
  const rowName = normalizeText(row.name);
  const rowAbbreviation = normalizeText(row.abbreviation);

  return aliases.some(
    (alias) =>
      rowName === alias ||
      rowName.includes(alias) ||
      rowAbbreviation === alias,
  );
}

export default function TeamSeasonPage({ data }: TeamSeasonPageProps) {
  const router = useRouter();
  const { team, season, games, record, standings, availableSeasons } = data;

  const hasLiveGame = games.some((game) => game.isLive);
  const currentSeason = getCurrentSeasonYearForTeam(team);
  const seasonLinks = availableSeasons;
  const routeInfo = getRouteInfoForSport(team.sport);
  const gamesHeaderRecordText = getGamesHeaderRecordText(record);

  const now = Date.now();

  const chronologicallySortedGames = [...games].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return aTime - bTime;
  });

  const liveGameIndex = chronologicallySortedGames.findIndex((game) => game.isLive);

  const nextUpcomingGameIndex =
    liveGameIndex === -1
      ? chronologicallySortedGames.findIndex((game) => {
          if (game.isLive || game.isCompleted) return false;
          const gameTime = new Date(game.date).getTime();
          return Number.isFinite(gameTime) && gameTime > now;
        })
      : -1;

  let sortedGames = chronologicallySortedGames;

  if (liveGameIndex !== -1) {
    sortedGames = [
      chronologicallySortedGames[liveGameIndex],
      ...chronologicallySortedGames.filter((_, index) => index !== liveGameIndex),
    ];
  } else if (nextUpcomingGameIndex !== -1) {
    sortedGames = [
      chronologicallySortedGames[nextUpcomingGameIndex],
      ...chronologicallySortedGames.filter((_, index) => index !== nextUpcomingGameIndex),
    ];
  }

  const sortedStandings = [...standings].sort((a, b) => {
    const aHasTeam = a.rows.some((row) => rowMatchesCurrentTeam(row, team));
    const bHasTeam = b.rows.some((row) => rowMatchesCurrentTeam(row, team));

    if (aHasTeam && !bHasTeam) return -1;
    if (!aHasTeam && bHasTeam) return 1;
    return 0;
  });

  const primaryStandingsGroup = sortedStandings.find((group) =>
    group.rows.some((row) => rowMatchesCurrentTeam(row, team)),
  );

  const goToGame = (gameId: string) => {
    if (!routeInfo) return;

    router.push(
      `/games/${routeInfo.sport}/${routeInfo.league}/${gameId}?team=${team.slug}&season=${season}`,
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <LiveSeasonAutoRefresh isLive={hasLiveGame} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            ← Back to Main Dashboard
          </Link>

          <Link
            href={`/teams/${team.slug}/${currentSeason}`}
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            ← Back to {team.name}
          </Link>
        </div>

        {seasonLinks.length > 0 ? (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Seasons
              </h2>
              <span className="text-xs text-slate-500">
                Only seasons with games are shown
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              {seasonLinks.map((seasonLink) => {
                const isActive = seasonLink === season;

                return (
                  <Link
                    key={seasonLink}
                    href={`/teams/${team.slug}/${seasonLink}`}
                    className={`rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${
                      isActive
                        ? "border-blue-500/40 bg-blue-600/15 text-blue-200"
                        : "border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500 hover:bg-slate-800"
                    }`}
                  >
                    {seasonLink} Season
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          {team.logo ? (
            <Image
              src={team.logo}
              alt={team.name}
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
          ) : null}

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {team.name} — {season}
              {record ? (
                <span className="ml-3 text-xl font-semibold text-slate-300">
                  ({record.summary})
                </span>
              ) : null}
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Season schedule, results, and standings
            </p>

            {team.website ? (
              <a
                href={team.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                Official Website →
              </a>
            ) : null}

            {primaryStandingsGroup ? (
              <p className="mt-2 text-sm font-medium text-blue-300">
                Current division / conference: {primaryStandingsGroup.groupName}
              </p>
            ) : null}

            {hasLiveGame ? (
              <p className="mt-2 text-xs font-medium text-red-300">
                Live game detected — this page auto-refreshes every 30 seconds.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Games
                {gamesHeaderRecordText ? (
                  <span className="ml-3 text-lg font-semibold text-blue-300">
                    (W/L/T: {gamesHeaderRecordText})
                  </span>
                ) : null}
              </h2>
              <span className="text-sm text-slate-400">{sortedGames.length} total</span>
            </div>

            {sortedGames.length === 0 ? (
              <p className="text-slate-400">No games found for this season.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-sm">
                    <thead className="bg-slate-950/80">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Opponent</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Site</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Result</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Score</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {sortedGames.map((game) => (
                        <tr
                          key={game.id}
                          className={`cursor-pointer transition ${
                            game.isLive
                              ? "bg-red-950/30 hover:bg-red-900/30"
                              : "bg-slate-900/30 hover:bg-slate-800/60"
                          }`}
                          onClick={() => goToGame(game.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              goToGame(game.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          title="Open game details"
                        >
                          <td className="px-4 py-3 text-slate-200">{formatDate(game.date)}</td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {game.opponentLogo ? (
                                <Image
                                  src={game.opponentLogo}
                                  alt={game.opponent}
                                  width={28}
                                  height={28}
                                  className="h-7 w-7 object-contain"
                                />
                              ) : null}
                              <div>
                                <div className="font-medium text-white">{game.opponent}</div>
                                <div className="text-xs text-slate-400">
                                  {game.opponentAbbreviation}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-slate-300">
                            {game.homeAway === "home" ? "Home" : "Away"}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${getResultClasses(
                                  game.result,
                                  game.isLive,
                                )}`}
                              >
                                {game.isLive ? "LIVE" : game.result}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-slate-200">
                            {game.teamScore != null && game.opponentScore != null
                              ? `${game.teamScore}-${game.opponentScore}`
                              : "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-400">
                            <div className="flex items-center gap-2">
                              {game.isLive ? (
                                <span className="inline-flex rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                                  LIVE
                                </span>
                              ) : null}
                              <span>{game.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-6">
            {sortedStandings.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <h2 className="mb-2 text-xl font-semibold">Standings</h2>
                <p className="text-slate-400">No standings were available for this season.</p>
              </div>
            ) : (
              sortedStandings.map((group, groupIndex) => {
                const highlightedTeamIndex = group.rows.findIndex((row) =>
                  rowMatchesCurrentTeam(row, team),
                );

                const isPrimaryGroup = groupIndex === 0 && highlightedTeamIndex !== -1;

                return (
                  <div
                    key={group.groupName}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold">{group.groupName}</h2>
                      {isPrimaryGroup ? (
                        <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-300">
                          Team&apos;s division / conference
                        </span>
                      ) : null}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-800">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-800 text-sm">
                          <thead className="bg-slate-950/80">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-slate-300">#</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-300">Team</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-300">W</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-300">L</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-300">T</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-300">Pct</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-300">GB</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {group.rows.map((row, index) => {
                              const isCurrentTeam = rowMatchesCurrentTeam(row, team);

                              return (
                                <tr
                                  key={`${group.groupName}-${row.teamId}-${index}`}
                                  className={isCurrentTeam ? "bg-blue-600/10" : "bg-slate-900/30"}
                                >
                                  <td className="px-4 py-3 text-slate-300">{index + 1}</td>

                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {row.logo ? (
                                        <Image
                                          src={row.logo}
                                          alt={row.name}
                                          width={24}
                                          height={24}
                                          className="h-6 w-6 object-contain"
                                        />
                                      ) : null}
                                      <div className="font-medium text-white">
                                        {row.name}
                                        {isCurrentTeam ? (
                                          <span className="ml-2 text-xs text-blue-300">
                                            (Current Team)
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 text-slate-200">{row.wins}</td>
                                  <td className="px-4 py-3 text-slate-200">{row.losses}</td>
                                  <td className="px-4 py-3 text-slate-200">{row.ties}</td>
                                  <td className="px-4 py-3 text-slate-200">{row.pct}</td>
                                  <td className="px-4 py-3 text-slate-400">
                                    {row.gamesBack || "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {highlightedTeamIndex === -1 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        This team was not found in this specific standings group.
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>
    </main>
  );
}