"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GameCard from "./GameCard";

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
  initialGames: Game[];
  teamSlug: string;
  enableLiveRefresh: boolean;
};

function isLiveStatus(status: string) {
  return status === "In Progress" || status === "Halftime";
}

function isRenderableGame(value: unknown): value is Game {
  if (!value || typeof value !== "object") return false;

  const game = value as Game;

  return (
    typeof game.id === "string" &&
    typeof game.status === "string" &&
    !!game.awayTeam &&
    !!game.homeTeam
  );
}

function normalizeGames(value: unknown): Game[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRenderableGame);
}

function getGameTimeValue(game: Game) {
  const time = game.date ? new Date(game.date).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function sortGames(games: Game[]) {
  return [...games].sort((a, b) => {
    const aLive = isLiveStatus(a.status);
    const bLive = isLiveStatus(b.status);

    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;

    return getGameTimeValue(b) - getGameTimeValue(a);
  });
}

function getScoreKey(game: Game) {
  return `${game.awayTeam?.score ?? ""}-${game.homeTeam?.score ?? ""}`;
}

export default function LiveScoreboard({
  initialGames,
  teamSlug,
  enableLiveRefresh,
}: Props) {
  const safeInitialGames = normalizeGames(initialGames);

  const [games, setGames] = useState<Game[]>(sortGames(safeInitialGames));
  const [changedGameIds, setChangedGameIds] = useState<Record<string, boolean>>({});
  const previousScoresRef = useRef<Record<string, string>>(
    Object.fromEntries(safeInitialGames.map((game) => [game.id, getScoreKey(game)])),
  );

  useEffect(() => {
    const nextGames = normalizeGames(initialGames);
    setGames(sortGames(nextGames));
    previousScoresRef.current = Object.fromEntries(
      nextGames.map((game) => [game.id, getScoreKey(game)]),
    );
    setChangedGameIds({});
  }, [initialGames]);

  useEffect(() => {
    if (!enableLiveRefresh) return;

    const hasLiveGame = games.some((game) => isLiveStatus(game.status));
    if (!hasLiveGame) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/teams/${teamSlug}`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        const nextGames = normalizeGames(data.games);

        const nextChangedIds: Record<string, boolean> = {};
        const nextScoreMap: Record<string, string> = {};

        for (const game of nextGames) {
          const nextScore = getScoreKey(game);
          const previousScore = previousScoresRef.current[game.id];

          nextScoreMap[game.id] = nextScore;

          if (
            previousScore !== undefined &&
            previousScore !== nextScore &&
            isLiveStatus(game.status)
          ) {
            nextChangedIds[game.id] = true;
          }
        }

        previousScoresRef.current = nextScoreMap;
        setGames(sortGames(nextGames));
        setChangedGameIds(nextChangedIds);

        if (Object.keys(nextChangedIds).length > 0) {
          window.setTimeout(() => {
            setChangedGameIds({});
          }, 4000);
        }
      } catch {
        // ignore polling errors
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [games, enableLiveRefresh, teamSlug]);

  const sortedGames = useMemo(() => sortGames(games), [games]);
  const liveGameCount = sortedGames.filter((game) => isLiveStatus(game.status)).length;

  if (sortedGames.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6 text-neutral-400">
        No games found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {liveGameCount > 0 ? (
        <div className="flex items-center gap-2 text-sm text-red-300">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          {liveGameCount} live {liveGameCount === 1 ? "game" : "games"} at the top
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            teamSlug={teamSlug}
            highlightUpdate={changedGameIds[game.id] === true}
          />
        ))}
      </div>
    </div>
  );
}