import { useState } from 'react';
import { Settings } from 'lucide-react';
import { usePersianDateTime } from '../hooks/usePersianDate';
import SettingsPanel from './SettingsPanel';

export default function Header() {
  const { timeString, dateString, dayName } = usePersianDateTime();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="topbar">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3.5 md:h-16 md:gap-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
            <div className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="16" cy="16" r="12.5" />
                <path d="M16 10.2l4.6 3.4-1.8 5.4h-5.6l-1.8-5.4z" fill="currentColor" stroke="none" />
                <path d="M16 3.5v6.7M6.3 12.3l6 1.3M25.7 12.3l-6 1.3M10.6 28l3.4-6.1M21.4 28l-3.4-6.1" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="display t-ink text-[23px] leading-none md:text-[27px]">لایو اسکور</h1>
                <span className="hidden h-[18px] items-center rounded-[5px] border border-[var(--line-strong)] px-1.5 text-[8px] font-bold tracking-[0.22em] t-faint sm:inline-flex">
                  LIVE
                </span>
              </div>
              <p className="mt-0.5 truncate text-[10px] t-faint md:hidden">{dayName} · {dateString}</p>
              <p className="kicker mt-1 hidden md:block">فوتبال ایران و جهان</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 md:hidden">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span className="num t-ink text-[12px] font-extrabold leading-none">{timeString.slice(0, 5)}</span>
            </div>
            <div className="hidden items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 md:flex">
              <span className="kicker hidden lg:inline">TEHRAN</span>
              <span className="num t-ink text-[17px] font-extrabold leading-none">{timeString}</span>
              <span className="h-6 w-px bg-[var(--line)]" />
              <span className="text-[10px] t-muted">
                {dayName} · {dateString}
              </span>
            </div>
            <button onClick={() => setShowSettings(true)} className="iconbtn" aria-label="تنظیمات">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
