export type ESPNCompetitor = {
  homeAway: "home" | "away";
  team: {
    id: string;
    displayName: string;
    abbreviation?: string;
    logo?: string;
  };
  score?: {
    value?: number | string;
    displayValue?: string;
  };
  winner?: boolean;
};

export type ESPNCompetition = {
  competitors: ESPNCompetitor[];
  status?: {
    type?: {
      name?: string;
      state?: string;
      description?: string;
      detail?: string;
      completed?: boolean;
    };
  };
};

export type ESPNGame = {
  id: string;
  date: string;
  name?: string;
  shortName?: string;
  status?: {
    type?: {
      name?: string;
      state?: string;
      description?: string;
      detail?: string;
      completed?: boolean;
    };
  };
  competitions?: ESPNCompetition[];
};

export type StandingRow = {
  teamId: string;
  name: string;
  logo?: string;
  rank: number;
  wins?: number;
  losses?: number;
  ties?: number;
  points?: number;
  pct?: string;
  gamesBack?: string;
  division?: string;
  conference?: string;
};

export type StatsTable = {
  title: string;
  columns: string[];
  rows: Array<{
    playerId?: string;
    playerName: string;
    values: string[];
  }>;
};