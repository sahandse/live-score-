// Feed layer for the site.
//
// Primary provider: the public varzesh3 web API, the same one the natijeh-app
// Android client reads (web-api.varzesh3.com/v2.0). It answers without CORS
// headers, so the payload is fetched at build time by scripts/sync-data.mjs and
// served from /data/*.json on the same origin as the site.
// ESPN (services/footballApi.ts) stays as the fallback when no synced payload
// is present, e.g. a fresh clone built without running the sync.
import {
  getLiveMatches,
  getRecentMatches,
  getStandings,
  getTopScorers,
  getMatch,
  competitionMap,
  leagueIdToCompetition,
  translateStatus,
  type LiveMatch,
} from './footballApi';
import { toPersian } from '../hooks/usePersianDate';

export type Provider = 'varzesh3' | 'espn' | 'none';
export type FeedStatus = 'live' | 'halftime' | 'finished' | 'upcoming' | 'postponed' | 'cancelled';

export interface FeedSide {
  id: string;
  name: string;
  logo: string;
}

export interface FeedMatch {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  dayOffset: number;
  persianDate: string;
  time: string;
  utcStart: string;
  status: FeedStatus;
  statusText: string;
  minute: number;
  hasDetails: boolean;
  home: FeedSide;
  away: FeedSide;
  homeScore: number | null;
  awayScore: number | null;
}

export interface FeedFormTurn {
  result: string;
  tooltip: string;
  matchId: string;
}

export interface FeedStandingRow {
  rank: number;
  teamId: string;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  qualificationColor: string;
  form: FeedFormTurn[];
}

export interface FeedScorer {
  playerId: string;
  name: string;
  portrait: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  goals: number;
  assists: number;
}

export interface FeedFixtureRound {
  round: string;
  selected: boolean;
  matches: FeedMatch[];
}

export interface FeedEvent {
  minute: number;
  type: string;
  isHome: boolean;
  player: string;
  playerId: string;
  detail: string;
  extra: string;
  extraId: string;
}

export interface FeedStat {
  title: string;
  home: string;
  away: string;
  homePercent: number;
  awayPercent: number;
  positive: boolean;
}

export interface FeedLineupPlayer {
  id: string;
  name: string;
  number: number;
  portrait: string;
  line: number;
  position: string;
  rating: number;
  isCaptain: boolean;
}

export interface FeedLineup {
  homeFormation: string;
  awayFormation: string;
  homeCoach: string;
  awayCoach: string;
  homeStarting: FeedLineupPlayer[];
  awayStarting: FeedLineupPlayer[];
  homeBench: FeedLineupPlayer[];
  awayBench: FeedLineupPlayer[];
}

export interface FeedMatchDetail {
  id: string;
  title: string;
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  season: string;
  stadium: string;
  referee: string;
  persianDate: string;
  time: string;
  utcStart: string;
  status: FeedStatus;
  statusText: string;
  minute: number;
  home: FeedSide;
  away: FeedSide;
  homeScore: number | null;
  awayScore: number | null;
  events: FeedEvent[];
  stats: FeedStat[];
  lineup: FeedLineup;
}

export interface FeedTeam {
  id: string;
  name: string;
  logo: string;
  leagueId: string;
  leagueName: string;
  rank: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  qualificationColor: string;
  form: FeedFormTurn[];
  coach: string;
  formation: string;
  stadium: string;
  squad: FeedPlayer[];
}

export interface FeedPlayer {
  id: string;
  name: string;
  portrait: string;
  position: string;
  positionFa: string;
  number: number;
  age: number;
  countryFlag: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  goals: number;
  assists: number;
}

export interface FeedLeague {
  id: string;
  name: string;
  logo: string;
  priority: number;
  hasData: boolean;
}

export interface FeedMeta {
  generatedAt: string;
  provider: Provider;
  counts: Record<string, number>;
}

export interface MatchFeed {
  matches: FeedMatch[];
  provider: Provider;
  generatedAt: string | null;
}

// ─── Synced payload (public/data) ─────────────────────────────────────────────

