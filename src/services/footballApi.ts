// Free Football Live Scores API by rezarahiminia — open-source, MongoDB-backed,
// provider-compatible REST API for real football data (no key needed, CORS-open).
// Source: https://github.com/rezarahiminia/livescoreFootball
// Docs:   https://worldcup26.ir/football-api
const BASE = 'https://worldcup26.ir/get/soccer';

// Leagues confirmed covered by the service as of this writing (see the project's
// README — England and Spain are the first production targets). Used only as a
// fallback if the live league catalog can't be fetched.
const FALLBACK_LEAGUES = ['eng.1', 'esp.1'];

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${BASE}/${path}`);
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch {
    return null;
  }
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

// The service publishes exactly which leagues currently have stored data via
// `/leagues?available=true`; querying it keeps the app honest about what's real.
let leagueCatalogCache: { slugs: string[]; ts: number } | null = null;
const CATALOG_TTL = 5 * 60_000;

async function getAvailableLeagueSlugs(): Promise<string[]> {
  if (leagueCatalogCache && Date.now() - leagueCatalogCache.ts < CATALOG_TTL) {
    return leagueCatalogCache.slugs;
  }
  const d = await apiGet<{ leagues: { slug: string }[] }>('leagues?kind=club&available=true');
  const slugs = d?.leagues?.length ? d.leagues.map(l => l.slug) : FALLBACK_LEAGUES;
  leagueCatalogCache = { slugs, ts: Date.now() };
  return slugs;
}

function mapStatus(state: string, name: string): string {
  if (state === 'post') return 'FINISHED';
  if (state === 'in') return /HALF/i.test(name) ? 'PAUSED' : 'IN_PLAY';
  return 'SCHEDULED';
}

function minuteFromStatus(status: any): number {
  const display: string = status?.type?.shortDetail || status?.type?.detail || status?.displayClock || '';
  const m = display.match(/(\d+)/);
  if (m) return parseInt(m[1], 10);
  return Math.floor((status?.clock ?? 0) / 60);
}

function crestFromTeam(team: any): string {
  if (!team) return '';
  if (typeof team.logo === 'string' && team.logo) return team.logo;
  const logos = team.logos;
  if (Array.isArray(logos) && logos.length) {
    return typeof logos[0] === 'string' ? logos[0] : logos[0]?.href ?? '';
  }
  return '';
}

// ─── Exported types (same shape used across the app) ────────────────────────

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
  playerIn:  { id: number; name: string } | null;
  playerOut: { id: number; name: string } | null;
}

export interface LiveMatchDetail extends LiveMatch {
  goals:         MatchGoal[];
  bookings:      MatchBooking[];
  substitutions: MatchSubstitution[];
  referees:      { id: number; name: string; nationality: string }[];
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

// ─── Competition map (keys = league slugs used by the API) ──────────────────

export const competitionMap: Record<string, { name: string; flag: string }> = {
  'eng.1':          { name: 'لیگ برتر انگلیس',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'esp.1':          { name: 'لالیگا',              flag: '🇪🇸' },
  'ger.1':          { name: 'بوندسلیگا',          flag: '🇩🇪' },
  'ita.1':          { name: 'سری آ',              flag: '🇮🇹' },
  'fra.1':          { name: 'لیگ ۱ فرانسه',      flag: '🇫🇷' },
  'uefa.champions': { name: 'لیگ قهرمانان اروپا', flag: '🇪🇺' },
  'uefa.europa':    { name: 'لیگ اروپا',          flag: '🇪🇺' },
  'ned.1':          { name: 'اردیویزیه',          flag: '🇳🇱' },
  'por.1':          { name: 'لیگ برتر پرتغال',    flag: '🇵🇹' },
  'bra.1':          { name: 'سری آ برزیل',        flag: '🇧🇷' },
};

// Internal league IDs → API league slugs
export const leagueIdToCompetition: Record<string, string> = {
  epl:         'eng.1',
  laliga:      'esp.1',
  bundesliga:  'ger.1',
  seriea:      'ita.1',
  ligue1:      'fra.1',
  ucl:         'uefa.champions',
  uel:         'uefa.europa',
  eredivisie:  'ned.1',
  primeiraliga:'por.1',
};

// ─── Status helpers ───────────────────────────────────────────────────────────

export function translateStatus(status: string): { label: string; type: 'live' | 'upcoming' | 'finished' | 'halftime' } {
  switch (status) {
    case 'IN_PLAY':    return { label: 'زنده',             type: 'live' };
    case 'PAUSED':     return { label: 'نیمه اول',         type: 'halftime' };
    case 'FINISHED':   return { label: 'پایان',            type: 'finished' };
    case 'TIMED':
    case 'SCHEDULED':  return { label: 'برنامه‌ریزی شده',  type: 'upcoming' };
    default:           return { label: status,             type: 'upcoming' };
  }
}

// ─── Zone helpers (standings color coding) ───────────────────────────────────

export type ZoneType = 'ucl' | 'uel' | 'uecl' | 'relegation_playoff' | 'relegation';

export function getZoneType(code: string, position: number, total: number): ZoneType | null {
  switch (code) {
    case 'eng.1': // Premier League
      if (position <= 4) return 'ucl';
      if (position === 5) return 'uel';
      if (position === 6) return 'uecl';
      if (position >= total - 2) return 'relegation';
      return null;
    case 'esp.1': // LaLiga
    case 'ita.1': // Serie A
      if (position <= 4) return 'ucl';
      if (position === 5) return 'uel';
      if (position === 6) return 'uecl';
      if (position >= total - 2) return 'relegation';
      return null;
    case 'ger.1': // Bundesliga
      if (position <= 4) return 'ucl';
      if (position === 5) return 'uel';
      if (position === 6) return 'uecl';
      if (position === total - 1) return 'relegation_playoff';
      if (position >= total) return 'relegation';
      return null;
    case 'fra.1': // Ligue 1
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
    case 'ucl':               return 'bg-emerald-500';
    case 'uel':               return 'bg-orange-500';
    case 'uecl':              return 'bg-sky-400';
    case 'relegation_playoff': return 'bg-amber-500';
    case 'relegation':        return 'bg-red-500';
    default:                  return 'bg-transparent';
  }
}

// ─── Data conversion ──────────────────────────────────────────────────────────

function eventsToMatches(events: any[], code: string): LiveMatch[] {
  return events.map((e) => {
    const comp = e.competitions?.[0];
    const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
    const statusType = comp?.status?.type ?? e.status?.type ?? {};
    const state = statusType.state ?? 'unknown';
    const name = statusType.name ?? '';
    const minute: number | undefined = state === 'in' ? minuteFromStatus(comp?.status) : undefined;
    return {
      id: parseInt(e.id, 10),
      utcDate: e.date ?? '',
      status: mapStatus(state, name),
      minute,
      homeTeam: {
        id: parseInt(home?.team?.id ?? home?.id ?? '0', 10),
        name: home?.team?.displayName ?? home?.team?.name ?? '',
        shortName: home?.team?.abbreviation ?? '',
        crest: crestFromTeam(home?.team),
      },
      awayTeam: {
        id: parseInt(away?.team?.id ?? away?.id ?? '0', 10),
        name: away?.team?.displayName ?? away?.team?.name ?? '',
        shortName: away?.team?.abbreviation ?? '',
        crest: crestFromTeam(away?.team),
      },
      score: {
        fullTime: {
          home: home?.score != null ? parseInt(home.score, 10) : null,
          away: away?.score != null ? parseInt(away.score, 10) : null,
        },
        halfTime: { home: null, away: null },
      },
      competition: {
        id: 0,
        name: competitionMap[code]?.name ?? code,
        emblem: '',
        code,
      },
    };
  });
}

function isCompletedEvent(e: any): boolean {
  return Boolean(e.competitions?.[0]?.status?.type?.completed ?? e.status?.type?.completed);
}

function dedupe(matches: LiveMatch[]): LiveMatch[] {
  const seen = new Set<number>();
  return matches.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getLiveMatches(): Promise<LiveMatch[] | null> {
  const slugs = await getAvailableLeagueSlugs();
  if (!slugs.length) return null;
  const tomorrow = toDateKey(new Date(Date.now() + 86400000));
  const fetches = slugs.flatMap(code => [
    apiGet<any>(`${code}/scoreboard`)
      .then(d => d?.events ? eventsToMatches(d.events, code) : []),
    apiGet<any>(`${code}/scoreboard?dates=${tomorrow}`)
      .then(d => d?.events ? eventsToMatches(d.events, code) : []),
  ]);
  return dedupe((await Promise.all(fetches)).flat());
}

export async function getRecentMatches(): Promise<LiveMatch[] | null> {
  const slugs = await getAvailableLeagueSlugs();
  if (!slugs.length) return null;
  const yesterday  = toDateKey(new Date(Date.now() - 86400000));
  const twoDaysAgo = toDateKey(new Date(Date.now() - 2 * 86400000));
  const fetches = slugs.flatMap(code => [
    apiGet<any>(`${code}/scoreboard?dates=${yesterday}`)
      .then(d => d?.events ? eventsToMatches(d.events.filter(isCompletedEvent), code) : []),
    apiGet<any>(`${code}/scoreboard?dates=${twoDaysAgo}`)
      .then(d => d?.events ? eventsToMatches(d.events.filter(isCompletedEvent), code) : []),
  ]);
  return dedupe((await Promise.all(fetches)).flat());
}

export async function getCompetitionMatches(code: string): Promise<LiveMatch[] | null> {
  const d = await apiGet<any>(`${code}/scoreboard`);
  if (!d?.events) return null;
  return eventsToMatches(d.events, code);
}

export async function getStandings(code: string): Promise<Standing[] | null> {
  const d = await apiGet<any>(`${code}/standings`);
  if (!d) return null;

  const entries: any[] = (d.children ?? []).flatMap((c: any) => c.standings?.entries ?? []);
  if (!entries.length) return null;

  return entries.map((entry: any, idx: number) => {
    const stats: any[] = entry.stats ?? [];
    const get = (...names: string[]): number => {
      for (const n of names) {
        const s = stats.find((s: any) => s.name === n || s.abbreviation === n);
        if (s?.displayValue != null) {
          const num = Number(s.displayValue);
          return Number.isFinite(num) ? Math.round(num) : 0;
        }
      }
      return 0;
    };
    return {
      position: entry.rank ?? idx + 1,
      team: {
        id: parseInt(entry.team?.id ?? '0', 10),
        name: entry.team?.displayName ?? entry.team?.name ?? '',
        shortName: entry.team?.abbreviation ?? '',
        crest: crestFromTeam(entry.team),
      },
      playedGames: get('gamesPlayed', 'GP'),
      won:         get('wins', 'W'),
      draw:        get('ties', 'D', 'draws'),
      lost:        get('losses', 'L'),
      goalsFor:    get('pointsFor', 'GF', 'goals'),
      goalsAgainst:get('pointsAgainst', 'GA'),
      points:      get('points', 'PTS'),
    };
  });
}

// League-wide top scorers are not published by this API yet (no validated,
// structured collection for them on the server side) — the caller falls back
// to a static list when this returns null.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getTopScorers(_code: string): Promise<{ player: ApiPlayer; team: ApiTeam; goals: number; assists: number }[] | null> {
  return null;
}

function parseMinuteFromPlay(p: any): number {
  const disp: string = p.clock?.displayValue || '';
  const m = disp.match(/(\d+)/);
  if (m) return parseInt(m[1], 10);
  const period = p.period?.number ?? 1;
  const secs = p.clock?.value ?? 0;
  return period >= 2 ? 45 + Math.floor(secs / 60) : Math.floor(secs / 60);
}

function athleteRef(a: any): { id: number; name: string } | null {
  if (!a) return null;
  const athlete = a.athlete ?? a;
  const id = parseInt(athlete?.id ?? '0', 10);
  const name = athlete?.displayName ?? athlete?.name ?? '';
  if (!name) return null;
  return { id, name };
}

// Match detail — leagueCode is the league slug (e.g. 'eng.1')
export async function getMatch(id: number, leagueCode?: string): Promise<LiveMatchDetail | null> {
  const codes = leagueCode ? [leagueCode] : await getAvailableLeagueSlugs();
  for (const code of codes) {
    try {
      const summary = await apiGet<any>(`${code}/summary?event=${id}`);
      const comp = summary?.header?.competitions?.[0];
      if (!comp) continue;

      const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
      const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
      if (!home || !away) continue;

      const statusType = comp.status?.type ?? {};
      const state = statusType.state ?? 'unknown';
      const name = statusType.name ?? '';

      const plays = await apiGet<any>(`${code}/events/${id}/plays?important=true&limit=300`);
      const items: any[] = plays?.items ?? [];

      const goals: MatchGoal[] = items
        .filter(p => p.scoringPlay)
        .map(p => ({
          minute: parseMinuteFromPlay(p),
          type: p.penaltyKick ? 'PENALTY' : p.ownGoal ? 'OWN_GOAL' : 'NORMAL',
          team: { id: parseInt(p.team?.id ?? '0', 10), name: p.team?.displayName ?? p.team?.name ?? '' },
          scorer: athleteRef(p.athletesInvolved?.[0]),
          assist: athleteRef(p.athletesInvolved?.[1]),
        }));

      const bookings: MatchBooking[] = items
        .filter(p => p.yellowCard || p.redCard)
        .map(p => ({
          minute: parseMinuteFromPlay(p),
          team: { id: parseInt(p.team?.id ?? '0', 10), name: p.team?.displayName ?? p.team?.name ?? '' },
          player: athleteRef(p.athletesInvolved?.[0]),
          card: p.redCard ? 'RED' : 'YELLOW',
        }));

      const substitutions: MatchSubstitution[] = items
        .filter(p => p.substitution || p.type?.type === 'substitution')
        .map(p => {
          const participants = p.participants?.length ? p.participants : p.athletesInvolved ?? [];
          return {
            minute: parseMinuteFromPlay(p),
            team: { id: parseInt(p.team?.id ?? '0', 10), name: p.team?.displayName ?? p.team?.name ?? '' },
            playerIn: athleteRef(participants[0]),
            playerOut: athleteRef(participants[1]),
          };
        });

      return {
        id,
        utcDate: comp.date ?? '',
        status: mapStatus(state, name),
        minute: state === 'in' ? minuteFromStatus(comp.status) : undefined,
        homeTeam: {
          id: parseInt(home.team?.id ?? home.id ?? '0', 10),
          name: home.team?.displayName ?? home.team?.name ?? '',
          shortName: home.team?.abbreviation ?? '',
          crest: crestFromTeam(home.team),
        },
        awayTeam: {
          id: parseInt(away.team?.id ?? away.id ?? '0', 10),
          name: away.team?.displayName ?? away.team?.name ?? '',
          shortName: away.team?.abbreviation ?? '',
          crest: crestFromTeam(away.team),
        },
        score: {
          fullTime: {
            home: home.score != null ? parseInt(home.score, 10) : null,
            away: away.score != null ? parseInt(away.score, 10) : null,
          },
          halfTime: { home: null, away: null },
        },
        competition: {
          id: 0,
          name: competitionMap[code]?.name ?? code,
          emblem: '',
          code,
        },
        goals,
        bookings,
        substitutions,
        referees: (summary?.gameInfo?.officials ?? []).map((o: any) => ({
          id: 0,
          name: o.displayName ?? o.name ?? o.fullName ?? '',
          nationality: o.nationality ?? '',
        })),
      };
    } catch {
      // try next league
    }
  }
  return null;
}

export function hasApiKey(): boolean { return true; }
