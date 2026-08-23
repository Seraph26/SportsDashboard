"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  teamSlug: string;
  teamName: string;
  nextGameDate: string | null;
  nextOpponent: string | null;
  isLive: boolean;
};

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function TeamCardCountdown({
  nextGameDate,
  nextOpponent,
  isLive,
}: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const targetTime = useMemo(() => {
    if (!nextGameDate) return null;
    const t = new Date(nextGameDate).getTime();
    return Number.isFinite(t) ? t : null;
  }, [nextGameDate]);

  if (isLive) {
    return (
      <div className="text-base font-semibold text-red-300">
        Game in progress
      </div>
    );
  }

  if (!targetTime || !nextOpponent) {
    return (
      <div className="text-sm leading-5 text-sky-200/70">
        No upcoming game scheduled
      </div>
    );
  }

  const remaining = targetTime - now;

  if (remaining <= 0) {
    return (
      <div className="text-base font-semibold text-yellow-300">
        Starting soon...
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-lg font-bold text-emerald-300">
        Next game in {formatCountdown(remaining)}
      </div>
      <div className="text-sm font-medium text-sky-200/80">
        vs {nextOpponent}
      </div>
    </div>
  );
}