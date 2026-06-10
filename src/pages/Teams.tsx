import { useState, useEffect } from 'react';
import { Star, Search, ChevronDown, ChevronUp, Users, MapPin, User } from 'lucide-react';
import { clubTeams, nationalTeams } from '../data/teams';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import { searchTeam, type SportsDbTeam } from '../services/sportsDbApi';

export default function Teams() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const [tab, setTab] = useState<'club' | 'national'>('club');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [teamInfo, setTeamInfo] = useState<Record<string, SportsDbTeam>>({});

  const allTeams = tab === 'club' ? clubTeams : nationalTeams;
  const teams = allTeams.filter(t =>
    t.persianName.includes(search) || t.name.toLowerCase().includes(search.toLowerCase()) || t.countryPersian.includes(search)
  );

  useEffect(() => {
    let cancelled = false;
    const source = tab === 'club' ? clubTeams : nationalTeams;

    const fetchAll = async () => {
      for (const team of source) {
        if (cancelled) break;
        const info = await searchTeam(team.name);
        if (info && !cancelled) {
          setTeamInfo(prev => ({ ...prev, [team.name]: info }));
        }
        if (!cancelled) await new Promise(r => setTimeout(r, 80));
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>تیم‌های فوتبال</h2>
        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(teams.length)} تیم</span>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <button
          onClick={() => setTab('club')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'club' ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg' : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          تیم‌های باشگاهی
        </button>
        <button
          onClick={() => setTab('national')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'national' ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg' : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          تیم‌های ملی
        </button>
      </div>

      {/* Search */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-5 border ${
        darkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-400 shadow-sm'
      }`}>
        <Search size={16} />
        <input
          type="text"
          placeholder="جستجوی تیم..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-gray-200 placeholder:text-gray-700' : 'text-gray-700 placeholder:text-gray-400'}`}
        />
      </div>

      <div className="space-y-3">
        {teams.map(team => {
          const isExpanded = expanded === team.id;
          const info = teamInfo[team.name];

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
                {/* Badge */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                  {info?.strTeamBadge ? (
                    <img
                      src={info.strTeamBadge}
                      alt={team.name}
                      className="w-11 h-11 object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-3xl">{team.flag}</span>
                  )}
                </div>

                <div className="flex-1 text-right">
                  <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {team.persianName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {team.countryPersian}
                    </span>
                    {team.founded && (
                      <>
                        <span className={`text-xs ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>•</span>
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>تأسیس {toPersian(team.founded)}</span>
                      </>
                    )}
                    {team.stadium && (
                      <span className={`flex items-center gap-0.5 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <MapPin size={10} />
                        {team.stadiumPersian}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-3 mt-1`}>
                    <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      <Users size={11} />
                      {toPersian(team.players.length)} بازیکن
                    </span>
                    {info?.strManager && (
                      <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <User size={10} />
                        {info.strManager}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(team.id); }}
                    className={`p-1.5 rounded-lg ${isFavorite(team.id) ? 'text-yellow-400' : darkMode ? 'text-gray-700 hover:text-gray-500' : 'text-gray-300 hover:text-gray-500'} transition-colors`}
                  >
                    <Star size={16} fill={isFavorite(team.id) ? 'currentColor' : 'none'} />
                  </button>
                  <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  {/* Stadium photo */}
                  {info?.strStadiumThumb && (
                    <div className="relative overflow-hidden h-36">
                      <img
                        src={info.strStadiumThumb}
                        alt={team.stadiumPersian || team.stadium}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 right-3 text-white text-xs font-medium flex items-center gap-1">
                        <MapPin size={11} />
                        {team.stadiumPersian || team.stadium}
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-4">
                    <p className={`text-xs mb-3 font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      ترکیب تیم
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {team.players.map(player => (
                        <div key={player.id} className={`flex items-center gap-3 p-3 rounded-xl ${
                          darkMode ? 'bg-gray-800/60' : 'bg-gray-50'
                        }`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                            player.position === 'GK' ? 'bg-yellow-500/20 text-yellow-400' :
                            player.position.includes('B') ? 'bg-blue-500/20 text-blue-400' :
                            player.position.includes('M') || player.position.includes('D') ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {toPersian(player.number)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {player.persianName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs">{player.flag}</span>
                              <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{player.persianPosition}</span>
                            </div>
                          </div>
                          {player.goals !== undefined && (
                            <div className="text-left">
                              <div className={`text-xs font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {toPersian(player.goals)} ⚽
                              </div>
                              {player.assists !== undefined && (
                                <div className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {toPersian(player.assists)} پاس
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {teams.length === 0 && (
          <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
            <div className="text-4xl mb-3">🔍</div>
            <p>تیمی با این نام یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}
