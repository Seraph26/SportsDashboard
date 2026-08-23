import Link from "next/link";
import type { TeamConfig } from "@lib/teamConfig";

type PlayerLike = {
  playerName: string;
  jersey?: string;
  position?: string;
};

type Props = {
  player: PlayerLike;
  team: TeamConfig;
  season: number;
  backHref: string;
  backLabel: string;
};

export default function PlayerHeader({
  player,
  team,
  season,
  backHref,
  backLabel,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href={backHref}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
        >
          ← {backLabel}
        </Link>

        <Link
          href={`/teams/${team.slug}/${season}`}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
        >
          Team season
        </Link>

        <Link
          href={`/teams/${team.slug}`}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
        >
          Team page
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {team.logo ? (
          <img
            src={team.logo}
            alt={team.name}
            className="h-16 w-16 object-contain"
          />
        ) : null}

        <div>
          <div className="text-sm font-medium uppercase tracking-wide text-slate-400">
            {team.name} • {season}
          </div>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            {player.playerName}
          </h1>

          <div className="mt-2 text-sm text-slate-300">
            {[player.position, player.jersey ? `#${player.jersey}` : null]
              .filter(Boolean)
              .join(" • ") || "Player details"}
          </div>
        </div>
      </div>
    </div>
  );
}