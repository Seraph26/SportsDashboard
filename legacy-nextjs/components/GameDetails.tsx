import Link from "next/link";
import type { GameDetails as GameDetailsType } from "@lib/gameDetailsService";

type Props = {
  game: GameDetailsType;
};

function TeamScoreCard({
  name,
  abbreviation,
  logo,
  score,
  record,
  winner,
  homeAway,
}: GameDetailsType["teams"]["home"]) {
  return (
    <div
      className={[
        "rounded-2xl border p-5",
        winner
          ? "border-white/20 bg-white/10"
          : "border-white/10 bg-neutral-900/70",
      ].join(" ")}
    >
      <div className="mb-3 text-xs uppercase tracking-wide text-neutral-400">
        {homeAway === "home" ? "Home" : "Away"}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="h-10 w-10 object-contain"
            />
          ) : null}

          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-sm text-neutral-400">
              {abbreviation}
              {record ? ` • ${record}` : ""}
            </div>
          </div>
        </div>

        <div className="text-3xl font-bold text-white">{score}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-xl font-semibold tracking-tight">{children}</h2>;
}

export default function GameDetails({ game }: Props) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-neutral-400">
          <span>{game.status}</span>
          {game.detail ? <span>• {game.detail}</span> : null}
          {game.date ? (
            <span>
              •{" "}
              {new Date(game.date).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          ) : null}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          {game.shortName || game.name}
        </h1>

        <div className="mt-2 text-sm text-neutral-400">
          {game.venue ? <span>{game.venue}</span> : null}
          {game.attendance ? (
            <span>{game.venue ? ` • Attendance: ${game.attendance}` : `Attendance: ${game.attendance}`}</span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TeamScoreCard {...game.teams.away} />
          <TeamScoreCard {...game.teams.home} />
        </div>
      </div>

      {game.teamStats.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
          <SectionTitle>Team Stats</SectionTitle>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left font-medium text-neutral-300">
                    Stat
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-300">
                    {game.teams.away.abbreviation}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-300">
                    {game.teams.home.abbreviation}
                  </th>
                </tr>
              </thead>
              <tbody>
                {game.teamStats.map((stat) => (
                  <tr key={stat.label} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 text-neutral-100">{stat.label}</td>
                    <td className="px-3 py-2 text-right text-neutral-100">{stat.awayValue}</td>
                    <td className="px-3 py-2 text-right text-neutral-100">{stat.homeValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {game.playerStats.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
          <SectionTitle>Player Stats</SectionTitle>

          <div className="space-y-8">
            {game.playerStats.map((team) => (
              <div key={team.teamId || team.teamName} className="space-y-5">
                <h3 className="text-lg font-semibold text-white">{team.teamName}</h3>

                {team.groups.map((group) => (
                  <div key={`${team.teamId}-${group.name}`} className="overflow-x-auto">
                    <div className="mb-2 text-sm font-medium text-neutral-300">
                      {group.name}
                    </div>

                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-3 py-2 text-left font-medium text-neutral-300">
                            Player
                          </th>
                          {group.headers.map((header) => (
                            <th
                              key={`${group.name}-${header}`}
                              className="px-3 py-2 text-right font-medium text-neutral-300"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => (
                          <tr
                            key={`${group.name}-${row.athleteId}-${row.athleteName}`}
                            className="border-b border-white/5 last:border-0"
                          >
                            <td className="px-3 py-2 text-neutral-100">{row.athleteName}</td>
                            {row.stats.map((stat, index) => (
                              <td
                                key={`${row.athleteId}-${index}`}
                                className="px-3 py-2 text-right text-neutral-100"
                              >
                                {stat}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {game.scoringSummary.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
          <SectionTitle>Scoring Summary</SectionTitle>

          <div className="space-y-5">
            {game.scoringSummary.map((group, index) => (
              <div key={`${group.title}-${index}`}>
                <div className="mb-2 text-sm font-medium text-neutral-300">
                  {group.title}
                </div>

                <div className="space-y-2">
                  {group.plays.map((play, playIndex) => (
                    <div
                      key={`${group.title}-${playIndex}`}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <div className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
                        {play.period} • {play.clock}
                        {play.teamAbbreviation ? ` • ${play.teamAbbreviation}` : ""}
                        {play.scoreValue ? ` • ${play.scoreValue}` : ""}
                      </div>
                      <div className="text-sm text-neutral-100">{play.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {game.plays.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
          <SectionTitle>Play-by-Play</SectionTitle>

          <div className="space-y-3">
            {game.plays.map((play) => (
              <div
                key={play.id}
                className="rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <div className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
                  {play.period} • {play.clock}
                  {play.teamAbbreviation ? ` • ${play.teamAbbreviation}` : ""}
                  {play.awayScore && play.homeScore
                    ? ` • ${game.teams.away.abbreviation} ${play.awayScore} - ${game.teams.home.abbreviation} ${play.homeScore}`
                    : ""}
                </div>

                <div className="text-sm text-neutral-100">{play.text}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
        >
          Home
        </Link>
      </div>
    </div>
  );
}