import { notFound } from "next/navigation";
import PlayerHeader from "../../../../../components/PlayerHeader";
import { teamConfig } from "@lib/teamConfig";
import { getTeamStats } from "@lib/statsService";
import { getCurrentSeasonYearForTeam } from "@lib/seasonUtils";

type PageProps = {
  params: Promise<{
    team: string;
    playerId: string;
  }>;
};

export default async function PlayerPage({ params }: PageProps) {
  const { team: teamSlug, playerId } = await params;

  const team = teamConfig.find((entry) => entry.slug === teamSlug);
  if (!team) notFound();

  const season = getCurrentSeasonYearForTeam(team);

  const stats = await getTeamStats(team, season);
  if (!stats?.sections?.length) notFound();

  const player = stats.sections
    .flatMap((section) => section.rows)
    .find((row) => row.playerId === playerId);

  if (!player) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <PlayerHeader
          player={player}
          team={team}
          season={season}
          backHref={`/teams/${team.slug}/${season}`}
          backLabel={`Back to ${team.name} ${season}`}
        />

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-xl font-semibold">Season Stats</h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(player.values ?? {}).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {label}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {value ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}