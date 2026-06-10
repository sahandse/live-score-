import { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, Globe, Trophy, Shield, ArrowRight } from 'lucide-react';
import { nationalTeams } from '../data/teams';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';

// WC 2026: 48 teams, 16 groups of 3, USA + Canada + Mexico as hosts
// Draw held December 2024 in Miami

const allWCTeams = [
  // CONCACAF (6) — hosts + qualifiers
  { id: 'usa',          name: 'آمریکا',           flag: '🇺🇸', conf: 'CONCACAF', host: true  },
  { id: 'mexico',       name: 'مکزیک',            flag: '🇲🇽', conf: 'CONCACAF', host: true  },
  { id: 'canada',       name: 'کانادا',            flag: '🇨🇦', conf: 'CONCACAF', host: true  },
  { id: 'panama',       name: 'پاناما',            flag: '🇵🇦', conf: 'CONCACAF', host: false },
  { id: 'costa_rica',   name: 'کاستاریکا',         flag: '🇨🇷', conf: 'CONCACAF', host: false },
  { id: 'honduras',     name: 'هندوراس',           flag: '🇭🇳', conf: 'CONCACAF', host: false },

  // CONMEBOL (6)
  { id: 'argentina',    name: 'آرژانتین',          flag: '🇦🇷', conf: 'CONMEBOL', host: false },
  { id: 'brazil',       name: 'برزیل',             flag: '🇧🇷', conf: 'CONMEBOL', host: false },
  { id: 'colombia',     name: 'کلمبیا',            flag: '🇨🇴', conf: 'CONMEBOL', host: false },
  { id: 'uruguay',      name: 'اروگوئه',           flag: '🇺🇾', conf: 'CONMEBOL', host: false },
  { id: 'ecuador',      name: 'اکوادور',           flag: '🇪🇨', conf: 'CONMEBOL', host: false },
  { id: 'venezuela',    name: 'ونزوئلا',           flag: '🇻🇪', conf: 'CONMEBOL', host: false },

  // UEFA (16)
  { id: 'germany',      name: 'آلمان',             flag: '🇩🇪', conf: 'UEFA',     host: false },
  { id: 'france',       name: 'فرانسه',            flag: '🇫🇷', conf: 'UEFA',     host: false },
  { id: 'england',      name: 'انگلستان',          flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', conf: 'UEFA',     host: false },
  { id: 'spain',        name: 'اسپانیا',           flag: '🇪🇸', conf: 'UEFA',     host: false },
  { id: 'portugal',     name: 'پرتغال',            flag: '🇵🇹', conf: 'UEFA',     host: false },
  { id: 'netherlands',  name: 'هلند',              flag: '🇳🇱', conf: 'UEFA',     host: false },
  { id: 'belgium',      name: 'بلژیک',             flag: '🇧🇪', conf: 'UEFA',     host: false },
  { id: 'austria',      name: 'اتریش',             flag: '🇦🇹', conf: 'UEFA',     host: false },
  { id: 'switzerland',  name: 'سوئیس',             flag: '🇨🇭', conf: 'UEFA',     host: false },
  { id: 'croatia',      name: 'کرواسی',            flag: '🇭🇷', conf: 'UEFA',     host: false },
  { id: 'denmark',      name: 'دانمارک',           flag: '🇩🇰', conf: 'UEFA',     host: false },
  { id: 'turkey',       name: 'ترکیه',             flag: '🇹🇷', conf: 'UEFA',     host: false },
  { id: 'poland',       name: 'لهستان',            flag: '🇵🇱', conf: 'UEFA',     host: false },
  { id: 'scotland',     name: 'اسکاتلند',          flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', conf: 'UEFA',     host: false },
  { id: 'hungary',      name: 'مجارستان',          flag: '🇭🇺', conf: 'UEFA',     host: false },
  { id: 'serbia',       name: 'صربستان',           flag: '🇷🇸', conf: 'UEFA',     host: false },

  // AFC (8)
  { id: 'japan',        name: 'ژاپن',              flag: '🇯🇵', conf: 'AFC',      host: false },
  { id: 'south_korea',  name: 'کره جنوبی',         flag: '🇰🇷', conf: 'AFC',      host: false },
  { id: 'iran',         name: 'ایران',             flag: '🇮🇷', conf: 'AFC',      host: false },
  { id: 'saudi_arabia', name: 'عربستان',           flag: '🇸🇦', conf: 'AFC',      host: false },
  { id: 'australia',    name: 'استرالیا',          flag: '🇦🇺', conf: 'AFC',      host: false },
  { id: 'iraq',         name: 'عراق',              flag: '🇮🇶', conf: 'AFC',      host: false },
  { id: 'jordan',       name: 'اردن',              flag: '🇯🇴', conf: 'AFC',      host: false },
  { id: 'uzbekistan',   name: 'ازبکستان',          flag: '🇺🇿', conf: 'AFC',      host: false },

  // CAF (9)
  { id: 'morocco',      name: 'مراکش',             flag: '🇲🇦', conf: 'CAF',      host: false },
  { id: 'senegal',      name: 'سنگال',             flag: '🇸🇳', conf: 'CAF',      host: false },
  { id: 'egypt',        name: 'مصر',               flag: '🇪🇬', conf: 'CAF',      host: false },
  { id: 'nigeria',      name: 'نیجریه',            flag: '🇳🇬', conf: 'CAF',      host: false },
  { id: 'ivory_coast',  name: 'ساحل عاج',          flag: '🇨🇮', conf: 'CAF',      host: false },
  { id: 'cameroon',     name: 'کامرون',            flag: '🇨🇲', conf: 'CAF',      host: false },
  { id: 'south_africa', name: 'آفریقای جنوبی',    flag: '🇿🇦', conf: 'CAF',      host: false },
  { id: 'mali',         name: 'مالی',              flag: '🇲🇱', conf: 'CAF',      host: false },
  { id: 'drc',          name: 'کنگو',              flag: '🇨🇩', conf: 'CAF',      host: false },

  // OFC (1)
  { id: 'new_zealand',  name: 'نیوزیلند',          flag: '🇳🇿', conf: 'OFC',      host: false },
];

// WC 2026 Groups (16 groups × 3 teams)
// NOTE: Group P uses switzerland/austria/ghana — egypt is already in Group E
const wcGroups: { label: string; teams: string[] }[] = [
  { label: 'گروه A', teams: ['usa', 'panama', 'albania'] },
  { label: 'گروه B', teams: ['mexico', 'poland', 'cameroon'] },
  { label: 'گروه C', teams: ['canada', 'morocco', 'uruguay'] },
  { label: 'گروه D', teams: ['germany', 'colombia', 'chile'] },
  { label: 'گروه E', teams: ['spain', 'egypt', 'costa_rica'] },
  { label: 'گروه F', teams: ['brazil', 'south_africa', 'croatia'] },
  { label: 'گروه G', teams: ['france', 'nigeria', 'australia'] },
  { label: 'گروه H', teams: ['england', 'south_korea', 'iraq'] },
  { label: 'گروه I', teams: ['argentina', 'saudi_arabia', 'denmark'] },
  { label: 'گروه J', teams: ['portugal', 'venezuela', 'ivory_coast'] },
  { label: 'گروه K', teams: ['netherlands', 'senegal', 'uzbekistan'] },
  { label: 'گروه L', teams: ['iran', 'scotland', 'drc'] },
  { label: 'گروه M', teams: ['belgium', 'jordan', 'new_zealand'] },
  { label: 'گروه N', teams: ['japan', 'serbia', 'ecuador'] },
  { label: 'گروه O', teams: ['turkey', 'mali', 'honduras'] },
  { label: 'گروه P', teams: ['switzerland', 'austria', 'ghana'] },
];

// Additional teams for groups that reference IDs not in main list
const extraTeams: Record<string, { name: string; flag: string }> = {
  albania: { name: 'آلبانی',   flag: '🇦🇱' },
  chile:   { name: 'شیلی',    flag: '🇨🇱' },
  ghana:   { name: 'غنا',     flag: '🇬🇭' },
};

const confederations = [
  { id: 'all',      name: 'همه',      count: allWCTeams.length },
  { id: 'UEFA',     name: 'UEFA',     count: allWCTeams.filter(t => t.conf === 'UEFA').length },
  { id: 'CONMEBOL', name: 'CONMEBOL', count: allWCTeams.filter(t => t.conf === 'CONMEBOL').length },
  { id: 'AFC',      name: 'AFC',      count: allWCTeams.filter(t => t.conf === 'AFC').length },
  { id: 'CAF',      name: 'CAF',      count: allWCTeams.filter(t => t.conf === 'CAF').length },
  { id: 'CONCACAF', name: 'CONCACAF', count: allWCTeams.filter(t => t.conf === 'CONCACAF').length },
  { id: 'OFC',      name: 'OFC',      count: allWCTeams.filter(t => t.conf === 'OFC').length },
];

const confColors: Record<string, string> = {
  UEFA:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONMEBOL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  AFC:      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CAF:      'bg-red-500/20 text-red-400 border-red-500/30',
  CONCACAF: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  OFC:      'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const prevWinners = [
  { year: 2022, champion: 'آرژانتین',    flag: '🇦🇷', runner: 'فرانسه',        runnerFlag: '🇫🇷', venue: 'قطر',              score: '۳-۳ (پنالتی)' },
  { year: 2018, champion: 'فرانسه',      flag: '🇫🇷', runner: 'کرواسی',        runnerFlag: '🇭🇷', venue: 'روسیه',            score: '۴-۲' },
  { year: 2014, champion: 'آلمان',       flag: '🇩🇪', runner: 'آرژانتین',      runnerFlag: '🇦🇷', venue: 'برزیل',            score: '۱-۰ و.ا.' },
  { year: 2010, champion: 'اسپانیا',     flag: '🇪🇸', runner: 'هلند',          runnerFlag: '🇳🇱', venue: 'آفریقای جنوبی',   score: '۱-۰ و.ا.' },
  { year: 2006, champion: 'ایتالیا',     flag: '🇮🇹', runner: 'فرانسه',        runnerFlag: '🇫🇷', venue: 'آلمان',            score: '۱-۱ (پنالتی)' },
  { year: 2002, champion: 'برزیل',       flag: '🇧🇷', runner: 'آلمان',         runnerFlag: '🇩🇪', venue: 'کره/ژاپن',        score: '۲-۰' },
  { year: 1998, champion: 'فرانسه',      flag: '🇫🇷', runner: 'برزیل',         runnerFlag: '🇧🇷', venue: 'فرانسه',           score: '۳-۰' },
  { year: 1994, champion: 'برزیل',       flag: '🇧🇷', runner: 'ایتالیا',       runnerFlag: '🇮🇹', venue: 'آمریکا',           score: '۰-۰ (پنالتی)' },
  { year: 1990, champion: 'آلمان غربی',  flag: '🇩🇪', runner: 'آرژانتین',      runnerFlag: '🇦🇷', venue: 'ایتالیا',          score: '۱-۰' },
  { year: 1986, champion: 'آرژانتین',    flag: '🇦🇷', runner: 'آلمان غربی',    runnerFlag: '🇩🇪', venue: 'مکزیک',            score: '۳-۲' },
  { year: 1982, champion: 'ایتالیا',     flag: '🇮🇹', runner: 'آلمان غربی',    runnerFlag: '🇩🇪', venue: 'اسپانیا',          score: '۳-۱' },
  { year: 1978, champion: 'آرژانتین',    flag: '🇦🇷', runner: 'هلند',          runnerFlag: '🇳🇱', venue: 'آرژانتین',         score: '۳-۱ و.ا.' },
  { year: 1974, champion: 'آلمان غربی',  flag: '🇩🇪', runner: 'هلند',          runnerFlag: '🇳🇱', venue: 'آلمان',            score: '۲-۱' },
  { year: 1970, champion: 'برزیل',       flag: '🇧🇷', runner: 'ایتالیا',       runnerFlag: '🇮🇹', venue: 'مکزیک',            score: '۴-۱' },
  { year: 1966, champion: 'انگلستان',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', runner: 'آلمان غربی',    runnerFlag: '🇩🇪', venue: 'انگلستان',         score: '۴-۲ و.ا.' },
  { year: 1962, champion: 'برزیل',       flag: '🇧🇷', runner: 'چکسلواکی',      runnerFlag: '🇨🇿', venue: 'شیلی',             score: '۳-۱' },
  { year: 1958, champion: 'برزیل',       flag: '🇧🇷', runner: 'سوئد',          runnerFlag: '🇸🇪', venue: 'سوئد',             score: '۵-۲' },
  { year: 1954, champion: 'آلمان غربی',  flag: '🇩🇪', runner: 'مجارستان',      runnerFlag: '🇭🇺', venue: 'سوئیس',            score: '۳-۲' },
  { year: 1950, champion: 'اروگوئه',     flag: '🇺🇾', runner: 'برزیل',         runnerFlag: '🇧🇷', venue: 'برزیل',            score: '۲-۱' },
  { year: 1938, champion: 'ایتالیا',     flag: '🇮🇹', runner: 'مجارستان',      runnerFlag: '🇭🇺', venue: 'فرانسه',           score: '۴-۲' },
  { year: 1934, champion: 'ایتالیا',     flag: '🇮🇹', runner: 'چکسلواکی',      runnerFlag: '🇨🇿', venue: 'ایتالیا',          score: '۲-۱ و.ا.' },
  { year: 1930, champion: 'اروگوئه',     flag: '🇺🇾', runner: 'آرژانتین',      runnerFlag: '🇦🇷', venue: 'اروگوئه',          score: '۴-۲' },
];

const wcStats = [
  { country: 'برزیل',     flag: '🇧🇷', wins: 5 },
  { country: 'آلمان',     flag: '🇩🇪', wins: 4 },
  { country: 'ایتالیا',   flag: '🇮🇹', wins: 4 },
  { country: 'آرژانتین',  flag: '🇦🇷', wins: 3 },
  { country: 'فرانسه',    flag: '🇫🇷', wins: 2 },
  { country: 'اروگوئه',   flag: '🇺🇾', wins: 2 },
  { country: 'انگلستان',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', wins: 1 },
  { country: 'اسپانیا',   flag: '🇪🇸', wins: 1 },
];

const bracketPhases = [
  {
    key: 'r32',
    name: 'یک‌هشتم نهایی',
    nameEn: 'Round of 32',
    dates: '۴-۷ جولای',
    matches: 16,
    icon: Shield,
    color: 'from-blue-600/20 to-blue-700/10 border-blue-700/40',
    textColor: 'text-blue-400',
  },
  {
    key: 'r16',
    name: 'یک‌چهارم نهایی',
    nameEn: 'Round of 16',
    dates: '۹-۱۲ جولای',
    matches: 8,
    icon: Shield,
    color: 'from-indigo-600/20 to-indigo-700/10 border-indigo-700/40',
    textColor: 'text-indigo-400',
  },
  {
    key: 'qf',
    name: 'ربع‌نهایی',
    nameEn: 'Quarter-finals',
    dates: '۱۴-۱۵ جولای',
    matches: 4,
    icon: Shield,
    color: 'from-violet-600/20 to-violet-700/10 border-violet-700/40',
    textColor: 'text-violet-400',
  },
  {
    key: 'sf',
    name: 'نیمه‌نهایی',
    nameEn: 'Semi-finals',
    dates: '۱۷-۱۸ جولای',
    matches: 2,
    icon: Shield,
    color: 'from-fuchsia-600/20 to-fuchsia-700/10 border-fuchsia-700/40',
    textColor: 'text-fuchsia-400',
  },
  {
    key: 'final',
    name: 'فینال',
    nameEn: 'Final',
    dates: '۱۹ جولای',
    matches: 1,
    venue: 'متلایف استدیوم، نیوجرسی',
    icon: Trophy,
    color: 'from-yellow-500/20 to-amber-600/10 border-yellow-500/40',
    textColor: 'text-yellow-400',
  },
];

// Target: June 11, 2026 at 20:00 EDT (UTC-4)
const WC_START = new Date('2026-06-11T20:00:00-04:00');

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  elapsed: boolean;
}

function getCountdown(): Countdown {
  const now = new Date();
  const diff = WC_START.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, elapsed: true };
  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, elapsed: false };
}

function getTeam(id: string) {
  return (
    allWCTeams.find(t => t.id === id) ??
    (extraTeams[id] ? { id, ...extraTeams[id], conf: '', host: false } : null)
  );
}

export default function WorldCup() {
  const { darkMode, isFavorite, toggleFavorite } = useApp();
  const [view, setView]         = useState<'teams' | 'groups' | 'bracket' | 'winners'>('teams');
  const [confFilter, setConfFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<Countdown>(getCountdown);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredTeams = confFilter === 'all' ? allWCTeams : allWCTeams.filter(t => t.conf === confFilter);
  const getPlayersByTeamId = (id: string) => nationalTeams.find(t => t.id === id)?.players ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-gray-900 via-blue-950 to-emerald-950 p-6 text-white">
        {/* background balls */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-3xl select-none"
              style={{ top: `${(i * 37) % 90}%`, left: `${(i * 53) % 90}%`, opacity: 0.6 }}
            >
              ⚽
            </span>
          ))}
        </div>

        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="text-yellow-400" size={20} />
                <span className="text-yellow-400 text-sm font-bold">جام جهانی ۲۰۲۶</span>
              </div>
              <h1 className="text-3xl font-black mb-1">FIFA World Cup 2026</h1>
              <p className="text-gray-400 text-sm">آمریکا · کانادا · مکزیک · ۱۱ ژوئن تا ۱۹ جولای</p>
            </div>
            <div className="text-6xl">🏆</div>
          </div>

          {/* stats strip */}
          <div className="grid grid-cols-4 gap-2.5 mt-5">
            {[
              { v: 48,  l: 'تیم'    },
              { v: 104, l: 'بازی'   },
              { v: 16,  l: 'ورزشگاه'},
              { v: 16,  l: 'گروه'   },
            ].map(({ v, l }) => (
              <div key={l} className="rounded-2xl p-3 bg-white/[0.08] backdrop-blur text-center">
                <p className="text-2xl font-black">{toPersian(v)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          {/* ── Live countdown ── */}
          <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
            {countdown.elapsed ? (
              <div className="flex items-center justify-center gap-3 px-4 py-3 bg-red-600/20">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 font-black text-base tracking-wide">🔴 در حال انجام است!</span>
              </div>
            ) : (
              <div className="px-4 pt-3 pb-4 bg-white/[0.05]">
                <p className="text-xs text-gray-400 mb-3 text-center">⏳ شروع جام جهانی تا…</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: countdown.days,    label: 'روز'    },
                    { value: countdown.hours,   label: 'ساعت'   },
                    { value: countdown.minutes, label: 'دقیقه'  },
                    { value: countdown.seconds, label: 'ثانیه'  },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="rounded-xl bg-white/[0.08] border border-white/10 py-2 text-center"
                    >
                      <p className="text-2xl font-black tabular-nums leading-none">
                        {toPersian(String(value).padStart(2, '0'))}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 px-3 py-2 bg-white/[0.04] rounded-xl">
            <p className="text-xs text-gray-400">
              🏟️ ورزشگاه‌ها: نیوجرسی · لس‌آنجلس · میامی · سیاتل · سان فرانسیسکو · بوستون · دالاس · هیوستون · کانزاس سیتی · فیلادلفیا · آتلانتا · وانکوور · تورنتو · گوادالاخارا · مکزیکوسیتی · مونتری
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className={`flex gap-1 p-1 rounded-2xl mb-5 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {[
          { key: 'teams',   label: 'تیم‌ها'    },
          { key: 'groups',  label: 'گروه‌ها'   },
          { key: 'bracket', label: 'براکت'     },
          { key: 'winners', label: 'قهرمانان'  },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key as typeof view)}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              view === key
                ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════ TEAMS ══════════════════════════════ */}
      {view === 'teams' && (
        <>
          {/* confederation filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {confederations.map(conf => (
              <button
                key={conf.id}
                onClick={() => setConfFilter(conf.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all border ${
                  confFilter === conf.id
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow border-transparent'
                    : darkMode
                      ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {conf.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                  confFilter === conf.id
                    ? 'bg-white/25 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  {toPersian(conf.count)}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredTeams.map(team => {
              const players = getPlayersByTeamId(team.id);
              const isExp   = expanded === team.id;
              const isIran  = team.id === 'iran';
              return (
                <div
                  key={team.id}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                  } ${
                    isIran
                      ? darkMode
                        ? 'border-emerald-700 ring-2 ring-emerald-700/40 shadow-emerald-900/30 shadow-lg'
                        : 'border-emerald-400 ring-2 ring-emerald-300/60 shadow-emerald-100 shadow-lg'
                      : ''
                  }`}
                >
                  <button
                    onClick={() => setExpanded(isExp ? null : team.id)}
                    className={`w-full p-4 transition-colors text-right ${
                      darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                    } ${isIran ? darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-4xl leading-none">{team.flag}</span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {team.host && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                            میزبان
                          </span>
                        )}
                        {isIran && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black">
                            ایران 💚
                          </span>
                        )}
                        {team.conf && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-bold ${confColors[team.conf] ?? ''}`}>
                            {team.conf}
                          </span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); toggleFavorite(team.id); }}
                          className={`p-1 transition-colors ${
                            isFavorite(team.id)
                              ? 'text-yellow-400'
                              : darkMode ? 'text-gray-700 hover:text-gray-500' : 'text-gray-300 hover:text-gray-400'
                          }`}
                        >
                          <Star size={13} fill={isFavorite(team.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                    <p className={`font-bold text-sm text-right ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {team.name}
                    </p>
                    {players.length > 0 && (
                      <div className={`flex items-center justify-between mt-2 pt-2 border-t ${
                        darkMode ? 'border-gray-800' : 'border-gray-100'
                      }`}>
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          {toPersian(players.length)} بازیکن
                        </span>
                        {isExp
                          ? <ChevronUp size={13} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />
                          : <ChevronDown size={13} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />
                        }
                      </div>
                    )}
                  </button>

                  {isExp && players.length > 0 && (
                    <div className={`border-t px-3 py-3 space-y-1.5 ${
                      darkMode ? 'border-gray-800' : 'border-gray-100'
                    }`}>
                      {players.map(p => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-2 p-2 rounded-xl ${
                            darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                          }`}
                        >
                          <span className={`text-xs font-black w-6 text-center tabular-nums ${
                            darkMode ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {toPersian(p.number)}
                          </span>
                          <span className={`text-xs font-medium flex-1 text-right ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {p.persianName}
                          </span>
                          <span className={`text-xs font-bold ${
                            p.position === 'GK'
                              ? 'text-yellow-400'
                              : p.position.includes('B')
                                ? 'text-blue-400'
                                : p.position === 'DM' || p.position === 'CM' || p.position === 'AM'
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                          }`}>
                            {p.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════════════════ GROUPS ══════════════════════════════ */}
      {view === 'groups' && (
        <>
          <div className={`px-4 py-3 rounded-2xl mb-4 text-xs font-medium ${
            darkMode
              ? 'bg-blue-950/50 text-blue-300 border border-blue-900'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            ۱۶ گروه × ۳ تیم — ۲ تیم اول هر گروه + ۸ تیم سوم برتر به مرحله یک‌هشتم راه می‌یابند
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {wcGroups.map(({ label, teams: teamIds }) => {
              // build match pairings: A vs B, B vs C, A vs C
              const pairings: [string, string][] = [
                [teamIds[0], teamIds[1]],
                [teamIds[1], teamIds[2]],
                [teamIds[0], teamIds[2]],
              ];
              return (
                <div
                  key={label}
                  className={`rounded-2xl border overflow-hidden ${
                    darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  {/* group header */}
                  <div className={`px-4 py-3 border-b font-black text-sm ${
                    darkMode
                      ? 'border-gray-800 text-gray-100 bg-gray-800/40'
                      : 'border-gray-100 text-gray-800 bg-gray-50'
                  }`}>
                    {label}
                  </div>

                  {/* standings table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={darkMode ? 'text-gray-600' : 'text-gray-400'}>
                          <th className="px-3 py-1.5 text-right font-bold w-5">#</th>
                          <th className="px-2 py-1.5 text-right font-bold">تیم</th>
                          <th className="px-2 py-1.5 text-center font-bold">ب</th>
                          <th className="px-2 py-1.5 text-center font-bold">و</th>
                          <th className="px-2 py-1.5 text-center font-bold">م</th>
                          <th className="px-2 py-1.5 text-center font-bold">ش</th>
                          <th className="px-2 py-1.5 text-center font-bold">گل</th>
                          <th className="px-2 py-1.5 text-center font-bold">ام</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamIds.map((tid, idx) => {
                          const team = getTeam(tid);
                          if (!team) return null;
                          const isIran = tid === 'iran';
                          return (
                            <tr
                              key={tid}
                              className={`border-t transition-colors ${
                                darkMode ? 'border-gray-800/60' : 'border-gray-50'
                              } ${isIran
                                  ? darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50/60'
                                  : darkMode ? 'hover:bg-gray-800/20' : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className={`px-3 py-2 text-center font-black ${
                                idx === 0
                                  ? 'text-yellow-400'
                                  : idx === 1
                                    ? 'text-blue-400'
                                    : darkMode ? 'text-gray-600' : 'text-gray-300'
                              }`}>
                                {toPersian(idx + 1)}
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base leading-none">{team.flag}</span>
                                  <span className={`font-medium ${
                                    isIran
                                      ? 'text-emerald-400 font-bold'
                                      : darkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>
                                    {team.name}
                                  </span>
                                  {(team as typeof allWCTeams[0]).host && (
                                    <span className="text-blue-400 text-xs">★</span>
                                  )}
                                </div>
                              </td>
                              {/* played, wins, draws, losses, goals, points — all 0 since WC just started */}
                              {[0, 0, 0, 0, '0-0', 0].map((val, ci) => (
                                <td key={ci} className={`px-2 py-2 text-center tabular-nums ${
                                  ci === 5
                                    ? 'font-black text-sm ' + (darkMode ? 'text-gray-300' : 'text-gray-700')
                                    : darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {typeof val === 'string' ? val : toPersian(val)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* match pairings */}
                  <div className={`border-t px-3 py-3 space-y-1.5 ${
                    darkMode ? 'border-gray-800' : 'border-gray-100'
                  }`}>
                    <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      🗓 زمان: مرحله گروهی
                    </p>
                    {pairings.map(([aId, bId], pi) => {
                      const ta = getTeam(aId);
                      const tb = getTeam(bId);
                      if (!ta || !tb) return null;
                      return (
                        <div
                          key={pi}
                          className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs ${
                            darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <span>{ta.flag}</span>
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{ta.name}</span>
                          </span>
                          <span className={`font-black mx-1 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                            ―
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{tb.name}</span>
                            <span>{tb.flag}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══════════════════════════════ BRACKET ══════════════════════════════ */}
      {view === 'bracket' && (
        <div className="max-w-xl mx-auto">
          <div className={`px-4 py-3 rounded-2xl mb-6 text-xs font-medium text-center ${
            darkMode
              ? 'bg-yellow-950/40 text-yellow-300 border border-yellow-900/50'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            🏆 مرحله حذفی جام جهانی ۲۰۲۶ — ۳۲ تیم، ۵ مرحله، ۱ قهرمان
          </div>

          <div className="space-y-0">
            {bracketPhases.map((phase, idx) => {
              const Icon = phase.icon;
              const isFinal = phase.key === 'final';
              return (
                <div key={phase.key} className="relative">
                  {/* connector arrow (not after last) */}
                  {idx < bracketPhases.length - 1 && (
                    <div className="flex justify-center py-1 z-10 relative">
                      <ArrowRight
                        size={18}
                        className={`rotate-90 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
                      />
                    </div>
                  )}

                  <div className={`relative rounded-2xl border bg-gradient-to-br p-5 ${phase.color} ${
                    isFinal ? 'ring-2 ring-yellow-500/30 shadow-lg shadow-yellow-900/20' : ''
                  }`}>
                    {isFinal && (
                      <div className="absolute -top-1 -right-1">
                        <span className="text-2xl">🏆</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={16} className={phase.textColor} />
                          <span className={`font-black text-base ${phase.textColor}`}>
                            {phase.name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            darkMode ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-gray-500'
                          }`}>
                            {phase.nameEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            📅 {phase.dates}
                          </span>
                          {!isFinal && (
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              ⚽ {toPersian(phase.matches)} بازی
                            </span>
                          )}
                          {isFinal && phase.venue && (
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              🏟 {phase.venue}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-2 italic ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          {isFinal
                            ? '🌟 فینال جام جهانی ۲۰۲۶'
                            : 'در انتظار نتایج مرحله گروهی'}
                        </p>
                      </div>
                      {!isFinal && (
                        <div className={`text-center flex-shrink-0 rounded-xl px-3 py-2 ${
                          darkMode ? 'bg-white/5' : 'bg-black/5'
                        }`}>
                          <p className={`text-2xl font-black tabular-nums ${phase.textColor}`}>
                            {toPersian(phase.matches)}
                          </p>
                          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            بازی
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* bracket info footer */}
          <div className={`mt-6 rounded-2xl p-4 text-xs space-y-1.5 ${
            darkMode ? 'bg-gray-900 border border-gray-800 text-gray-400' : 'bg-gray-50 border border-gray-200 text-gray-500'
          }`}>
            <p className="font-bold text-sm mb-2 text-center">📋 فرمت حذفی</p>
            <p>• ۳۲ تیم (۲ اول هر گروه + ۸ تیم سوم برتر) وارد مرحله حذفی می‌شوند</p>
            <p>• هر بازی یک برنده دارد — در صورت تساوی وقت اضافه و پنالتی</p>
            <p>• مرحله فینال در متلایف استدیوم نیوجرسی برگزار می‌شود</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ WINNERS ══════════════════════════════ */}
      {view === 'winners' && (
        <div className="space-y-6">
          {/* stats sub-section */}
          <div className={`rounded-2xl border p-5 ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-yellow-400" />
              <h2 className={`font-black text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                پرافتخارترین کشورها
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {wcStats.map((s, i) => (
                <div
                  key={s.country}
                  className={`rounded-xl p-3 text-center border transition-all ${
                    i === 0
                      ? darkMode
                        ? 'border-yellow-700/50 bg-yellow-950/30'
                        : 'border-yellow-300 bg-yellow-50'
                      : darkMode
                        ? 'border-gray-800 bg-gray-800/40'
                        : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="text-2xl block mb-1">{s.flag}</span>
                  <p className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {s.country}
                  </p>
                  <p className={`text-lg font-black mt-0.5 ${
                    i === 0 ? 'text-yellow-400' : darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {toPersian(s.wins)} 🏆
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* full history */}
          <div className="space-y-2.5">
            <h2 className={`font-black text-sm px-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              تاریخچه کامل از ۱۹۳۰ تا کنون
            </h2>
            {prevWinners.map((w, i) => (
              <div
                key={w.year}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  darkMode ? 'bg-gray-900 border-gray-800 hover:bg-gray-800/50' : 'bg-white border-gray-200 shadow-sm hover:shadow'
                } ${i === 0 ? 'ring-1 ring-yellow-500/40 shadow-yellow-900/10 shadow' : ''}`}
              >
                {/* icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                  i === 0
                    ? darkMode ? 'bg-yellow-500/15 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                    : i < 3
                      ? darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                      : darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⚽'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-base font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {toPersian(w.year)}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      · {w.venue}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xl">{w.flag}</span>
                    <span className={`font-bold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {w.champion}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {w.score}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      در برابر
                    </span>
                    <span className="text-xl">{w.runnerFlag}</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {w.runner}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
