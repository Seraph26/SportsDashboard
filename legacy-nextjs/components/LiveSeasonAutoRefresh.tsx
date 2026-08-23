"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type LiveSeasonAutoRefreshProps = {
  isLive: boolean;
  intervalMs?: number;
};

export default function LiveSeasonAutoRefresh({
  isLive,
  intervalMs = 30000,
}: LiveSeasonAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isLive) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [intervalMs, isLive, router]);

  return null;
}