const DATA_BASE = `${import.meta.env.BASE_URL}data/`;
const CACHE_TTL = 60_000;

type SyncedSide = { id: string; name: string; logo: string };
type SyncedMatch = {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  offset: number;
  persianDate: string;
  time: string;
  utcStart: string;
  status: string;
  statusTitle: string;
  liveTime: string;
  minute: number;
  hasDetails: boolean;
  home: SyncedSide;
  away: SyncedSide;
  homeScore: number | null;
  awayScore: number | null;
};
type SyncedFixtureRound = {
  round: string;
  selected: boolean;
  matches: {
    id: string;
    home: SyncedSide;
    away: SyncedSide;
    homeScore: number | null;
    awayScore: number | null;
    time: string;
    date: string;
    utcStart: string;
    status: string;
    statusTitle: string;
  }[];
};

const cache = new Map<string, { at: number; value: unknown }>();

const JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

// The feed mixes two shapes: league fixtures send "1405/08/07", livescore sends "7 آبان 1405".
function persianDateLabel(value: string): string {
  const slash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value.trim());
  if (!slash) return toPersian(value);
  const month = JALALI_MONTHS[Number(slash[2]) - 1];
  return month ? `${toPersian(Number(slash[3]))} ${month} ${toPersian(slash[1])}` : toPersian(value);
}

async function loadSynced<T>(file: string, refresh = false): Promise<T | null> {
  const key = file;
  const hit = cache.get(key);
  if (!refresh && hit && Date.now() - hit.at < CACHE_TTL) return hit.value as T;
  try {
    const response = await fetch(`${DATA_BASE}${file}`, { cache: refresh ? 'reload' : 'default' });
    if (!response.ok) return null;
    const value = (await response.json()) as T;
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}

export function clearFeedCache() {
  cache.clear();
}

const toStatus = (status: string): FeedStatus => {
  switch (status) {
    case 'LIVE':
      return 'live';
    case 'HALFTIME':
      return 'halftime';
    case 'FINISHED':
      return 'finished';
    case 'POSTPONED':
      return 'postponed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'upcoming';
  }
};

const readMatch = (raw: SyncedMatch, league?: { id: string; name: string; logo: string }): FeedMatch => ({
  id: raw.id,
  leagueId: raw.leagueId || league?.id || '',
  leagueName: raw.leagueName || league?.name || '',
  leagueLogo: raw.leagueLogo || league?.logo || '',
  dayOffset: raw.offset ?? 0,
  persianDate: persianDateLabel(raw.persianDate || ''),
  time: toPersian(raw.time || ''),
  utcStart: raw.utcStart || '',
  status: toStatus(raw.status),
  statusText: raw.statusTitle || '',
  minute: raw.minute || 0,
  hasDetails: raw.hasDetails === true,
  home: raw.home,
  away: raw.away,
  homeScore: raw.homeScore,
  awayScore: raw.awayScore,
});

// ─── ESPN fallback mapping ────────────────────────────────────────────────────

const tehranTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })
    : '';
const tehranDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' }) : '';

