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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>بازیکنان</h2>
        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(filtered.length)} بازیکن</span>
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

      {/* Players list */}
      <div className="space-y-2">
        {filtered.map((player, idx) => {
          const pos = positionColors[player.position] || positionColors.CM;
          const photo = playerPhotos[player.name];
          return (
            <div key={`${player.id}_${idx}`} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
            }`}>
              {/* Rank */}
              <span className={`text-sm font-black w-6 text-center flex-shrink-0 ${
                idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : darkMode ? 'text-gray-700' : 'text-gray-300'
              }`}>{toPersian(idx + 1)}</span>

              {/* Photo or position badge */}
              {photo ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
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
                <span className={`text-xs font-black px-2 py-1 rounded-lg flex-shrink-0 ${pos.bg} ${pos.text}`}>
                  {player.position}
                </span>
              )}

              {/* Flag */}
              <span className="text-xl flex-shrink-0">{player.flag}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {player.persianName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm">{player.teamFlag}</span>
                  <span className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {player.teamPersian}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>·</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {toPersian(player.age)} ساله
                  </span>
                </div>
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
