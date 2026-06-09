import { useState, useEffect, useCallback } from 'react';
import { Flame, Clock, CheckCircle, RefreshCw, Wifi, WifiOff, Settings } from 'lucide-react';
import { liveMatches as mockMatches, standings as mockStandings } from '../data/matches';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import MatchCard from '../components/MatchCard';
import ApiKeyModal from '../components/ApiKeyModal';
import {
  getLiveMatches, getStandings, getTopScorers,
  hasApiKey, competitionMap, translateStatus,
  type LiveMatch, type Standing,
} from '../services/footballApi';
import type { Match } from '../data/matches';

type Tab = 'live' | 'upcoming' | 'finished';

function apiMatchToLocal(m: LiveMatch): Match {
  const { type } = translateStatus(m.status);
  const comp = competitionMap[m.competition.code] ?? { name: m.competition.name, flag: '🌍' };
  const minute = m.status === 'IN_PLAY' ? undefined : undefined;
  return {
    id: String(m.id),
    homeTeam: m.homeTeam.name,
    homeTeamPersian: m.homeTeam.shortName || m.homeTeam.name,
    homeTeamFlag: '',
    awayTeam: m.awayTeam.name,
    awayTeamPersian: m.awayTeam.shortName || m.awayTeam.name,
    awayTeamFlag: '',
    homeScore: m.score.fullTime.home ?? m.score.halfTime.home ?? 0,
    awayScore: m.score.fullTime.away ?? m.score.halfTime.away ?? 0,
    status: type,
    minute,
    leagueId: m.competition.code,
    leagueName: comp.name,
    leagueFlag: comp.flag,
    date: new Date(m.utcDate).toLocaleDateString('fa-IR'),
    time: new Date(m.utcDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }),
    events: [],
    homeCrest: m.homeTeam.crest,
    awayCrest: m.awayTeam.crest,
  };
}

