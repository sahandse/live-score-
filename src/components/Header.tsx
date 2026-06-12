import { useState } from 'react';
import { Settings } from 'lucide-react';
import { usePersianDateTime } from '../hooks/usePersianDate';
import { useApp } from '../context/AppContext';
import SettingsPanel from './SettingsPanel';

export default function Header() {
  const { timeString, dateString, dayName } = usePersianDateTime();
  const { darkMode } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${
        darkMode ? 'bg-gray-950/90 border-gray-800' : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🏆</span>
              </div>
              <div>
                <h1 className={`text-base font-black leading-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  جام جهانی ۲۰۲۶
                </h1>
                <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>FIFA World Cup</p>
              </div>
            </div>

            {/* Persian Date — desktop */}
            <div className={`hidden md:flex flex-col items-center px-3 py-1.5 rounded-xl ${
              darkMode ? 'bg-gray-800/60' : 'bg-gray-100'
            }`}>
              <span className={`text-base font-bold tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{timeString}</span>
              <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{dayName}، {dateString}</span>
            </div>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2.5 rounded-xl transition-all ${
                darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings size={20} />
            </button>
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

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
