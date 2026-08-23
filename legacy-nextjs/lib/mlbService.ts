export async function getMetsGames(season?: number) {
  const res = await fetch(
    season
      ? `...`
      : `...`
  );
  const data = (await res.json()) as { events?: any[] };
  return data.events ?? [];
}