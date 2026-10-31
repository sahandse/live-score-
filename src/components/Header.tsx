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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="16" cy="16" r="12.5" />
                <path d="M16 10.2l4.6 3.4-1.8 5.4h-5.6l-1.8-5.4z" fill="currentColor" stroke="none" />
                <path d="M16 3.5v6.7M6.3 12.3l6 1.3M25.7 12.3l-6 1.3M10.6 28l3.4-6.1M21.4 28l-3.4-6.1" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="display t-ink text-[27px] leading-none">لایو اسکور</h1>
                <span className="hidden h-[18px] items-center rounded-[5px] border border-[var(--line-strong)] px-1.5 text-[8px] font-bold tracking-[0.22em] t-faint sm:inline-flex">
                  LIVE
                </span>
              </div>
              <p className="kicker mt-1 truncate">فوتبال ایران و جهان</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
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

        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 pb-2 text-[10px] t-muted md:hidden">
          <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
          <span className="num t-soft font-bold">{timeString}</span>
          <span className="t-faint">|</span>
          <span>
            {dayName} · {dateString}
          </span>
        </div>
      </header>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}
