// OpenLigaDB — free, no API key, CORS-open, covers German football
// Docs: https://api.openligadb.de/
// Leagues: bl1 (Bundesliga), bl2 (2. Bundesliga), bl3 (3. Liga)
const BASE = 'https://api.openligadb.de';

export type OldbLeague = 'bl1' | 'bl2';

export interface OldbTeam {
  teamId: number;
  teamName: string;
  shortName: string;
}

export interface OldbMatch {
  matchID: number;
  matchDateTime: string; // ISO datetime e.g. "2024-08-24T15:30:00"
  matchIsFinished: boolean;
  group: { groupName: string; groupOrderID: number; groupID: number };
  team1: OldbTeam;
  team2: OldbTeam;
  matchResults: Array<{
    resultTypeID: number; // 1=HT, 2=FT
    resultDescription: string;
    pointsTeam1: number;
    pointsTeam2: number;
  }>;
  goals: Array<{
    goalID: number;
    scoreTeam1: number;
    scoreTeam2: number;
    matchMinute: number;
    goalScorer: string;
    isOwnGoal: boolean;
    isPenalty: boolean;
  }>;
}

export interface OldbTableEntry {
  teamInfoId: number;
  shortName: string;
  teamName: string;
  points: number;
  opponentGoals: number;
  goals: number;
  matches: number;
  won: number;
  lost: number;
  draw: number;
  goalDiff: number;
}

// Module-level cache keyed by path
const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 60_000;

async function oldbGet<T>(path: string): Promise<T | null> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.ts < TTL) return hit.data as T;
  try {
    const r = await fetch(`${BASE}/${path}`);
    if (!r.ok) return null;
    const data = await r.json();
    cache.set(path, { data, ts: Date.now() });
    return data as T;
  } catch {
    return null;
  }
}

// Current matchday matches (auto-selects current matchday)
export function getCurrentMatches(league: OldbLeague = 'bl1'): Promise<OldbMatch[] | null> {
  return oldbGet<OldbMatch[]>(`getmatchdata/${league}`);
}

// Standings/table for a specific season (2024 = 2024/25 season)
export function getTable(league: OldbLeague = 'bl1', season = '2024'): Promise<OldbTableEntry[] | null> {
  return oldbGet<OldbTableEntry[]>(`getbltable/${league}/${season}`);
}

// All groups/matchdays available for a league+season
export function getAvailableGroups(league: OldbLeague = 'bl1', season = '2024') {
  return oldbGet<Array<{ groupName: string; groupOrderID: number; groupID: number }>>(`getavailablegroups/${league}/${season}`);
}

// Specific matchday
export function getMatchday(league: OldbLeague, season: string, matchday: number): Promise<OldbMatch[] | null> {
  return oldbGet<OldbMatch[]>(`getmatchdata/${league}/${season}/${matchday}`);
}
