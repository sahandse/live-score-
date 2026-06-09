import { NavLink } from 'react-router-dom';
import { Home, Users, Trophy, User, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/', label: 'خانه', icon: Home },
  { to: '/leagues', label: 'لیگ‌ها', icon: Trophy },
  { to: '/teams', label: 'تیم‌ها', icon: Users },
  { to: '/players', label: 'بازیکنان', icon: User },
  { to: '/worldcup', label: 'جام جهانی', icon: Globe },
];

export default function Navigation() {
  const { darkMode } = useApp();

  return (
    <>
      {/* Desktop sidebar-style top nav */}
      <nav className={`border-b ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? darkMode
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-emerald-600 text-emerald-700'
                      : darkMode
                        ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t md:hidden ${
        darkMode ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl`}>
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? darkMode
                      ? 'text-emerald-400'
                      : 'text-emerald-600'
                    : darkMode
                      ? 'text-gray-500'
                      : 'text-gray-400'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
