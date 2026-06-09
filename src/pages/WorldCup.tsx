import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { nationalTeams } from '../data/teams';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';

const worldCupGroups: Record<string, { group: string; teams: string[] }> = {
  'A': { group: 'گروه A', teams: ['usa', 'mexico', 'canada', 'ghana'] },
  'B': { group: 'گروه B', teams: ['france', 'belgium', 'morocco', 'croatia'] },
  'C': { group: 'گروه C', teams: ['brazil', 'argentina', 'chile', 'ecuador'] },
  'D': { group: 'گروه D', teams: ['spain', 'portugal', 'iran', 'australia'] },
  'E': { group: 'گروه E', teams: ['germany', 'england', 'japan', 'senegal'] },
};

const allWCTeams = [
  { id: 'usa', name: 'آمریکا', flag: '🇺🇸', confederation: 'CONCACAF' },
  { id: 'mexico', name: 'مکزیک', flag: '🇲🇽', confederation: 'CONCACAF' },
  { id: 'canada', name: 'کانادا', flag: '🇨🇦', confederation: 'CONCACAF' },
  { id: 'france', name: 'فرانسه', flag: '🇫🇷', confederation: 'UEFA' },
  { id: 'belgium', name: 'بلژیک', flag: '🇧🇪', confederation: 'UEFA' },
  { id: 'morocco', name: 'مراکش', flag: '🇲🇦', confederation: 'CAF' },
  { id: 'croatia', name: 'کرواسی', flag: '🇭🇷', confederation: 'UEFA' },
  { id: 'brazil', name: 'برزیل', flag: '🇧🇷', confederation: 'CONMEBOL' },
  { id: 'argentina', name: 'آرژانتین', flag: '🇦🇷', confederation: 'CONMEBOL' },
  { id: 'chile', name: 'شیلی', flag: '🇨🇱', confederation: 'CONMEBOL' },
  { id: 'ecuador', name: 'اکوادور', flag: '🇪🇨', confederation: 'CONMEBOL' },
  { id: 'spain', name: 'اسپانیا', flag: '🇪🇸', confederation: 'UEFA' },
  { id: 'portugal', name: 'پرتغال', flag: '🇵🇹', confederation: 'UEFA' },
  { id: 'iran', name: 'ایران', flag: '🇮🇷', confederation: 'AFC' },
  { id: 'australia', name: 'استرالیا', flag: '🇦🇺', confederation: 'AFC' },
  { id: 'germany', name: 'آلمان', flag: '🇩🇪', confederation: 'UEFA' },
  { id: 'england', name: 'انگلستان', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA' },
  { id: 'japan', name: 'ژاپن', flag: '🇯🇵', confederation: 'AFC' },
  { id: 'senegal', name: 'سنگال', flag: '🇸🇳', confederation: 'CAF' },
  { id: 'ghana', name: 'غنا', flag: '🇬🇭', confederation: 'CAF' },
  { id: 'south_korea', name: 'کره جنوبی', flag: '🇰🇷', confederation: 'AFC' },
  { id: 'nigeria', name: 'نیجریه', flag: '🇳🇬', confederation: 'CAF' },
  { id: 'colombia', name: 'کلمبیا', flag: '🇨🇴', confederation: 'CONMEBOL' },
  { id: 'uruguay', name: 'اروگوئه', flag: '🇺🇾', confederation: 'CONMEBOL' },
  { id: 'netherlands', name: 'هلند', flag: '🇳🇱', confederation: 'UEFA' },
  { id: 'italy', name: 'ایتالیا', flag: '🇮🇹', confederation: 'UEFA' },
  { id: 'poland', name: 'لهستان', flag: '🇵🇱', confederation: 'UEFA' },
  { id: 'denmark', name: 'دانمارک', flag: '🇩🇰', confederation: 'UEFA' },
  { id: 'switzerland', name: 'سوئیس', flag: '🇨🇭', confederation: 'UEFA' },
  { id: 'turkey', name: 'ترکیه', flag: '🇹🇷', confederation: 'UEFA' },
  { id: 'saudi_arabia', name: 'عربستان', flag: '🇸🇦', confederation: 'AFC' },
  { id: 'south_africa', name: 'آفریقای جنوبی', flag: '🇿🇦', confederation: 'CAF' },
  { id: 'new_zealand', name: 'نیوزیلند', flag: '🇳🇿', confederation: 'OFC' },
  { id: 'panama', name: 'پاناما', flag: '🇵🇦', confederation: 'CONCACAF' },
  { id: 'peru', name: 'پرو', flag: '🇵🇪', confederation: 'CONMEBOL' },
  { id: 'wales', name: 'ولز', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', confederation: 'UEFA' },
  { id: 'ukraine', name: 'اوکراین', flag: '🇺🇦', confederation: 'UEFA' },
  { id: 'costa_rica', name: 'کاستاریکا', flag: '🇨🇷', confederation: 'CONCACAF' },
  { id: 'cameroon', name: 'کامرون', flag: '🇨🇲', confederation: 'CAF' },
  { id: 'honduras', name: 'هندوراس', flag: '🇭🇳', confederation: 'CONCACAF' },
  { id: 'qatar', name: 'قطر', flag: '🇶🇦', confederation: 'AFC' },
  { id: 'indonesia', name: 'اندونزی', flag: '🇮🇩', confederation: 'AFC' },
  { id: 'cuba', name: 'کوبا', flag: '🇨🇺', confederation: 'CONCACAF' },
  { id: 'el_salvador', name: 'السالوادور', flag: '🇸🇻', confederation: 'CONCACAF' },
  { id: 'trinidad', name: 'ترینیداد و توباگو', flag: '🇹🇹', confederation: 'CONCACAF' },
  { id: 'haiti', name: 'هائیتی', flag: '🇭🇹', confederation: 'CONCACAF' },
  { id: 'jamaica', name: 'جامائیکا', flag: '🇯🇲', confederation: 'CONCACAF' },
  { id: 'venezuela', name: 'ونزوئلا', flag: '🇻🇪', confederation: 'CONMEBOL' },
];

const confederations = [
  { id: 'all', name: 'همه', count: allWCTeams.length },
  { id: 'UEFA', name: 'UEFA', count: allWCTeams.filter(t => t.confederation === 'UEFA').length },
  { id: 'CONMEBOL', name: 'CONMEBOL', count: allWCTeams.filter(t => t.confederation === 'CONMEBOL').length },
  { id: 'AFC', name: 'AFC', count: allWCTeams.filter(t => t.confederation === 'AFC').length },
  { id: 'CAF', name: 'CAF', count: allWCTeams.filter(t => t.confederation === 'CAF').length },
  { id: 'CONCACAF', name: 'CONCACAF', count: allWCTeams.filter(t => t.confederation === 'CONCACAF').length },
];

const prevWinners = [
  { year: 2022, champion: 'آرژانتین', flag: '🇦🇷', runner: 'فرانسه', runnerFlag: '🇫🇷', venue: 'قطر' },
  { year: 2018, champion: 'فرانسه', flag: '🇫🇷', runner: 'کرواسی', runnerFlag: '🇭🇷', venue: 'روسیه' },
  { year: 2014, champion: 'آلمان', flag: '🇩🇪', runner: 'آرژانتین', runnerFlag: '🇦🇷', venue: 'برزیل' },
  { year: 2010, champion: 'اسپانیا', flag: '🇪🇸', runner: 'هلند', runnerFlag: '🇳🇱', venue: 'آفریقای جنوبی' },
  { year: 2006, champion: 'ایتالیا', flag: '🇮🇹', runner: 'فرانسه', runnerFlag: '🇫🇷', venue: 'آلمان' },
];

export default function WorldCup() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const [view, setView] = useState<'teams' | 'groups' | 'winners'>('teams');
  const [confFilter, setConfFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredTeams = confFilter === 'all'
    ? allWCTeams
    : allWCTeams.filter(t => t.confederation === confFilter);

  const getPlayersByTeamId = (teamId: string) => {
    const team = nationalTeams.find(t => t.id === teamId);
    return team?.players || [];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Hero banner */}
      <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-gray-900 via-blue-950 to-emerald-950 p-6 text-white">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="absolute text-4xl" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: Math.random() }}>⚽</span>
          ))}
        </div>
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="text-yellow-400" size={20} />
                <span className="text-yellow-400 text-sm font-bold">جام جهانی ۲۰۲۶</span>
              </div>
              <h1 className="text-3xl font-black mb-1">FIFA World Cup 2026</h1>
              <p className="text-gray-400 text-sm">آمریکا · کانادا · مکزیک</p>
            </div>
            <div className="text-6xl">🏆</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className={`rounded-2xl p-3 bg-white/5 backdrop-blur`}>
              <p className="text-2xl font-black">{toPersian(48)}</p>
              <p className="text-xs text-gray-400 mt-0.5">تیم شرکت‌کننده</p>
            </div>
            <div className={`rounded-2xl p-3 bg-white/5 backdrop-blur`}>
              <p className="text-2xl font-black">{toPersian(104)}</p>
              <p className="text-xs text-gray-400 mt-0.5">بازی</p>
            </div>
            <div className={`rounded-2xl p-3 bg-white/5 backdrop-blur`}>
              <p className="text-2xl font-black">{toPersian(16)}</p>
              <p className="text-xs text-gray-400 mt-0.5">ورزشگاه</p>
            </div>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-5 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {[
          { key: 'teams', label: 'تیم‌ها' },
          { key: 'groups', label: 'گروه‌ها' },
          { key: 'winners', label: 'قهرمانان' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key as typeof view)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              view === key ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg' : darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Teams view */}
      {view === 'teams' && (
        <>
          {/* Confederation filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {confederations.map(conf => (
              <button
                key={conf.id}
                onClick={() => setConfFilter(conf.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                  confFilter === conf.id
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow'
                    : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {conf.name}
                <span className={`text-xs px-1 rounded ${confFilter === conf.id ? 'bg-white/20' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {toPersian(conf.count)}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredTeams.map(team => {
              const players = getPlayersByTeamId(team.id);
              const isExp = expanded === team.id;
              return (
                <div key={team.id} className={`rounded-2xl border overflow-hidden ${
                  darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                } ${team.id === 'iran' ? darkMode ? 'border-emerald-800 ring-1 ring-emerald-700/30' : 'border-emerald-300 ring-1 ring-emerald-200' : ''}`}>
                  <button
                    onClick={() => setExpanded(isExp ? null : team.id)}
                    className={`w-full p-4 transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl">{team.flag}</span>
                      <div className="flex items-center gap-1">
                        {team.id === 'iran' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">ایران</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); toggleFavorite(team.id); }}
                          className={`p-1 ${isFavorite(team.id) ? 'text-yellow-400' : darkMode ? 'text-gray-700' : 'text-gray-300'}`}
                        >
                          <Star size={14} fill={isFavorite(team.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                    <p className={`font-bold text-sm text-right ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{team.name}</p>
                    <p className={`text-xs text-right mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{team.confederation}</p>
                    {players.length > 0 && (
                      <div className={`flex items-center justify-between mt-2 pt-2 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{toPersian(players.length)} بازیکن</span>
                        {isExp ? <ChevronUp size={14} className={darkMode ? 'text-gray-600' : 'text-gray-400'} /> : <ChevronDown size={14} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />}
                      </div>
                    )}
                  </button>
                  {isExp && players.length > 0 && (
                    <div className={`border-t px-3 py-3 space-y-1.5 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                      {players.map(p => (
                        <div key={p.id} className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                          <span className={`text-xs font-black w-6 text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{toPersian(p.number)}</span>
                          <span className={`text-xs font-medium flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.persianName}</span>
                          <span className={`text-xs ${
                            p.position === 'GK' ? 'text-yellow-400' :
                            p.position.includes('B') ? 'text-blue-400' :
                            p.position.includes('M') || p.position.includes('D') ? 'text-emerald-400' :
                            'text-red-400'
                          }`}>{p.position}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Groups view */}
      {view === 'groups' && (
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(worldCupGroups).map(([key, { group, teams: teamIds }]) => (
            <div key={key} className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className={`px-5 py-4 border-b font-bold ${darkMode ? 'border-gray-800 text-gray-200' : 'border-gray-100 text-gray-800'}`}>
                {group}
              </div>
              <div className="divide-y">
                {teamIds.map((tid, idx) => {
                  const team = allWCTeams.find(t => t.id === tid);
                  if (!team) return null;
                  return (
                    <div key={tid} className={`flex items-center gap-3 px-5 py-3 ${
                      darkMode ? 'divide-gray-800 hover:bg-gray-800/30' : 'divide-gray-50 hover:bg-gray-50'
                    } transition-colors`}>
                      <span className={`text-sm font-bold w-5 text-center ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>{toPersian(idx + 1)}</span>
                      <span className="text-2xl">{team.flag}</span>
                      <span className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{team.name}</span>
                      {tid === 'iran' && (
                        <span className="mr-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">ایران 🇮🇷</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Winners view */}
      {view === 'winners' && (
        <div className="space-y-3">
          {prevWinners.map((w, i) => (
            <div key={w.year} className={`flex items-center gap-4 p-5 rounded-2xl border ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            } ${i === 0 ? 'ring-1 ring-yellow-500/30' : ''}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                i === 0 ? 'bg-yellow-500/15' : darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                {i === 0 ? '🏆' : '🥈'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(w.year)}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>· {w.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{w.flag}</span>
                  <span className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{w.champion}</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>در برابر</span>
                  <span className="text-2xl">{w.runnerFlag}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{w.runner}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
