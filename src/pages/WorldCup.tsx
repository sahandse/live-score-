import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { nationalTeams } from '../data/teams';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';

// WC 2026: 48 teams, 16 groups of 3, USA + Canada + Mexico as hosts
// Draw held December 2024 in Miami

const allWCTeams = [
  // CONCACAF (6) — hosts + qualifiers
  { id: 'usa',          name: 'آمریکا',           flag: '🇺🇸', conf: 'CONCACAF', host: true  },
  { id: 'mexico',       name: 'مکزیک',            flag: '🇲🇽', conf: 'CONCACAF', host: true  },
  { id: 'canada',       name: 'کانادا',            flag: '🇨🇦', conf: 'CONCACAF', host: true  },
  { id: 'panama',       name: 'پاناما',            flag: '🇵🇦', conf: 'CONCACAF', host: false },
  { id: 'costa_rica',   name: 'کاستاریکا',         flag: '🇨🇷', conf: 'CONCACAF', host: false },
  { id: 'honduras',     name: 'هندوراس',           flag: '🇭🇳', conf: 'CONCACAF', host: false },

  // CONMEBOL (6)
  { id: 'argentina',    name: 'آرژانتین',          flag: '🇦🇷', conf: 'CONMEBOL', host: false },
  { id: 'brazil',       name: 'برزیل',             flag: '🇧🇷', conf: 'CONMEBOL', host: false },
  { id: 'colombia',     name: 'کلمبیا',            flag: '🇨🇴', conf: 'CONMEBOL', host: false },
  { id: 'uruguay',      name: 'اروگوئه',           flag: '🇺🇾', conf: 'CONMEBOL', host: false },
  { id: 'ecuador',      name: 'اکوادور',           flag: '🇪🇨', conf: 'CONMEBOL', host: false },
  { id: 'venezuela',    name: 'ونزوئلا',           flag: '🇻🇪', conf: 'CONMEBOL', host: false },

  // UEFA (16)
  { id: 'germany',      name: 'آلمان',             flag: '🇩🇪', conf: 'UEFA',     host: false },
  { id: 'france',       name: 'فرانسه',            flag: '🇫🇷', conf: 'UEFA',     host: false },
  { id: 'england',      name: 'انگلستان',          flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', conf: 'UEFA',     host: false },
  { id: 'spain',        name: 'اسپانیا',           flag: '🇪🇸', conf: 'UEFA',     host: false },
  { id: 'portugal',     name: 'پرتغال',            flag: '🇵🇹', conf: 'UEFA',     host: false },
  { id: 'netherlands',  name: 'هلند',              flag: '🇳🇱', conf: 'UEFA',     host: false },
  { id: 'belgium',      name: 'بلژیک',             flag: '🇧🇪', conf: 'UEFA',     host: false },
  { id: 'austria',      name: 'اتریش',             flag: '🇦🇹', conf: 'UEFA',     host: false },
  { id: 'switzerland',  name: 'سوئیس',             flag: '🇨🇭', conf: 'UEFA',     host: false },
  { id: 'croatia',      name: 'کرواسی',            flag: '🇭🇷', conf: 'UEFA',     host: false },
  { id: 'denmark',      name: 'دانمارک',           flag: '🇩🇰', conf: 'UEFA',     host: false },
  { id: 'turkey',       name: 'ترکیه',             flag: '🇹🇷', conf: 'UEFA',     host: false },
  { id: 'poland',       name: 'لهستان',            flag: '🇵🇱', conf: 'UEFA',     host: false },
  { id: 'scotland',     name: 'اسکاتلند',          flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', conf: 'UEFA',     host: false },
  { id: 'hungary',      name: 'مجارستان',          flag: '🇭🇺', conf: 'UEFA',     host: false },
  { id: 'serbia',       name: 'صربستان',           flag: '🇷🇸', conf: 'UEFA',     host: false },

  // AFC (8)
  { id: 'japan',        name: 'ژاپن',              flag: '🇯🇵', conf: 'AFC',      host: false },
  { id: 'south_korea',  name: 'کره جنوبی',         flag: '🇰🇷', conf: 'AFC',      host: false },
  { id: 'iran',         name: 'ایران',             flag: '🇮🇷', conf: 'AFC',      host: false },
  { id: 'saudi_arabia', name: 'عربستان',           flag: '🇸🇦', conf: 'AFC',      host: false },
  { id: 'australia',    name: 'استرالیا',          flag: '🇦🇺', conf: 'AFC',      host: false },
  { id: 'iraq',         name: 'عراق',              flag: '🇮🇶', conf: 'AFC',      host: false },
  { id: 'jordan',       name: 'اردن',              flag: '🇯🇴', conf: 'AFC',      host: false },
  { id: 'uzbekistan',   name: 'ازبکستان',          flag: '🇺🇿', conf: 'AFC',      host: false },

  // CAF (9)
  { id: 'morocco',      name: 'مراکش',             flag: '🇲🇦', conf: 'CAF',      host: false },
  { id: 'senegal',      name: 'سنگال',             flag: '🇸🇳', conf: 'CAF',      host: false },
  { id: 'egypt',        name: 'مصر',               flag: '🇪🇬', conf: 'CAF',      host: false },
  { id: 'nigeria',      name: 'نیجریه',            flag: '🇳🇬', conf: 'CAF',      host: false },
  { id: 'ivory_coast',  name: 'ساحل عاج',          flag: '🇨🇮', conf: 'CAF',      host: false },
  { id: 'cameroon',     name: 'کامرون',            flag: '🇨🇲', conf: 'CAF',      host: false },
  { id: 'south_africa', name: 'آفریقای جنوبی',    flag: '🇿🇦', conf: 'CAF',      host: false },
  { id: 'mali',         name: 'مالی',              flag: '🇲🇱', conf: 'CAF',      host: false },
  { id: 'drc',          name: 'کنگو',              flag: '🇨🇩', conf: 'CAF',      host: false },

  // OFC (1)
  { id: 'new_zealand',  name: 'نیوزیلند',          flag: '🇳🇿', conf: 'OFC',      host: false },
];

// WC 2026 Groups (16 groups × 3 teams)
const wcGroups: { label: string; teams: string[] }[] = [
  { label: 'گروه A', teams: ['usa', 'panama', 'albania'] },
  { label: 'گروه B', teams: ['mexico', 'poland', 'cameroon'] },
  { label: 'گروه C', teams: ['canada', 'morocco', 'uruguay'] },
  { label: 'گروه D', teams: ['germany', 'colombia', 'chile'] },
  { label: 'گروه E', teams: ['spain', 'egypt', 'costa_rica'] },
  { label: 'گروه F', teams: ['brazil', 'south_africa', 'croatia'] },
  { label: 'گروه G', teams: ['france', 'nigeria', 'australia'] },
  { label: 'گروه H', teams: ['england', 'south_korea', 'iraq'] },
  { label: 'گروه I', teams: ['argentina', 'saudi_arabia', 'denmark'] },
  { label: 'گروه J', teams: ['portugal', 'venezuela', 'ivory_coast'] },
  { label: 'گروه K', teams: ['netherlands', 'senegal', 'uzbekistan'] },
  { label: 'گروه L', teams: ['iran', 'scotland', 'drc'] },
  { label: 'گروه M', teams: ['belgium', 'jordan', 'new_zealand'] },
  { label: 'گروه N', teams: ['japan', 'serbia', 'ecuador'] },
  { label: 'گروه O', teams: ['turkey', 'mali', 'honduras'] },
  { label: 'گروه P', teams: ['switzerland', 'austria', 'egypt'] },
];

// Additional teams for groups that reference IDs not in main list
const extraTeams: Record<string, { name: string; flag: string }> = {
  albania: { name: 'آلبانی', flag: '🇦🇱' },
  chile: { name: 'شیلی', flag: '🇨🇱' },
  ghana: { name: 'غنا', flag: '🇬🇭' },
};

const confederations = [
  { id: 'all',      name: 'همه',      count: allWCTeams.length },
  { id: 'UEFA',     name: 'UEFA',     count: allWCTeams.filter(t => t.conf === 'UEFA').length },
  { id: 'CONMEBOL', name: 'CONMEBOL', count: allWCTeams.filter(t => t.conf === 'CONMEBOL').length },
  { id: 'AFC',      name: 'AFC',      count: allWCTeams.filter(t => t.conf === 'AFC').length },
  { id: 'CAF',      name: 'CAF',      count: allWCTeams.filter(t => t.conf === 'CAF').length },
  { id: 'CONCACAF', name: 'CONCACAF', count: allWCTeams.filter(t => t.conf === 'CONCACAF').length },
  { id: 'OFC',      name: 'OFC',      count: allWCTeams.filter(t => t.conf === 'OFC').length },
];

const prevWinners = [
  { year: 2022, champion: 'آرژانتین', flag: '🇦🇷', runner: 'فرانسه',  runnerFlag: '🇫🇷', venue: 'قطر',               score: '3-3 (پنالتی)' },
  { year: 2018, champion: 'فرانسه',   flag: '🇫🇷', runner: 'کرواسی',  runnerFlag: '🇭🇷', venue: 'روسیه',             score: '4-2' },
  { year: 2014, champion: 'آلمان',    flag: '🇩🇪', runner: 'آرژانتین',runnerFlag: '🇦🇷', venue: 'برزیل',             score: '1-0 (وقت اضافه)' },
  { year: 2010, champion: 'اسپانیا',  flag: '🇪🇸', runner: 'هلند',    runnerFlag: '🇳🇱', venue: 'آفریقای جنوبی',    score: '1-0 (وقت اضافه)' },
  { year: 2006, champion: 'ایتالیا',  flag: '🇮🇹', runner: 'فرانسه',  runnerFlag: '🇫🇷', venue: 'آلمان',             score: '1-1 (پنالتی)' },
  { year: 2002, champion: 'برزیل',    flag: '🇧🇷', runner: 'آلمان',   runnerFlag: '🇩🇪', venue: 'کره/ژاپن',         score: '2-0' },
  { year: 1998, champion: 'فرانسه',   flag: '🇫🇷', runner: 'برزیل',   runnerFlag: '🇧🇷', venue: 'فرانسه',            score: '3-0' },
  { year: 1994, champion: 'برزیل',    flag: '🇧🇷', runner: 'ایتالیا', runnerFlag: '🇮🇹', venue: 'آمریکا',            score: '0-0 (پنالتی)' },
];

function getTeam(id: string) {
  return allWCTeams.find(t => t.id === id) ?? (extraTeams[id] ? { id, ...extraTeams[id], conf: '', host: false } : null);
}

export default function WorldCup() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const [view, setView] = useState<'teams' | 'groups' | 'winners'>('teams');
  const [confFilter, setConfFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredTeams = confFilter === 'all' ? allWCTeams : allWCTeams.filter(t => t.conf === confFilter);
  const getPlayersByTeamId = (id: string) => nationalTeams.find(t => t.id === id)?.players ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-gray-900 via-blue-950 to-emerald-950 p-6 text-white">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="absolute text-3xl select-none" style={{ top: `${(i * 37) % 90}%`, left: `${(i * 53) % 90}%`, opacity: 0.6 }}>⚽</span>
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
              <p className="text-gray-400 text-sm">آمریکا · کانادا · مکزیک · ۱۱ ژوئن تا ۱۹ جولای</p>
            </div>
            <div className="text-6xl">🏆</div>
          </div>
          <div className="grid grid-cols-4 gap-2.5 mt-5">
            {[
              { v: 48, l: 'تیم' },
              { v: 104, l: 'بازی' },
              { v: 16, l: 'ورزشگاه' },
              { v: 16, l: 'گروه' },
            ].map(({ v, l }) => (
              <div key={l} className="rounded-2xl p-3 bg-white/8 backdrop-blur text-center">
                <p className="text-2xl font-black">{toPersian(v)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 px-3 py-2 bg-white/5 rounded-xl">
            <p className="text-xs text-gray-400">
              🏟️ میزبانان: نیوجرسی · لس‌آنجلس · میامی · داکوتا · سیاتل · سان فرانسیسکو · بوستون · دالاس · هیوستون · کانزاس سیتی · فیلادلفیا · آتلانتا · وانکوور · تورنتو · گوادالاخارا · مکزیکوسیتی · مونتری
            </p>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-5 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {[
          { key: 'teams',   label: 'تیم‌ها' },
          { key: 'groups',  label: 'گروه‌ها' },
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
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
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
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-4xl">{team.flag}</span>
                      <div className="flex items-center gap-1">
                        {team.host && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">میزبان</span>
                        )}
                        {team.id === 'iran' && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">ایران</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); toggleFavorite(team.id); }}
                          className={`p-1 ${isFavorite(team.id) ? 'text-yellow-400' : darkMode ? 'text-gray-700' : 'text-gray-300'}`}
                        >
                          <Star size={13} fill={isFavorite(team.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                    <p className={`font-bold text-sm text-right ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{team.name}</p>
                    <p className={`text-xs text-right mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{team.conf}</p>
                    {players.length > 0 && (
                      <div className={`flex items-center justify-between mt-2 pt-2 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{toPersian(players.length)} بازیکن</span>
                        {isExp ? <ChevronUp size={13} className={darkMode ? 'text-gray-600' : 'text-gray-400'} /> : <ChevronDown size={13} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />}
                      </div>
                    )}
                  </button>
                  {isExp && players.length > 0 && (
                    <div className={`border-t px-3 py-3 space-y-1.5 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                      {players.map(p => (
                        <div key={p.id} className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                          <span className={`text-xs font-black w-6 text-center tabular-nums ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{toPersian(p.number)}</span>
                          <span className={`text-xs font-medium flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.persianName}</span>
                          <span className={`text-xs font-bold ${
                            p.position === 'GK' ? 'text-yellow-400' :
                            p.position.includes('B') ? 'text-blue-400' :
                            p.position === 'DM' || p.position === 'CM' || p.position === 'AM' ? 'text-emerald-400' :
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
        <>
          <div className={`px-4 py-3 rounded-2xl mb-4 text-xs ${darkMode ? 'bg-blue-950/50 text-blue-300 border border-blue-900' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            ۱۶ گروه × ۳ تیم — ۲ تیم اول هر گروه + ۸ تیم سوم برتر به مرحله یک‌هشتم راه می‌یابند
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {wcGroups.map(({ label, teams: teamIds }) => (
              <div key={label} className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className={`px-4 py-3 border-b font-bold text-sm ${darkMode ? 'border-gray-800 text-gray-200' : 'border-gray-100 text-gray-800'}`}>
                  {label}
                </div>
                <div>
                  {teamIds.map((tid, idx) => {
                    const team = getTeam(tid);
                    if (!team) return null;
                    return (
                      <div key={tid} className={`flex items-center gap-3 px-4 py-2.5 ${
                        idx < teamIds.length - 1 ? darkMode ? 'border-b border-gray-800/60' : 'border-b border-gray-50' : ''
                      } ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                        <span className="text-xl">{team.flag}</span>
                        <span className={`font-medium text-sm flex-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{team.name}</span>
                        {tid === 'iran' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">🇮🇷</span>}
                        {(team as typeof allWCTeams[0]).host && <span className="text-xs text-blue-400">میزبان</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Winners view */}
      {view === 'winners' && (
        <div className="space-y-3">
          {prevWinners.map((w, i) => (
            <div key={w.year} className={`flex items-center gap-4 p-5 rounded-2xl border ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            } ${i === 0 ? 'ring-1 ring-yellow-500/30' : ''}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                i === 0 ? 'bg-yellow-500/15' : darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                {i === 0 ? '🏆' : '🥈'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(w.year)}</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>· {w.venue}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl">{w.flag}</span>
                  <span className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{w.champion}</span>
                  <span className={`text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'} px-2 py-0.5 rounded-full`}>{w.score}</span>
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
