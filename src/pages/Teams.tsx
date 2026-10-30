import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, Star, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import { getFeedLeagues, getFeedTeams, type FeedLeague, type FeedTeam } from '../services/dataApi';

const positionAccent: Record<string, string> = {
  GK: 'bg-yellow-500/20 text-yellow-400',
  DF: 'bg-blue-500/20 text-blue-400',
  MF: 'bg-emerald-500/20 text-emerald-400',
  FW: 'bg-red-500/20 text-red-400',
  OTHER: 'bg-gray-500/20 text-gray-400',
};

const teamStats = (team: FeedTeam) => [
  { label: 'بازی', value: team.played, signed: false },
  { label: 'برد', value: team.won, signed: false },
  { label: 'مساوی', value: team.drawn, signed: false },
  { label: 'باخت', value: team.lost, signed: false },
  { label: 'گل زده', value: team.goalsFor, signed: false },
  { label: 'گل خورده', value: team.goalsAgainst, signed: false },
  { label: 'تفاضل', value: team.goalDifference, signed: true },
  { label: 'امتیاز', value: team.points, signed: false },
];

export default function Teams() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const [teams, setTeams] = useState<FeedTeam[]>([]);
  const [leagues, setLeagues] = useState<FeedLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFeedTeams(), getFeedLeagues()]).then(([feed, allLeagues]) => {
      if (cancelled) return;
      setTeams(feed.teams);
      setLeagues(allLeagues.filter((league) => feed.teams.some((team) => team.leagueId === league.id)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim();
    return teams.filter((team) => {
      if (leagueFilter && team.leagueId !== leagueFilter) return false;
      if (!query) return true;
      return team.name.includes(query) || team.leagueName.includes(query);
    });
  }, [teams, search, leagueFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>تیم‌ها</h2>
        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(visible.length)} تیم</span>
      </div>

      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-3 border ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <Search size={16} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />
        <input
          type="text"
          placeholder="جستجوی تیم..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`flex-1 bg-transparent text-sm outline-none ${
            darkMode ? 'text-gray-200 placeholder:text-gray-700' : 'text-gray-700 placeholder:text-gray-400'
          }`}
        />
      </div>

      {leagues.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          <button
            onClick={() => setLeagueFilter(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !leagueFilter
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            همه لیگ‌ها
          </button>
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => setLeagueFilter(leagueFilter === league.id ? null : league.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                leagueFilter === league.id
                  ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {league.logo && <img src={league.logo} alt="" className="w-4 h-4 object-contain" />}
              <span className="max-w-[110px] truncate">{league.name}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-24 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((team) => {
            const isExpanded = expanded === team.id;
            return (
              <div key={team.id} className={`rounded-2xl border overflow-hidden ${
                darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : team.id)}
                  className={`w-full flex items-center gap-4 p-4 transition-colors ${
                    darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                  }`}
                >
                  {team.logo ? (
                    <img src={team.logo} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
                  ) : (
                    <span className="text-3xl flex-shrink-0">🛡️</span>
                  )}
                  <div className="flex-1 min-w-0 text-right">
                    <h3 className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{team.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{team.leagueName}</span>
                      <span className={`text-xs font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        رتبه {toPersian(team.rank)} · {toPersian(team.points)} امتیاز
                      </span>
                      {team.squad.length > 0 && (
                        <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          <Users size={11} />
                          {toPersian(team.squad.length)} بازیکن
                        </span>
                      )}
                      {team.coach && <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>👨‍🏫 {team.coach}</span>}
                      {team.formation && <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>سیستم {team.formation}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {team.form.map((turn, i) => (
                        <span
                          key={i}
                          title={turn.tooltip}
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                            turn.result === 'W'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : turn.result === 'L'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {turn.result === 'W' ? 'ب' : turn.result === 'L' ? 'خ' : 'م'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(team.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFavorite(team.id)
                          ? 'text-yellow-400'
                          : darkMode ? 'text-gray-700 hover:text-gray-500' : 'text-gray-300 hover:text-gray-500'
                      }`}
                    >
                      <Star size={16} fill={isFavorite(team.id) ? 'currentColor' : 'none'} />
                    </button>
                    <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className={`border-t px-4 py-4 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                      {teamStats(team).map((stat) => (
                        <div key={stat.label} className={`rounded-xl py-2 ${darkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                          <p className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stat.signed && stat.value > 0 ? '+' : ''}
                            {toPersian(stat.value)}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    {team.stadium && (
                      <p className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>🏟️ {team.stadium}</p>
                    )}
                    {team.squad.length === 0 ? (
                      <p className={`text-center py-6 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        ترکیب این تیم در آخرین همگام‌سازی گرفته نشده است
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {team.squad.map((player) => (
                          <div key={player.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                            darkMode ? 'bg-gray-800/60' : 'bg-gray-50'
                          }`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                              positionAccent[player.position] ?? positionAccent.OTHER
                            }`}>
                              {player.number ? toPersian(player.number) : player.positionFa.slice(0, 1)}
                            </div>
                            {player.portrait && (
                              <img src={player.portrait} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-700 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{player.name}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                {player.positionFa || 'سایر'}
                                {player.age > 0 && ` · ${toPersian(player.age)} ساله`}
                              </p>
                            </div>
                            {(player.goals > 0 || player.assists > 0) && (
                              <div className="text-left flex-shrink-0">
                                <p className={`text-xs font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{toPersian(player.goals)} ⚽</p>
                                <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{toPersian(player.assists)} 🎯</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {visible.length === 0 && (
            <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
              <div className="text-4xl mb-3">🔍</div>
              <p>تیمی با این نام یافت نشد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