function tehranDayOffset(iso: string): number {
  if (!iso) return 0;
  const day = (value: Date) =>
    Number(value.toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' }).replace(/-/g, ''));
  const target = day(new Date(iso));
  const today = day(new Date());
  if (target === today) return 0;
  // Calendar-day distance, close enough for grouping upcoming/finished rows.
  const diffDays = Math.round(
    (Date.UTC(Math.floor(target / 10000), (Math.floor(target / 100)) % 100, target % 100) -
      Date.UTC(Math.floor(today / 10000), (Math.floor(today / 100)) % 100, today % 100)) /
      86_400_000
  );
  return Math.max(-2, Math.min(2, diffDays));
}

function fromEspn(raw: LiveMatch): FeedMatch {
  const { type } = translateStatus(raw.status);
  const status: FeedStatus = type === 'live' ? 'live' : type === 'halftime' ? 'halftime' : type === 'finished' ? 'finished' : 'upcoming';
  const code = raw.competition.code;
  return {
    id: String(raw.id),
    leagueId: code,
    leagueName: competitionMap[code]?.name ?? raw.competition.name,
    leagueLogo: raw.competition.emblem || '',
    dayOffset: tehranDayOffset(raw.utcDate),
    persianDate: tehranDate(raw.utcDate),
    time: tehranTime(raw.utcDate),
    utcStart: raw.utcDate,
    status,
    statusText: '',
    minute: raw.minute ?? 0,
    hasDetails: true,
    home: { id: String(raw.homeTeam.id), name: raw.homeTeam.name, logo: raw.homeTeam.crest },
    away: { id: String(raw.awayTeam.id), name: raw.awayTeam.name, logo: raw.awayTeam.crest },
    homeScore: raw.score.fullTime.home ?? raw.score.halfTime.home,
    awayScore: raw.score.fullTime.away ?? raw.score.halfTime.away,
  };
}

// ─── Public feed API ──────────────────────────────────────────────────────────

export async function getMeta(): Promise<FeedMeta | null> {
  const raw = await loadSynced<{ generatedAt: string; counts: Record<string, number> }>('meta.json');
  if (!raw) return null;
  return { generatedAt: raw.generatedAt, provider: 'varzesh3', counts: raw.counts ?? {} };
}

export async function getMatchFeed(options: { refresh?: boolean } = {}): Promise<MatchFeed> {
  const refresh = options.refresh === true;
  const payload = await loadSynced<{ generatedAt: string; matches: SyncedMatch[] }>('matches.json', refresh);
  if (payload?.matches?.length) {
    return {
      matches: payload.matches.map((raw) => readMatch(raw)),
      provider: 'varzesh3',
      generatedAt: payload.generatedAt ?? null,
    };
  }

  const [live, recent] = await Promise.all([getLiveMatches(), getRecentMatches()]);
  const matches = [...(live ?? []), ...(recent ?? [])];
  if (!matches.length) return { matches: [], provider: 'none', generatedAt: null };
  const deduped = new Map(matches.map((raw) => [String(raw.id), fromEspn(raw)]));
  return { matches: [...deduped.values()], provider: 'espn', generatedAt: null };
}

export async function getFeedLeagues(): Promise<FeedLeague[]> {
  const payload = await loadSynced<{ leagues: FeedLeague[] }>('leagues.json');
  if (payload?.leagues?.length) return payload.leagues;
  const feed = await getMatchFeed();
  const seen = new Map<string, FeedLeague>();
  feed.matches.forEach((match) => {
    if (!match.leagueId || seen.has(match.leagueId)) return;
    seen.set(match.leagueId, {
      id: match.leagueId,
      name: match.leagueName,
      logo: match.leagueLogo,
      priority: match.leagueId.startsWith('uefa') ? 10 : 20,
      hasData: false,
    });
  });
  return [...seen.values()].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, 'fa'));
}

export async function getLeagueStandings(leagueId: string): Promise<FeedStandingRow[]> {
  const payload = await loadSynced<{ standings: Record<string, FeedStandingRow[]> }>('standings.json');
  if (payload?.standings?.[leagueId]?.length) return payload.standings[leagueId];

  const code = leagueIdToCompetition[leagueId];
  const rows = await getStandings(code ?? leagueId);
  return (rows ?? []).map((row) => ({
    rank: row.position,
    teamId: String(row.team.id),
    teamName: row.team.name,
    teamLogo: row.team.crest,
    played: row.playedGames,
    won: row.won,
    drawn: row.draw,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalsFor - row.goalsAgainst,
    points: row.points,
    qualificationColor: '',
    form: [],
  }));
}

export async function getLeagueScorers(leagueId: string): Promise<FeedScorer[]> {
  const payload = await loadSynced<{ scorers: Record<string, FeedScorer[]> }>('scorers.json');
  if (payload?.scorers?.[leagueId]?.length) return payload.scorers[leagueId];

  const code = leagueIdToCompetition[leagueId];
  const leaders = await getTopScorers(code ?? leagueId);
  return (leaders ?? []).map((row) => ({
    playerId: String(row.player.id),
    name: row.player.name,
    portrait: '',
    teamId: String(row.team.id),
    teamName: row.team.name,
    teamLogo: row.team.crest,
    goals: row.goals,
    assists: row.assists,
  }));
}

