import type { StandingsGroup } from "@lib/standingsService";

type Props = {
  groups: StandingsGroup[];
};

export default function StandingsTable({ groups }: Props) {
  if (!groups || groups.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
        <h2 className="mb-3 text-xl font-semibold text-white">Standings</h2>
        <p className="text-sm text-neutral-400">No standings available.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section
          key={group.name}
          className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6"
        >
          <h2 className="mb-4 text-xl font-semibold text-white">{group.name}</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left font-medium text-neutral-300">RK</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-300">Team</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-300">W</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-300">L</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-300">T</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-300">Pct</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-300">GB</th>
                </tr>
              </thead>

              <tbody>
                {group.rows.map((row) => (
                  <tr
                    key={row.teamId}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-3 py-3 text-neutral-100">{row.rank}</td>
                    <td className="px-3 py-3 text-neutral-100">
                      <div className="flex items-center gap-3">
                        {row.logo ? (
                          <img
                            src={row.logo}
                            alt={row.teamName}
                            className="h-6 w-6 object-contain"
                          />
                        ) : null}
                        <span>{row.teamName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-neutral-100">{row.wins}</td>
                    <td className="px-3 py-3 text-right text-neutral-100">{row.losses}</td>
                    <td className="px-3 py-3 text-right text-neutral-100">{row.ties}</td>
                    <td className="px-3 py-3 text-right text-neutral-100">{row.percentage}</td>
                    <td className="px-3 py-3 text-right text-neutral-100">{row.gamesBack ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}