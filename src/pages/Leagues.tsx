import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { leagues } from '../data/leagues';
import { clubTeams, nationalTeams } from '../data/teams';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import {
  getStandings, getTopScorers, getCompetitionMatches, leagueIdToCompetition,
  getZoneType, zoneColor, translateStatus,
  type Standing, type ApiPlayer, type ApiTeam, type LiveMatch,
} from '../services/footballApi';

type LeagueTab = 'standings' | 'scorers' | 'teams' | 'matches';

type LeagueData = {
  standings: Standing[] | null;
  scorers: { player: ApiPlayer; team: ApiTeam; goals: number; assists: number }[] | null;
  matches: LiveMatch[] | null;
  loaded: boolean;
};

const zoneLabel: Record<string, string> = {
  ucl: 'لیگ قهرمانان اروپا',
  uel: 'لیگ اروپا',
  uecl: 'لیگ کنفرانس',
  relegation_playoff: 'پلی‌اف سقوط',
  relegation: 'سقوط به دسته پایین‌تر',
};

export default function Leagues() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'club' | 'international'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, LeagueTab>>({});
  const [leagueData, setLeagueData] = useState<Record<string, LeagueData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filtered = leagues.filter(l => filter === 'all' || l.type === filter);

  const getTeamsForLeague = (leagueId: string) =>
    [...clubTeams, ...nationalTeams].filter(t => t.leagueId === leagueId);

  const handleExpand = async (leagueId: string) => {
    const next = expanded === leagueId ? null : leagueId;
    setExpanded(next);
    if (!next || leagueData[next]?.loaded) return;

    const code = leagueIdToCompetition[leagueId];
    if (!code) return;

    setLoading(prev => ({ ...prev, [leagueId]: true }));
    const [standings, scorers, matches] = await Promise.all([
      getStandings(code),
      getTopScorers(code),
      getCompetitionMatches(code),
    ]);
    setLeagueData(prev => ({ ...prev, [leagueId]: { standings, scorers, matches, loaded: true } }));
    setLoading(prev => ({ ...prev, [leagueId]: false }));

    if (standings) {
      setActiveTab(prev => ({ ...prev, [leagueId]: prev[leagueId] ?? 'standings' }));
    }
  };

  const getTab = (leagueId: string): LeagueTab => activeTab[leagueId] ?? 'standings';
  const setTab = (leagueId: string, tab: LeagueTab) =>
    setActiveTab(prev => ({ ...prev, [leagueId]: tab }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>لیگ‌های فوتبال</h2>
        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(filtered.length)} لیگ</span>
      </div>

      {/* Filter */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-5 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {[
          { key: 'all', label: 'همه' },
          { key: 'club', label: 'باشگاهی' },
          { key: 'international', label: 'بین‌المللی' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(league => {
          const teams = getTeamsForLeague(league.id);
          const isExpanded = expanded === league.id;
          const code = leagueIdToCompetition[league.id];
          const data = leagueData[league.id];
          const isLoading = loading[league.id];
          const tab = getTab(league.id);
          const standings = data?.standings;
          const scorers = data?.scorers;

          const matches = data?.matches;
          const tabs: { key: LeagueTab; label: string }[] = [
            ...(code ? [{ key: 'standings' as LeagueTab, label: 'جدول' }] : []),
            ...(code ? [{ key: 'scorers' as LeagueTab, label: 'گلزنان' }] : []),
            ...(code ? [{ key: 'matches' as LeagueTab, label: 'بازی‌ها' }] : []),
            ...(teams.length > 0 ? [{ key: 'teams' as LeagueTab, label: 'تیم‌ها' }] : []),
          ];

          return (
            <div key={league.id} className={`rounded-2xl border overflow-hidden ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              {/* League row */}
              <button
                onClick={() => handleExpand(league.id)}
                className={`w-full flex items-center gap-4 p-4 transition-colors ${
                  darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-3xl">{league.flag}</span>
                <div className="flex-1 text-right">
                  <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{league.persianName}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {league.countryPersian} · فصل {league.season}
                    </span>
                    {teams.length > 0 && (
                      <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <Users size={11} />
                        {toPersian(teams.length)} تیم
                      </span>
                    )}
                    {code && <span className="text-xs text-emerald-500">● دیتای زنده</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(league.id); }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isFavorite(league.id)
                        ? 'text-yellow-400'
                        : darkMode ? 'text-gray-700 hover:text-gray-500' : 'text-gray-300 hover:text-gray-500'
                    }`}
                  >
                    <Star size={16} fill={isFavorite(league.id) ? 'currentColor' : 'none'} />
                  </button>
                  <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  {/* Loading */}
                  {isLoading && (
                    <div className="p-6 space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-8 rounded-xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
                      ))}
                    </div>
                  )}

                  {/* Tabs */}
                  {!isLoading && tabs.length > 0 && (
                    <>
                      <div className={`flex border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        {tabs.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setTab(league.id, key)}
                            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                              tab === key
                                ? darkMode
                                  ? 'text-emerald-400 border-b-2 border-emerald-500'
                                  : 'text-emerald-600 border-b-2 border-emerald-500'
                                : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Standings tab */}
                      {tab === 'standings' && (
                        <div>
                          {!standings ? (
                            <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              جدول در دسترس نیست
                            </p>
                          ) : (
                            <>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                                    <th className="px-3 py-2.5 text-right w-8">#</th>
                                    <th className="px-3 py-2.5 text-right">تیم</th>
                                    <th className="px-2 py-2.5 text-center">ب</th>
                                    <th className="px-2 py-2.5 text-center text-emerald-500">B</th>
                                    <th className="px-2 py-2.5 text-center">M</th>
                                    <th className="px-2 py-2.5 text-center text-red-400">B</th>
                                    <th className="px-2 py-2.5 text-center">GD</th>
                                    <th className="px-2 py-2.5 text-center font-bold">ام</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {standings.map((row, i) => {
                                    const zone = getZoneType(code, row.position, standings.length);
                                    const dot = zoneColor(zone);
                                    const gd = row.goalsFor - row.goalsAgainst;
                                    return (
                                      <tr
                                        key={i}
                                        className={`border-t transition-colors ${
                                          darkMode ? 'border-gray-800 hover:bg-gray-800/40' : 'border-gray-50 hover:bg-gray-50'
                                        }`}
                                      >
                                        <td className="px-3 py-2.5">
                                          <div className="flex items-center gap-1.5 justify-end">
                                            <span className={`font-bold ${row.position <= 4 ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                              {toPersian(row.position)}
                                            </span>
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                                          </div>
                                        </td>
                                        <td className={`px-3 py-2.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                          <div className="flex items-center gap-1.5">
                                            {row.team.crest && <img src={row.team.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" />}
                                            <span className="font-medium truncate max-w-[90px]">{row.team.shortName || row.team.name}</span>
                                          </div>
                                        </td>
                                        <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(row.playedGames)}</td>
                                        <td className="px-2 py-2.5 text-center text-emerald-500 font-medium">{toPersian(row.won)}</td>
                                        <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(row.draw)}</td>
                                        <td className="px-2 py-2.5 text-center text-red-400 font-medium">{toPersian(row.lost)}</td>
                                        <td className={`px-2 py-2.5 text-center text-xs ${gd > 0 ? 'text-emerald-500' : gd < 0 ? 'text-red-400' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                          {gd > 0 ? '+' : ''}{toPersian(gd)}
                                        </td>
                                        <td className={`px-2 py-2.5 text-center font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(row.points)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              {/* Zone legend */}
                              <div className={`px-4 py-3 flex flex-wrap gap-3 border-t text-xs ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                                {(['ucl', 'uel', 'uecl', 'relegation'] as const).map(z => (
                                  <span key={z} className="flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${zoneColor(z)}`} />
                                    {zoneLabel[z]}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Scorers tab */}
                      {tab === 'scorers' && (
                        <div>
                          {!scorers ? (
                            <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              گلزنان در دسترس نیست
                            </p>
                          ) : (
                            <div className="divide-y divide-gray-800/20">
                              {scorers.map((s, i) => (
                                <div key={i} className={`flex items-center gap-3 px-4 py-3 ${darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'} transition-colors`}>
                                  <span className={`text-sm font-black w-6 text-center tabular-nums ${
                                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : darkMode ? 'text-gray-700' : 'text-gray-300'
                                  }`}>{toPersian(i + 1)}</span>
                                  {s.team.crest
                                    ? <img src={s.team.crest} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                                    : <span className="text-xl">⚽</span>
                                  }
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{s.player.name}</p>
                                    <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{s.team.shortName || s.team.name}</p>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs font-bold">
                                    <span className="text-emerald-500">{toPersian(s.goals)} ⚽</span>
                                    {s.assists > 0 && <span className={darkMode ? 'text-blue-400' : 'text-blue-500'}>{toPersian(s.assists)} 🎯</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Matches tab */}
                      {tab === 'matches' && (
                        <div>
                          {!matches || matches.length === 0 ? (
                            <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              بازی‌ای یافت نشد
                            </p>
                          ) : (
                            <div className="divide-y divide-gray-100/10">
                              {matches.map((m, i) => {
                                const { type: sType } = translateStatus(m.status);
                                const homeScore = m.score.fullTime.home ?? m.score.halfTime.home;
                                const awayScore = m.score.fullTime.away ?? m.score.halfTime.away;
                                const matchUrl = `/match/${code}~${m.id}`;
                                const timeStr = new Date(m.utcDate).toLocaleTimeString('fa-IR', {
                                  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran',
                                });
                                const dateStr = new Date(m.utcDate).toLocaleDateString('fa-IR', {
                                  month: 'short', day: 'numeric', timeZone: 'Asia/Tehran',
                                });
                                return (
                                  <div
                                    key={i}
                                    onClick={() => navigate(matchUrl)}
                                    className={`flex items-center gap-2 px-3 py-3 cursor-pointer transition-colors ${
                                      darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'
                                    } ${sType === 'live' ? darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50/60' : ''}`}
                                  >
                                    {/* Home team */}
                                    <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                                      <span className={`text-xs font-semibold truncate text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {m.homeTeam.shortName || m.homeTeam.name}
                                      </span>
                                      {m.homeTeam.crest
                                        ? <img src={m.homeTeam.crest} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                                        : <span className="text-base">🏠</span>
                                      }
                                    </div>

                                    {/* Score / time */}
                                    <div className="flex flex-col items-center min-w-[64px]">
                                      {sType === 'upcoming' ? (
                                        <>
                                          <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{timeStr}</span>
                                          <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{dateStr}</span>
                                        </>
                                      ) : sType === 'live' ? (
                                        <div className="flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                                          <span className={`text-sm font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {toPersian(homeScore ?? 0)}-{toPersian(awayScore ?? 0)}
                                          </span>
                                          <span className="text-red-400 text-xs">{toPersian(m.minute ?? 0)}′</span>
                                        </div>
                                      ) : (
                                        <span className={`text-sm font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                          {toPersian(homeScore ?? 0)}-{toPersian(awayScore ?? 0)}
                                        </span>
                                      )}
                                      {sType === 'halftime' && <span className="text-amber-400 text-xs">نیمه</span>}
                                      {sType === 'finished' && <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>پایان</span>}
                                    </div>

                                    {/* Away team */}
                                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                                      {m.awayTeam.crest
                                        ? <img src={m.awayTeam.crest} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                                        : <span className="text-base">✈️</span>
                                      }
                                      <span className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {m.awayTeam.shortName || m.awayTeam.name}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Teams tab */}
                      {tab === 'teams' && (
                        <div className="px-4 py-3">
                          {teams.length === 0 ? (
                            <p className={`text-center py-4 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              اطلاعات تیم‌ها به زودی اضافه می‌شود
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {teams.map(team => (
                                <div key={team.id} className={`flex items-center gap-2 p-2 rounded-xl ${
                                  darkMode ? 'bg-gray-800/60 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
                                } transition-colors`}>
                                  <span className="text-xl">{team.flag}</span>
                                  <div className="min-w-0">
                                    <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{team.persianName}</p>
                                    {team.stadium && (
                                      <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{team.stadiumPersian}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* No tabs at all */}
                  {!isLoading && tabs.length === 0 && (
                    <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      اطلاعات به زودی اضافه می‌شود
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
