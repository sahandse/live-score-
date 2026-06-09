import { useState } from 'react';
import { Flame, Clock, CheckCircle } from 'lucide-react';
import { liveMatches, standings } from '../data/matches';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import MatchCard from '../components/MatchCard';

type Tab = 'live' | 'upcoming' | 'finished';

export default function Home() {
  const { darkMode } = useApp();
  const [tab, setTab] = useState<Tab>('live');

  const filtered = liveMatches.filter(m => {
    if (tab === 'live') return m.status === 'live' || m.status === 'halftime';
    if (tab === 'upcoming') return m.status === 'upcoming';
    if (tab === 'finished') return m.status === 'finished';
    return true;
  });

  const tabs: { key: Tab; label: string; icon: typeof Flame; count: number }[] = [
    { key: 'live', label: 'زنده', icon: Flame, count: liveMatches.filter(m => m.status === 'live' || m.status === 'halftime').length },
    { key: 'upcoming', label: 'آینده', icon: Clock, count: liveMatches.filter(m => m.status === 'upcoming').length },
    { key: 'finished', label: 'پایان یافته', icon: CheckCircle, count: liveMatches.filter(m => m.status === 'finished').length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Hero stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'بازی زنده', value: liveMatches.filter(m => m.status === 'live').length, color: 'from-red-600 to-orange-500', icon: '🔴' },
          { label: 'کل بازی‌ها', value: liveMatches.length, color: 'from-emerald-600 to-teal-500', icon: '⚽' },
          { label: 'یادآوری‌ها', value: liveMatches.filter(m => m.status === 'upcoming').length, color: 'from-blue-600 to-indigo-500', icon: '🔔' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl bg-gradient-to-br ${stat.color} p-4 text-white`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-black">{toPersian(stat.value)}</div>
            <div className="text-xs opacity-80 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-5 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === key
                  ? 'bg-white/20 text-white'
                  : key === 'live'
                    ? 'bg-red-500 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>{toPersian(count)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Matches */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
              <div className="text-4xl mb-3">⚽</div>
              <p>بازی‌ای در این بخش وجود ندارد</p>
            </div>
          ) : (
            filtered.map(match => <MatchCard key={match.id} match={match} />)
          )}
        </div>

        {/* Standings sidebar */}
        <div className="hidden md:block">
          <div className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>جدول لیگ برتر انگلیس</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                    <th className="px-3 py-2 text-right">#</th>
                    <th className="px-3 py-2 text-right">تیم</th>
                    <th className="px-3 py-2 text-center">ب</th>
                    <th className="px-3 py-2 text-center">ب</th>
                    <th className="px-3 py-2 text-center">م</th>
                    <th className="px-3 py-2 text-center">ب</th>
                    <th className="px-3 py-2 text-center font-bold">ام</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.position} className={`border-t transition-colors ${
                      darkMode
                        ? 'border-gray-800 hover:bg-gray-800/50'
                        : 'border-gray-50 hover:bg-gray-50'
                    } ${row.position <= 4 ? darkMode ? 'border-r-2 border-r-emerald-700' : 'border-r-2 border-r-emerald-500' : ''}`}>
                      <td className={`px-3 py-2.5 font-bold text-center ${
                        row.position <= 4 ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>{toPersian(row.position)}</td>
                      <td className={`px-3 py-2.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-1.5">
                          <span>{row.flag}</span>
                          <span className="font-medium">{row.team}</span>
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{toPersian(row.played)}</td>
                      <td className="px-3 py-2.5 text-center text-emerald-500 font-medium">{toPersian(row.won)}</td>
                      <td className={`px-3 py-2.5 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{toPersian(row.drawn)}</td>
                      <td className="px-3 py-2.5 text-center text-red-400 font-medium">{toPersian(row.lost)}</td>
                      <td className={`px-3 py-2.5 text-center font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(row.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`px-4 py-2 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-1" />
              ۴ تیم اول = لیگ قهرمانان اروپا
            </div>
          </div>

          {/* Top Scorers */}
          <div className={`mt-4 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center gap-2 px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <span>⚽</span>
              <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>گلزنان برتر</h3>
            </div>
            <div className="divide-y divide-transparent">
              {[
                { name: 'کریستیانو رونالدو', flag: '🇵🇹', team: 'پرتغال', goals: 135, assists: 42 },
                { name: 'لیونل مسی', flag: '🇦🇷', team: 'آرژانتین', goals: 109, assists: 56 },
                { name: 'هری کین', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', team: 'بایرن مونیخ', goals: 36, assists: 8 },
                { name: 'کیلیان امباپه', flag: '🇫🇷', team: 'رئال مادرید', goals: 32, assists: 9 },
                { name: 'محمد صلاح', flag: '🇪🇬', team: 'لیورپول', goals: 29, assists: 14 },
              ].map((scorer, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${
                  darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                } transition-colors`}>
                  <span className={`text-lg font-black w-6 text-center ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}>{toPersian(i + 1)}</span>
                  <span className="text-xl">{scorer.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{scorer.name}</p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{scorer.team}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500 font-black text-sm">{toPersian(scorer.goals)}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>⚽</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
