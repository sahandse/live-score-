// World Cup 2026 live data service
// Priority: worldcup26.ir → ESPN → GitHub (schedule base + score overlay)

const GH_RAW = 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main';
const WC26   = 'https://worldcup26.ir';
const ESPN   = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

export interface WCTeam {
  id: string; fa: string; en: string;
  iso2: string; group: string; code: string;
  flag: string;
}

export interface WCStadium {
  id: string;
  name_fa: string; city_fa: string;
  country_fa: string; capacity: number;
}

export type MatchType = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';

export interface WCMatch {
  id: string;
  h: string; a: string;
  hs: number | null; as: number | null;
  st: 'upcoming' | 'live' | 'ht' | 'ft';
  min?: number;
  g: string; md: number;
  ld: string; sid: string;
  type: MatchType;
  hscorers: string | null; ascorers: string | null;
  hlabel?: string; alabel?: string;
  pd?: string;
}

export interface GRow {
  teamId: string;
  mp: number; w: number; d: number; l: number;
  gf: number; ga: number; pts: number;
}

export type DataSource = 'worldcup26' | 'espn' | 'github';

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
    g:   String(m.group ?? ''),
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

// ─── worldcup26.ir ────────────────────────────────────────────────────────────
async function tryWC26(): Promise<WCMatch[] | null> {
  for (const path of ['/get/matches', '/api/matches', '/get/games', '/api/games']) {
    try {
      const r = await fetch(`${WC26}${path}`, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(8000),
        mode: 'cors',
        credentials: 'omit',
      });
      if (!r.ok) continue;
      const d = await r.json();
      const arr: any[] = Array.isArray(d)
        ? d
        : (d.matches ?? d.games ?? d.data ?? d.result ?? []);
      if (arr.length > 0) return arr.map(rawToMatch);
    } catch { continue; }
  }
  return null;
}

// ─── ESPN fallback ────────────────────────────────────────────────────────────
type ScoreUpdate = Pick<WCMatch, 'h' | 'a' | 'hs' | 'as' | 'st' | 'min' | 'hscorers' | 'ascorers'>;

function buildCodeMap(teams: WCTeam[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const t of teams) map[t.code.toUpperCase()] = t.id;
  // Common ESPN abbreviation differences
  const aliases: Record<string, string> = {
    'IRI': 'IRN', 'IRAN': 'IRN',
    'USMNT': 'USA',
    'SWI': 'SUI', 'SWIZ': 'SUI',
    'SKO': 'KOR',
    'NIR': 'NIR',
    'CIV': 'CIV',
    'CPV': 'CPV',
    'COD': 'COD',
  };
  for (const [espn, fifa] of Object.entries(aliases)) {
    if (map[fifa] && !map[espn]) map[espn] = map[fifa];
  }
  return map;
}

function parseESPNEvent(e: any, codeMap: Record<string, string>): ScoreUpdate | null {
  try {
    const comp = e.competitions?.[0];
    if (!comp) return null;
    const homeC = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const awayC = comp.competitors?.find((c: any) => c.homeAway === 'away');
    if (!homeC || !awayC) return null;

    const h = codeMap[(homeC.team?.abbreviation ?? '').toUpperCase()];
    const a = codeMap[(awayC.team?.abbreviation ?? '').toUpperCase()];
    if (!h || !a) return null;

    const statusType = comp.status?.type ?? e.status?.type;
    const completed  = statusType?.completed ?? false;
    const state      = (statusType?.state ?? '').toLowerCase();
    const desc       = (statusType?.description ?? '').toLowerCase();
    const clock      = String(comp.status?.displayClock ?? e.status?.displayClock ?? '');

    let st: WCMatch['st'] = 'upcoming';
    if (completed) st = 'ft';
    else if (state === 'in') st = (desc.includes('half') ? 'ht' : 'live');

    const hs  = st !== 'upcoming' ? (parseInt(String(homeC.score ?? '0'), 10) || 0) : null;
    const as_ = st !== 'upcoming' ? (parseInt(String(awayC.score ?? '0'), 10) || 0) : null;
    const min = st === 'live' ? (parseInt(clock.split(':')[0], 10) || undefined) : undefined;

    // Scorers from competition details
    let hscorers: string | null = null;
    let ascorers: string | null = null;
    if (Array.isArray(comp.details)) {
      const hGoals: string[] = [], aGoals: string[] = [];
      for (const det of comp.details) {
        if (String(det.type?.id) !== '1') continue; // type 1 = goal
        const name  = det.athletesInvolved?.[0]?.shortName ?? det.athletesInvolved?.[0]?.displayName ?? '';
        const time  = det.clock?.displayValue ?? '';
        const entry = time ? `${name} ${time}'` : name;
        if (det.team?.abbreviation?.toUpperCase() === homeC.team?.abbreviation?.toUpperCase()) hGoals.push(entry);
        else aGoals.push(entry);
      }
      if (hGoals.length) hscorers = hGoals.join(', ');
      if (aGoals.length) ascorers = aGoals.join(', ');
    }

    return { h, a, hs, as: as_, st, min, hscorers, ascorers };
  } catch { return null; }
}

