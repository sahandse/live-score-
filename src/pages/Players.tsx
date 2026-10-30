import { useEffect, useMemo, useState } from 'react';
import { Search, Star, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import { getFeedPlayers, type FeedPlayer } from '../services/dataApi';

type SortKey = 'goals' | 'assists';

const POSITIONS: { code: string; label: string; accent: string }[] = [
  { code: 'all', label: 'همه', accent: '' },
  { code: 'GK', label: 'دروازه‌بان', accent: 'bg-yellow-500/15 text-yellow-400' },
  { code: 'DF', label: 'مدافع', accent: 'bg-blue-500/15 text-blue-400' },
  { code: 'MF', label: 'هافبک', accent: 'bg-emerald-500/15 text-emerald-400' },
  { code: 'FW', label: 'مهاجم', accent: 'bg-red-500/15 text-red-400' },
];

const accentFor = (position: string) =>
  POSITIONS.find((entry) => entry.code === position)?.accent ?? 'bg-gray-500/15 text-gray-400';

export default function Players() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const [players, setPlayers] = useState<FeedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('all');
  const [leagueFilter, setLeagueFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('goals');

  useEffect(() => {
    let cancelled = false;
    getFeedPlayers().then((rows) => {
      if (cancelled) return;
      setPlayers(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const teamNames = useMemo(
    () => [...new Set(players.map((player) => player.teamName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fa')),
    [players]
  );

  const filtered = useMemo(() => {
    const query = search.trim();
    return players
      .filter((player) => {
        if (position !== 'all' && player.position !== position) return false;
        if (leagueFilter !== 'all' && player.teamName !== leagueFilter) return false;
        if (query && !player.name.includes(query)) return false;
        return true;
      })
      .sort((a, b) => (sortBy === 'goals' ? b.goals - a.goals : b.assists - a.assists) || a.name.localeCompare(b.name, 'fa'));
  }, [players, search, position, leagueFilter, sortBy]);

  const ranked = useMemo(() => filtered.filter((player) => (sortBy === 'goals' ? player.goals : player.assists) > 0), [filtered, sortBy]);
  const maxGoals = Math.max(1, ...players.map((player) => player.goals));
  const maxAssists = Math.max(1, ...players.map((player) => player.assists));

  const podium = [ranked[1], ranked[0], ranked[2]];
  const podiumHeight = [112, 144, 96];
  const podiumRank = [2, 1, 3];
  const podiumMedal = ['🥈', '🥇', '🥉'];
  const podiumTone = ['text-gray-400', 'text-yellow-400', 'text-amber-600'];

  const statOf = (player: FeedPlayer) => (sortBy === 'goals' ? player.goals : player.assists);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>بازیکنان</h2>
        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(filtered.length)} بازیکن</span>
      </div>

      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-3 border ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <Search size={16} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />
        <input
          type="text"
          placeholder="جستجوی بازیکن..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`flex-1 bg-transparent text-sm outline-none ${
            darkMode ? 'text-gray-200 placeholder:text-gray-700' : 'text-gray-700 placeholder:text-gray-400'
          }`}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
        {POSITIONS.map((entry) => (
          <button
            key={entry.code}
            onClick={() => setPosition(entry.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              position === entry.code
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow'
                : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <select
          value={leagueFilter}
          onChange={(event) => setLeagueFilter(event.target.value)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium outline-none border ${
            darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          <option value="all">همه تیم‌ها</option>
          {teamNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {([
          { key: 'goals', label: 'گل', icon: '⚽' },
          { key: 'assists', label: 'پاس گل', icon: '🎯' },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              sortBy === key
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : darkMode ? 'text-gray-500 hover:text-gray-400 border border-gray-800' : 'text-gray-400 hover:text-gray-600 border border-gray-200'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-20 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          ))}
        </div>
      ) : (
        <>
          {ranked.length >= 3 && (
            <div className={`rounded-2xl border p-4 mb-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <p className={`text-center text-xs font-bold mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <Trophy size={12} className="inline ml-1" />
                برترین‌ها بر اساس {sortBy === 'goals' ? 'گل' : 'پاس گل'}
              </p>
              <div className="flex items-end justify-center gap-3">
                {podium.map((player, index) =>
                  player ? (
                    <div key={player.id} className="flex flex-col items-center flex-1 max-w-[120px]">
                      <span className="text-2xl mb-1">{podiumMedal[index]}</span>
                      {player.portrait ? (
                        <img src={player.portrait} alt="" className="w-14 h-14 rounded-full object-cover bg-gray-700 mb-1" />
                      ) : (
                        <span className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-black mb-1 ${accentFor(player.position)}`}>
                          {player.number > 0 ? toPersian(player.number) : player.name.trim().charAt(0)}
                        </span>
                      )}
                      <p className={`text-xs font-bold text-center truncate w-full px-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{player.name}</p>
                      <p className={`text-xs text-center truncate w-full px-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{player.teamName}</p>
                      <p className={`text-sm font-black mt-1 ${podiumTone[index]}`}>
                        {toPersian(statOf(player))} {sortBy === 'goals' ? 'گل' : 'پاس'}
                      </p>
                      <div
                        className={`w-full rounded-t-xl mt-2 border-t-2 border-x-2 flex items-center justify-center ${
                          darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-100 border-gray-200'
                        }`}
                        style={{ height: `${podiumHeight[index]}px` }}
                      >
                        <span className={`text-2xl font-black ${podiumTone[index]}`}>{toPersian(podiumRank[index])}</span>
                      </div>
                    </div>
                  ) : (
                    <div key={index} className="flex-1 max-w-[120px]" />
                  )
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {ranked.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${
                  darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                <span className={`text-sm font-black w-6 text-center flex-shrink-0 tabular-nums ${
                  index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : darkMode ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {toPersian(index + 1)}
                </span>
                {player.portrait ? (
                  <img src={player.portrait} alt="" className={`w-11 h-11 rounded-full object-cover bg-gray-700 flex-shrink-0`} />
                ) : (
                  <span className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${accentFor(player.position)}`}>
                    {player.number > 0 ? toPersian(player.number) : player.name.trim().charAt(0)}
                  </span>
                )}
                {player.countryFlag && <img src={player.countryFlag} alt="" className="w-5 h-3 object-cover flex-shrink-0 rounded-sm" />}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{player.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 mb-1.5">
                    {player.teamLogo && <img src={player.teamLogo} alt="" className="w-4 h-4 object-contain" />}
                    <span className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{player.teamName}</span>
                    {player.positionFa && player.positionFa !== 'سایر' && (
                      <>
                        <span className={`text-xs ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>·</span>
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{player.positionFa}</span>
                      </>
                    )}
                    {player.number > 0 && (
                      <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>· پیراهن {toPersian(player.number)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs w-4 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>⚽</span>
                    <div className={`flex-1 h-[2px] rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(player.goals / maxGoals) * 100}%` }} />
                    </div>
                    <span className={`text-xs w-4 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>🎯</span>
                    <div className={`flex-1 h-[2px] rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${(player.assists / maxAssists) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <p className={`text-base font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(player.goals)}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>گل</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className={`text-base font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{toPersian(player.assists)}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>پاس</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(player.id)}
                    className={`p-1 ${isFavorite(player.id) ? 'text-yellow-400' : darkMode ? 'text-gray-700 hover:text-gray-500' : 'text-gray-300 hover:text-gray-500'}`}
                  >
                    <Star size={15} fill={isFavorite(player.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {ranked.length === 0 && (
            <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
              <div className="text-4xl mb-3">👤</div>
              <p>بازیکنی با این آمار یافت نشد</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
