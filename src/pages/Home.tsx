import { useState, useEffect, useCallback, useMemo } from 'react';
import { Flame, Clock, CheckCircle, RefreshCw, Search, History, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import MatchCard from '../components/MatchCard';
import { toPersianTeamName } from '../data/teamNames';
import {
  clearFeedCache,
  getFeedLeagues,
  getLeagueScorers,
  getLeagueStandings,
  getMatchFeed,
  type FeedMatch,
  type FeedScorer,
  type FeedStandingRow,
  type Provider,
} from '../services/dataApi';
import type { Match } from '../data/matches';

type Tab = 'live' | 'upcoming' | 'finished' | 'recent';

const IRAN_LEAGUE_ID = '6';

function toLocalMatch(feed: FeedMatch, provider: Provider): Match {
  const faName = (name: string) => (provider === 'espn' ? toPersianTeamName(name, name) : name);
  return {
    id: feed.id,
    homeTeam: feed.home.name,
    homeTeamPersian: faName(feed.home.name),
    homeTeamFlag: '',
    homeCrest: feed.home.logo,
    awayTeam: feed.away.name,
    awayTeamPersian: faName(feed.away.name),
    awayTeamFlag: '',
    awayCrest: feed.away.logo,
    homeScore: feed.homeScore,
    awayScore: feed.awayScore,
    status: feed.status,
    statusText: feed.statusText,
    minute: feed.minute,
    leagueId: feed.leagueId,
    leagueName: feed.leagueName,
    leagueFlag: '',
    leagueLogo: feed.leagueLogo,
    date: feed.persianDate,
    time: feed.time,
    dayOffset: feed.dayOffset,
  };
}

const isFinishedLike = (status: Match['status']) =>
  status === 'finished' || status === 'cancelled' || status === 'postponed';

export default function Home() {
  const { darkMode } = useApp();
  const [tab, setTab] = useState<Tab>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [localMatches, setLocalMatches] = useState<Match[] | null>(null);
  const [provider, setProvider] = useState<Provider>('none');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [leagueOrder, setLeagueOrder] = useState<Record<string, number>>({});
  const [standingsLeague, setStandingsLeague] = useState<{ id: string; name: string; logo: string } | null>(null);
  const [apiStandings, setApiStandings] = useState<FeedStandingRow[] | null>(null);
  const [apiScorers, setApiScorers] = useState<FeedScorer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    if (refresh) clearFeedCache();

    const [feed, leagues] = await Promise.all([getMatchFeed({ refresh }), getFeedLeagues()]);
    const order: Record<string, number> = {};
    leagues.forEach((league) => { order[league.id] = league.priority; });
    setLeagueOrder(order);
    setProvider(feed.provider);
    setGeneratedAt(feed.generatedAt);

    const primary =
      leagues.find((league) => league.id === IRAN_LEAGUE_ID && league.hasData) ??
      leagues.find((league) => league.hasData) ??
      leagues[0];
    if (primary) {
      setStandingsLeague({ id: primary.id, name: primary.name, logo: primary.logo });
      const [rows, scorers] = await Promise.all([getLeagueStandings(primary.id), getLeagueScorers(primary.id)]);
      setApiStandings(rows.slice(0, 10));
      setApiScorers(scorers.slice(0, 8));
    }

    if (feed.matches.length) {
      setLocalMatches(feed.matches.map((match) => toLocalMatch(match, feed.provider)));
    }
    if (refresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const matches = useMemo(() => {
    const source = localMatches ?? [];
    return [...source].sort((a, b) => {
      const rank = (a.leagueId in leagueOrder ? leagueOrder[a.leagueId] : 20) - (b.leagueId in leagueOrder ? leagueOrder[b.leagueId] : 20);
      if (rank !== 0) return rank;
      return a.leagueName.localeCompare(b.leagueName, 'fa') || a.time.localeCompare(b.time);
    });
  }, [localMatches, leagueOrder]);

  const recentMatches = useMemo(
    () => matches.filter((m) => isFinishedLike(m.status) && (m.dayOffset ?? 0) < 0),
    [matches]
  );

  const allMatches = tab === 'recent' ? recentMatches : matches;

  const leagueChips = [
    ...new Map(
      matches.map(m => [m.leagueId, { id: m.leagueId, name: m.leagueName, logo: m.leagueLogo }])
    ).values()
  ].slice(0, 8);

  const filtered = allMatches.filter(m => {
    if (tab === 'live') return m.status === 'live' || m.status === 'halftime';
    if (tab === 'upcoming') return m.status === 'upcoming';
    if (tab === 'finished') return isFinishedLike(m.status);
    return true;
  }).filter(m => {
    if (leagueFilter && m.leagueId !== leagueFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      m.homeTeamPersian.includes(searchQuery.trim()) ||
      m.awayTeamPersian.includes(searchQuery.trim()) ||
      m.homeTeam.toLowerCase().includes(q) ||
      m.awayTeam.toLowerCase().includes(q) ||
      m.leagueName.includes(searchQuery.trim())
    );
  });

  const counts = {
    live: matches.filter(m => m.status === 'live' || m.status === 'halftime').length,
    upcoming: matches.filter(m => m.status === 'upcoming').length,
    finished: matches.filter(m => isFinishedLike(m.status)).length,
    recent: recentMatches.length,
  };

  const tabs = [
    { key: 'live' as Tab, label: 'زنده', icon: Flame, count: counts.live },
    { key: 'upcoming' as Tab, label: 'آینده', icon: Clock, count: counts.upcoming },
    { key: 'finished' as Tab, label: 'پایان یافته', icon: CheckCircle, count: counts.finished },
    { key: 'recent' as Tab, label: 'اخیر', icon: History, count: counts.recent },
  ];

  const sourceLabel =
    provider === 'varzesh3' ? 'ورزش ۳' : provider === 'espn' ? 'ESPN (پشتیبان)' : 'بدون داده';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* Data source bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl mb-4 ${
        provider === 'varzesh3'
          ? darkMode ? 'bg-emerald-950/60 border border-emerald-900' : 'bg-emerald-50 border border-emerald-200'
          : provider === 'espn'
            ? darkMode ? 'bg-amber-950/50 border border-amber-900' : 'bg-amber-50 border border-amber-200'
            : darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          {provider !== 'none' && <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse flex-shrink-0" />}
          <span className={`text-xs font-medium truncate ${
            provider === 'varzesh3'
              ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
              : darkMode ? 'text-amber-400' : 'text-amber-600'
          }`}>
            داده {sourceLabel}
          </span>
          <span className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            · {toPersian(matches.length)} بازی · آخرین بروزرسانی:{' '}
            {generatedAt
              ? new Date(generatedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })
              : new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            provider === 'varzesh3'
              ? darkMode ? 'hover:bg-emerald-900/50 text-emerald-500' : 'hover:bg-emerald-100 text-emerald-600'
              : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
          } ${loading || refreshing ? 'animate-spin' : ''}`}
          title="بروزرسانی"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {[
          { label: 'زنده', value: counts.live, color: 'from-red-600 to-orange-500', icon: '🔴' },
          { label: 'کل', value: matches.length, color: 'from-emerald-600 to-teal-500', icon: '⚽' },
          { label: 'آینده', value: counts.upcoming, color: 'from-blue-600 to-indigo-500', icon: '🔔' },
          { label: 'نتایج اخیر', value: counts.finished, color: 'from-purple-600 to-pink-500', icon: '📋' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl bg-gradient-to-br ${stat.color} p-3 text-white`}>
            <div className="text-xl mb-0.5">{stat.icon}</div>
            <div className="text-xl font-black">{toPersian(stat.value)}</div>
            <div className="text-xs opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-3 border ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <Search size={15} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />
        <input
          type="text"
          placeholder="جستجوی تیم یا لیگ..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={`flex-1 text-sm bg-transparent outline-none ${
            darkMode ? 'text-gray-200 placeholder:text-gray-700' : 'text-gray-800 placeholder:text-gray-400'
          }`}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className={darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* League filter chips */}
      {leagueChips.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setLeagueFilter(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !leagueFilter
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            همه
          </button>
          {leagueChips.map(l => (
            <button
              key={l.id}
              onClick={() => setLeagueFilter(leagueFilter === l.id ? null : l.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                leagueFilter === l.id
                  ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l.logo
                ? <img src={l.logo} alt="" className="w-4 h-4 object-contain" />
                : <span>⚽</span>
              }
              <span className="max-w-[90px] truncate">{l.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-5 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              tab === key
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={13} />
            <span>{label}</span>
            {count > 0 && (
              <span className={`text-xs px-1 py-0.5 rounded-full font-bold ${
                tab === key
                  ? 'bg-white/20 text-white'
                  : key === 'live'
                    ? 'bg-red-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>{toPersian(count)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Matches column */}
        <div className="space-y-3">
          {loading && !localMatches ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-28 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
            ))
          ) : filtered.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
              <div className="text-4xl mb-3">
                {searchQuery ? '🔍' : '⚽'}
              </div>
              <p>
                {searchQuery
                  ? `نتیجه‌ای برای «${searchQuery}» یافت نشد`
                  : provider === 'none'
                    ? 'هنوز داده‌ای همگام‌سازی نشده است'
                    : 'بازی‌ای در این بخش وجود ندارد'}
              </p>
            </div>
          ) : (
            filtered.map(match => <MatchCard key={match.id} match={match} />)
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden md:block space-y-4">
          {/* Standings */}
          <div className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 min-w-0">
                {standingsLeague?.logo
                  ? <img src={standingsLeague.logo} alt="" className="w-5 h-5 object-contain" />
                  : <span>🏆</span>
                }
                <h3 className={`font-bold text-sm truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  جدول {standingsLeague?.name ?? 'لیگ'}
                </h3>
              </div>
              {provider === 'varzesh3' && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />زنده
                </span>
              )}
            </div>
            {!apiStandings || apiStandings.length === 0 ? (
              <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>جدول در دسترس نیست</p>
            ) : (
              <>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                      <th className="px-3 py-2 text-right">#</th>
                      <th className="px-3 py-2 text-right">تیم</th>
                      <th className="px-2 py-2 text-center">ب</th>
                      <th className="px-2 py-2 text-center text-emerald-500">B</th>
                      <th className="px-2 py-2 text-center">M</th>
                      <th className="px-2 py-2 text-center text-red-400">B</th>
                      <th className="px-2 py-2 text-center font-bold">ام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiStandings.map((row) => (
                      <tr key={row.teamId} className={`border-t transition-colors ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 justify-end">
                            <span className={`font-bold ${row.rank <= 4 ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(row.rank)}</span>
                            {row.qualificationColor && (
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.qualificationColor }} />
                            )}
                          </div>
                        </td>
                        <td className={`px-3 py-2.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="flex items-center gap-1.5">
                            {row.teamLogo && <img src={row.teamLogo} alt="" className="w-4 h-4 object-contain" />}
                            <span className="font-medium truncate max-w-[90px]">{row.teamName}</span>
                          </div>
                        </td>
                        <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(row.played)}</td>
                        <td className="px-2 py-2.5 text-center text-emerald-500 font-medium">{toPersian(row.won)}</td>
                        <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(row.drawn)}</td>
                        <td className="px-2 py-2.5 text-center text-red-400 font-medium">{toPersian(row.lost)}</td>
                        <td className={`px-2 py-2.5 text-center font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(row.points)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={`px-4 py-2.5 flex flex-wrap gap-3 text-xs border-t ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />سهمیه قاره‌ای</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />سقوط</span>
                </div>
              </>
            )}
          </div>

          {/* Top Scorers */}
          <div className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center gap-2 px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <span>⚽</span>
              <h3 className={`font-bold text-sm truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                گلزنان برتر — {standingsLeague?.name ?? 'لیگ'}
              </h3>
            </div>
            {!apiScorers || apiScorers.length === 0 ? (
              <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>گلزنان در دسترس نیست</p>
            ) : (
              apiScorers.map((s, i) => (
                <div key={s.playerId} className={`flex items-center gap-3 px-4 py-2.5 ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                  <span className={`text-sm font-black w-6 text-center tabular-nums ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : darkMode ? 'text-gray-700' : 'text-gray-300'
                  }`}>{toPersian(i + 1)}</span>
                  {s.portrait || s.teamLogo
                    ? <img src={s.portrait || s.teamLogo} alt="" className="w-7 h-7 object-contain flex-shrink-0 rounded-full" />
                    : <span className="text-xl">⚽</span>
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{s.name}</p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.teamName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-emerald-500">{toPersian(s.goals)} ⚽</span>
                    {s.assists > 0 && <span className={darkMode ? 'text-blue-400' : 'text-blue-500'}>{toPersian(s.assists)} 🎯</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
