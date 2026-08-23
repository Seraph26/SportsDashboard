import { notFound } from "next/navigation";
import Link from "next/link";
import { getTeamBySlug, getTeamSeasonData } from "@lib/teamData";
import { getTeamStats } from "@lib/statsService";
import { getCurrentSeasonYearForTeam } from "@lib/seasonUtils";

type PageProps = {
  params: Promise<{
    team: string;
  }>;
};

export default async function TeamStatsPage({ params }: PageProps) {
  const { team: teamSlug } = await params;

  const team = getTeamBySlug(teamSlug);
  if (!team) notFound();

  const season = getCurrentSeasonYearForTeam(team);

  const [seasonData, statsData] = await Promise.all([
    getTeamSeasonData(team, season),
    getTeamStats(team, season),
  ]);

  if (!statsData) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/teams/${team.slug}/${season}`}
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            ← Back to {team.name} {season}
          </Link>

          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            ← Back to Main Dashboard
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {team.name} Player Stats — {season}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Browse player stat tables for this season.
          </p>
          {seasonData.record ? (
            <p className="mt-2 text-sm text-slate-300">
              Team record: {seasonData.record.summary}
            </p>
          ) : null}
        </div>

        {statsData.sections.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">No player stats were available for this season.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {statsData.sections.map((section) => (
              <section
                key={section.key}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
              >
                <h2 className="mb-4 text-xl font-semibold">{section.title}</h2>

                <div className="overflow-hidden rounded-xl border border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800 text-sm">
                      <thead className="bg-slate-950/80">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-300">
                            Player
                          </th>
                          {section.columns.map((column) => (
                            <th
                              key={column.key}
                              className={`px-4 py-3 font-medium text-slate-300 ${
                                column.align === "center"
                                  ? "text-center"
                                  : column.align === "right" || column.numeric
                                    ? "text-right"
                                    : "text-left"
                              }`}
                            >
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-800">
                        {section.rows.map((row) => (
                          <tr
                            key={row.playerId}
                            className="bg-slate-900/30 transition hover:bg-slate-800/60"
                          >
                            <td className="px-4 py-3">
                              <Link
                                href={`/teams/${team.slug}/${season}/player/${row.playerId}`}
                                className="font-medium text-white hover:underline"
                              >
                                {row.playerName}
                              </Link>
                              <div className="text-xs text-slate-400">
                                {[row.position, row.jersey ? `#${row.jersey}` : null]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </div>
                            </td>

                            {section.columns.map((column) => (
                              <td
                                key={`${row.playerId}-${column.key}`}
                                className={`px-4 py-3 text-slate-200 ${
                                  column.align === "center"
                                    ? "text-center"
                                    : column.align === "right" || column.numeric
                                      ? "text-right"
                                      : "text-left"
                                }`}
                              >
                                {row.values[column.key] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}