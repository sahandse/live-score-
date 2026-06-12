import { Moon, Sun } from 'lucide-react';
import { usePersianDateTime } from '../hooks/usePersianDate';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { timeString, dateString, dayName } = usePersianDateTime();
  const { darkMode, toggleDarkMode } = useApp();

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
      darkMode
        ? 'bg-gray-950/90 border-gray-800'
        : 'bg-white/90 border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">🏆</span>
            </div>
            <div>
              <h1 className={`text-lg font-bold leading-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                جام جهانی ۲۰۲۶
              </h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                FIFA World Cup 2026
              </p>
            </div>
          </div>

          {/* Persian Date & Time */}
          <div className={`hidden md:flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl ${
            darkMode ? 'bg-gray-800/60' : 'bg-gray-100'
          }`}>
            <div className={`text-lg font-bold tabular-nums tracking-wide ${
              darkMode ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              {timeString}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {dayName}، {dateString}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl transition-all ${
                darkMode
                  ? 'hover:bg-gray-800 text-yellow-400 hover:text-yellow-300'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Date */}
        <div className={`md:hidden flex items-center justify-center gap-2 mt-2 pt-2 border-t text-xs ${
          darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'
        }`}>
          <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{timeString}</span>
          <span>•</span>
          <span>{dayName}، {dateString}</span>
        </div>
      </div>
    </header>
  );
}
