import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import LiveGameAutoRefresh from "@components/LiveGameAutoRefresh";
import { getGameDetail } from "@lib/espnService";

type PageProps = {
  params: Promise<{
    sport: string;
    league: string;
    gameId: string;
  }>;
  searchParams: Promise<{
    team?: string;
    season?: string;
  }>;
};

function formatGameDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function GameDetailPage({ params, searchParams }: PageProps) {
  const { sport, league, gameId } = await params;
  const { team, season } = await searchParams;

  const detail = await getGameDetail(sport, league, gameId);

  if (!detail) {
    notFound();
  }

  const backHref = team && season ? `/teams/${team}/${season}` : "/";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <LiveGameAutoRefresh isLive={detail.isLive} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            ← Back to Games
          </Link>

          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            ← Back to Main Dashboard
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {detail.teams[0]?.name || "Team"} vs {detail.teams[1]?.name || "Team"}
              </h1>
              <p className="mt-2 text-sm text-slate-400">{formatGameDate(detail.date)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {detail.isLive ? (
                  <span className="inline-flex rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                    LIVE
                  </span>
                ) : null}
                {detail.isCompleted ? (
                  <span className="inline-flex rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
                    FINAL
                  </span>
                ) : !detail.isLive ? (
                  <span className="inline-flex rounded-full bg-slate-700/50 px-3 py-1 text-xs font-semibold text-slate-200">
                    UPCOMING
                  </span>
                ) : null}
                <span className="text-sm text-slate-300">{detail.status}</span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-400">
                {detail.venue ? <p>Venue: {detail.venue}</p> : null}
                {detail.broadcast ? <p>Broadcast: {detail.broadcast}</p> : null}
              </div>
            </div>

            <div className="grid min-w-[320px] gap-3">
              {detail.teams.map((teamSummary, teamIndex) => (
                <div
                  key={`${teamSummary.id || teamSummary.abbreviation || "team"}-${teamSummary.homeAway}-${teamIndex}`}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {teamSummary.logo ? (
                      <Image
                        src={teamSummary.logo}
                        alt={teamSummary.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 object-contain"
                      />
                    ) : null}
                    <div>
                      <div className="font-semibold text-white">{teamSummary.name}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">
                        {teamSummary.homeAway}
                        {teamSummary.record ? ` • ${teamSummary.record}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">{teamSummary.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="mb-4 text-xl font-semibold">Team Stats</h2>

              {detail.teamStats.length === 0 ? (
                <p className="text-slate-400">No team stats were available for this game.</p>
              ) : (
                <div className="space-y-6">
                  {detail.teamStats.map((section, sectionIndex) => (
                    <div
                      key={`${section.team.id || section.team.abbreviation || "team"}-${sectionIndex}`}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        {section.team.logo ? (
                          <Image
                            src={section.team.logo}
                            alt={section.team.name}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                          />
                        ) : null}
                        <h3 className="text-lg font-semibold">{section.team.name}</h3>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-slate-800">
                        <table className="min-w-full divide-y divide-slate-800 text-sm">
                          <tbody className="divide-y divide-slate-800">
                            {section.stats.map((stat, statIndex) => (
                              <tr
                                key={`${section.team.id || section.team.abbreviation || "team"}-${stat.label}-${statIndex}`}
                                className="bg-slate-900/30"
                              >
                                <td className="px-4 py-3 text-slate-300">{stat.label}</td>
                                <td className="px-4 py-3 text-right font-medium text-white">
                                  {stat.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">
                  {detail.isLive ? "Live Play-by-Play" : "Play-by-Play"}
                </h2>
                {detail.isLive ? (
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                    Auto-refreshing
                  </span>
                ) : null}
              </div>

              {detail.playByPlay.length === 0 ? (
                <p className="text-slate-400">No play-by-play data was available for this game.</p>
              ) : (
                <div className="space-y-3">
                  {detail.playByPlay.map((play, playIndex) => (
                    <div
                      key={`${play.id}-${playIndex}`}
                      className={`rounded-xl border p-4 ${
                        play.isScoringPlay
                          ? "border-amber-500/30 bg-amber-500/10"
                          : "border-slate-800 bg-slate-950/60"
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {play.teamLogo ? (
                          <Image
                            src={play.teamLogo}
                            alt={play.teamAbbreviation || "Team"}
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] object-contain"
                          />
                        ) : null}
                        {play.teamAbbreviation ? <span>{play.teamAbbreviation}</span> : null}
                        {play.period ? <span>{play.period}</span> : null}
                        {play.clock ? <span>{play.clock}</span> : null}
                        {play.awayScore && play.homeScore ? (
                          <span>
                            Score {play.awayScore}-{play.homeScore}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-white">{play.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="mb-4 text-xl font-semibold">Scoring Summary</h2>

              {detail.scoringPlays.length === 0 ? (
                <p className="text-slate-400">No scoring summary was available for this game.</p>
              ) : (
                <div className="space-y-3">
                  {detail.scoringPlays.map((play, playIndex) => (
                    <div
                      key={`${play.id}-${playIndex}`}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {play.teamLogo ? (
                          <Image
                            src={play.teamLogo}
                            alt={play.teamAbbreviation || "Team"}
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] object-contain"
                          />
                        ) : null}
                        {play.teamAbbreviation ? <span>{play.teamAbbreviation}</span> : null}
                        {play.period ? <span>{play.period}</span> : null}
                        {play.clock ? <span>{play.clock}</span> : null}
                        {play.awayScore && play.homeScore ? (
                          <span>
                            Score {play.awayScore}-{play.homeScore}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-white">{play.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="mb-4 text-xl font-semibold">Player Stats</h2>

              {detail.playerStats.length === 0 ? (
                <p className="text-slate-400">No player stats were available for this game.</p>
              ) : (
                <div className="space-y-8">
                  {detail.playerStats.map((teamSection, teamSectionIndex) => (
                    <div
                      key={`${teamSection.team.id || teamSection.team.abbreviation || "team"}-${teamSectionIndex}`}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        {teamSection.team.logo ? (
                          <Image
                            src={teamSection.team.logo}
                            alt={teamSection.team.name}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                          />
                        ) : null}
                        <h3 className="text-lg font-semibold">{teamSection.team.name}</h3>
                      </div>

                      <div className="space-y-6">
                        {teamSection.groups
                          .filter((group) => group.rows.length > 0)
                          .map((group, groupIndex) => (
                            <div
                              key={`${teamSection.team.id || teamSection.team.abbreviation || "team"}-${group.title}-${groupIndex}`}
                            >
                              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
                                {group.title}
                              </h4>
                              <div className="overflow-hidden rounded-xl border border-slate-800">
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-slate-800 text-sm">
                                    <thead className="bg-slate-950/80">
                                      <tr>
                                        <th className="px-4 py-3 text-left font-medium text-slate-300">
                                          Player
                                        </th>
                                        {group.labels.map((label, labelIndex) => (
                                          <th
                                            key={`${teamSection.team.id || teamSection.team.abbreviation || "team"}-${group.title}-${label}-${labelIndex}`}
                                            className="px-4 py-3 text-left font-medium text-slate-300"
                                          >
                                            {label}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                      {group.rows.map((row, rowIndex) => (
                                        <tr
                                          key={`${teamSection.team.id || teamSection.team.abbreviation || "team"}-${group.title}-${row.athlete}-${rowIndex}`}
                                          className="bg-slate-900/30"
                                        >
                                          <td className="px-4 py-3 font-medium text-white">
                                            {row.athlete}
                                          </td>
                                          {row.values.map((value, valueIndex) => (
                                            <td
                                              key={`${teamSection.team.id || teamSection.team.abbreviation || "team"}-${group.title}-${row.athlete}-${valueIndex}`}
                                              className="px-4 py-3 text-slate-200"
                                            >
                                              {value}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}