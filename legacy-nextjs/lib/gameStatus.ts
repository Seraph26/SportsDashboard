import type { ESPNGame } from "./types";

export function isGameLive(game: ESPNGame): boolean {
  const state = game.status?.type?.state?.toLowerCase();
  const completed = game.status?.type?.completed;

  if (completed) return false;

  return state === "in" || state === "inprogress" || state === "live";
}

export function hasAnyLiveGames(games: ESPNGame[]): boolean {
  return games.some(isGameLive);
}