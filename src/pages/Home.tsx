import { useState, useEffect, useCallback } from 'react';
import { Flame, Clock, CheckCircle, RefreshCw, Search, History, X } from 'lucide-react';
import { liveMatches as mockMatches, standings as mockStandings } from '../data/matches';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import MatchCard from '../components/MatchCard';
import {
  getLiveMatches, getRecentMatches, getStandings, getTopScorers,
  competitionMap, translateStatus,
  getZoneType, zoneColor,
  type LiveMatch, type Standing,
} from '../services/footballApi';
import type { Match } from '../data/matches';
import { toPersianTeamName } from '../data/teamNames';

type Tab = 'live' | 'upcoming' | 'finished' | 'recent';

function apiMatchToLocal(m: LiveMatch): Match {
  const { type } = translateStatus(m.status);
  const comp = competitionMap[m.competition.code] ?? { name: m.competition.name, flag: '🌍' };
  return {
    id: String(m.id),
    homeTeam: m.homeTeam.name,
    homeTeamPersian: toPersianTeamName(m.homeTeam.shortName, m.homeTeam.name),
    homeTeamFlag: '',
    homeCrest: m.homeTeam.crest,
    awayTeam: m.awayTeam.name,
    awayTeamPersian: toPersianTeamName(m.awayTeam.shortName, m.awayTeam.name),
    awayTeamFlag: '',
    awayCrest: m.awayTeam.crest,
    homeScore: m.score.fullTime.home ?? m.score.halfTime.home ?? 0,
    awayScore: m.score.fullTime.away ?? m.score.halfTime.away ?? 0,
    status: type,
    leagueId: m.competition.code,
    leagueName: comp.name,
    leagueFlag: comp.flag,
    date: new Date(m.utcDate).toLocaleDateString('fa-IR'),
    time: new Date(m.utcDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }),
    events: [],
  };
}

