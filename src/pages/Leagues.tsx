import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { leagues } from '../data/leagues';
import { clubTeams, nationalTeams } from '../data/teams';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import { liveMatches } from '../data/matches';

export default function Leagues() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const [filter, setFilter] = useState<'all' | 'club' | 'international'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = leagues.filter(l => filter === 'all' || l.type === filter);

  const getTeamsForLeague = (leagueId: string) => {
    return [...clubTeams, ...nationalTeams].filter(t => t.leagueId === leagueId);
  };

  const getLiveMatchCount = (leagueId: string) => {
    return liveMatches.filter(m => m.leagueId === leagueId && (m.status === 'live' || m.status === 'halftime')).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          لیگ‌های فوتبال
        </h2>
        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {toPersian(filtered.length)} لیگ
        </span>
      </div>

      {/* Filter tabs */}
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
          const liveCount = getLiveMatchCount(league.id);
          const isExpanded = expanded === league.id;

          return (
            <div key={league.id} className={`rounded-2xl border overflow-hidden ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <button
                onClick={() => setExpanded(isExpanded ? null : league.id)}
                className={`w-full flex items-center gap-4 p-4 transition-colors ${
                  darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-3xl">{league.flag}</span>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {league.persianName}
                    </h3>
                    {liveCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                        {toPersian(liveCount)} زنده
                      </span>
                    )}
                  </div>
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(league.id); }}
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

              {isExpanded && teams.length > 0 && (
                <div className={`border-t px-4 py-3 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <p className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>تیم‌های این لیگ</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {teams.map(team => (
                      <div key={team.id} className={`flex items-center gap-2 p-2 rounded-xl ${
                        darkMode ? 'bg-gray-800/60 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
                      } transition-colors`}>
                        <span className="text-xl">{team.flag}</span>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {team.persianName}
                          </p>
                          {team.stadium && (
                            <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              {team.stadiumPersian}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && teams.length === 0 && (
                <div className={`border-t px-4 py-6 text-center ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                  <p className="text-sm">اطلاعات تیم‌ها به زودی اضافه می‌شود</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
