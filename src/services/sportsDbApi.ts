const BASE = 'https://www.thesportsdb.com/api/v1/json/3';

export interface SportsDbTeam {
  idTeam: string;
  strTeam: string;
  strTeamBadge: string;
  strStadiumThumb: string;
  strManager: string;
  intFormedYear: string;
}

export interface SportsDbPlayer {
  idPlayer: string;
  strPlayer: string;
  strThumb: string;
  strCutout: string;
}

const teamCache = new Map<string, SportsDbTeam | null>();
const playerCache = new Map<string, SportsDbPlayer | null>();

export function getCachedTeam(name: string): SportsDbTeam | null | undefined {
  return teamCache.get(name);
}

export function getCachedPlayer(name: string): SportsDbPlayer | null | undefined {
  return playerCache.get(name);
}

export async function searchTeam(name: string): Promise<SportsDbTeam | null> {
  if (teamCache.has(name)) return teamCache.get(name)!;
  try {
    const r = await fetch(`${BASE}/searchteams.php?t=${encodeURIComponent(name)}`);
    const d = await r.json();
    const team = (d.teams ?? [])[0] ?? null;
    teamCache.set(name, team);
    return team;
  } catch {
    teamCache.set(name, null);
    return null;
  }
}

export async function searchPlayer(name: string): Promise<SportsDbPlayer | null> {
  if (playerCache.has(name)) return playerCache.get(name)!;
  try {
    const r = await fetch(`${BASE}/searchplayers.php?p=${encodeURIComponent(name)}`);
    const d = await r.json();
    const player = (d.player ?? [])[0] ?? null;
    playerCache.set(name, player);
    return player;
  } catch {
    playerCache.set(name, null);
    return null;
  }
}
