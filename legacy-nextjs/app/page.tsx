import Link from "next/link";
import TeamCardCountdown from "../components/TeamCardCountdown";
import { teamConfig } from "@lib/teamConfig";
import { getLatestNewsForTeams, type TeamNewsItem } from "@lib/newsService";
import { getTeamGames } from "@lib/teamData";
import { getCurrentSeasonYearForTeam } from "@lib/seasonUtils";
import type { TeamGame } from "@lib/espnService";

type TeamGamesResult = {
  games: TeamGame[];
  record: unknown;
};

type DashboardGameInfo = {
  opponent: string | null;
  nextGameDate: string | null;
  isLive: boolean;
};

const LIVE_STREAM_LINKS: Record<
  string,
  { label: string; url: string }[]
> = {
  jets: [
    { label: "LIVE STREAM 1", url: "https://freestreams-live1b.pk/nfl-live-stream88/" },
    { label: "LIVE STREAM 2", url: "https://streamed.pk/category/american-football" },
  ],
  mets: [
    { label: "LIVE STREAM 1", url: "https://freestreams-live1b.pk/mlb-stream1/" },
    { label: "LIVE STREAM 2", url: "https://streamed.pk/category/baseball" },
  ],
  providence: [
    { label: "LIVE STREAM 1", url: "https://freestreams-live1b.pk/ncaa-basketball-streams/" },
    { label: "CLICK NCAA MEN", url: "https://streamcorner.info/" },
  ],
  wrexham: [
    { label: "LIVE STREAM 1", url: "https://freestreams-live1b.pk/football-streamz5/" },
    { label: "LIVE STREAM 2", url: "https://streamed.pk/category/football" },
  ],
};

function normalizeGamesResult(value: unknown): TeamGamesResult {
  if (
    value &&
    typeof value === "object" &&
    "games" in value &&
    Array.isArray((value as TeamGamesResult).games)
  ) {
    return {
      games: (value as TeamGamesResult).games,
      record: (value as TeamGamesResult).record ?? null,
    };
  }

  return {
    games: [],
    record: null,
  };
}

function getDashboardGameInfo(games: TeamGame[]): DashboardGameInfo {
  if (!games.length) {
    return { opponent: null, nextGameDate: null, isLive: false };
  }

  const liveGame = games.find((g) => g.isLive);
  if (liveGame) {
    return {
      opponent: liveGame.opponent ?? null,
      nextGameDate: liveGame.date ?? null,
      isLive: true,
    };
  }

  const now = Date.now();

  const nextGame = games
    .filter((g) => !g.isCompleted && !g.isLive)
    .filter((g) => new Date(g.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  if (!nextGame) {
    return { opponent: null, nextGameDate: null, isLive: false };
  }

  return {
    opponent: nextGame.opponent ?? null,
    nextGameDate: nextGame.date ?? null,
    isLive: false,
  };
}

export default async function HomePage() {
  const teams = teamConfig;

  const [newsByTeam, teamDataEntries] = await Promise.all([
    getLatestNewsForTeams(teams.map((t) => t.slug), 3),
    Promise.all(
      teams.map(async (team) => {
        try {
          const currentSeason = getCurrentSeasonYearForTeam(team);
          const result = await getTeamGames(team, currentSeason);
          return [team.slug, normalizeGamesResult(result)] as const;
        } catch {
          return [team.slug, { games: [], record: null }] as const;
        }
      }),
    ),
  ]);

  const teamDataMap = Object.fromEntries(teamDataEntries);

  return (
    <main className="min-h-screen bg-[#000a2a] text-white">
      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold">Roger&apos;s Teams</h1>
        </header>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
          {teams.map((team) => {
            const teamData = teamDataMap[team.slug] ?? { games: [], record: null };
            const dashboardGame = getDashboardGameInfo(teamData.games);
            const latestNews = (newsByTeam[team.slug] ?? []) as TeamNewsItem[];
            const isJets = team.slug === "jets";

            return (
              <div key={team.slug} className="flex flex-col gap-8">
                <section className="relative overflow-hidden rounded-2xl border bg-[#06133a] px-8 py-7">
                  {team.logo && (
                    <img
                      src={team.logo}
                      alt=""
                      className={[
                        "pointer-events-none absolute inset-0 m-auto",
                        isJets
                          ? "h-80 w-80 opacity-[0.45] brightness-[0.85]"
                          : "h-64 w-64 opacity-[0.22] brightness-[0.6]",
                      ].join(" ")}
                    />
                  )}

                  <div className="relative">
                    <Link
                      href={`/teams/${team.slug}`}
                      className="text-2xl font-extrabold text-red-400 hover:text-red-300 hover:underline"
                    >
                      {team.name}
                    </Link>

                    <div className="mt-4">
                      <TeamCardCountdown
                        teamSlug={team.slug}
                        teamName={team.name}
                        nextGameDate={dashboardGame.nextGameDate}
                        nextOpponent={dashboardGame.opponent}
                        isLive={dashboardGame.isLive}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border bg-[#06133a] px-5 py-4">
                  <div className="mb-3 text-xs uppercase text-sky-300">
                    Latest News
                  </div>

                  <div className="space-y-3">
                    {latestNews.map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl bg-[#041031] px-4 py-3"
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border bg-[#06133a] px-5 py-4">
                  <div className="mb-3 text-xs uppercase text-sky-300">
                    Live Streams
                  </div>

                  <div className="space-y-3">
                    {(LIVE_STREAM_LINKS[team.slug] || []).map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl bg-[#041031] px-4 py-3 text-sm font-semibold hover:bg-[#081842]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <section className="w-[420px] rounded-2xl border bg-[#06133a] px-6 py-5 text-center shadow-lg">
            <div className="mb-2 text-xs uppercase text-sky-300">
              LIVE STREAMS
            </div>

            <a
              href="https://fmhy.net/video#live-sports"
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl bg-[#041031] px-4 py-3 text-sm font-semibold !text-green-400 hover:bg-[#081842]"
            >
              MASTER STREAM LINKS
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}