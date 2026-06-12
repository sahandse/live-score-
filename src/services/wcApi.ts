// World Cup 2026 live data service
// Priority: worldcup26.ir → GitHub raw files

const GH_RAW = 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main';
const WC26   = 'https://worldcup26.ir';

export interface WCTeam {
  id: string; fa: string; en: string;
  iso2: string; group: string; code: string;
  flag: string;
}

export interface WCStadium {
  id: string;
  name_fa: string;
  city_fa: string;
  country_fa: string;
  capacity: number;
}

export type MatchType = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';

export interface WCMatch {
  id: string;
  h: string; a: string;              // home / away team id
  hs: number | null; as: number | null;
  st: 'upcoming' | 'live' | 'ht' | 'ft';
  min?: number;
  g: string; md: number;
  ld: string; sid: string;
  type: MatchType;
  hscorers: string | null;
  ascorers: string | null;
  hlabel?: string;   // knockout: "Runner-up Group A"
  alabel?: string;
  pd?: string;       // persian_date "1405-03-21 13:00"
}

export interface GRow {
  teamId: string;
  mp: number; w: number; d: number; l: number;
  gf: number; ga: number; pts: number;
}

export type DataSource = 'worldcup26' | 'github';

// ─── Timezone ─────────────────────────────────────────────────────────────────
const STAD_TZ: Record<string, number> = {
  '1':-5,'2':-5,'3':-5,'4':-5,'5':-5,'6':-5,
  '7':-4,'8':-4,'9':-4,'10':-4,'11':-4,'12':-4,
  '13':-7,'14':-7,'15':-7,'16':-7,
};

export function matchUtcDate(ld: string, sid: string): Date {
  const [d, t] = ld.split(' ');
  const [mo, dy, yr] = d.split('/').map(Number);
  const [hr, mn] = t.split(':').map(Number);
  const tz = STAD_TZ[sid] ?? -5;
  return new Date(Date.UTC(yr, mo - 1, dy, hr, mn) - tz * 3600000);
}

export function matchTehranTime(ld: string, sid: string): string {
  return matchUtcDate(ld, sid).toLocaleTimeString('fa-IR',
    { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' });
}

export function matchTehranDay(ld: string, sid: string): string {
  return matchUtcDate(ld, sid).toLocaleDateString('fa-IR',
    { timeZone: 'Asia/Tehran', weekday: 'long', month: 'long', day: 'numeric' });
}

export function matchTehranShort(ld: string, sid: string): string {
  return matchUtcDate(ld, sid).toLocaleDateString('fa-IR',
    { timeZone: 'Asia/Tehran', month: 'short', day: 'numeric' });
}

export function isTodayTehran(ld: string, sid: string): boolean {
  const dt = matchUtcDate(ld, sid);
  const today = new Date();
  const a = dt.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });
  const b = today.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' });
  return a === b;
}

// ─── Scorer parser ────────────────────────────────────────────────────────────
export function parseScorers(raw: string | null): string[] {
  if (!raw || raw === 'null' || raw === 'false' || raw.trim() === '') return [];
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
    } catch {}
  }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// ─── Parsers ──────────────────────────────────────────────────────────────────
function parseStatus(fin: string, el: string): WCMatch['st'] {
  if (fin.toUpperCase() === 'TRUE') return 'ft';
  const e = el.toLowerCase().trim();
  if (!e || e === 'notstarted' || e === 'false' || e === 'null') return 'upcoming';
  if (e === 'ht' || e.includes('half')) return 'ht';
  return 'live';
}

function parseMatchType(t: any): MatchType {
  const s = String(t ?? '').toLowerCase();
  if (s === 'r32') return 'r32';
  if (s === 'r16') return 'r16';
  if (s === 'qf')  return 'qf';
  if (s === 'sf')  return 'sf';
  if (s === 'third') return 'third';
  if (s === 'final') return 'final';
  return 'group';
}

