/* Every team the dashboard knows about. Adding a team is a change to this file
   and nothing else -- routes, the homepage grid, and the ESPN calls are all
   driven from here.

   Fields:
     key      slug used in the URL (#/teams/<key>)
     name     display name
     league   which espnService function handles it (nfl | mlb | ncaab | soccer)
     teamId   ESPN's numeric team id, verified against the live API
     sport    ESPN's sport path segment
     path     ESPN's league path segment; for soccer this varies by season, see
              soccerLeagues below
     accent   card colour, the team's primary
     seasonLabel  how a season year is written for humans. NFL/MLB seasons are
              a single calendar year; NCAAB and soccer span two, and ESPN's
              "2025" for those means the 2025-26 campaign. */

export const teamConfig = {
  jets: {
    key: "jets",
    name: "New York Jets",
    shortName: "Jets",
    league: "nfl",
    teamId: "20",
    sport: "football",
    path: "nfl",
    accent: "#115740",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
    website: "https://www.newyorkjets.com/",
    streams: [
      { label: "LIVE STREAM 1", url: "https://freestreams-live1b.pk/nfl-live-stream88/" },
      { label: "LIVE STREAM 2", url: "https://streamed.pk/category/american-football" },
    ],
    seasonLabel: (y) => `${y}`,
    firstSeason: 2002,
  },
  mets: {
    key: "mets",
    name: "New York Mets",
    shortName: "Mets",
    league: "mlb",
    teamId: "21",
    sport: "baseball",
    path: "mlb",
    accent: "#002d72",
    logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nym.png",
    website: "https://www.mlb.com/mets",
    streams: [
      { label: "LIVE STREAM 1", url: "https://freestreams-live1b.pk/mlb-stream1/" },
      { label: "LIVE STREAM 2", url: "https://streamed.pk/category/baseball" },
    ],
    seasonLabel: (y) => `${y}`,
    firstSeason: 2002,
  },
  wrexham: {
    key: "wrexham",
    name: "Wrexham AFC",
    shortName: "Wrexham",
    league: "soccer",
    teamId: "352",
    sport: "soccer",
    /* Wrexham have been promoted repeatedly, so the league path is not fixed:
       ESPN files each season under the division they actually played in. A
       request to the wrong division returns an empty event list rather than an
       error, so teamData probes these in order and keeps the first that has
       fixtures. Verified: 2024 lives in eng.3, 2025 in eng.2. */
    soccerLeagues: ["eng.2", "eng.3", "eng.1", "eng.4"],
    accent: "#d0021b",
    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/352.png",
    website: "https://www.wrexhamafc.co.uk/",
    streams: [
      { label: "LIVE STREAM 1", url: "https://freestreams-live1b.pk/football-streamz5/" },
      { label: "LIVE STREAM 2", url: "https://streamed.pk/category/football" },
    ],
    seasonLabel: (y) => `${y}-${String(y + 1).slice(2)}`,
    firstSeason: 2019,
  },
  providence: {
    key: "providence",
    name: "Providence Friars",
    shortName: "Providence",
    league: "ncaab",
    teamId: "2507",
    sport: "basketball",
    path: "mens-college-basketball",
    accent: "#000000",
    logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2507.png",
    /* ESPN's college basketball standings return all of Division I -- 6 MB --
       unless narrowed to a conference. 4 is the Big East, which is where the
       team's own payload says it plays (groups.id). */
    standingsGroup: "4",
    website: "https://friars.com/",
    streams: [
      { label: "LIVE STREAM 1", url: "https://freestreams-live1b.pk/ncaa-basketball-streams/" },
      { label: "CLICK NCAA MEN", url: "https://streamcorner.info/" },
    ],
    /* ESPN numbers college basketball by the year the season ENDS -- season=2025
       returns the 2024-25 schedule. This is the opposite of soccer above, which
       is numbered by the year it starts, so the two cannot share a label. */
    seasonLabel: (y) => `${y - 1}-${String(y).slice(2)}`,
    firstSeason: 2003,
  },
};

export const teamList = Object.values(teamConfig);

export function getTeam(key) {
  return teamConfig[String(key || "").toLowerCase()] || null;
}
