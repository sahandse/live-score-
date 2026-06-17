import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Trophy, Shield, Share2, Bell, BellOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import {
  fetchTeams, fetchMatches, fetchStadiums, fetchApiStandings, computeStandings,
  matchTehranTime, matchTehranShort, matchTehranDay, matchUtcDate, isTodayTehran,
  parseScorers,
  type WCTeam, type WCMatch, type WCStadium, type GRow, type MatchType,
} from '../services/wcApi';
import { fetchWeatherForMatches, type WeatherData } from '../services/weatherApi';

// ─── Static data ──────────────────────────────────────────────────────────────
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const CONF_MAP: Record<string, string> = {
  MEX:'CONCACAF', RSA:'CAF', KOR:'AFC', CZE:'UEFA',
  CAN:'CONCACAF', BIH:'UEFA', QAT:'AFC', SUI:'UEFA',
  BRA:'CONMEBOL', MAR:'CAF', HAI:'CONCACAF', SCO:'UEFA',
  USA:'CONCACAF', PAR:'CONMEBOL', AUS:'AFC', TUR:'UEFA',
  GER:'UEFA', CUW:'CONCACAF', CIV:'CAF', ECU:'CONMEBOL',
  NED:'UEFA', JPN:'AFC', SWE:'UEFA', TUN:'CAF',
  BEL:'UEFA', EGY:'CAF', IRN:'AFC', NZL:'OFC',
  ESP:'UEFA', CPV:'CAF', KSA:'AFC', URU:'CONMEBOL',
  FRA:'UEFA', SEN:'CAF', IRQ:'AFC', NOR:'UEFA',
  ARG:'CONMEBOL', ALG:'CAF', AUT:'UEFA', JOR:'AFC',
  POR:'UEFA', COD:'CAF', UZB:'AFC', COL:'CONMEBOL',
  ENG:'UEFA', CRO:'UEFA', GHA:'CAF', PAN:'CONCACAF',
};

const CONF_CL: Record<string, string> = {
  UEFA:    'text-blue-400 border-blue-500/30 bg-blue-500/10',
  CONMEBOL:'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  AFC:     'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  CAF:     'text-red-400 border-red-500/30 bg-red-500/10',
  CONCACAF:'text-orange-400 border-orange-500/30 bg-orange-500/10',
  OFC:     'text-purple-400 border-purple-500/30 bg-purple-500/10',
};

const PHASE_LABEL: Record<MatchType, { fa: string; dates: string; matches: number }> = {
  group: { fa: 'مرحله گروهی',    dates: '۱۱–۲۷ جون',    matches: 72 },
  r32:   { fa: 'یک‌هشتم نهایی', dates: '۳–۲۸ جون',     matches: 16 },
  r16:   { fa: 'یک‌چهارم نهایی',dates: '۷–۴ جولای',    matches: 8  },
  qf:    { fa: 'ربع‌نهایی',     dates: '۱۱–۹ جولای',   matches: 4  },
  sf:    { fa: 'نیمه‌نهایی',    dates: '۱۵–۱۴ جولای',  matches: 2  },
  third: { fa: 'رده سوم',       dates: '۱۸ جولای',     matches: 1  },
  final: { fa: 'فینال',         dates: '۱۹ جولای',     matches: 1  },
};

// ─── Video map: FIFA code key "HOME-AWAY" → direct Varzesh3 CDN URL ──────────
const VIDEO_MAP: Record<string, string> = {
  'KOR-CZE': 'https://video-vcdn.varzesh3.com/videos-quality/2026/06/12/B/0wfw1qoo.mp4',
  'MEX-RSA': 'https://video-vcdn.varzesh3.com/videos-quality/2026/06/12/A/0lgin4nu.mp4',
};