export async function getLeagueMatches(leagueId: string): Promise<{ rounds: FeedFixtureRound[]; matches: FeedMatch[] }> {
  const [matchesPayload, fixturesPayload, leaguesPayload] = await Promise.all([
    loadSynced<{ matches: SyncedMatch[] }>('matches.json'),
    loadSynced<{ fixtures: Record<string, SyncedFixtureRound[]> }>('fixtures.json'),
    loadSynced<{ leagues: FeedLeague[] }>('leagues.json'),
  ]);

  const league = leaguesPayload?.leagues?.find((entry) => entry.id === leagueId);
  const live = (matchesPayload?.matches ?? [])
    .filter((raw) => raw.leagueId === leagueId)
    .map((raw) => readMatch(raw));

  if (!fixturesPayload?.fixtures?.[leagueId]?.length) {
    if (live.length) return { rounds: [], matches: live };
    const fallback = await getMatchFeed();
    return { rounds: [], matches: fallback.matches.filter((match) => match.leagueId === leagueId) };
  }

  const readFixture = (leagueIdValue: string, raw: SyncedFixtureRound['matches'][number]): FeedMatch => ({
    id: raw.id,
    leagueId: leagueIdValue,
    leagueName: league?.name ?? live[0]?.leagueName ?? '',
    leagueLogo: league?.logo ?? live[0]?.leagueLogo ?? '',
    dayOffset: tehranDayOffset(raw.utcStart),
    persianDate: persianDateLabel(raw.date || ''),
    time: toPersian(raw.time || ''),
    utcStart: raw.utcStart || '',
    status: toStatus(raw.status),
    statusText: raw.statusTitle || '',
    minute: 0,
    hasDetails: true,
    home: raw.home,
    away: raw.away,
    homeScore: raw.homeScore,
    awayScore: raw.awayScore,
  });

  const rounds: FeedFixtureRound[] = fixturesPayload.fixtures[leagueId].map((round) => ({
    round: round.round,
    selected: round.selected,
    matches: round.matches.map((raw) => readFixture(leagueId, raw)),
  }));

  const seen = new Set<string>();
  const flat = rounds.flatMap((round) => round.matches).concat(live).filter((match) => {
    if (seen.has(match.id)) return false;
    seen.add(match.id);
    return true;
  });
  return { rounds, matches: flat };
}

const emptyLineup: FeedLineup = {
  homeFormation: '-',
  awayFormation: '-',
  homeCoach: '',
  awayCoach: '',
  homeStarting: [],
  awayStarting: [],
  homeBench: [],
  awayBench: [],
};

const summaryToDetail = (summary: FeedMatch): FeedMatchDetail => ({
  id: summary.id,
  title: `${summary.home.name} - ${summary.away.name}`,
  leagueId: summary.leagueId,
  leagueName: summary.leagueName,
  leagueLogo: summary.leagueLogo,
  season: '',
  stadium: '',
  referee: '',
  persianDate: summary.persianDate,
  time: summary.time,
  utcStart: summary.utcStart,
  status: summary.status,
  statusText: summary.statusText,
  minute: summary.minute,
  home: summary.home,
  away: summary.away,
  homeScore: summary.homeScore,
  awayScore: summary.awayScore,
  events: [],
  stats: [],
  lineup: emptyLineup,
});