export default function Home() {
  const { darkMode } = useApp();
  const [tab, setTab] = useState<Tab>('live');
  const [apiMatches, setApiMatches] = useState<Match[] | null>(null);
  const [apiStandings, setApiStandings] = useState<Standing[] | null>(null);
  const [apiScorers, setApiScorers] = useState<{ player: { name: string }; team: { crest: string; shortName: string }; goals: number; assists: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    if (!hasApiKey()) return;
    setLoading(true);
    const [matches, standings, scorers] = await Promise.all([
      getLiveMatches(),
      getStandings('PL'),
      getTopScorers('PL'),
    ]);
    if (matches !== null) {
      setApiMatches(matches.map(apiMatchToLocal));
      setIsLive(true);
      setLastUpdated(new Date());
    }
    if (standings) setApiStandings(standings.slice(0, 8));
    if (scorers) setApiScorers(scorers);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasApiKey()) loadData();
    const interval = setInterval(() => {
      if (hasApiKey()) loadData();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const matches = apiMatches ?? mockMatches.map(m => m);

  const filtered = matches.filter(m => {
    if (tab === 'live') return m.status === 'live' || m.status === 'halftime';
    if (tab === 'upcoming') return m.status === 'upcoming';
    if (tab === 'finished') return m.status === 'finished';
    return true;
  });

  const counts = {
    live: matches.filter(m => m.status === 'live' || m.status === 'halftime').length,
    upcoming: matches.filter(m => m.status === 'upcoming').length,
    finished: matches.filter(m => m.status === 'finished').length,
  };

  const standings = apiStandings ?? mockStandings;

  const scorers = apiScorers ?? [
    { player: { name: 'کریستیانو رونالدو' }, team: { crest: '', shortName: 'پرتغال' }, goals: 135, assists: 42 },
    { player: { name: 'لیونل مسی' }, team: { crest: '', shortName: 'آرژانتین' }, goals: 109, assists: 56 },
    { player: { name: 'هری کین' }, team: { crest: '', shortName: 'بایرن مونیخ' }, goals: 36, assists: 8 },
    { player: { name: 'کیلیان امباپه' }, team: { crest: '', shortName: 'رئال مادرید' }, goals: 32, assists: 9 },
    { player: { name: 'محمد صلاح' }, team: { crest: '', shortName: 'لیورپول' }, goals: 29, assists: 14 },
  ];

  const tabs = [
    { key: 'live' as Tab, label: 'زنده', icon: Flame, count: counts.live },
    { key: 'upcoming' as Tab, label: 'آینده', icon: Clock, count: counts.upcoming },
    { key: 'finished' as Tab, label: 'پایان یافته', icon: CheckCircle, count: counts.finished },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {showApiModal && (
        <ApiKeyModal
          onClose={() => setShowApiModal(false)}
          onSaved={() => loadData()}
        />
      )}

      {/* API Status bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl mb-5 ${
        isLive
          ? darkMode ? 'bg-emerald-950/60 border border-emerald-900' : 'bg-emerald-50 border border-emerald-200'
          : darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          {isLive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse" />
              <span className={`text-xs font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                دیتای واقعی · زنده
              </span>
              {lastUpdated && (
                <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  · بروزرسانی {lastUpdated.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff size={13} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>نمایش دیتای نمونه</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button
              onClick={loadData}
              disabled={loading}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-emerald-900/50 text-emerald-500' : 'hover:bg-emerald-100 text-emerald-600'
              } ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={13} />
            </button>
          )}
          <button
            onClick={() => setShowApiModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isLive
                ? darkMode ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-600 hover:bg-emerald-100'
                : 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
            }`}
          >
            {isLive ? <Settings size={12} /> : <Wifi size={12} />}
            {isLive ? 'تنظیمات API' : 'اتصال به دیتای واقعی'}
          </button>
        </div>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'بازی زنده', value: counts.live, color: 'from-red-600 to-orange-500', icon: '🔴' },
          { label: 'کل بازی‌ها', value: matches.length, color: 'from-emerald-600 to-teal-500', icon: '⚽' },
          { label: 'بازی آینده', value: counts.upcoming, color: 'from-blue-600 to-indigo-500', icon: '🔔' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl bg-gradient-to-br ${stat.color} p-4 text-white`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-black">{toPersian(stat.value)}</div>
            <div className="text-xs opacity-80 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-5 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
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
        {/* Matches */}
        <div className="space-y-3">
          {loading && filtered.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-24 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
            ))
          ) : filtered.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
              <div className="text-4xl mb-3">⚽</div>
              <p>بازی‌ای در این بخش وجود ندارد</p>
            </div>
          ) : (
            filtered.map(match => <MatchCard key={match.id} match={match} />)
          )}
        </div>

        {/* Standings sidebar */}
        <div className="hidden md:block space-y-4">
          <div className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>جدول لیگ برتر انگلیس</h3>
              </div>
              {isLive && <span className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />زنده</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                    <th className="px-3 py-2 text-right">#</th>
                    <th className="px-3 py-2 text-right">تیم</th>
                    <th className="px-3 py-2 text-center">ب</th>
                    <th className="px-3 py-2 text-center text-emerald-500">B</th>
                    <th className="px-3 py-2 text-center">M</th>
                    <th className="px-3 py-2 text-center text-red-400">B</th>
                    <th className="px-3 py-2 text-center font-bold">ام</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => {
                    const pos = 'position' in row ? (row as Standing).position : i + 1;
                    const teamName = 'team' in row
                      ? (row as Standing).team.shortName || (row as Standing).team.name
                      : (row as typeof mockStandings[0]).team;
                    const teamCrest = 'team' in row ? (row as Standing).team.crest : '';
                    const teamFlag = !('team' in row) ? (row as typeof mockStandings[0]).flag : '';
                    const played = 'playedGames' in row ? (row as Standing).playedGames : (row as typeof mockStandings[0]).played;
                    const won = (row as Standing | typeof mockStandings[0]).won;
                    const drawn = 'draw' in row ? (row as Standing).draw : (row as typeof mockStandings[0]).drawn;
                    const lost = (row as Standing | typeof mockStandings[0]).lost;
                    const points = (row as Standing | typeof mockStandings[0]).points;

                    return (
                      <tr key={i} className={`border-t transition-colors ${
                        darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'
                      } ${pos <= 4 ? darkMode ? 'border-r-2 border-r-emerald-700' : 'border-r-2 border-r-emerald-500' : ''}`}>
                        <td className={`px-3 py-2.5 font-bold text-center text-xs ${
                          pos <= 4 ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>{toPersian(pos)}</td>
                        <td className={`px-3 py-2.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="flex items-center gap-1.5">
                            {teamCrest
                              ? <img src={teamCrest} alt="" className="w-4 h-4 object-contain" />
                              : <span>{teamFlag}</span>
                            }
                            <span className="font-medium text-xs truncate max-w-[80px]">{teamName}</span>
                          </div>
                        </td>
                        <td className={`px-3 py-2.5 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{toPersian(played)}</td>
                        <td className="px-3 py-2.5 text-center text-emerald-500 font-medium">{toPersian(won)}</td>
                        <td className={`px-3 py-2.5 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{toPersian(drawn)}</td>
                        <td className="px-3 py-2.5 text-center text-red-400 font-medium">{toPersian(lost)}</td>
                        <td className={`px-3 py-2.5 text-center font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(points)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-1" />
              ۴ تیم اول = لیگ قهرمانان اروپا
            </div>
          </div>

          {/* Top Scorers */}
          <div className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center gap-2 px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <span>⚽</span>
              <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>گلزنان برتر</h3>
              {isLive && <span className="text-xs text-emerald-400 mr-auto flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />زنده</span>}
            </div>
            <div>
              {scorers.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${
                  darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                } transition-colors`}>
                  <span className={`text-lg font-black w-6 text-center ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}>{toPersian(i + 1)}</span>
                  {s.team.crest
                    ? <img src={s.team.crest} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                    : <span className="text-xl">⚽</span>
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{s.player.name}</p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.team.shortName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500 font-black text-sm">{toPersian(s.goals)}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>⚽</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
