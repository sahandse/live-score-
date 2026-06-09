const BASE_URL = 'https://api.football-data.org/v4';
const API_KEY = '20efc7393a344050afae389cb04938da';

function getApiKey(): string {
  return API_KEY;
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

export interface MatchGoal {
  minute: number;
  type: string;
  team: { id: number; name: string };
  scorer: { id: number; name: string } | null;
  assist: { id: number; name: string } | null;
}

export interface MatchBooking {
  minute: number;
  team: { id: number; name: string };
  player: { id: number; name: string } | null;
  card: 'YELLOW' | 'RED' | 'YELLOW_RED';
}

export interface MatchSubstitution {
  minute: number;
  team: { id: number; name: string };
  playerIn: { id: number; name: string } | null;
  playerOut: { id: number; name: string } | null;
}

export interface LiveMatchDetail extends LiveMatch {
  goals: MatchGoal[];
  bookings: MatchBooking[];
  substitutions: MatchSubstitution[];
  referees: { id: number; name: string; nationality: string }[];
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

export const leagueIdToCompetition: Record<string, string> = {
  epl: 'PL',
  laliga: 'PD',
  bundesliga: 'BL1',
  seriea: 'SA',
  ligue1: 'FL1',
  ucl: 'CL',
  uel: 'EL',
  eredivisie: 'DED',
  primeiraliga: 'PPL',
};

export type ZoneType = 'ucl' | 'uel' | 'uecl' | 'relegation_playoff' | 'relegation';

export function getZoneType(code: string, position: number, total: number): ZoneType | null {
  switch (code) {
    case 'PL':
      if (position <= 4) return 'ucl';
      if (position === 5) return 'uel';
      if (position === 6) return 'uecl';
      if (position >= total - 2) return 'relegation';
      return null;
    case 'PD':
    case 'SA':
      if (position <= 4) return 'ucl';
      if (position === 5) return 'uel';
      if (position === 6) return 'uecl';
      if (position >= total - 2) return 'relegation';
      return null;
    case 'BL1':
      if (position <= 4) return 'ucl';
      if (position === 5) return 'uel';
      if (position === 6) return 'uecl';
      if (position === total - 1) return 'relegation_playoff';
      if (position >= total) return 'relegation';
      return null;
    case 'FL1':
      if (position <= 3) return 'ucl';
      if (position <= 5) return 'uel';
      if (position === 6) return 'uecl';
      if (position === total - 1) return 'relegation_playoff';
      if (position >= total) return 'relegation';
      return null;
    default:
      if (position <= 4) return 'ucl';
      if (position >= total - 2) return 'relegation';
      return null;
  }
}

export function zoneColor(zone: ZoneType | null): string {
  switch (zone) {
    case 'ucl': return 'bg-emerald-500';
    case 'uel': return 'bg-orange-500';
    case 'uecl': return 'bg-sky-400';
    case 'relegation_playoff': return 'bg-amber-500';
    case 'relegation': return 'bg-red-500';
    default: return 'bg-transparent';
  }
}

export async function getLiveMatches(): Promise<LiveMatch[] | null> {
  const data = await fetchApi<{ matches: LiveMatch[] }>('/matches?status=IN_PLAY,PAUSED,TIMED,SCHEDULED');
  return data?.matches ?? null;
}

export async function getRecentMatches(): Promise<LiveMatch[] | null> {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - 4);
  const from = pastDate.toISOString().split('T')[0];
  const to = now.toISOString().split('T')[0];
  const data = await fetchApi<{ matches: LiveMatch[] }>(`/matches?status=FINISHED&dateFrom=${from}&dateTo=${to}`);
  return data?.matches ?? null;
}

export async function getCompetitionMatches(competitionCode: string): Promise<LiveMatch[] | null> {
  const data = await fetchApi<{ matches: LiveMatch[] }>(`/competitions/${competitionCode}/matches?status=IN_PLAY,PAUSED,SCHEDULED,FINISHED&limit=10`);
  return data?.matches ?? null;
}

export async function getStandings(competitionCode: string): Promise<Standing[] | null> {
  const data = await fetchApi<{ standings: { type: string; table: Standing[] }[] }>(
    `/competitions/${competitionCode}/standings`
  );
  if (!data) return null;
  const total = data.standings.find(s => s.type === 'TOTAL');
  return total?.table ?? null;
}

export async function getMatch(id: number): Promise<LiveMatchDetail | null> {
  return fetchApi<LiveMatchDetail>(`/matches/${id}`);
}

export async function getTeam(teamId: number): Promise<ApiTeam | null> {
  return fetchApi<ApiTeam>(`/teams/${teamId}`);
}

export async function getTopScorers(competitionCode: string): Promise<{ player: ApiPlayer; team: ApiTeam; goals: number; assists: number }[] | null> {
  const data = await fetchApi<{
    scorers: { player: ApiPlayer; team: ApiTeam; goals: number; assists: number | null }[];
  }>(`/competitions/${competitionCode}/scorers?limit=10`);
  return data?.scorers.map(s => ({ ...s, assists: s.assists ?? 0 })) ?? null;
}

export function hasApiKey(): boolean {
  return true;
}
