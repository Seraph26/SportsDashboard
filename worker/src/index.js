/* Cloudflare Worker: a narrow, cached read-only proxy in front of ESPN's
   public site API.

   Why it exists when ESPN already sends Access-Control-Allow-Origin: * and the
   browser could call it directly:
     - caching. A season schedule is identical for every visitor, and the
       season-probe in teamData fires a dozen requests to draw one page. At the
       edge those collapse into one upstream request per season per region.
     - one origin we control, so if ESPN ever tightens CORS or starts rate
       limiting, the fix is here rather than in every client.

   What it deliberately is not: a general proxy. It forwards GET only, to one
   host, under one path prefix, for an allowlisted set of sports, and only for
   the origins that are actually this app. The Lost Ark connector was briefly a
   free public proxy because it answered "*" to everyone; this one does not
   repeat that. */

const WORKER_VERSION = "2026-08-23-news";
const ESPN_ORIGIN = "https://site.api.espn.com";
const ESPN_PREFIX = "/apis/site/v2/sports";

/* Add an entry when the dashboard moves or gains a domain. Note the limit:
   Origin is set by the browser and cannot be forged by a page, so this does
   stop another *website* using the proxy, but a direct client (curl) can send
   any Origin it likes. That is what the cache and the narrow path allowlist are
   for. */
const ALLOWED_ORIGINS = new Set([
  "https://seraph26.github.io",
  "http://localhost:8777",
]);

/* Only the four leagues the dashboard actually shows, plus soccer's divisions.
   Anything else is a 404 rather than a pass-through. */
const ALLOWED_PATHS = [
  /^football\/nfl\/teams\/\d+\/schedule$/,
  /^baseball\/mlb\/teams\/\d+\/schedule$/,
  /^basketball\/mens-college-basketball\/teams\/\d+\/schedule$/,
  /^soccer\/[a-z]{3}\.\d+\/teams\/\d+\/schedule$/,
  /^(football\/nfl|baseball\/mlb|basketball\/mens-college-basketball|soccer\/[a-z]{3}\.\d+)\/teams$/,
];

/* Only these query parameters reach ESPN, so the proxy cannot be used to smuggle
   arbitrary requests, and the cache key stays small and predictable. This is
   exactly what espnService sends and nothing more -- "limit" was allowed here
   originally but no call site ever set it, and an unused allowlist entry is
   surface with no payer. */
const ALLOWED_PARAMS = ["season", "seasontype"];

/* A finished season never changes; a live one changes every few seconds. The
   client polls every 15s, so caching a current-season response for 15s means a
   room full of viewers still costs ESPN one request per interval. */
const CACHE_LIVE_SECONDS = 15;
const CACHE_ARCHIVE_SECONDS = 60 * 60 * 6;

/* --- Team news -------------------------------------------------------------

   The original Next.js dashboard fetched Google News RSS server-side, which is
   why news did not survive the static rebuild: news.google.com sends no CORS
   headers, so a browser cannot fetch it at all. The worker is now that server.

   The query strings live here rather than being passed in, for the same reason
   the ESPN paths are an allowlist: a proxy that forwards an arbitrary caller
   query to Google is a general-purpose search proxy, and this is not one. Four
   keys, four fixed queries.

   Feeds are cached 15 minutes, matching the revalidate window the original
   used -- headlines do not move faster than that and every visitor shares one
   fetch per team. */
const NEWS_QUERIES = {
  jets: "New York Jets NFL",
  mets: "New York Mets MLB",
  wrexham: "Wrexham soccer",
  providence: "Providence Friars basketball",
};
const NEWS_ORIGIN = "https://news.google.com";
const NEWS_CACHE_SECONDS = 15 * 60;
const NEWS_LIMIT = 6;

