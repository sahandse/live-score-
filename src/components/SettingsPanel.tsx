import { X, Moon, Sun, RefreshCw, Info, Bell, BellOff, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const INTERVALS = [
  { label: '۳۰ ثانیه', value: 30000 },
  { label: '۱ دقیقه',  value: 60000 },
  { label: '۲ دقیقه',  value: 120000 },
  { label: '۵ دقیقه',  value: 300000 },
];

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { darkMode, toggleDarkMode, refreshInterval, setRefreshInterval } = useApp();
  const [notifPerm, setNotifPerm] = useState<string>(() => {
    try { return Notification.permission; } catch { return 'default'; }
  });
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setInstallable(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function requestNotif() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  }

  async function installApp() {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === 'accepted') setInstallable(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden ${
        darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200'
      }`}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>تنظیمات</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Dark mode */}
          <div className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              {darkMode
                ? <Moon size={20} className="text-blue-400" />
                : <Sun size={20} className="text-yellow-500" />
              }
              <div>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>حالت تاریک</p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>تغییر ظاهر اپلیکیشن</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${darkMode ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Refresh interval */}
          <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw size={20} className={darkMode ? 'text-emerald-400' : 'text-emerald-600'} />
              <div>
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>بروزرسانی خودکار</p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>هر چند وقت داده تازه بشه</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {INTERVALS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setRefreshInterval(value)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    refreshInterval === value
                      ? 'bg-emerald-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-400 hover:text-white'
                        : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          {'Notification' in window && (
            <div className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                {notifPerm === 'granted'
                  ? <Bell size={20} className="text-emerald-400" />
                  : <BellOff size={20} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                }
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>اعلان بازی ایران</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {notifPerm === 'granted' ? 'فعال — ۱۵ دقیقه قبل از بازی' : notifPerm === 'denied' ? 'مسدود شده در مرورگر' : 'دریافت اطلاع‌رسانی'}
                  </p>
                </div>
              </div>
              {notifPerm === 'default' && (
                <button
                  onClick={requestNotif}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  فعال‌سازی
                </button>
              )}
              {notifPerm === 'granted' && (
                <span className="text-emerald-400 text-lg">✓</span>
              )}
            </div>
          )}

          {/* Install PWA */}
          {installable && (
            <div className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <Download size={20} className="text-blue-400" />
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>نصب اپلیکیشن</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>نصب روی صفحه اصلی گوشی</p>
                </div>
              </div>
              <button
                onClick={installApp}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                نصب
              </button>
            </div>
          )}

          {/* About */}
          <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3 mb-3">
              <Info size={20} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>درباره اپلیکیشن</p>
            </div>
            <div className={`space-y-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex justify-between">
                <span>نسخه</span>
                <span className="font-bold">۱.۰.۰</span>
              </div>
              <div className="flex justify-between">
                <span>تورنومنت</span>
                <span>جام جهانی ۲۰۲۶ FIFA</span>
              </div>
              <div className="flex justify-between">
                <span>تیم‌ها</span>
                <span>۴۸ تیم</span>
              </div>
              <div className="flex justify-between">
                <span>بازی‌ها</span>
                <span>۱۰۴ بازی</span>
              </div>
              <div className="flex justify-between">
                <span>میزبان</span>
                <span>آمریکا · کانادا · مکزیک</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