async function tryESPN(): Promise<ScoreUpdate[] | null> {
  const teams = await fetchTeams();
  if (!teams.length) return null;
  const codeMap = buildCodeMap(teams);

  // Try schedule first (full WC data), then scoreboard (recent)
  const now  = new Date();
  const from = '20260611';
  const to   = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()+1).padStart(2,'0')}`;

  const URLS = [
    `${ESPN}/fifa.worldcup/scoreboard`,
    `${ESPN}/fifa.world/scoreboard`,
    `${ESPN}/fifa.worldcup/schedule?dates=${from}-${to}&limit=120`,
    `${ESPN}/fifa.world/schedule?dates=${from}-${to}&limit=120`,
    `${ESPN}/soccerworldcup/scoreboard`,
  ];

  for (const url of URLS) {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/json' },
      });
      if (!r.ok) continue;
      const d = await r.json();
      const events: any[] = d.events ?? d.content?.schedule?.flatMap((w: any) => w.events ?? []) ?? [];
      if (!events.length) continue;

      const updates: ScoreUpdate[] = [];
      for (const e of events) {
        const u = parseESPNEvent(e, codeMap);
        if (u && (u.st === 'ft' || u.st === 'live' || u.st === 'ht')) updates.push(u);
      }
      if (updates.length) return updates;
    } catch { continue; }
  }
  return null;
}

// Overlay score updates from ESPN onto the GitHub schedule base
function applyOverlay(base: WCMatch[], updates: ScoreUpdate[]): WCMatch[] {
  const key = (h: string, a: string) => `${h}:${a}`;
  const map = new Map<string, ScoreUpdate>();
  for (const u of updates) map.set(key(u.h, u.a), u);
  return base.map(m => {
    const u = map.get(key(m.h, m.a));
    if (!u) return m;
    return { ...m, hs: u.hs, as: u.as, st: u.st, min: u.min,
      hscorers: u.hscorers ?? m.hscorers,
      ascorers: u.ascorers ?? m.ascorers };
  });
}

// ─── GitHub schedule (base, always 104 matches) ───────────────────────────────
async function tryGitHub(): Promise<WCMatch[] | null> {
  try {
    const r = await fetch(`${GH_RAW}/football.matches.json`);
    if (!r.ok) return null;
    const d = await r.json();
    return (Array.isArray(d) ? d : []).map(rawToMatch);
  } catch { return null; }
}

// ─── Public: fetch matches ────────────────────────────────────────────────────
export async function fetchMatches(): Promise<{ matches: WCMatch[]; source: DataSource } | null> {
  // 1. worldcup26.ir has full live database — best source
  const wc26 = await tryWC26();
  if (wc26?.length) return { matches: wc26, source: 'worldcup26' };

  // 2. ESPN + GitHub base: ESPN for live scores, GitHub for full schedule metadata
  const [espn, ghBase] = await Promise.all([tryESPN(), tryGitHub()]);
  if (ghBase?.length) {
    if (espn?.length) {
      return { matches: applyOverlay(ghBase, espn), source: 'espn' };
    }
    return { matches: ghBase, source: 'github' };
  }

  return null;
}

// ─── Standings: try live API first ────────────────────────────────────────────
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
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(8000),
        mode: 'cors',
        credentials: 'omit',
      });
      if (!r.ok) continue;
      const d = await r.json();
      const arr: any[] = Array.isArray(d) ? d : (d.tables ?? d.groups ?? d.data ?? []);
      if (arr.length >= 12) return parseApiStandings(arr);
    } catch { continue; }
  }
  // GitHub matchtables only if it has actual data
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