function allowedOrigin(request) {
  const origin = request.headers.get("Origin");
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function corsHeaders(origin) {
  return {
    /* Echo the single origin that asked, never "*", and Vary so a response
       cached for one origin is not handed to another. */
    "Access-Control-Allow-Origin": origin || "https://seraph26.github.io",
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };
}

function json(body, { status = 200, origin, cacheSeconds = 0 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheSeconds
        ? `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
        : "no-store",
      ...corsHeaders(origin),
    },
  });
}

/* RSS parsing, ported from the original lib/newsService.ts. Regex rather than a
   parser because Workers have no DOMParser and a feed is a flat, predictable
   shape -- and because this is the same code that already worked. */
function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, "i"));
  return (match && match[1] ? match[1] : "").trim();
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "").trim();
}

function decodeEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    /* &amp; last, so "&amp;lt;" does not decode twice into a real tag. */
    .replace(/&amp;/g, "&");
}

function parseNewsFeed(xml) {
  const items = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = match[1] || "";
    const title = decodeEntities(stripTags(extractTag(block, "title")));
    const url = decodeEntities(stripTags(extractTag(block, "link")));
    if (!title || !url) continue;
    items.push({
      title,
      url,
      source: decodeEntities(stripTags(extractTag(block, "source"))) || undefined,
      publishedAt: decodeEntities(stripTags(extractTag(block, "pubDate"))) || undefined,
    });
  }
  return items;
}

async function handleNews(teamKey, origin, ctx) {
  const query = NEWS_QUERIES[teamKey];
  if (!query) {
    return json({ error: "unknown team" }, { status: 404, origin });
  }

  const upstream = `${NEWS_ORIGIN}/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const cacheKey = new Request(upstream, { method: "GET" });
  const cache = caches.default;

  const hit = await cache.match(cacheKey);
  if (hit) {
    return json(await hit.json(), { origin, cacheSeconds: NEWS_CACHE_SECONDS });
  }

  let res;
  try {
    res = await fetch(upstream, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8" },
    });
  } catch (err) {
    return json({ error: "news upstream unreachable" }, { status: 502, origin });
  }
  if (!res.ok) {
    return json({ error: `news upstream ${res.status}` }, { status: 502, origin });
  }

  const items = parseNewsFeed(await res.text()).slice(0, NEWS_LIMIT);
  const payload = { team: teamKey, items };

  ctx.waitUntil(
    cache.put(
      cacheKey,
      new Response(JSON.stringify(payload), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${NEWS_CACHE_SECONDS}`,
        },
      }),
    ),
  );

  return json(payload, { origin, cacheSeconds: NEWS_CACHE_SECONDS });
}

export default {
  async fetch(request, env, ctx) {
    const origin = allowedOrigin(request);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "GET") {
      return json({ error: "method not allowed" }, { status: 405, origin });
    }
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, version: WORKER_VERSION }, { origin });
    }
    if (!origin) {
      return json({ error: "origin not allowed" }, { status: 403, origin });
    }
    /* Team news. Behind the same origin gate as everything else. */
    if (url.pathname.startsWith("/news/")) {
      return handleNews(url.pathname.slice("/news/".length), origin, ctx);
    }

    if (!url.pathname.startsWith("/espn/")) {
      return json({ error: "not found" }, { status: 404, origin });
    }

    const path = url.pathname.slice("/espn/".length);
    if (!ALLOWED_PATHS.some((re) => re.test(path))) {
      return json({ error: "path not allowed" }, { status: 404, origin });
    }

    const upstream = new URL(`${ESPN_ORIGIN}${ESPN_PREFIX}/${path}`);
    for (const key of ALLOWED_PARAMS) {
      const value = url.searchParams.get(key);
      if (value !== null && /^[\w.-]{1,16}$/.test(value)) {
        upstream.searchParams.set(key, value);
      }
    }

    /* A request with no season is the current one and must stay fresh; an
       explicit past season can sit in the cache for hours. "Current" here is
       decided by the absence of the parameter, which is how the client asks. */
    const isArchive = upstream.searchParams.has("season");
    const cacheSeconds = isArchive ? CACHE_ARCHIVE_SECONDS : CACHE_LIVE_SECONDS;

    /* Cache on the upstream URL, not the incoming one, so two origins asking
       for the same season share a single cached copy. */
    const cacheKey = new Request(upstream.toString(), { method: "GET" });
    const cache = caches.default;

    let hit = await cache.match(cacheKey);
    let payload;

    if (hit) {
      payload = await hit.json();
    } else {
      let res;
      try {
        res = await fetch(upstream.toString(), {
          headers: {
            Accept: "application/json",
            /* ESPN's edge is fronted by Akamai bot detection, which allows
               well-known honest client user agents (curl, python-requests,
               Go-http-client) and 403s anything claiming to be a browser
               without the TLS fingerprint to match. A half-browser string like
               "Mozilla/5.0 (compatible; SportsDashboard/1.0)" is the worst
               case: browser-shaped, unrecognised, blocked every time. */
            "User-Agent": "curl/8.7.1",
          },
        });
      } catch (err) {
        return json({ error: "upstream unreachable" }, { status: 502, origin });
      }
      /* Don't flatten every upstream failure into 502: a caller mistake and an
         ESPN outage want different reactions, and 502 tells you it was theirs.
         Relay 4xx with its own status, keep 502 for 5xx and network faults.

         ESPN never answers 404 for a bad team id -- measured 2026-08-23, it is
         400 for nfl/mlb and 500 for soccer, so a bogus soccer id is genuinely
         indistinguishable from an outage here and will read as 502. Don't add
         a 404 branch expecting it to fire; it will not. */
      if (res.status >= 400 && res.status < 500) {
        return json({ error: `upstream ${res.status}` }, { status: res.status, origin });
      }
      if (!res.ok) {
        return json({ error: `upstream ${res.status}` }, { status: 502, origin });
      }
      payload = await res.json();
      const toCache = new Response(JSON.stringify(payload), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${cacheSeconds}`,
        },
      });
      ctx.waitUntil(cache.put(cacheKey, toCache));
    }

    return json(payload, { origin, cacheSeconds });
  },
};
