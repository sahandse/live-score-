import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import {
  getFeedLeagues,
  getFeedTeams,
  getLeagueMatches,
  getLeagueScorers,
  getLeagueStandings,
  getMatchFeed,
  type FeedFixtureRound,
  type FeedLeague,
  type FeedMatch,
  type FeedScorer,
  type FeedStandingRow,
  type FeedTeam,
} from '../services/dataApi';

type LeagueTab = 'standings' | 'scorers' | 'matches' | 'teams';

type LeagueData = {
  standings: FeedStandingRow[];
  scorers: FeedScorer[];
  rounds: FeedFixtureRound[];
  matches: FeedMatch[];
};

export default function Leagues() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<FeedLeague[]>([]);
  const [teamsByLeague, setTeamsByLeague] = useState<Record<string, FeedTeam[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeagueTab>('standings');
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Record<string, LeagueData>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyWithData, setOnlyWithData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFeedLeagues(), getMatchFeed(), getFeedTeams()]).then(([all, feed, teams]) => {
      if (cancelled) return;
      // Leagues with a table come first; the ones live today are listed even without one.
      const fromFeed = new Set(feed.matches.map((match) => match.leagueId));
      const ranked = [...all].sort(
        (a, b) =>
          Number(b.hasData) - Number(a.hasData) ||
          Number(fromFeed.has(b.id)) - Number(fromFeed.has(a.id)) ||
          a.priority - b.priority ||
          a.name.localeCompare(b.name, 'fa')
      );
      setLeagues(ranked);
      const grouped: Record<string, FeedTeam[]> = {};
      teams.teams.forEach((team) => {
        (grouped[team.leagueId] ??= []).push(team);
      });
      setTeamsByLeague(grouped);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLeague = useCallback(async (leagueId: string) => {
    setLoadingId(leagueId);
    const [standings, scorers, fixtures] = await Promise.all([
      getLeagueStandings(leagueId),
      getLeagueScorers(leagueId),
      getLeagueMatches(leagueId),
    ]);
    setData((prev) => ({
      ...prev,
      [leagueId]: { standings, scorers, rounds: fixtures.rounds, matches: fixtures.matches },
    }));
    const current = fixtures.rounds.findIndex((entry) => entry.selected);
    setRound(current >= 0 ? current : 0);
    setLoadingId(null);
  }, []);

  const handleExpand = (leagueId: string) => {
    if (expanded === leagueId) {
      setExpanded(null);
      return;
    }
    setExpanded(leagueId);
    setRound(0);
    if (!data[leagueId]) void loadLeague(leagueId);
  };

  const visible = useMemo(() => {
    const query = search.trim();
    return leagues.filter((league) => {
      if (onlyWithData && !league.hasData) return false;
      return !query || league.name.includes(query);
    });
  }, [leagues, search, onlyWithData]);

  const panels: { key: LeagueTab; label: string }[] = [
    { key: 'standings', label: 'جدول' },
    { key: 'scorers', label: 'گلزنان' },
    { key: 'matches', label: 'بازی‌ها' },
    { key: 'teams', label: 'تیم‌ها' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>لیگ‌ها</h2>
        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {toPersian(visible.length)} لیگ · {toPersian(leagues.filter((l) => l.hasData).length)} با جدول و آمار
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border flex-1 ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <Search size={16} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />
          <input
            type="text"
            placeholder="جستجوی لیگ..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`flex-1 bg-transparent text-sm outline-none ${
              darkMode ? 'text-gray-200 placeholder:text-gray-700' : 'text-gray-700 placeholder:text-gray-400'
            }`}
          />
        </div>
        <button
          onClick={() => setOnlyWithData((value) => !value)}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
            onlyWithData
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
              : darkMode ? 'bg-gray-900 text-gray-400 hover:bg-gray-800' : 'bg-white text-gray-500 hover:bg-gray-100 shadow-sm'
          }`}
        >
          فقط لیگ‌های دارای داده
        </button>
      </div>

      <div className="space-y-3">
        {visible.map((league) => {
          const isExpanded = expanded === league.id;
          const leagueData = data[league.id];
          const teams = teamsByLeague[league.id] ?? [];
          const isLoading = loadingId === league.id;

          return (
            <div key={league.id} className={`rounded-2xl border overflow-hidden ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <button
                onClick={() => handleExpand(league.id)}
                className={`w-full flex items-center gap-3 p-4 text-right transition-colors ${
                  darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                }`}
              >
                {league.logo ? (
                  <img src={league.logo} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
                ) : (
                  <span className="text-2xl flex-shrink-0">🏆</span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{league.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {league.hasData ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse" />
                        جدول، گلزنان و برنامه بازی‌ها
                      </span>
                    ) : (
                      <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>فقط نتیجه بازی‌های این لیگ</span>
                    )}
                    {teams.length > 0 && (
                      <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <Users size={11} />
                        {toPersian(teams.length)} تیم
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(league.id);
                    }}
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

              {isExpanded && (
                <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  {isLoading || !leagueData ? (
                    <div className="p-5 space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-8 rounded-xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className={`flex border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        {panels.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                              activeTab === key
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

                      {activeTab === 'standings' && (
                        leagueData.standings.length === 0 ? (
                          <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>جدولی برای این لیگ منتشر نشده است</p>
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
                                {leagueData.standings.map((row) => {
                                  const gd = row.goalDifference;
                                  return (
                                    <tr
                                      key={row.teamId}
                                      className={`border-t transition-colors ${
                                        darkMode ? 'border-gray-800 hover:bg-gray-800/40' : 'border-gray-50 hover:bg-gray-50'
                                      }`}
                                    >
                                      <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 justify-end">
                                          <span className={`font-bold ${row.rank <= 4 ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {toPersian(row.rank)}
                                          </span>
                                          {row.qualificationColor && (
                                            <span
                                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                              style={{ backgroundColor: row.qualificationColor }}
                                            />
                                          )}
                                        </div>
                                      </td>
                                      <td className={`px-3 py-2.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <div className="flex items-center gap-1.5">
                                          {row.teamLogo && <img src={row.teamLogo} alt="" className="w-4 h-4 object-contain flex-shrink-0" />}
                                          <span className="font-medium truncate max-w-[130px]">{row.teamName}</span>
                                        </div>
                                      </td>
                                      <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(row.played)}</td>
                                      <td className="px-2 py-2.5 text-center text-emerald-500 font-medium">{toPersian(row.won)}</td>
                                      <td className={`px-2 py-2.5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{toPersian(row.drawn)}</td>
                                      <td className="px-2 py-2.5 text-center text-red-400 font-medium">{toPersian(row.lost)}</td>
                                      <td className={`px-2 py-2.5 text-center ${gd > 0 ? 'text-emerald-500' : gd < 0 ? 'text-red-400' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {gd > 0 ? '+' : ''}{toPersian(gd)}
                                      </td>
                                      <td className={`px-2 py-2.5 text-center font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(row.points)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {leagueData.standings.some((row) => row.qualificationColor) && (
                              <div className={`px-4 py-3 border-t text-xs ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                                رنگ کنار رتبه، سهمیه جدول (قاره‌ای / پلی‌آف / سقوط) را نشان می‌دهد.
                              </div>
                            )}
                          </>
                        )
                      )}

                      {activeTab === 'scorers' && (
                        leagueData.scorers.length === 0 ? (
                          <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>گلزنان این لیگ در دسترس نیست</p>
                        ) : (
                          <div>
                            {leagueData.scorers.slice(0, 20).map((scorer, i) => (
                              <div key={scorer.playerId} className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 ${
                                darkMode ? 'border-gray-800/60 hover:bg-gray-800/40' : 'border-gray-50 hover:bg-gray-50'
                              } transition-colors`}>
                                <span className={`text-sm font-black w-6 text-center tabular-nums ${
                                  i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : darkMode ? 'text-gray-700' : 'text-gray-300'
                                }`}>{toPersian(i + 1)}</span>
                                {scorer.portrait ? (
                                  <img src={scorer.portrait} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-700 flex-shrink-0" />
                                ) : scorer.teamLogo ? (
                                  <img src={scorer.teamLogo} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                                ) : (
                                  <span className="text-xl">⚽</span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{scorer.name}</p>
                                  <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{scorer.teamName}</p>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold flex-shrink-0">
                                  <span className="text-emerald-500">{toPersian(scorer.goals)} ⚽</span>
                                  {scorer.assists > 0 && <span className={darkMode ? 'text-blue-400' : 'text-blue-500'}>{toPersian(scorer.assists)} 🎯</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}

                      {activeTab === 'matches' && (
                        <div>
                          {leagueData.rounds.length > 0 && (
                            <div className={`flex gap-2 overflow-x-auto px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                              {leagueData.rounds.map((entry, i) => (
                                <button
                                  key={entry.round + i}
                                  onClick={() => setRound(i)}
                                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                    round === i
                                      ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                                      : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  {toPersian(entry.round)}
                                </button>
                              ))}
                            </div>
                          )}
                          {(() => {
                            const rows = leagueData.rounds.length
                              ? (leagueData.rounds[round]?.matches ?? [])
                              : leagueData.matches;
                            if (rows.length === 0) {
                              return (
                                <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                  بازی‌ای برای این لیگ ثبت نشده است
                                </p>
                              );
                            }
                            return rows.map((match) => (
                              <div
                                key={match.id}
                                onClick={() => navigate(`/match/${league.id}~${match.id}`)}
                                className={`flex items-center gap-2 px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                                  darkMode ? 'border-gray-800/60 hover:bg-gray-800/40' : 'border-gray-50 hover:bg-gray-50'
                                } ${match.status === 'live' ? (darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50/60') : ''}`}
                              >
                                <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                                  <span className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{match.home.name}</span>
                                  {match.home.logo && <img src={match.home.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
                                </div>
                                <div className="flex flex-col items-center min-w-[72px]">
                                  {match.status === 'upcoming' || match.homeScore === null || match.awayScore === null ? (
                                    <>
                                      <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{match.time}</span>
                                      <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{match.persianDate}</span>
                                    </>
                                  ) : (
                                    <span className={`text-sm font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {toPersian(match.homeScore)} - {toPersian(match.awayScore)}
                                    </span>
                                  )}
                                  {match.status === 'live' ? (
                                    <span className="flex items-center gap-1 text-xs text-red-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                                      {toPersian(match.minute)}′
                                    </span>
                                  ) : (
                                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                      {match.statusText || (match.status === 'upcoming' ? 'برگزار نشده' : 'پایان')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                                  {match.away.logo && <img src={match.away.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
                                  <span className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{match.away.name}</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}

                      {activeTab === 'teams' && (
                        teams.length === 0 ? (
                          <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            تیم‌های این لیگ در آخرین همگام‌سازی نبوده‌اند
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
                            {teams.map((team) => (
                              <div
                                key={team.id}
                                className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${
                                  darkMode ? 'bg-gray-800/60' : 'bg-gray-50'
                                }`}
                              >
                                {team.logo ? (
                                  <img src={team.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                                ) : (
                                  <span className="text-lg">🛡️</span>
                                )}
                                <div className="min-w-0">
                                  <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{team.name}</p>
                                  <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                    رتبه {toPersian(team.rank)} · {toPersian(team.points)} امتیاز
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
            <div className="text-4xl mb-3">🔍</div>
            <p>لیگی با این نام پیدا نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}