export async function getFeedMatchDetail(
  leagueId: string,
  matchId: string,
  refresh = false
): Promise<FeedMatchDetail | null> {
  // The sync writes the same uppercase varzesh3 status token as matches.json, so it needs the shared mapping.
  const payload = await loadSynced<{ items: Record<string, Omit<FeedMatchDetail, 'status'> & { status: string }> }>(
    'details.json',
    refresh
  );
  const synced = payload?.items?.[matchId];
  if (synced) {
    return {
      ...synced,
      status: toStatus(synced.status),
      persianDate: persianDateLabel(synced.persianDate || ''),
      time: toPersian(synced.time || ''),
      lineup: synced.lineup ?? emptyLineup,
    };
  }

  const feed = await getMatchFeed({ refresh });
  const summary = feed.matches.find((match) => match.id === matchId);
  const numericId = parseInt(matchId, 10);
  if (Number.isNaN(numericId)) return summary ? summaryToDetail(summary) : null;

  const espn = await getMatch(numericId, leagueIdToCompetition[leagueId] ?? leagueId);
  if (!espn) return summary ? summaryToDetail(summary) : null;
  const { type } = translateStatus(espn.status);
  return {
    id: String(espn.id),
    title: `${espn.homeTeam.name} - ${espn.awayTeam.name}`,
    leagueId: espn.competition.code,
    leagueName: competitionMap[espn.competition.code]?.name ?? espn.competition.name,
    leagueLogo: espn.competition.emblem || '',
    season: '',
    stadium: '',
    referee: espn.referees?.[0]?.name ?? '',
    persianDate: tehranDate(espn.utcDate),
    time: tehranTime(espn.utcDate),
    utcStart: espn.utcDate,
    status: type === 'live' ? 'live' : type === 'halftime' ? 'halftime' : type === 'finished' ? 'finished' : 'upcoming',
    statusText: '',
    minute: espn.minute ?? 0,
    home: { id: String(espn.homeTeam.id), name: espn.homeTeam.name, logo: espn.homeTeam.crest },
    away: { id: String(espn.awayTeam.id), name: espn.awayTeam.name, logo: espn.awayTeam.crest },
    homeScore: espn.score.fullTime.home ?? espn.score.halfTime.home,
    awayScore: espn.score.fullTime.away ?? espn.score.halfTime.away,
    events: [
      ...espn.goals.map((goal) => ({
        minute: goal.minute,
        type: 'GOAL',
        isHome: String(goal.team.id) === String(espn.homeTeam.id),
        player: goal.scorer?.name ?? '',
        playerId: goal.scorer ? String(goal.scorer.id) : '',
        detail: '',
        extra: goal.assist?.name ?? '',
        extraId: '',
      })),
      ...espn.bookings.map((booking) => ({
        minute: booking.minute,
        type: booking.card === 'YELLOW' ? 'CARD_YELLOW' : 'CARD_RED',
        isHome: String(booking.team.id) === String(espn.homeTeam.id),
        player: booking.player?.name ?? '',
        playerId: booking.player ? String(booking.player.id) : '',
        detail: '',
        extra: '',
        extraId: '',
      })),
      ...espn.substitutions.map((sub) => ({
        minute: sub.minute,
        type: 'SUBSTITUTION',
        isHome: String(sub.team.id) === String(espn.homeTeam.id),
        player: sub.playerIn?.name ?? '',
        playerId: sub.playerIn ? String(sub.playerIn.id) : '',
        detail: '',
        extra: sub.playerOut?.name ?? '',
        extraId: '',
      })),
    ].sort((a, b) => a.minute - b.minute),
    stats: [],
    lineup: emptyLineup,
  };
}

export async function getFeedTeams(): Promise<{ teams: FeedTeam[]; provider: Provider }> {
  const [teamsPayload, squadsPayload] = await Promise.all([
    loadSynced<{ teams: FeedTeam[] }>('teams.json'),
    loadSynced<{ squads: Record<string, { players: FeedPlayer[] }> }>('squads.json'),
  ]);
  if (!teamsPayload?.teams?.length) return { teams: [], provider: 'none' };
  const squads = squadsPayload?.squads ?? {};
  return {
    teams: teamsPayload.teams.map((team) => ({
      ...team,
      form: team.form ?? [],
      squad: (squads[team.id]?.players ?? []).map((player) => ({
        ...player,
        teamId: player.teamId || team.id,
        teamName: player.teamName || team.name,
        teamLogo: player.teamLogo || team.logo,
      })),
    })),
    provider: 'varzesh3',
  };
}

export async function getFeedPlayers(): Promise<FeedPlayer[]> {
  const payload = await loadSynced<{ players: FeedPlayer[] }>('players.json');
  return payload?.players ?? [];
}
