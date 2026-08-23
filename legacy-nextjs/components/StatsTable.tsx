import type { StatsSection } from "@lib/statsNormalizer";

type StatsTableProps = {
  sections: StatsSection[];
  emptyMessage?: string;
};

function getAlignmentClass(align?: "left" | "right" | "center") {
  if (align === "center") return "text-center";
  if (align === "left") return "text-left";
  return "text-right";
}

export default function StatsTable({
  sections,
  emptyMessage = "No stats available.",
}: StatsTableProps) {
  const visibleSections = sections.filter(
    (section) => section.columns.length > 0 && section.rows.length > 0,
  );

  if (!visibleSections.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 text-sm text-neutral-300">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleSections.map((section) => {
        const hasAnyJersey = section.rows.some((row) => Boolean(row.jersey));
        const hasAnyPosition = section.rows.some((row) => Boolean(row.position));

        return (
          <section
            key={section.key}
            className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-base font-semibold text-white">{section.title}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-neutral-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    {hasAnyJersey ? (
                      <th className="px-4 py-3 text-left font-medium">No.</th>
                    ) : null}
                    {hasAnyPosition ? (
                      <th className="px-4 py-3 text-left font-medium">Pos</th>
                    ) : null}
                    {section.columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-4 py-3 font-medium ${getAlignmentClass(column.align)}`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {section.rows.map((row) => (
                    <tr
                      key={row.playerId}
                      className="border-t border-white/10 text-neutral-100"
                    >
                      <td className="px-4 py-3 font-medium">
                        {row.playerName || "Team"}
                      </td>
                      {hasAnyJersey ? (
                        <td className="px-4 py-3 text-neutral-400">
                          {row.jersey || "—"}
                        </td>
                      ) : null}
                      {hasAnyPosition ? (
                        <td className="px-4 py-3 text-neutral-400">
                          {row.position || "—"}
                        </td>
                      ) : null}
                      {section.columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 ${getAlignmentClass(column.align)}`}
                        >
                          {row.values[column.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}