import { X, Moon, Sun, RefreshCw, Info, Bell, BellOff, Download, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const INTERVALS = [
  { label: '۳۰ ثانیه', value: 30000 },
  { label: '۱ دقیقه', value: 60000 },
  { label: '۲ دقیقه', value: 120000 },
  { label: '۵ دقیقه', value: 300000 },
];

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { darkMode, toggleDarkMode, refreshInterval, setRefreshInterval } = useApp();
  const [notifPerm, setNotifPerm] = useState<string>(() => {
    try {
      return Notification.permission;
    } catch {
      return 'default';
    }
  });
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };
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
      <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]" onClick={onClose} />

      <div className="sheet fixed bottom-0 left-0 right-0 z-[60] max-h-[88dvh] overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-lg px-5 pb-[calc(28px+env(safe-area-inset-bottom,0px))]">
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-[var(--line-strong)]" />
          </div>

          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="kicker">PREFERENCES</p>
              <h2 className="display t-ink mt-1 text-3xl">تنظیمات</h2>
            </div>
            <button onClick={onClose} className="iconbtn" aria-label="بستن">
              <X size={17} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="sheet-row flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--surface)] text-[var(--accent)]">
                  {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                </span>
                <div>
                  <p className="t-ink text-[13px] font-bold">حالت تاریک</p>
                  <p className="mt-0.5 text-[10px] t-muted">تغییر ظاهر اپلیکیشن</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`toggle ${darkMode ? 'toggle-on' : ''}`}
                role="switch"
                aria-checked={darkMode}
                aria-label="حالت تاریک"
              >
                <span className="toggle-knob" />
              </button>
            </div>

            <div className="sheet-row p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--surface)] text-[var(--accent)]">
                  <RefreshCw size={18} />
                </span>
                <div>
                  <p className="t-ink text-[13px] font-bold">بروزرسانی خودکار</p>
                  <p className="mt-0.5 text-[10px] t-muted">هر چند وقت داده تازه شود</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {INTERVALS.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setRefreshInterval(value)}
                    className={`chip justify-center !py-2 ${refreshInterval === value ? 'chip-on' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {'Notification' in window && (
              <div className="sheet-row flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--surface)] text-[var(--accent)]">
                    {notifPerm === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
                  </span>
                  <div>
                    <p className="t-ink text-[13px] font-bold">اعلان بازی ایران</p>
                    <p className="mt-0.5 text-[10px] t-muted">
                      {notifPerm === 'granted' ? 'فعال — ۱۵ دقیقه قبل از بازی' : notifPerm === 'denied' ? 'مسدود شده در مرورگر' : 'دریافت اطلاع‌رسانی'}
                    </p>
                  </div>
                </div>
                {notifPerm === 'default' && (
                  <button onClick={requestNotif} className="chip chip-on">
                    فعال‌سازی
                  </button>
                )}
                {notifPerm === 'granted' && <span className="text-[var(--accent)]">✓</span>}
              </div>
            )}

            {installable && (
              <div className="sheet-row flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--surface)] text-[var(--accent)]">
                    <Download size={18} />
                  </span>
                  <div>
                    <p className="t-ink text-[13px] font-bold">نصب اپلیکیشن</p>
                    <p className="mt-0.5 text-[10px] t-muted">نصب روی صفحه اصلی گوشی</p>
                  </div>
                </div>
                <button onClick={installApp} className="chip chip-on">
                  نصب
                </button>
              </div>
            )}

            <div className="sheet-row p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--surface)] text-[var(--accent)]">
                  <Info size={18} />
                </span>
                <p className="t-ink text-[13px] font-bold">درباره اپلیکیشن</p>
              </div>
              <div className="space-y-0 text-[11px]">
                <div className="flex items-center justify-between border-b border-[var(--line)] py-2">
                  <span className="t-muted">نسخه</span>
                  <span className="num font-bold t-soft">۱.۰.۰</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--line)] py-2">
                  <span className="t-muted">منبع داده</span>
                  <span className="flex items-center gap-1.5 font-bold t-soft">
                    <Database size={12} className="t-accent" />
                    ورزش ۳
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--line)] py-2">
                  <span className="t-muted">پوشش</span>
                  <span className="font-bold t-soft">نتایج، جدول و گلزنان لیگ‌ها</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="t-muted">بروزرسانی</span>
                  <span className="font-bold t-soft">خودکار</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