function rawToMatch(m: any): WCMatch {
  const fin = String(m.finished ?? '');
  const el  = String(m.time_elapsed ?? m.timeElapsed ?? m.minute ?? '');
  const st  = parseStatus(fin, el);
  const hs  = parseInt(String(m.home_score ?? '0'), 10);
  const as_ = parseInt(String(m.away_score ?? '0'), 10);
  const hs_  = String(m.home_scorers ?? 'null').trim();
  const as__ = String(m.away_scorers ?? 'null').trim();
  return {
    id:  String(m.id ?? ''),
    h:   String(m.home_team_id ?? m.homeTeamId ?? ''),
    a:   String(m.away_team_id ?? m.awayTeamId ?? ''),
    hs:  st !== 'upcoming' ? (isNaN(hs)  ? 0 : hs)  : null,
    as:  st !== 'upcoming' ? (isNaN(as_) ? 0 : as_) : null,
    st, min: st === 'live' ? (parseInt(el, 10) || undefined) : undefined,
    g:   String(m.group    ?? ''),
    md:  parseInt(String(m.matchday ?? '1'), 10),
    ld:  String(m.local_date ?? m.localDate ?? ''),
    sid: String(m.stadium_id ?? m.stadiumId ?? ''),
    type: parseMatchType(m.type),
    hscorers: (hs_ === 'null' || hs_ === '') ? null : hs_,
    ascorers: (as__ === 'null' || as__ === '') ? null : as__,
    hlabel: m.home_team_label ? String(m.home_team_label) : undefined,
    alabel: m.away_team_label ? String(m.away_team_label) : undefined,
    pd: m.persian_date ? String(m.persian_date) : undefined,
  };
}

function rawToTeam(t: any): WCTeam {
  return {
    id:    String(t.id ?? ''),
    fa:    String(t.name_fa ?? t.nameFa ?? ''),
    en:    String(t.name_en ?? t.nameEn ?? ''),
    iso2:  String(t.iso2 ?? '').toLowerCase(),
    group: String(t.groups ?? t.group ?? ''),
    code:  String(t.fifa_code ?? t.fifaCode ?? ''),
    flag:  String(t.flag ?? ''),
  };
}

// ─── Teams (cached once) ──────────────────────────────────────────────────────
let _teamCache: WCTeam[] | null = null;

export async function fetchTeams(): Promise<WCTeam[]> {
  if (_teamCache) return _teamCache;
  try {
    const r = await fetch(`${GH_RAW}/football.teams.json`);
    if (r.ok) {
      const d = await r.json();
      _teamCache = (Array.isArray(d) ? d : []).map(rawToTeam);
      return _teamCache;
    }
  } catch { /* ignore */ }
  return [];
}

// ─── Stadiums (cached once) ───────────────────────────────────────────────────
let _stadiumCache: WCStadium[] | null = null;

export async function fetchStadiums(): Promise<WCStadium[]> {
  if (_stadiumCache) return _stadiumCache;
  try {
    const r = await fetch(`${GH_RAW}/football.stadiums.json`);
    if (r.ok) {
      const d = await r.json();
      _stadiumCache = (Array.isArray(d) ? d : []).map((s: any) => ({
        id:         String(s.id ?? ''),
        name_fa:    String(s.name_fa ?? ''),
        city_fa:    String(s.city_fa ?? ''),
        country_fa: String(s.country_fa ?? ''),
        capacity:   Number(s.capacity ?? 0),
      }));
      return _stadiumCache;
    }
  } catch { /* ignore */ }
  return [];
}

