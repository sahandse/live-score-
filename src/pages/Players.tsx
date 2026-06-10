import { useState, useEffect, useRef } from 'react';
import { Star, Search, Award } from 'lucide-react';
import { clubTeams, nationalTeams, type Player } from '../data/teams';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import { searchPlayer } from '../services/sportsDbApi';

interface ExtendedPlayer extends Player {
  teamName: string;
  teamPersian: string;
  teamFlag: string;
}

const positionColors: Record<string, { bg: string; text: string; label: string }> = {
  GK: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'دروازه‌بان' },
  CB: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'مدافع' },
  LB: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'مدافع چپ' },
  RB: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'مدافع راست' },
  DM: { bg: 'bg-teal-500/15', text: 'text-teal-400', label: 'هافبک دفاعی' },
  CM: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'هافبک' },
  AM: { bg: 'bg-lime-500/15', text: 'text-lime-400', label: 'هافبک تهاجمی' },
  LW: { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'مهاجم چپ' },
  RW: { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'مهاجم راست' },
  ST: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'مهاجم' },
};

const PODIUM_SORTS = ['goals', 'assists', 'rating'] as const;

export default function Players() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'goals' | 'assists' | 'rating'>('goals');
  const [playerPhotos, setPlayerPhotos] = useState<Record<string, string>>({});
  const fetchedRef = useRef(new Set<string>());

  const allPlayers: ExtendedPlayer[] = [...clubTeams, ...nationalTeams].flatMap(team =>
    team.players.map(p => ({
      ...p,
      teamName: team.name,
      teamPersian: team.persianName,
      teamFlag: team.flag,
    }))
  );

  const uniquePlayers = allPlayers.filter((p, idx) => allPlayers.findIndex(q => q.id === p.id) === idx);

  const filtered = uniquePlayers
    .filter(p => {
      const matchSearch = !search ||
        p.persianName.includes(search) ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nationalityPersian.includes(search);
      const matchPos = posFilter === 'all' || p.position === posFilter;
      return matchSearch && matchPos;
    })
    .sort((a, b) => {
      if (sortBy === 'goals') return (b.goals || 0) - (a.goals || 0);
      if (sortBy === 'assists') return (b.assists || 0) - (a.assists || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

  // Fetch photos for top 30 visible players
  useEffect(() => {
    let cancelled = false;
    const toFetch = filtered.slice(0, 30).filter(p => !fetchedRef.current.has(p.name));

    const fetchPhotos = async () => {
      for (const player of toFetch) {
        if (cancelled) break;
        fetchedRef.current.add(player.name);
        const info = await searchPlayer(player.name);
        if (info && !cancelled) {
          const photo = info.strCutout || info.strThumb || '';
          if (photo) setPlayerPhotos(prev => ({ ...prev, [player.name]: photo }));
        }
        if (!cancelled) await new Promise(r => setTimeout(r, 120));
      }
    };

    fetchPhotos();
    return () => { cancelled = true; };
  }, [search, posFilter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const positions = ['all', 'GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
  const posLabels: Record<string, string> = {
    all: 'همه', GK: 'GK', CB: 'CB', LB: 'LB', RB: 'RB', DM: 'DM', CM: 'CM', AM: 'AM', LW: 'LW', RW: 'RW', ST: 'ST'
  };

  // Computed max values for progress bars
  const maxGoals = Math.max(1, ...uniquePlayers.map(p => p.goals || 0));
  const maxAssists = Math.max(1, ...uniquePlayers.map(p => p.assists || 0));

  // Stats summary
  const topScorer = [...uniquePlayers].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];
  const topAssister = [...uniquePlayers].sort((a, b) => (b.assists || 0) - (a.assists || 0))[0];
  const topRated = [...uniquePlayers].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

  // Podium: shown when sorted by goals/assists/rating and >=3 players in filtered
  const showPodium = PODIUM_SORTS.includes(sortBy) && filtered.length >= 3;
  const podiumPlayers = filtered.slice(0, 3); // [0]=1st, [1]=2nd, [2]=3rd
  // Reorder for display: 2nd | 1st | 3rd
  const podiumOrder = [podiumPlayers[1], podiumPlayers[0], podiumPlayers[2]];
  const podiumBaseHeights = [112, 144, 96]; // px for 2nd, 1st, 3rd
  const podiumColors = ['text-gray-400', 'text-yellow-400', 'text-amber-600'];
  const podiumBgColors = ['bg-gray-400/10', 'bg-yellow-400/10', 'bg-amber-600/10'];
  const podiumBorderColors = ['border-gray-400/30', 'border-yellow-400/30', 'border-amber-600/30'];
  const podiumMedals = ['🥈', '🥇', '🥉'];
  const podiumRanks = [2, 1, 3]; // actual rank of each column

  const getStatValue = (player: ExtendedPlayer) => {
    if (sortBy === 'goals') return `${toPersian(player.goals || 0)} گل`;
    if (sortBy === 'assists') return `${toPersian(player.assists || 0)} پاس گل`;
    return `${(player.rating || 0).toFixed(1)}`;
  };

  const listPlayers = showPodium ? filtered.slice(3) : filtered;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>بازیکنان</h2>
        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(filtered.length)} بازیکن</span>
      </div>

      {/* Stats summary bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
          darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
        }`}>
          <span>👥</span>
          <span>{toPersian(uniquePlayers.length)} بازیکن</span>
        </div>
        {topScorer && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
            darkMode ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
          }`}>
            <span>⚽</span>
            <span>{topScorer.persianName}</span>
            <span className="font-black">{toPersian(topScorer.goals || 0)}</span>
          </div>
        )}
        {topAssister && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
            darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <span>🎯</span>
            <span>{topAssister.persianName}</span>
            <span className="font-black">{toPersian(topAssister.assists || 0)}</span>
          </div>
        )}
        {topRated && topRated.rating && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
            darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span>⭐</span>
            <span>{topRated.persianName}</span>
            <span className="font-black">{topRated.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-4 border ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <Search size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
        <input
          type="text"
          placeholder="جستجوی بازیکن..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-gray-200 placeholder:text-gray-700' : 'text-gray-700 placeholder:text-gray-400'}`}
        />
      </div>

      {/* Position filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setPosFilter(pos)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              posFilter === pos
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow'
                : darkMode
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {posLabels[pos]}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-5">
        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>مرتب‌سازی:</span>
        {[
          { key: 'goals', label: 'گل', icon: '⚽' },
          { key: 'assists', label: 'پاس گل', icon: '🎯' },
          { key: 'rating', label: 'امتیاز', icon: '⭐' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setSortBy(key as typeof sortBy)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              sortBy === key
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : darkMode
                  ? 'text-gray-500 hover:text-gray-400 border border-gray-800'
                  : 'text-gray-400 hover:text-gray-600 border border-gray-200'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {showPodium && (
        <div className={`rounded-2xl border p-4 mb-5 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-center text-xs font-bold mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            برترین بازیکنان
          </p>
          <div className="flex items-end justify-center gap-3">
            {podiumOrder.map((player, colIdx) => {
              if (!player) return null;
              const photo = playerPhotos[player.name];
              const rank = podiumRanks[colIdx];
              const baseH = podiumBaseHeights[colIdx];
              const colorClass = podiumColors[colIdx];
              const bgClass = podiumBgColors[colIdx];
              const borderClass = podiumBorderColors[colIdx];
              const medal = podiumMedals[colIdx];
              const pos = positionColors[player.position] || positionColors.CM;

              return (
                <div key={player.id} className="flex flex-col items-center flex-1 max-w-[110px]">
                  {/* Player card above podium base */}
                  <div className="flex flex-col items-center mb-2 w-full">
                    {/* Medal */}
                    <span className="text-2xl mb-1">{medal}</span>
                    {/* Photo */}
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${borderClass} mb-1 flex-shrink-0 ${bgClass}`}>
                      {photo ? (
                        <img
                          src={photo}
                          alt={player.name}
                          className="w-full h-full object-cover object-top"
                          onError={e => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            const parent = el.parentElement!;
                            const span = document.createElement('span');
                            span.className = `w-full h-full flex items-center justify-center text-xs font-black ${pos.text}`;
                            span.textContent = player.position;
                            parent.appendChild(span);
                          }}
                        />
                      ) : (
                        <span className={`w-full h-full flex items-center justify-center text-xs font-black ${pos.text}`}>
                          {player.position}
                        </span>
                      )}
                    </div>
                    {/* Flag */}
                    <span className="text-base mb-0.5">{player.flag}</span>
                    {/* Name */}
                    <p className={`text-xs font-bold text-center truncate w-full px-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {player.persianName}
                    </p>
                    {/* Team */}
                    <p className={`text-xs text-center truncate w-full px-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {player.teamPersian}
                    </p>
                    {/* Stat value */}
                    <p className={`text-sm font-black mt-1 ${colorClass}`}>
                      {getStatValue(player)}
                    </p>
                  </div>
                  {/* Podium base */}
                  <div
                    className={`w-full rounded-t-xl flex items-center justify-center border-t-2 border-x-2 ${bgClass} ${borderClass}`}
                    style={{ height: `${baseH}px` }}
                  >
                    <span className={`text-2xl font-black ${colorClass}`}>{toPersian(rank)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Players list */}
      <div className="space-y-2">
        {listPlayers.map((player, idx) => {
          const actualIdx = showPodium ? idx + 3 : idx;
          const pos = positionColors[player.position] || positionColors.CM;
          const photo = playerPhotos[player.name];
          const goalsBar = ((player.goals || 0) / maxGoals) * 100;
          const assistsBar = ((player.assists || 0) / maxAssists) * 100;

          return (
            <div key={`${player.id}_${actualIdx}`} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
            }`}>
              {/* Rank */}
              <span className={`text-sm font-black w-6 text-center flex-shrink-0 ${
                actualIdx === 0 ? 'text-yellow-400' : actualIdx === 1 ? 'text-gray-400' : actualIdx === 2 ? 'text-amber-600' : darkMode ? 'text-gray-700' : 'text-gray-300'
              }`}>{toPersian(actualIdx + 1)}</span>

              {/* Photo or position badge */}
              {photo ? (
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-800 border border-gray-700">
                  <img
                    src={photo}
                    alt={player.name}
                    className="w-full h-full object-cover object-top"
                    onError={e => {
                      const parent = (e.target as HTMLImageElement).parentElement!;
                      parent.innerHTML = `<span class="w-full h-full flex items-center justify-center text-xs font-black ${pos.bg} ${pos.text}">${player.position}</span>`;
                    }}
                  />
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${pos.bg}`}>
                  <span className={`text-xs font-black ${pos.text}`}>
                    {player.position}
                  </span>
                </div>
              )}

              {/* Flag */}
              <span className="text-xl flex-shrink-0">{player.flag}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {player.persianName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 mb-1.5">
                  <span className="text-sm">{player.teamFlag}</span>
                  <span className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {player.teamPersian}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>·</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {toPersian(player.age)} ساله
                  </span>
                </div>
                {/* Progress bars */}
                {(player.goals !== undefined || player.assists !== undefined) && (
                  <div className="flex flex-col gap-1">
                    {player.goals !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs w-4 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>⚽</span>
                        <div className={`flex-1 h-[2px] rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${goalsBar}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {player.assists !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs w-4 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>🎯</span>
                        <div className={`flex-1 h-[2px] rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${assistsBar}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {player.goals !== undefined && (
                  <div className="text-center">
                    <p className={`text-base font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {toPersian(player.goals)}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>گل</p>
                  </div>
                )}
                {player.assists !== undefined && (
                  <div className="text-center hidden sm:block">
                    <p className={`text-base font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {toPersian(player.assists)}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>پاس</p>
                  </div>
                )}
                {player.rating && (
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${
                    player.rating >= 9 ? 'bg-yellow-500/15' : player.rating >= 8.5 ? 'bg-emerald-500/15' : 'bg-gray-500/15'
                  }`}>
                    <span className={`text-sm font-black ${
                      player.rating >= 9 ? 'text-yellow-400' : player.rating >= 8.5 ? 'text-emerald-400' : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{player.rating.toFixed(1)}</span>
                    <Award size={10} className={player.rating >= 9 ? 'text-yellow-400' : 'text-emerald-400'} />
                  </div>
                )}
                <button
                  onClick={() => toggleFavorite(player.id)}
                  className={`p-1 ${isFavorite(player.id) ? 'text-yellow-400' : darkMode ? 'text-gray-700 hover:text-gray-500' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  <Star size={15} fill={isFavorite(player.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
          <div className="text-4xl mb-3">👤</div>
          <p>بازیکنی یافت نشد</p>
        </div>
      )}
    </div>
  );
}
