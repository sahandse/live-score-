import { Radio, LayoutGrid, CalendarDays, Trophy, Users } from 'lucide-react';
import { useApp, type AppTab } from '../context/AppContext';

const ITEMS: { id: AppTab; fa: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { id: 'live',     fa: 'زنده',    icon: Radio },
  { id: 'groups',   fa: 'گروه‌ها', icon: LayoutGrid },
  { id: 'schedule', fa: 'برنامه',  icon: CalendarDays },
  { id: 'bracket',  fa: 'براکت',   icon: Trophy },
  { id: 'teams',    fa: 'تیم‌ها',  icon: Users },
];

export default function BottomNav({ liveCount = 0 }: { liveCount?: number }) {
  const { tab, setTab, darkMode } = useApp();

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t ${
      darkMode ? 'bg-gray-950/95 border-gray-800/80' : 'bg-white/95 border-gray-200'
    } backdrop-blur-xl`}>
      <div className="max-w-2xl mx-auto flex items-center justify-around px-1 py-1.5 pb-safe">
        {ITEMS.map(({ id, fa, icon: Icon }) => {
          const active = tab === id;
          const isLive = id === 'live';
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[56px] ${
                active
                  ? darkMode
                    ? 'bg-emerald-500/15'
                    : 'bg-emerald-50'
                  : 'bg-transparent'
              }`}
            >
              {/* Live badge */}
              {isLive && liveCount > 0 && (
                <span className="absolute -top-0.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center leading-none">
                  {liveCount}
                </span>
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.5}
                className={active
                  ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
                }
              />
              <span className={`text-[10px] font-medium ${
                active
                  ? darkMode ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>{fa}</span>
              {active && (
                <span className={`w-1 h-1 rounded-full ${darkMode ? 'bg-emerald-500' : 'bg-emerald-600'}`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
