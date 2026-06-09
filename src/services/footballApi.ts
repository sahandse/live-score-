const BASE_URL = 'https://api.football-data.org/v4';

function getApiKey(): string {
  return localStorage.getItem('football_api_key') || '';
}

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'X-Auth-Token': key },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export interface LiveMatch {
  id: number;
  utcDate: string;
  status: string;
  minute?: number;
  homeTeam: { id: number; name: string; shortName: string; crest: string };
  awayTeam: { id: number; name: string; shortName: string; crest: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  competition: { id: number; name: string; emblem: string; code: string };
}

export interface Standing {
  position: number;
  team: { id: number; name: string; shortName: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface ApiPlayer {
  id: number;
  name: string;
  position: string;
  nationality: string;
  dateOfBirth: string;
  shirtNumber?: number;
}

export interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  crest: string;
  founded?: number;
  venue?: string;
  squad?: ApiPlayer[];
}

// Status translation
export function translateStatus(status: string): { label: string; type: 'live' | 'upcoming' | 'finished' | 'halftime' } {
  switch (status) {
    case 'IN_PLAY': return { label: 'زنده', type: 'live' };
    case 'PAUSED': return { label: 'نیمه اول', type: 'halftime' };
    case 'FINISHED': return { label: 'پایان', type: 'finished' };
    case 'TIMED':
    case 'SCHEDULED': return { label: 'برنامه‌ریزی شده', type: 'upcoming' };
    default: return { label: status, type: 'upcoming' };
  }
}

// Competition code to Persian name and flag
export const competitionMap: Record<string, { name: string; flag: string }> = {
  PL:    { name: 'لیگ برتر انگلیس', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  PD:    { name: 'لالیگا', flag: '🇪🇸' },
  BL1:   { name: 'بوندسلیگا', flag: '🇩🇪' },
  SA:    { name: 'سری آ', flag: '🇮🇹' },
  FL1:   { name: 'لیگ ۱ فرانسه', flag: '🇫🇷' },
  CL:    { name: 'لیگ قهرمانان اروپا', flag: '🇪🇺' },
  EL:    { name: 'لیگ اروپا', flag: '🇪🇺' },
  PPL:   { name: 'لیگ برتر پرتغال', flag: '🇵🇹' },
  DED:   { name: 'اردیویزیه', flag: '🇳🇱' },
  BSA:   { name: 'سری آ برزیل', flag: '🇧🇷' },
  EC:    { name: 'یورو', flag: '🇪🇺' },
  WC:    { name: 'جام جهانی', flag: '🌍' },
};

// Today's + live matches
export async function getLiveMatches(): Promise<LiveMatch[] | null> {
  const data = await fetchApi<{ matches: LiveMatch[] }>('/matches?status=IN_PLAY,PAUSED,TIMED,SCHEDULED');
  return data?.matches ?? null;
}

// Matches for a specific competition
export async function getCompetitionMatches(competitionCode: string): Promise<LiveMatch[] | null> {
  const data = await fetchApi<{ matches: LiveMatch[] }>(`/competitions/${competitionCode}/matches?status=IN_PLAY,PAUSED,SCHEDULED,FINISHED&limit=10`);
  return data?.matches ?? null;
}

// Standings for a competition
export async function getStandings(competitionCode: string): Promise<Standing[] | null> {
  const data = await fetchApi<{ standings: { type: string; table: Standing[] }[] }>(
    `/competitions/${competitionCode}/standings`
  );
  if (!data) return null;
  const total = data.standings.find(s => s.type === 'TOTAL');
  return total?.table ?? null;
}

// Team with squad
export async function getTeam(teamId: number): Promise<ApiTeam | null> {
  return fetchApi<ApiTeam>(`/teams/${teamId}`);
}

// Top scorers
export async function getTopScorers(competitionCode: string): Promise<{ player: ApiPlayer; team: ApiTeam; goals: number; assists: number }[] | null> {
  const data = await fetchApi<{
    scorers: { player: ApiPlayer; team: ApiTeam; goals: number; assists: number | null }[];
  }>(`/competitions/${competitionCode}/scorers?limit=10`);
  return data?.scorers.map(s => ({ ...s, assists: s.assists ?? 0 })) ?? null;
}

export function hasApiKey(): boolean {
  return !!localStorage.getItem('football_api_key');
}

export function setApiKey(key: string): void {
  localStorage.setItem('football_api_key', key.trim());
}

export function removeApiKey(): void {
  localStorage.removeItem('football_api_key');
}