// ─── Matches (polled every 2 min) ─────────────────────────────────────────────
async function tryWC26(): Promise<WCMatch[] | null> {
  for (const path of ['/get/matches', '/api/matches', '/get/games', '/api/games']) {
    try {
      const r = await fetch(`${WC26}${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) continue;
      const d = await r.json();
      const arr: any[] = Array.isArray(d) ? d : (d.matches ?? d.games ?? d.data ?? []);
      if (arr.length > 0) return arr.map(rawToMatch);
    } catch { continue; }
  }
  return null;
}

async function tryGitHub(): Promise<WCMatch[] | null> {
  try {
    const r = await fetch(`${GH_RAW}/football.matches.json`);
    if (!r.ok) return null;
    const d = await r.json();
    return (Array.isArray(d) ? d : []).map(rawToMatch);
  } catch { return null; }
}

export async function fetchMatches(): Promise<{ matches: WCMatch[]; source: DataSource } | null> {
  const wc26 = await tryWC26();
  if (wc26?.length) return { matches: wc26, source: 'worldcup26' };
  const gh = await tryGitHub();
  if (gh?.length) return { matches: gh, source: 'github' };
  return null;
}

// ─── Standings: try live API, then compute from match results ─────────────────
function parseApiStandings(arr: any[]): Record<string, GRow[]> {
  const result: Record<string, GRow[]> = {};
  for (const group of arr) {
    const name = String(group.group ?? group.name ?? '').toUpperCase();
    if (!name || name.length !== 1) continue;
    const teams: any[] = Array.isArray(group.teams) ? group.teams : [];
    result[name] = teams.map((t: any) => ({
      teamId: String(t.team_id ?? ''),
      mp:  parseInt(String(t.mp  ?? '0'), 10),
      w:   parseInt(String(t.w   ?? '0'), 10),
      d:   parseInt(String(t.d   ?? '0'), 10),
      l:   parseInt(String(t.l   ?? '0'), 10),
      gf:  parseInt(String(t.gf  ?? '0'), 10),
      ga:  parseInt(String(t.ga  ?? '0'), 10),
      pts: parseInt(String(t.pts ?? '0'), 10),
    })).sort((x: GRow, y: GRow) => {
      if (y.pts !== x.pts) return y.pts - x.pts;
      const gdy = y.gf - y.ga, gdx = x.gf - x.ga;
      if (gdy !== gdx) return gdy - gdx;
      return y.gf - x.gf;
    });
  }
  return result;
}

export async function fetchApiStandings(): Promise<Record<string, GRow[]> | null> {
  for (const path of ['/get/tables', '/api/tables', '/get/groups', '/api/groups']) {
    try {
      const r = await fetch(`${WC26}${path}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) continue;
      const d = await r.json();
      const arr: any[] = Array.isArray(d) ? d : (d.tables ?? d.groups ?? d.data ?? []);
      if (arr.length >= 12) return parseApiStandings(arr);
    } catch { continue; }
  }
  // Fall back to GitHub matchtables only if it has real data
  try {
    const r = await fetch(`${GH_RAW}/football.matchtables.json`);
    if (r.ok) {
      const d = await r.json();
      const arr: any[] = Array.isArray(d) ? d : [];
      if (arr.length >= 12) {
        const parsed = parseApiStandings(arr);
        const hasData = Object.values(parsed).some(rows => rows.some(row => row.mp > 0));
        if (hasData) return parsed;
      }
    }
  } catch { /* ignore */ }
  return null;
}

// ─── Group standings (computed from match results) ────────────────────────────
export function computeStandings(matches: WCMatch[]): Record<string, GRow[]> {
  const gs: Record<string, Record<string, GRow>> = {};
  for (const m of matches) {
    if (!m.g || m.type !== 'group') continue;
    if (!gs[m.g]) gs[m.g] = {};
    for (const tid of [m.h, m.a]) {
      if (!gs[m.g][tid]) gs[m.g][tid] = { teamId: tid, mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 };
    }
    if ((m.st !== 'ft' && m.st !== 'live') || m.hs === null || m.as === null) continue;
    const h = gs[m.g][m.h], a = gs[m.g][m.a];
    h.mp++; h.gf += m.hs; h.ga += m.as;
    a.mp++; a.gf += m.as; a.ga += m.hs;
    if (m.hs > m.as)      { h.w++; h.pts += 3; a.l++; }
    else if (m.as > m.hs) { a.w++; a.pts += 3; h.l++; }
    else                  { h.d++; h.pts++;     a.d++; a.pts++; }
  }
  const result: Record<string, GRow[]> = {};
  for (const [g, rows] of Object.entries(gs)) {
    result[g] = Object.values(rows).sort((x, y) => {
      if (y.pts !== x.pts) return y.pts - x.pts;
      const gdy = y.gf - y.ga, gdx = x.gf - x.ga;
      if (gdy !== gdx) return gdy - gdx;
      return y.gf - x.gf;
    });
  }
  return result;
}