// ─── Module-level helpers ─────────────────────────────────────────────────────
function padPer(n: number): string {
  return n < 10 ? `۰${toPersian(n)}` : toPersian(n);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const { darkMode, tab, refreshInterval } = useApp();
  const [selGroup, setSelGroup]     = useState('A');
  const [confFilter, setConfFilter] = useState('all');
  const [liveFilter, setLiveFilter] = useState<'all' | 'iran' | 'live'>('all');

  const [teams,    setTeams]    = useState<WCTeam[]>([]);
  const [stadiums, setStadiums] = useState<WCStadium[]>([]);
  const [matches,  setMatches]  = useState<WCMatch[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [updated,  setUpdated]  = useState<Date | null>(null);
  const [started,  setStarted]  = useState(false);
  const [apiStandings, setApiStandings] = useState<Record<string, GRow[]> | null>(null);

  // New features state
  const [weatherMap,  setWeatherMap]  = useState<Record<string, WeatherData>>({});
  const [countdown,   setCountdown]   = useState('');
  const [shareToast,  setShareToast]  = useState(false);
  const [notifPerm,   setNotifPerm]   = useState<string>(() => {
    try { return Notification.permission; } catch { return 'default'; }
  });

  // Tournament start check
  useEffect(() => {
    const check = () => setStarted(Date.now() >= new Date('2026-06-11T18:00:00Z').getTime());
    check();
    const t = setInterval(check, 1000);
    return () => clearInterval(t);
  }, []);

  // Load static data once
  useEffect(() => {
    fetchTeams().then(setTeams);
    fetchStadiums().then(setStadiums);
  }, []);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    const [res, st] = await Promise.all([fetchMatches(), fetchApiStandings()]);
    if (res) { setMatches(res.matches); setUpdated(new Date()); }
    if (st)  setApiStandings(st);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMatches();
    const t = setInterval(loadMatches, refreshInterval);
    return () => clearInterval(t);
  }, [loadMatches, refreshInterval]);

  const teamMap = useMemo(
    () => Object.fromEntries(teams.map(t => [t.id, t])),
    [teams]
  ) as Record<string, WCTeam>;

  const stadiumMap = useMemo(
    () => Object.fromEntries(stadiums.map(s => [s.id, s])),
    [stadiums]
  ) as Record<string, WCStadium>;

  const standings = useMemo(
    () => apiStandings ?? computeStandings(matches),
    [apiStandings, matches]
  );

  const liveMatches  = matches.filter(m => m.st === 'live' || m.st === 'ht');
  const todayMatches = matches.filter(m => m.ld && m.sid && isTodayTehran(m.ld, m.sid));
  const groupMatches = matches.filter(m => m.type === 'group');

  // ─── Iran countdown ──────────────────────────────────────────────────────────
  const nextIranMatch = useMemo(() => {
    const now = Date.now();
    return matches
      .filter(m => (m.h === '27' || m.a === '27') && m.st === 'upcoming' && m.ld && m.sid)
      .sort((a, b) => matchUtcDate(a.ld, a.sid).getTime() - matchUtcDate(b.ld, b.sid).getTime())
      .find(m => matchUtcDate(m.ld, m.sid).getTime() > now) ?? null;
  }, [matches]);

  useEffect(() => {
    if (!nextIranMatch) { setCountdown(''); return; }
    const update = () => {
      const diff = matchUtcDate(nextIranMatch.ld, nextIranMatch.sid).getTime() - Date.now();
      if (diff <= 0) { setCountdown(''); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setCountdown(`${padPer(h)}:${padPer(m)}:${padPer(s)}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [nextIranMatch]);

  // ─── Top scorers ─────────────────────────────────────────────────────────────
  const topScorers = useMemo(() => {
    const map: Record<string, { name: string; goals: number }> = {};
    for (const m of matches) {
      if (m.st !== 'ft' && m.st !== 'live') continue;
      [...parseScorers(m.hscorers), ...parseScorers(m.ascorers)].forEach(raw => {
        const name = raw.replace(/\s+\d+[''′]?\s*$/, '').trim();
        if (!name) return;
        if (!map[name]) map[name] = { name, goals: 0 };
        map[name].goals += 1;
      });
    }
    return Object.values(map).sort((a, b) => b.goals - a.goals).slice(0, 10);
  }, [matches]);

  // ─── Weather ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    const sids = [...new Set([
      ...todayMatches.map(m => m.sid),
      ...matches.filter(m => m.st === 'upcoming').slice(0, 6).map(m => m.sid),
    ])].filter(Boolean);
    if (sids.length) fetchWeatherForMatches(sids).then(setWeatherMap);
  }, [started, matches.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Live tab filters ─────────────────────────────────────────────────────────
  const filteredLive = liveFilter === 'iran'
    ? liveMatches.filter(m => m.h === '27' || m.a === '27')
    : liveMatches;

  const filteredToday = liveFilter === 'iran'
    ? todayMatches.filter(m => m.h === '27' || m.a === '27')
    : liveFilter === 'live'
      ? todayMatches.filter(m => m.st === 'live' || m.st === 'ht')
      : todayMatches;

  const knockoutByPhase = useMemo(() => {
    const phases: MatchType[] = ['r32','r16','qf','sf','third','final'];
    const out: Partial<Record<MatchType, WCMatch[]>> = {};
    for (const p of phases) {
      const ms = matches.filter(m => m.type === p);
      if (ms.length) out[p] = ms;
    }
    return out;
  }, [matches]);

  const scheduleByDay = useMemo(() => {
    const days: Record<string, WCMatch[]> = {};
    for (const m of groupMatches) {
      if (!m.ld || !m.sid) continue;
      const day = matchTehranDay(m.ld, m.sid);
      if (!days[day]) days[day] = [];
      days[day].push(m);
    }
    return Object.entries(days).sort((a, b) => {
      const da = matchUtcDate(a[1][0].ld, a[1][0].sid);
      const db = matchUtcDate(b[1][0].ld, b[1][0].sid);
      return da.getTime() - db.getTime();
    });
  }, [groupMatches]);

  const card  = `rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`;
  const muted = darkMode ? 'text-gray-500' : 'text-gray-400';

  // ─── Share ────────────────────────────────────────────────────────────────────
  function doShare(m: WCMatch, ht?: WCTeam, at?: WCTeam) {
    const home = ht?.fa ?? m.hlabel ?? '؟';
    const away = at?.fa ?? m.alabel ?? '؟';
    const text = m.st === 'ft'
      ? `${home} ${toPersian(m.hs ?? 0)} - ${toPersian(m.as ?? 0)} ${away} | جام جهانی ۲۰۲۶`
      : `${home} - ${away} | ${m.ld && m.sid ? matchTehranTime(m.ld, m.sid) : ''} | جام جهانی ۲۰۲۶`;
    if (navigator.share) {
      navigator.share({ title: 'جام جهانی ۲۰۲۶', text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────────────
  async function requestNotif() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === 'granted' && nextIranMatch) {
      const matchTime = matchUtcDate(nextIranMatch.ld, nextIranMatch.sid).getTime();
      const delay = matchTime - 15 * 60 * 1000 - Date.now();
      const ht = teamMap[nextIranMatch.h];
      const at = teamMap[nextIranMatch.a];
      if (delay > 0 && delay < 23 * 3_600_000) {
        setTimeout(() => {
          new Notification('⚽ بازی ایران ۱۵ دقیقه دیگر!', {
            body: `${ht?.fa ?? '؟'} در مقابل ${at?.fa ?? '؟'} | جام جهانی ۲۰۲۶`,
            icon: '/favicon.svg',
          });
        }, delay);
      }
    }
  }

  // ─── Sub-components ───────────────────────────────────────────────────────────
  function Flag({ iso2, size = 'md' }: { iso2?: string; size?: 'sm' | 'md' | 'lg' }) {
    if (!iso2) return <span className={size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base'}>🏳️</span>;
    const cls = size === 'lg' ? 'w-12 h-8' : size === 'md' ? 'w-8 h-5' : 'w-6 h-4';
    return <img src={`https://flagcdn.com/w40/${iso2}.png`} className={`${cls} object-cover rounded-sm flex-shrink-0`} alt="" />;
  }

  function Scorers({ scorers, side }: { scorers: string | null; side: 'home' | 'away' }) {
    const list = parseScorers(scorers);
    if (!list.length) return null;
    return (
      <div className={`flex flex-col gap-0.5 text-xs ${muted} ${side === 'home' ? 'items-end' : 'items-start'}`}>
        {list.map((s, i) => (
          <span key={i} className="flex items-center gap-1">
            {side === 'away' && <span className="text-emerald-500">⚽</span>}
            <span>{s}</span>
            {side === 'home' && <span className="text-emerald-500">⚽</span>}
          </span>
        ))}
      </div>
    );
  }

  function MatchRow({ m, compact, showStadium }: { m: WCMatch; compact?: boolean; showStadium?: boolean }) {
    const ht = teamMap[m.h];
    const at = teamMap[m.a];
    const isIran = m.h === '27' || m.a === '27';
    const stad = stadiumMap[m.sid];
    const weather = m.st === 'upcoming' && m.sid ? weatherMap[m.sid] : undefined;
    const hasScorers = (m.hscorers && m.hscorers !== 'null') || (m.ascorers && m.ascorers !== 'null');
    const baseRow = `px-3 py-2.5 ${isIran && started ? darkMode ? 'bg-emerald-950/20' : 'bg-emerald-50/50' : ''}`;

    return (
      <div className={baseRow}>
        <div className="flex items-center gap-2">
          {m.st === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse flex-shrink-0" />}
          {m.st === 'ht'   && <span className="text-xs font-bold text-yellow-400 flex-shrink-0">نیمه</span>}

          {/* Home */}
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span className={`text-xs font-semibold truncate ${ht?.id === '27' ? 'text-emerald-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {ht?.fa ?? m.hlabel ?? '—'}
            </span>
            <Flag iso2={ht?.iso2} size="sm" />
          </div>

          {/* Score / Time */}
          <div className="flex flex-col items-center min-w-[64px] flex-shrink-0">
            {m.st !== 'upcoming' && m.hs !== null && m.as !== null ? (
              <>
                <span className={`text-base font-black tabular-nums ${m.st === 'live' ? 'text-red-400' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {toPersian(m.hs)} – {toPersian(m.as)}
                </span>
                <span className={`text-xs ${m.st === 'live' ? 'text-red-500' : m.st === 'ht' ? 'text-yellow-500' : muted}`}>
                  {m.st === 'live' && m.min ? `${toPersian(m.min)}'` : m.st === 'ft' ? 'پایان' : ''}
                </span>
              </>
            ) : (
              <>
                <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {m.ld && m.sid ? matchTehranTime(m.ld, m.sid) : '—'}
                </span>
                {!compact && m.ld && m.sid && (
                  <span className={`text-xs ${muted}`}>{matchTehranShort(m.ld, m.sid)}</span>
                )}
              </>
            )}
            {!compact && m.type === 'group' && (
              <span className={`text-xs ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>گروه {m.g}</span>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Flag iso2={at?.iso2} size="sm" />
            <span className={`text-xs font-semibold truncate ${at?.id === '27' ? 'text-emerald-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {at?.fa ?? m.alabel ?? '—'}
            </span>
          </div>

          {/* Share */}
          <button
            onClick={() => doShare(m, ht, at)}
            className={`p-1 rounded-lg flex-shrink-0 transition-colors ${darkMode ? 'text-gray-700 hover:text-gray-400 active:text-gray-300' : 'text-gray-300 hover:text-gray-500 active:text-gray-700'}`}
          >
            <Share2 size={12} />
          </button>
        </div>

        {/* Goal scorers */}
        {hasScorers && (
          <div className="flex justify-between px-1 mt-1.5 gap-2">
            <Scorers scorers={m.hscorers} side="home" />
            <Scorers scorers={m.ascorers} side="away" />
          </div>
        )}

        {/* Stadium + weather */}
        {showStadium && stad && (
          <div className={`flex items-center justify-center gap-2 text-xs mt-1 ${muted}`}>
            <span>{stad.name_fa} · {stad.city_fa}</span>
            <span className={darkMode ? 'text-gray-700' : 'text-gray-300'}>{toPersian(stad.capacity / 1000)}k نفر</span>
            {weather && (
              <span className="flex items-center gap-0.5 text-sky-400">
                <span>{weather.icon}</span>
                <span>{toPersian(weather.temp)}°</span>
              </span>
            )}
          </div>
        )}

        {/* Video section for finished matches */}
        {m.st === 'ft' && ht && at && (() => {
          const videoUrl = VIDEO_MAP[`${ht.code}-${at.code}`];
          return (
            <div className="mt-2 space-y-2">
              {videoUrl && (
                <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <span className="text-red-500 text-xs">▶</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      خلاصه بازی — ورزش سه
                    </span>
                  </div>
                  <video controls preload="metadata" className="w-full max-h-52 bg-black" controlsList="nodownload">
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                <a
                  href={`https://www.varzesh3.com/?s=${encodeURIComponent(`${ht.fa} ${at.fa} جام جهانی`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    darkMode ? 'bg-red-950/40 text-red-400 hover:bg-red-900/50 border border-red-900/50'
                             : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <span>▶</span>
                  <span>{videoUrl ? 'بیشتر در ورزش سه' : 'ویدیو در ورزش سه'}</span>
                </a>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${ht.en} vs ${at.en} World Cup 2026 highlights`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    darkMode ? 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                             : 'bg-gray-100 text-gray-500 hover:text-gray-700 border border-gray-200'
                  }`}
                >
                  <span>🎬</span>
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-6">

      {/* Share toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl animate-bounce">
          لینک کپی شد ✓
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className={`${card} mb-4 overflow-hidden`}>
        <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-lg font-black">🏆 جام جهانی ۲۰۲۶ FIFA</h1>
              <p className="text-white/70 text-xs mt-0.5">۱۱ جون – ۱۹ جولای · ۴۸ تیم · ۱۰۴ بازی</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {started ? (
                <div className="flex items-center gap-1.5">
                  {liveMatches.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-400 live-pulse" />
                  )}
                  <span className="text-white/90 text-sm font-bold">
                    {liveMatches.length > 0 ? `${toPersian(liveMatches.length)} زنده` : 'در حال برگزاری'}
                  </span>
                </div>
              ) : (
                <span className="text-white/70 text-xs">به زودی شروع می‌شود</span>
              )}
              <button
                onClick={loadMatches}
                disabled={loading}
                className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${loading ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={12} className="text-white" />
              </button>
            </div>
          </div>
          {updated && (
            <p className="text-white/40 text-xs mt-2">
              آخرین بروزرسانی: {updated.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: زنده                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'live' && (
        <div className="space-y-3">

          {/* ── Iran countdown banner ──────────────────────────────────── */}
          {nextIranMatch && countdown && (() => {
            const ht = teamMap[nextIranMatch.h];
            const at = teamMap[nextIranMatch.a];
            return (
              <div className={`${card} overflow-hidden`}>
                <div className="bg-gradient-to-r from-emerald-900/80 via-green-900/60 to-emerald-900/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-emerald-400 text-xs font-bold">💚 بازی بعدی ایران</span>
                      <div className="flex items-center gap-2">
                        <Flag iso2={ht?.iso2} size="sm" />
                        <span className="text-white text-xs font-semibold">{ht?.fa ?? '—'}</span>
                        <span className={`text-xs ${muted}`}>vs</span>
                        <span className="text-white text-xs font-semibold">{at?.fa ?? '—'}</span>
                        <Flag iso2={at?.iso2} size="sm" />
                      </div>
                      {nextIranMatch.ld && nextIranMatch.sid && (
                        <span className={`text-xs ${muted}`}>{matchTehranDay(nextIranMatch.ld, nextIranMatch.sid)}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span className="text-emerald-300 text-2xl font-black tabular-nums tracking-wide">{countdown}</span>
                      <span className={`text-xs ${muted}`}>مانده تا بازی</span>
                      {notifPerm !== 'granted' && 'Notification' in window && (
                        <button
                          onClick={requestNotif}
                          className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                        >
                          <Bell size={10} />
                          <span>اعلان</span>
                        </button>
                      )}
                      {notifPerm === 'granted' && (
                        <span className="mt-1 text-xs text-emerald-500 flex items-center gap-1">
                          <BellOff size={10} />یادآور فعال
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Live filter chips ──────────────────────────────────────── */}
          <div className="flex gap-2">
            {([['all','همه'], ['live','زنده'], ['iran','ایران 💚']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setLiveFilter(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  liveFilter === id
                    ? id === 'iran' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {id === 'live' && liveMatches.length > 0 && liveFilter !== 'live' && (
                  <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                )}
                {label}
              </button>
            ))}
          </div>

          {/* ── Skeleton loading ──────────────────────────────────────── */}
          {loading && matches.length === 0 && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className={`rounded-2xl overflow-hidden border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className={`h-14 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
                  <div className={`h-10 animate-pulse ${darkMode ? 'bg-gray-850' : 'bg-gray-50'}`} style={{ animationDelay: `${i * 100}ms` }} />
                </div>
              ))}
            </div>
          )}

          {/* Live now */}
          {filteredLive.length > 0 && (
            <div className={`${card} overflow-hidden`}>
              <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
                <span className={`text-sm font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>الان زنده</span>
              </div>
              {filteredLive.map((m, i) => (
                <div key={m.id} className={i > 0 ? `border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''}>
                  <MatchRow m={m} showStadium />
                </div>
              ))}
            </div>
          )}

          {/* Today */}
          {filteredToday.filter(m => m.st !== 'live' && m.st !== 'ht').length > 0 && (
            <div className={`${card} overflow-hidden`}>
              <div className={`px-4 py-2.5 border-b text-xs font-bold ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                بازی‌های امروز
              </div>
              {filteredToday.filter(m => m.st !== 'live' && m.st !== 'ht').map((m, i, arr) => (
                <div key={m.id} className={i < arr.length - 1 ? `border-b ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''}>
                  <MatchRow m={m} showStadium />
                </div>
              ))}
            </div>
          )}

          {/* No matches today → show upcoming + recent */}
          {filteredToday.length === 0 && !loading && (
            <>
              {(() => {
                const now = Date.now();
                const upcoming = (liveFilter === 'iran'
                  ? matches.filter(m => m.h === '27' || m.a === '27')
                  : matches
                )
                  .filter(m => m.st === 'upcoming' && m.ld && m.sid && matchUtcDate(m.ld, m.sid).getTime() > now)
                  .sort((a, b) => matchUtcDate(a.ld, a.sid).getTime() - matchUtcDate(b.ld, b.sid).getTime())
                  .slice(0, 6);
                if (!upcoming.length) return null;
                return (
                  <div className={`${card} overflow-hidden`}>
                    <div className={`px-4 py-2.5 border-b text-xs font-bold ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                      بازی‌های آینده
                    </div>
                    {upcoming.map((m, i) => (
                      <div key={m.id} className={i > 0 ? `border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''}>
                        <MatchRow m={m} showStadium />
                      </div>
                    ))}
                  </div>
                );
              })()}

              {(() => {
                const recent = (liveFilter === 'iran'
                  ? matches.filter(m => m.h === '27' || m.a === '27')
                  : matches
                )
                  .filter(m => m.st === 'ft')
                  .sort((a, b) => matchUtcDate(b.ld, b.sid).getTime() - matchUtcDate(a.ld, a.sid).getTime())
                  .slice(0, 6);
                if (!recent.length) return null;
                return (
                  <div className={`${card} overflow-hidden`}>
                    <div className={`px-4 py-2.5 border-b text-xs font-bold ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                      آخرین نتایج
                    </div>
                    {recent.map((m, i) => (
                      <div key={m.id} className={i > 0 ? `border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''}>
                        <MatchRow m={m} />
                      </div>
                    ))}
                  </div>
                );
              })()}

              {matches.length === 0 && !loading && (
                <div className={`text-center py-16 ${muted}`}>
                  <div className="text-4xl mb-3">⏳</div>
                  <p>در حال اتصال به سرور...</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: گروه‌ها                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'groups' && (
        <div>
          {/* Group selector */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {GROUPS.map(g => {
              const hasLive = matches.some(m => m.g === g && (m.st === 'live' || m.st === 'ht'));
              return (
                <button
                  key={g}
                  onClick={() => setSelGroup(g)}
                  className={`relative w-10 h-10 rounded-xl text-sm font-black transition-all ${
                    selGroup === g
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow'
                      : darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {g}
                  {hasLive && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 live-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Standings */}
          <div className={`${card} overflow-hidden mb-3`}>
            <div className={`px-4 py-3 border-b font-bold text-sm ${darkMode ? 'border-gray-800 text-gray-100' : 'border-gray-100 text-gray-900'}`}>
              جدول گروه {selGroup}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className={muted}>
                  <th className="px-3 py-2 text-right w-40">تیم</th>
                  <th className="px-2 py-2 text-center w-8">ب</th>
                  <th className="px-2 py-2 text-center w-8 text-emerald-500">و</th>
                  <th className="px-2 py-2 text-center w-8">م</th>
                  <th className="px-2 py-2 text-center w-8 text-red-400">ش</th>
                  <th className="px-2 py-2 text-center w-12">گل</th>
                  <th className="px-2 py-2 text-center w-8 font-bold">ام</th>
                </tr>
              </thead>
              <tbody>
                {(standings[selGroup] ?? teams.filter(t => t.group === selGroup).map(t => ({
                  teamId: t.id, mp:0, w:0, d:0, l:0, gf:0, ga:0, pts:0,
                }) as GRow)).map((row, i) => {
                  const t = teamMap[row.teamId];
                  return (
                    <tr key={row.teamId} className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'} ${i < 2 ? darkMode ? 'bg-emerald-950/10' : 'bg-emerald-50/40' : ''}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs w-4 text-center font-bold ${i < 2 ? 'text-emerald-500' : muted}`}>{i+1}</span>
                          <Flag iso2={t?.iso2} size="sm" />
                          <span className={`font-semibold truncate ${t?.id === '27' ? 'text-emerald-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {t?.fa ?? row.teamId}
                          </span>
                          {t?.id === '27' && <span className="text-xs">💚</span>}
                        </div>
                      </td>
                      <td className={`px-2 py-2.5 text-center ${muted}`}>{toPersian(row.mp)}</td>
                      <td className="px-2 py-2.5 text-center text-emerald-500 font-medium">{toPersian(row.w)}</td>
                      <td className={`px-2 py-2.5 text-center ${muted}`}>{toPersian(row.d)}</td>
                      <td className="px-2 py-2.5 text-center text-red-400">{toPersian(row.l)}</td>
                      <td className={`px-2 py-2.5 text-center ${muted}`}>{toPersian(row.gf)}:{toPersian(row.ga)}</td>
                      <td className={`px-2 py-2.5 text-center font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(row.pts)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Group matches */}
          {[1,2,3].map(md => {
            const ms = matches.filter(m => m.g === selGroup && m.md === md && m.type === 'group');
            if (!ms.length) return null;
            return (
              <div key={md} className={`${card} overflow-hidden mb-3`}>
                <div className={`px-4 py-2 border-b text-xs font-bold ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                  هفته {toPersian(md)}
                </div>
                {ms.map((m, i) => (
                  <div key={m.id} className={i > 0 ? `border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''}>
                    <MatchRow m={m} showStadium />
                  </div>
                ))}
              </div>
            );
          })}

          {/* ── Top scorers ──────────────────────────────────────────── */}
          {topScorers.length > 0 && (
            <div className={`${card} overflow-hidden mt-1`}>
              <div className={`px-4 py-3 border-b text-sm font-bold ${darkMode ? 'border-gray-800 text-gray-100' : 'border-gray-100 text-gray-900'}`}>
                ⚽ برترین گل‌زنان
              </div>
              <div className="py-1">
                {topScorers.map((s, i) => (
                  <div key={s.name} className={`flex items-center gap-3 px-4 py-2 ${i > 0 ? `border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''}`}>
                    <span className={`text-xs font-black w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : muted}`}>
                      {toPersian(i + 1)}
                    </span>
                    <span className={`flex-1 text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{s.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">⚽</span>
                      <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(s.goals)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: برنامه                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          {scheduleByDay.map(([day, dayMatches]) => (
            <div key={day} className={`${card} overflow-hidden`}>
              <div className={`px-4 py-2.5 border-b text-xs font-bold ${darkMode ? 'border-gray-800 text-emerald-400' : 'border-gray-100 text-emerald-700'}`}>
                {day}
              </div>
              {dayMatches
                .sort((a, b) => matchUtcDate(a.ld, a.sid).getTime() - matchUtcDate(b.ld, b.sid).getTime())
                .map((m, i) => {
                  const stad = stadiumMap[m.sid];
                  return (
                    <div key={m.id} className={i > 0 ? `border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''}>
                      <div className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {m.st === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse flex-shrink-0" />}
                          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                            <span className={`text-xs font-semibold truncate ${teamMap[m.h]?.id === '27' ? 'text-emerald-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {teamMap[m.h]?.fa ?? '—'}
                            </span>
                            <Flag iso2={teamMap[m.h]?.iso2} size="sm" />
                          </div>
                          <div className="flex flex-col items-center min-w-[72px] flex-shrink-0">
                            {m.st !== 'upcoming' && m.hs !== null ? (
                              <span className={`text-base font-black tabular-nums ${m.st === 'live' ? 'text-red-400' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {toPersian(m.hs!)} – {toPersian(m.as!)}
                              </span>
                            ) : (
                              <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {matchTehranTime(m.ld, m.sid)}
                              </span>
                            )}
                            <span className={`text-xs ${muted}`}>گروه {m.g} · هفته {toPersian(m.md)}</span>
                            {stad && (
                              <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                {stad.city_fa}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <Flag iso2={teamMap[m.a]?.iso2} size="sm" />
                            <span className={`text-xs font-semibold truncate ${teamMap[m.a]?.id === '27' ? 'text-emerald-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {teamMap[m.a]?.fa ?? '—'}
                            </span>
                          </div>
                          <button
                            onClick={() => doShare(m, teamMap[m.h], teamMap[m.a])}
                            className={`p-1 rounded-lg flex-shrink-0 transition-colors ${darkMode ? 'text-gray-700 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'}`}
                          >
                            <Share2 size={12} />
                          </button>
                        </div>
                        {(m.hscorers || m.ascorers) && (
                          <div className="flex justify-between px-1 mt-1 gap-2">
                            <div className={`flex flex-col gap-0.5 text-xs ${muted} items-end`}>
                              {parseScorers(m.hscorers).map((s, i) => (
                                <span key={i}>{s} ⚽</span>
                              ))}
                            </div>
                            <div className={`flex flex-col gap-0.5 text-xs ${muted} items-start`}>
                              {parseScorers(m.ascorers).map((s, i) => (
                                <span key={i}>⚽ {s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {stad && (
                          <div className={`text-center text-xs mt-1 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>
                            {stad.name_fa} · {toPersian(stad.capacity / 1000)}k نفر
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: براکت                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'bracket' && (
        <div className="space-y-3">
          {/* Group stage summary */}
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>مرحله گروهی</p>
                <p className={`text-xs mt-0.5 ${muted}`}>۱۱ – ۲۷ جون · ۷۲ بازی · ۱۲ گروه</p>
              </div>
              <div className="text-left">
                <p className={`text-xs ${muted}`}>
                  {toPersian(groupMatches.filter(m => m.st === 'ft').length)} از {toPersian(groupMatches.length)} بازی
                </p>
              </div>
            </div>
          </div>

          {/* Knockout phases */}
          {(['r32','r16','qf','sf','third','final'] as MatchType[]).map(phase => {
            const phaseMatches = knockoutByPhase[phase] ?? [];
            const info = PHASE_LABEL[phase];
            const isFinal = phase === 'final';
            const hasStarted = phaseMatches.some(m => m.st === 'live' || m.st === 'ft');

            return (
              <div
                key={phase}
                className={`${card} overflow-hidden ${isFinal ? darkMode ? 'border-yellow-800/50' : 'border-yellow-300' : ''}`}
              >
                <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2.5">
                    {isFinal
                      ? <Trophy size={16} className="text-yellow-400 flex-shrink-0" />
                      : <Shield size={14} className={`flex-shrink-0 ${muted}`} />
                    }
                    <div>
                      <p className={`text-sm font-bold ${isFinal ? 'text-yellow-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {info.fa}
                      </p>
                      <p className={`text-xs ${muted}`}>{info.dates}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasStarted && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    <span className={`text-xs ${muted}`}>{toPersian(info.matches)} بازی</span>
                  </div>
                </div>

                {phaseMatches.length > 0 ? (
                  phaseMatches.map((m, i) => (
                    <div key={m.id} className={i > 0 ? `border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'}` : ''}>
                      <MatchRow m={m} showStadium />
                    </div>
                  ))
                ) : (
                  <div className={`px-4 py-3 text-xs text-center ${muted}`}>
                    در انتظار نتایج مرحله قبل
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: تیم‌ها                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'teams' && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {['all', 'UEFA', 'CONMEBOL', 'AFC', 'CAF', 'CONCACAF', 'OFC'].map(cf => (
              <button
                key={cf}
                onClick={() => setConfFilter(cf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  confFilter === cf
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cf === 'all' ? 'همه' : cf}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {teams.filter(t => confFilter === 'all' || CONF_MAP[t.code] === confFilter).map(team => {
              const conf = CONF_MAP[team.code] ?? 'UEFA';
              const groupRow = (standings[team.group] ?? []).find(r => r.teamId === team.id);
              return (
                <div
                  key={team.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    team.id === '27'
                      ? darkMode ? 'bg-emerald-950/50 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
                      : darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 shadow-sm hover:shadow'
                  }`}
                >
                  <img
                    src={team.flag || `https://flagcdn.com/w40/${team.iso2}.png`}
                    alt={team.fa}
                    className="w-10 h-7 object-cover rounded shadow-sm flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${team.id === '27' ? 'text-emerald-400' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {team.fa}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-xs px-1 py-0.5 rounded border ${CONF_CL[conf] ?? ''}`}>{conf}</span>
                      <span className={`text-xs ${muted}`}>گروه {team.group}</span>
                    </div>
                    {groupRow && groupRow.mp > 0 && (
                      <p className={`text-xs mt-0.5 ${muted}`}>
                        {toPersian(groupRow.mp)} بازی · {toPersian(groupRow.pts)} امتیاز
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