export default function Home() {
  const { darkMode } = useApp();
  const [tab, setTab] = useState<Tab>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [apiMatches, setApiMatches] = useState<Match[] | null>(null);
  const [recentApiMatches, setRecentApiMatches] = useState<Match[] | null>(null);
  const [apiStandings, setApiStandings] = useState<Standing[] | null>(null);
  const [apiScorers, setApiScorers] = useState<{ player: { name: string }; team: { crest: string; shortName: string }; goals: number; assists: number }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [matches, recent, standings, scorers] = await Promise.all([
      getLiveMatches(),
      getRecentMatches(),
      getStandings('PL'),
      getTopScorers('PL'),
    ]);
    if (matches !== null) {
      setApiMatches(matches.map(apiMatchToLocal));
      setLastUpdated(new Date());
    }
    if (recent !== null) {
      setRecentApiMatches(recent.map(apiMatchToLocal));
    }
    if (standings) setApiStandings(standings.slice(0, 10));
    if (scorers) setApiScorers(scorers);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const matches = apiMatches ?? mockMatches;
  const recentMatches = recentApiMatches ?? mockMatches.filter(m => m.status === 'finished');

  const allMatches = tab === 'recent' ? recentMatches : matches;

  // Derive unique leagues from all visible matches for filter chips
  const leagueChips = [
    ...new Map(
      [...matches, ...recentMatches].map(m => [m.leagueId, { id: m.leagueId, name: m.leagueName, flag: m.leagueFlag }])
    ).values()
  ].slice(0, 8);

  const filtered = allMatches.filter(m => {
    if (tab === 'live') return m.status === 'live' || m.status === 'halftime';
    if (tab === 'upcoming') return m.status === 'upcoming';
    if (tab === 'finished') return m.status === 'finished';
    if (tab === 'recent') return m.status === 'finished';
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
    finished: matches.filter(m => m.status === 'finished').length,
    recent: recentMatches.length,
  };

  const standings = apiStandings ?? mockStandings;

  const scorers = apiScorers ?? [
    { player: { name: 'هری کین' }, team: { crest: '', shortName: 'بایرن' }, goals: 36, assists: 8 },
    { player: { name: 'کیلیان امباپه' }, team: { crest: '', shortName: 'رئال' }, goals: 32, assists: 10 },
    { player: { name: 'محمد صلاح' }, team: { crest: '', shortName: 'لیورپول' }, goals: 29, assists: 17 },
    { player: { name: 'لامین یامال' }, team: { crest: '', shortName: 'بارسا' }, goals: 25, assists: 20 },
    { player: { name: 'ویکتور اوسیمن' }, team: { crest: '', shortName: 'گالاتاسارای' }, goals: 24, assists: 5 },
  ];

  const tabs = [
    { key: 'live' as Tab, label: 'زنده', icon: Flame, count: counts.live },
    { key: 'upcoming' as Tab, label: 'آینده', icon: Clock, count: counts.upcoming },
    { key: 'finished' as Tab, label: 'پایان یافته', icon: CheckCircle, count: counts.finished },
    { key: 'recent' as Tab, label: 'اخیر', icon: History, count: counts.recent },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* API status bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl mb-4 ${
        apiMatches
          ? darkMode ? 'bg-emerald-950/60 border border-emerald-900' : 'bg-emerald-50 border border-emerald-200'
          : darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          {apiMatches ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" />
              <span className={`text-xs font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>دیتای زنده واقعی</span>
              {lastUpdated && (
                <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  · آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </>
          ) : (
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {loading ? 'در حال اتصال به سرور...' : '⚠️ نمایش دیتای نمونه — بررسی اتصال'}
            </span>
          )}
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className={`p-1.5 rounded-lg transition-colors ${
            apiMatches
              ? darkMode ? 'hover:bg-emerald-900/50 text-emerald-500' : 'hover:bg-emerald-100 text-emerald-600'
              : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
          } ${loading ? 'animate-spin' : ''}`}
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
          { label: 'نتایج اخیر', value: counts.recent, color: 'from-purple-600 to-pink-500', icon: '📋' },
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
              <span>{l.flag}</span>
              <span className="max-w-[80px] truncate">{l.name.split(' ').slice(0, 2).join(' ')}</span>
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
          {loading && !apiMatches ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-28 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
            ))
          ) : filtered.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
              <div className="text-4xl mb-3">
                {searchQuery ? '🔍' : '⚽'}
              </div>
              <p>{searchQuery ? `نتیجه‌ای برای «${searchQuery}» یافت نشد` : 'بازی‌ای در این بخش وجود ندارد'}</p>
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
              <div className="flex items-center gap-2">
                <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>جدول لیگ برتر انگلیس</h3>
              </div>
              {apiStandings && <span className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />زنده</span>}
            </div>
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
                {standings.map((row, i) => {
                  const pos = 'position' in row ? (row as Standing).position : i + 1;
                  const isApiRow = 'team' in row && typeof (row as Standing).team === 'object';
                  const teamName = isApiRow ? ((row as Standing).team.shortName || (row as Standing).team.name) : (row as typeof mockStandings[0]).team;
                  const crest = isApiRow ? (row as Standing).team.crest : '';
                  const flag = !isApiRow ? (row as typeof mockStandings[0]).flag : '';
                  const played = isApiRow ? (row as Standing).playedGames : (row as typeof mockStandings[0]).played;
                  const won = (row as { won: number }).won;
                  const drawn = isApiRow ? (row as Standing).draw : (row as typeof mockStandings[0]).drawn;
                  const lost = (row as { lost: number }).lost;
                  const pts = (row as { points: number }).points;
                  const zone = isApiRow ? getZoneType('PL', pos, standings.length) : null;
                  const dot = zoneColor(zone);

                  return (
                    <tr key={i} className={`border-t transition-colors ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`font-bold ${pos <= 4 ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(pos)}</span>
                          {zone && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-1.5">
                          {crest ? <img src={crest} alt="" className="w-4 h-4 object-contain" /> : <span>{flag}</span>}
                          <span className="font-medium truncate max-w-[80px]">{teamName}</span>
                        </div>
                      </td>
                      <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(played)}</td>
                      <td className="px-2 py-2.5 text-center text-emerald-500 font-medium">{toPersian(won)}</td>
                      <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(drawn)}</td>
                      <td className="px-2 py-2.5 text-center text-red-400 font-medium">{toPersian(lost)}</td>
                      <td className={`px-2 py-2.5 text-center font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(pts)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className={`px-4 py-2.5 flex flex-wrap gap-3 text-xs border-t ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />لیگ قهرمانان</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />لیگ اروپا</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />سقوط</span>
            </div>
          </div>

          {/* Top Scorers */}
          <div className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center gap-2 px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <span>⚽</span>
              <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>گلزنان برتر — لیگ برتر</h3>
              {apiScorers && <span className="text-xs text-emerald-400 mr-auto flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />زنده</span>}
            </div>
            {scorers.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors`}>
                <span className={`text-sm font-black w-6 text-center tabular-nums ${
                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : darkMode ? 'text-gray-700' : 'text-gray-300'
                }`}>{toPersian(i + 1)}</span>
                {s.team.crest
                  ? <img src={s.team.crest} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                  : <span className="text-xl">⚽</span>
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{s.player.name}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.team.shortName}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-emerald-500">{toPersian(s.goals)} ⚽</span>
                  {s.assists > 0 && <span className={darkMode ? 'text-blue-400' : 'text-blue-500'}>{toPersian(s.assists)} 🎯</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
