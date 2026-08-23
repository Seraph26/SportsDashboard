import Link from "next/link";

type TeamSide = {
  name?: string;
  logo?: string;
  score?: string;
  winner?: boolean;
};

type Game = {
  id: string;
  date?: string;
  status: string;
  awayTeam?: TeamSide;
  homeTeam?: TeamSide;
};

type Props = {
  game: Game;
  teamSlug?: string;
  highlightUpdate?: boolean;
};

function isLiveStatus(status: string) {
  return status === "In Progress" || status === "Halftime";
}

function TeamRow({
  name,
  logo,
  score,
  isWinner,
  highlightUpdate,
}: {
  name: string;
  logo?: string;
  score?: string;
  isWinner?: boolean;
  highlightUpdate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {logo ? (
          <img
            src={logo}
            alt={name}
            className="h-6 w-6 object-contain"
          />
        ) : null}

        <span className={isWinner ? "font-semibold text-white" : "text-neutral-300"}>
          {name}
        </span>
      </div>

      <span
        className={[
          "font-semibold text-white transition-all duration-500",
          highlightUpdate ? "scale-110" : "",
        ].join(" ")}
      >
        {score ?? "-"}
      </span>
    </div>
  );
}

export default function GameCard({
  game,
  teamSlug,
  highlightUpdate = false,
}: Props) {
  const awayTeam = game.awayTeam;
  const homeTeam = game.homeTeam;

  if (!awayTeam || !homeTeam) {
    return null;
  }

  const href = teamSlug ? `/games/${game.id}?team=${teamSlug}` : `/games/${game.id}`;
  const isLive = isLiveStatus(game.status);

  return (
    <Link
      href={href}
      className={[
        "block rounded-2xl border p-4 transition",
        highlightUpdate
          ? "border-emerald-400/40 bg-emerald-500/10"
          : isLive
            ? "border-red-500/20 bg-neutral-900/70"
            : "border-white/10 bg-neutral-900/70",
        "hover:bg-neutral-900",
      ].join(" ")}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div
            className={[
              "text-xs uppercase tracking-wide",
              isLive ? "text-red-300" : "text-neutral-400",
            ].join(" ")}
          >
            {game.status}
          </div>

          {isLive ? (
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-red-300">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              Live
            </div>
          ) : null}
        </div>

        <TeamRow
          name={awayTeam.name ?? "Away Team"}
          logo={awayTeam.logo}
          score={awayTeam.score}
          isWinner={awayTeam.winner}
          highlightUpdate={highlightUpdate}
        />

        <TeamRow
          name={homeTeam.name ?? "Home Team"}
          logo={homeTeam.logo}
          score={homeTeam.score}
          isWinner={homeTeam.winner}
          highlightUpdate={highlightUpdate}
        />

        {game.date ? (
          <div className="text-xs text-neutral-500">
            {new Date(game.date).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        ) : null}
      </div>
    </Link>
  );
}