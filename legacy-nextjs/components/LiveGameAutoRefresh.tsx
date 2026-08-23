"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type LiveGameAutoRefreshProps = {
  isLive: boolean;
  intervalMs?: number;
};

export default function LiveGameAutoRefresh({
  isLive,
  intervalMs = 15000,
}: LiveGameAutoRefreshProps) {
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