import { teamConfig } from "@lib/teamConfig";

export type TeamNewsItem = {
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
};

type TeamLike = {
  id?: string;
  slug?: string;
  key?: string;
  name?: string;
  displayName?: string;
  shortName?: string;
  nickname?: string;
  league?: string;
};

type TeamInput = TeamLike | string;

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");
}

export function parseNewsFeed(xml: string): TeamNewsItem[] {
  const matches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));
  const results: TeamNewsItem[] = [];

  for (const match of matches) {
    const block = match[1] ?? "";
    const title = decodeHtmlEntities(stripTags(extractTag(block, "title")));
    const url = decodeHtmlEntities(stripTags(extractTag(block, "link")));
    const source = decodeHtmlEntities(stripTags(extractTag(block, "source"))) || undefined;
    const publishedAt = decodeHtmlEntities(stripTags(extractTag(block, "pubDate"))) || undefined;

    if (!title || !url) {
      continue;
    }

    results.push({
      title,
      url,
      source,
      publishedAt,
    });
  }

  return results;
}

function asTeamLike(team: unknown): TeamLike {
  if (team && typeof team === "object") {
    return team as TeamLike;
  }

  return {};
}

function findTeamConfigByString(value: string): TeamLike | undefined {
  const normalized = value.trim().toLowerCase();

  return teamConfig.find((rawTeam) => {
    const team = asTeamLike(rawTeam);

    const candidates = [
      team.id,
      team.slug,
      team.key,
      team.name,
      team.displayName,
      team.shortName,
      team.nickname,
    ];

    return candidates.some(
      (candidate) => typeof candidate === "string" && candidate.trim().toLowerCase() === normalized,
    );
  }) as TeamLike | undefined;
}

function normalizeTeamInput(team: TeamInput): TeamLike {
  if (typeof team === "string") {
    return (
      findTeamConfigByString(team) ?? {
        slug: team,
        name: team,
        displayName: team,
      }
    );
  }

  return team;
}

function getTeamDisplayName(team: TeamLike): string {
  return (
    team.displayName ||
    team.name ||
    team.shortName ||
    team.nickname ||
    team.slug ||
    team.id ||
    "Team"
  );
}

function getTeamKeys(team: TeamLike): string[] {
  const values = [
    team.id,
    team.slug,
    team.key,
    team.name,
    team.displayName,
    team.shortName,
    team.nickname,
  ];

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  );
}

function buildNewsQuery(team: TeamLike): string {
  const name = getTeamDisplayName(team);
  const league = typeof team.league === "string" ? team.league : "";

  switch (league) {
    case "nfl":
      return `${name} NFL`;
    case "mlb":
      return `${name} MLB`;
    case "ncaab":
      return `${name} basketball`;
    case "soccer":
      return `${name} soccer`;
    default:
      return name;
  }
}

async function fetchText(url: string, revalidateSeconds = 900): Promise<string | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

export async function getLatestNewsForTeam(
  teamInput: TeamInput,
  limit = 5,
): Promise<TeamNewsItem[]> {
  const team = normalizeTeamInput(teamInput);
  const query = buildNewsQuery(team);
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  const xml = await fetchText(url, 900);
  if (!xml) {
    return [];
  }

  return parseNewsFeed(xml).slice(0, limit);
}

export async function getLatestNewsForTeams(
  teams: TeamInput[] = teamConfig as unknown as TeamInput[],
  limitPerTeam = 5,
): Promise<Record<string, TeamNewsItem[]>> {
  const normalizedTeams = teams.map(normalizeTeamInput);

  const entries = await Promise.all(
    normalizedTeams.map(async (team) => {
      const news = await getLatestNewsForTeam(team, limitPerTeam);
      return { team, news };
    }),
  );

  const result: Record<string, TeamNewsItem[]> = {};

  for (const { team, news } of entries) {
    for (const key of getTeamKeys(team)) {
      result[key] = news;
    }
  }

  return result;
}