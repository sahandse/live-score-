import { LayoutGrid, Radio, Trophy, UserRound, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ITEMS: { path: string; fa: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { path: '/',         fa: 'خانه',     icon: Radio },
  { path: '/leagues',  fa: 'لیگ‌ها',   icon: LayoutGrid },
  { path: '/teams',    fa: 'تیم‌ها',   icon: Users },
  { path: '/players',  fa: 'بازیکنان', icon: UserRound },
  { path: '/worldcup', fa: 'جام جهانی', icon: Trophy },
];

export default function BottomNav() {
  const { darkMode } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t ${
      darkMode ? 'bg-gray-950/95 border-gray-800/80' : 'bg-white/95 border-gray-200'
    } backdrop-blur-xl`}>
      <div className="max-w-2xl mx-auto flex items-center justify-around px-1 py-1.5 pb-safe">
        {ITEMS.map(({ path, fa, icon: Icon }) => {
          const active = path === '/' ? pathname.startsWith('/match') || pathname === '/' : pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[56px] ${
                active
                  ? darkMode ? 'bg-emerald-500/15' : 'bg-emerald-50'
                  : 'bg-transparent'
              }`}
            >
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
