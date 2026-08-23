import Link from "next/link";
import type { TeamConfig } from "@lib/teamConfig";

type Props = {
  team: TeamConfig;
  season?: number;
  active?: "schedule" | "stats";
};

function getTabClasses(isActive: boolean) {
  return isActive
    ? "rounded-lg border border-cyan-500 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-200"
    : "rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800";
}

export default function TeamTabs({ team, season, active }: Props) {
  const scheduleHref = season
    ? `/teams/${team.slug}/${season}`
    : `/teams/${team.slug}`;

  const statsHref = season
    ? `/teams/${team.slug}/${season}/stats`
    : `/teams/${team.slug}/stats`;

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <Link href={scheduleHref} className={getTabClasses(active === "schedule")}>
        Schedule
      </Link>

      <Link href={statsHref} className={getTabClasses(active === "stats")}>
        Stats
      </Link>
    </div>
  );
}