export type TeamConfig = {
  slug: string;
  name: string;
  sport: "nfl" | "mlb" | "ncaab" | "soccer";
  espnTeamId: string;
  logo?: string;
  website?: string;
};

export const teamConfig: TeamConfig[] = [
  {
    slug: "jets",
    name: "New York Jets",
    sport: "nfl",
    espnTeamId: "20",
    logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
    website: "https://www.newyorkjets.com/",
  },
  {
    slug: "mets",
    name: "New York Mets",
    sport: "mlb",
    espnTeamId: "25",
    logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nym.png",
    website: "https://www.mlb.com/mets",
  },
  {
    slug: "providence",
    name: "Providence Friars",
    sport: "ncaab",
    espnTeamId: "2507",
    logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2507.png",
    website: "https://friars.com/",
  },
  {
    slug: "wrexham",
    name: "Wrexham",
    sport: "soccer",
    espnTeamId: "352",
    logo: "https://a.espncdn.com/i/teamlogos/soccer/500/352.png",
    website: "https://www.wrexhamafc.co.uk/",
  },
];