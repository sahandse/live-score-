// ESPN unofficial API — no key needed, CORS-open from any browser origin
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

const ALL_LEAGUES = [
  'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1',
  'uefa.champions_league', 'uefa.europa', 'ned.1', 'por.1',
];
const TOP_LEAGUES = ['eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1'];

function toEspnDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function espnGet<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${ESPN}/${path}`);
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch {
    return null;
  }
}

function mapStatus(name: string): string {
  switch (name) {
    case 'STATUS_IN_PROGRESS': return 'IN_PLAY';
    case 'STATUS_HALFTIME':    return 'PAUSED';
    case 'STATUS_FINAL':
    case 'STATUS_FULL_TIME':   return 'FINISHED';
    default:                   return 'SCHEDULED';
  }
}

// ─── Exported types (same shape as before) ──────────────────────────────────

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

// ─── Competition map (keys = ESPN league codes) ───────────────────────────────

export const competitionMap: Record<string, { name: string; flag: string }> = {
  'eng.1':               { name: 'لیگ برتر انگلیس',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'esp.1':               { name: 'لالیگا',              flag: '🇪🇸' },
  'ger.1':               { name: 'بوندسلیگا',          flag: '🇩🇪' },
  'ita.1':               { name: 'سری آ',              flag: '🇮🇹' },
  'fra.1':               { name: 'لیگ ۱ فرانسه',      flag: '🇫🇷' },
  'uefa.champions_league': { name: 'لیگ قهرمانان اروپا', flag: '🇪🇺' },
  'uefa.europa':         { name: 'لیگ اروپا',          flag: '🇪🇺' },
  'ned.1':               { name: 'اردیویزیه',          flag: '🇳🇱' },
  'por.1':               { name: 'لیگ برتر پرتغال',    flag: '🇵🇹' },
  'bra.1':               { name: 'سری آ برزیل',        flag: '🇧🇷' },
};

// Internal league IDs → ESPN codes
export const leagueIdToCompetition: Record<string, string> = {
  epl:         'eng.1',
  laliga:      'esp.1',
  bundesliga:  'ger.1',
  seriea:      'ita.1',
  ligue1:      'fra.1',
  ucl:         'uefa.champions_league',
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
    const sName = e.status?.type?.name ?? 'STATUS_SCHEDULED';
    let minute: number | undefined;
    if (sName === 'STATUS_IN_PROGRESS') {
      const elapsed = Math.floor(e.status?.clock ?? 0);
      minute = (e.status?.period ?? 1) >= 2 ? 45 + elapsed : elapsed;
    } else if (sName === 'STATUS_HALFTIME') {
      minute = 45;
    }
    return {
      id: parseInt(e.id, 10),
      utcDate: e.date ?? '',
      status: mapStatus(sName),
      minute,
      homeTeam: {
        id: parseInt(home?.team?.id ?? '0', 10),
        name: home?.team?.displayName ?? '',
        shortName: home?.team?.abbreviation ?? '',
        crest: home?.team?.logo ?? '',
      },
      awayTeam: {
        id: parseInt(away?.team?.id ?? '0', 10),
        name: away?.team?.displayName ?? '',
        shortName: away?.team?.abbreviation ?? '',
        crest: away?.team?.logo ?? '',
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
  const tomorrow = toEspnDate(new Date(Date.now() + 86400000));
  const fetches = ALL_LEAGUES.flatMap(code => [
    espnGet<any>(`${code}/scoreboard`)
      .then(d => d?.events ? eventsToMatches(d.events, code) : []),
    espnGet<any>(`${code}/scoreboard?dates=${tomorrow}`)
      .then(d => d?.events ? eventsToMatches(d.events, code) : []),
  ]);
  return dedupe((await Promise.all(fetches)).flat());
}

export async function getRecentMatches(): Promise<LiveMatch[] | null> {
  const yesterday  = toEspnDate(new Date(Date.now() - 86400000));
  const twoDaysAgo = toEspnDate(new Date(Date.now() - 2 * 86400000));
  const fetches = TOP_LEAGUES.flatMap(code => [
    espnGet<any>(`${code}/scoreboard?dates=${yesterday}`)
      .then(d => d?.events ? eventsToMatches(d.events.filter((e: any) => e.status?.type?.completed), code) : []),
    espnGet<any>(`${code}/scoreboard?dates=${twoDaysAgo}`)
      .then(d => d?.events ? eventsToMatches(d.events.filter((e: any) => e.status?.type?.completed), code) : []),
  ]);
  return dedupe((await Promise.all(fetches)).flat());
}

export async function getCompetitionMatches(code: string): Promise<LiveMatch[] | null> {
  const d = await espnGet<any>(`${code}/scoreboard`);
  if (!d?.events) return null;
  return eventsToMatches(d.events, code);
}

export async function getStandings(code: string): Promise<Standing[] | null> {
  const d = await espnGet<any>(`${code}/standings`);
  if (!d) return null;

  let entries: any[] = d.standings?.entries ?? [];
  if (!entries.length && d.children?.length) {
    entries = d.children.flatMap((c: any) => c.standings?.entries ?? []);
  }
  if (!entries.length) return null;

  return entries.map((entry: any, idx: number) => {
    const stats: any[] = entry.stats ?? [];
    const get = (...names: string[]): number => {
      for (const n of names) {
        const s = stats.find((s: any) => s.name === n || s.abbreviation === n);
        if (s?.value !== undefined) {
          return typeof s.value === 'number' ? Math.round(s.value) : parseInt(s.value, 10) || 0;
        }
      }
      return 0;
    };
    return {
      position: idx + 1,
      team: {
        id: parseInt(entry.team?.id ?? '0', 10),
        name: entry.team?.displayName ?? '',
        shortName: entry.team?.abbreviation ?? '',
        crest: entry.team?.logos?.[0]?.href ?? '',
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

export async function getTopScorers(code: string): Promise<{ player: ApiPlayer; team: ApiTeam; goals: number; assists: number }[] | null> {
  const d = await espnGet<any>(`${code}/leaders`);
  if (!d) return null;
  const goalCat = (d.leaders ?? []).find((l: any) =>
    (l.name ?? '').toLowerCase().includes('goal') ||
    (l.displayName ?? '').toLowerCase().includes('goal')
  );
  if (!goalCat?.leaders?.length) return null;
  return goalCat.leaders.slice(0, 10).map((l: any) => ({
    player: {
      id: parseInt(l.athlete?.id ?? '0', 10),
      name: l.athlete?.displayName ?? '',
      position: l.athlete?.position?.abbreviation ?? '',
      nationality: '',
      dateOfBirth: '',
    },
    team: {
      id: parseInt(l.team?.id ?? '0', 10),
      name: l.team?.displayName ?? '',
      shortName: l.team?.abbreviation ?? '',
      crest: l.team?.logos?.[0]?.href ?? '',
    },
    goals: l.value ?? 0,
    assists: 0,
  }));
}

// Match detail — leagueCode is the ESPN code (e.g. 'eng.1')
export async function getMatch(id: number, leagueCode?: string): Promise<LiveMatchDetail | null> {
  const codes = leagueCode ? [leagueCode, ...ALL_LEAGUES.filter(c => c !== leagueCode)] : ALL_LEAGUES;
  for (const code of codes) {
    try {
      const r = await fetch(`${ESPN}/${code}/summary?event=${id}`);
      if (!r.ok) continue;
      const d = await r.json();
      const comp = d.header?.competitions?.[0];
      if (!comp) continue;

      const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
      const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
      if (!home || !away) continue;

      const sName = comp.status?.type?.name ?? 'STATUS_SCHEDULED';

      const htHome = home.linescores?.[0]?.value ?? null;
      const htAway = away.linescores?.[0]?.value ?? null;

      const goals: MatchGoal[] = (d.plays ?? [])
        .filter((p: any) => p.scoringPlay)
        .map((p: any) => {
          // Parse minute from play text e.g. "Goal by Player (45')"
          const mMatch = (p.text ?? '').match(/\((\d+)'/);
          const period = p.period?.number ?? 1;
          const minute = mMatch
            ? parseInt(mMatch[1], 10)
            : period >= 2
              ? 45 + Math.floor((p.clock?.value ?? 0) / 60)
              : Math.floor((p.clock?.value ?? 0) / 60);
          return {
            minute,
            type: 'NORMAL',
            team: { id: parseInt(p.team?.id ?? '0', 10), name: p.team?.displayName ?? '' },
            scorer: p.participants?.[0]?.athlete
              ? { id: parseInt(p.participants[0].athlete.id, 10), name: p.participants[0].athlete.displayName }
              : null,
            assist: null,
          };
        });

      return {
        id,
        utcDate: comp.date ?? '',
        status: mapStatus(sName),
        minute: sName === 'STATUS_IN_PROGRESS' ? Math.floor(comp.status?.clock ?? 0) : undefined,
        homeTeam: {
          id: parseInt(home.id, 10),
          name: home.team?.displayName ?? '',
          shortName: home.team?.abbreviation ?? '',
          crest: home.team?.logos?.[0]?.href ?? '',
        },
        awayTeam: {
          id: parseInt(away.id, 10),
          name: away.team?.displayName ?? '',
          shortName: away.team?.abbreviation ?? '',
          crest: away.team?.logos?.[0]?.href ?? '',
        },
        score: {
          fullTime: {
            home: home.score != null ? parseInt(home.score, 10) : null,
            away: away.score != null ? parseInt(away.score, 10) : null,
          },
          halfTime: {
            home: htHome !== null ? Math.round(htHome) : null,
            away: htAway !== null ? Math.round(htAway) : null,
          },
        },
        competition: {
          id: 0,
          name: competitionMap[code]?.name ?? code,
          emblem: '',
          code,
        },
        goals,
        bookings: [],
        substitutions: [],
        referees: [],
      };
    } catch {
      // try next league
    }
  }
  return null;
}

export function hasApiKey(): boolean { return true; }
