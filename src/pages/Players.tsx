import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Trophy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import { getFeedPlayers, type FeedPlayer } from '../services/dataApi';

type SortKey = 'goals' | 'assists';

const POSITIONS: { code: string; label: string; tone: string }[] = [
  { code: 'all', label: 'همه', tone: '' },
  { code: 'GK', label: 'دروازه‌بان', tone: 'bg-[color-mix(in_srgb,var(--gold)_16%,transparent)] text-[var(--gold)]' },
  { code: 'DF', label: 'مدافع', tone: 'bg-[var(--blue-soft)] text-[var(--blue)]' },
  { code: 'MF', label: 'هافبک', tone: 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]' },
  { code: 'FW', label: 'مهاجم', tone: 'bg-[var(--live-soft)] text-[var(--live)]' },
];

const accentFor = (position: string) =>
  POSITIONS.find((entry) => entry.code === position)?.tone || 'bg-[var(--surface-3)] t-muted';

export default function Players() {
  const { isFavorite, toggleFavorite } = useApp();
  const [players, setPlayers] = useState<FeedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('goals');

  useEffect(() => {
    let cancelled = false;
    getFeedPlayers().then((rows) => {
      if (cancelled) return;
      setPlayers(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const teamNames = useMemo(
    () => [...new Set(players.map((player) => player.teamName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fa')),
    [players]
  );

  const filtered = useMemo(() => {
    const query = search.trim();
    return players
      .filter((player) => {
        if (position !== 'all' && player.position !== position) return false;
        if (teamFilter !== 'all' && player.teamName !== teamFilter) return false;
        if (query && !player.name.includes(query)) return false;
        return true;
      })
      .sort((a, b) => (sortBy === 'goals' ? b.goals - a.goals : b.assists - a.assists) || a.name.localeCompare(b.name, 'fa'));
  }, [players, search, position, teamFilter, sortBy]);

  const ranked = useMemo(
    () => filtered.filter((player) => (sortBy === 'goals' ? player.goals : player.assists) > 0),
    [filtered, sortBy]
  );
  const maxGoals = Math.max(1, ...players.map((player) => player.goals));
  const maxAssists = Math.max(1, ...players.map((player) => player.assists));

  const podium = [ranked[1], ranked[0], ranked[2]];
  const podiumHeight = [76, 104, 62];
  const podiumRank = [2, 1, 3];
  const podiumMedal = ['🥈', '🥇', '🥉'];
  const podiumTone = ['t-muted', 't-gold', 'text-[var(--bronze)]'];

  const statOf = (player: FeedPlayer) => (sortBy === 'goals' ? player.goals : player.assists);
  const statLabel = sortBy === 'goals' ? 'گل' : 'پاس گل';

  return (
    <div className="page">
      <header className="reveal mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="kicker">PLAYERS — ۰۳</p>
          <h2 className="display t-ink mt-1 text-[40px] leading-none md:text-5xl">بازیکنان</h2>
        </div>
        <div className="text-left">
          <p className="display num t-ink text-2xl leading-none">{toPersian(filtered.length)}</p>
          <p className="mt-1 text-[10px] t-faint">بازیکن · {toPersian(teamNames.length)} تیم</p>
        </div>
      </header>

      <div className="reveal reveal-1">
        <div className="field">
          <Search size={15} className="t-faint shrink-0" />
          <input
            type="text"
            placeholder="جستجوی بازیکن..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="جستجوی بازیکن"
          />
          {search && (
            <button onClick={() => setSearch('')} className="t-faint hover:text-[var(--ink-soft)]" aria-label="پاک کردن جستجو">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="scroll-x -mx-4 mt-3 flex gap-2 px-4 pb-1 md:mx-0 md:px-0">
          {POSITIONS.map((entry) => (
            <button
              key={entry.code}
              onClick={() => setPosition(entry.code)}
              className={`chip shrink-0 ${position === entry.code ? 'chip-on' : ''}`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="select"
            aria-label="فیلتر تیم"
          >
            <option value="all">همه تیم‌ها</option>
            {teamNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <div className="seg ml-auto w-full sm:w-auto">
            {([
              { key: 'goals', label: '⚽ گل' },
              { key: 'assists', label: '🎯 پاس گل' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`seg-item !flex-none px-3.5 ${sortBy === key ? 'seg-item-on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="reveal reveal-2 mt-5 space-y-2.5">
          <div className="skeleton h-[230px]" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[72px]" />
          ))}
        </div>
      ) : (
        <>
          {ranked.length >= 3 && (
            <section
              className="hero reveal reveal-2 mt-5 px-4 pb-5 pt-4 md:px-6"
              aria-label={`برترین ${statLabel}‌زنان`}
            >
              <div className="flex items-center justify-between">
                <p className="kicker flex items-center gap-1.5">
                  <Trophy size={11} />
                  LEADERBOARD
                </p>
                <span className="chip !py-1">بر اساس {statLabel}</span>
              </div>

              <div className="mt-4 flex items-end justify-center gap-3 md:gap-5">
                {podium.map((player, index) =>
                  player ? (
                    <div key={player.id} className="flex w-full max-w-[132px] flex-col items-center">
                      <span className="mb-1 text-xl">{podiumMedal[index]}</span>
                      {player.portrait ? (
                        <img
                          src={player.portrait}
                          alt=""
                          className="mb-1.5 h-14 w-14 rounded-full border border-[var(--line-strong)] bg-[var(--surface-2)] object-cover"
                        />
                      ) : (
                        <span
                          className={`mb-1.5 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line)] text-sm font-black ${accentFor(player.position)}`}
                        >
                          {player.number > 0 ? toPersian(player.number) : player.name.trim().charAt(0)}
                        </span>
                      )}
                      <p className="t-ink w-full truncate px-1 text-center text-xs font-bold">{player.name}</p>
                      <p className="w-full truncate px-1 text-center text-[10px] t-faint">{player.teamName}</p>
                      <p className={`display num mt-0.5 text-lg leading-none ${podiumTone[index]}`}>
                        {toPersian(statOf(player))}
                      </p>
                      <div
                        className={`mt-2 flex w-full items-start justify-center rounded-t-xl border border-b-0 border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_88%,transparent)] pt-2 ${
                          index === 1 ? 'shadow-[0_-10px_30px_-18px_var(--glow)]' : ''
                        }`}
                        style={{ height: `${podiumHeight[index]}px` }}
                      >
                        <span className={`display num text-2xl leading-none ${podiumTone[index]}`}>
                          {toPersian(podiumRank[index])}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div key={index} className="w-full max-w-[132px]" />
                  )
                )}
              </div>
            </section>
          )}

          <section className="reveal reveal-3 mt-5">
            <div className="mb-3 flex items-end justify-between">
              <h3 className="display t-ink text-2xl">
                جدول {statLabel}
              </h3>
              <span className="text-[10px] t-faint">{toPersian(ranked.length)} بازیکن</span>
            </div>

            <div className="plate divide-hair overflow-hidden">
              {ranked.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)] md:gap-3 md:px-4"
                >
                  <span
                    className={`display num w-6 shrink-0 text-center text-lg leading-none ${
                      index === 0
                        ? 't-gold'
                        : index === 1
                          ? 't-muted'
                          : index === 2
                            ? 'text-[var(--bronze)]'
                            : 't-faint'
                    }`}
                  >
                    {toPersian(index + 1)}
                  </span>

                  {player.portrait ? (
                    <img
                      src={player.portrait}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface-2)] object-cover"
                    />
                  ) : (
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-xs font-black ${accentFor(player.position)}`}
                    >
                      {player.number > 0 ? toPersian(player.number) : player.name.trim().charAt(0)}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {player.countryFlag && (
                        <img src={player.countryFlag} alt="" className="h-3 w-[18px] shrink-0 rounded-[2px] object-cover" />
                      )}
                      <p className="t-ink truncate text-[12.5px] font-bold">{player.name}</p>
                      {player.positionFa && player.positionFa !== 'سایر' && (
                        <span className={`hidden shrink-0 rounded px-1.5 py-px text-[9px] font-bold sm:inline ${accentFor(player.position)}`}>
                          {player.positionFa}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {player.teamLogo && <img src={player.teamLogo} alt="" className="h-3.5 w-3.5 shrink-0 object-contain" />}
                      {player.teamId ? (
                        <Link
                          to={`/team/${player.teamId}`}
                          className="truncate text-[10px] t-faint hover:underline hover:underline-offset-2"
                        >
                          {player.teamName}
                        </Link>
                      ) : (
                        <span className="truncate text-[10px] t-faint">{player.teamName}</span>
                      )}
                      {player.number > 0 && (
                        <span className="num hidden shrink-0 text-[10px] t-faint sm:inline">#{toPersian(player.number)}</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="w-4 text-center text-[9px] t-faint">⚽</span>
                      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(player.goals / maxGoals) * 100}%` }} />
                      </div>
                      <span className="w-4 text-center text-[9px] t-faint">🎯</span>
                      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                        <div className="h-full rounded-full bg-[var(--blue)]" style={{ width: `${(player.assists / maxAssists) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 md:gap-4">
                    <div className="min-w-[34px] text-center">
                      <p className="display num t-ink text-lg leading-none">{toPersian(player.goals)}</p>
                      <p className="text-[9px] t-faint">گل</p>
                    </div>
                    <div className="hidden min-w-[34px] text-center sm:block">
                      <p className="display num text-lg leading-none t-blue">{toPersian(player.assists)}</p>
                      <p className="text-[9px] t-faint">پاس</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(player.id)}
                      className={`rounded-md p-1 transition-colors ${
                        isFavorite(player.id) ? 'text-[var(--gold)]' : 't-faint hover:text-[var(--ink-soft)]'
                      }`}
                      aria-label="بازیکن محبوب"
                    >
                      <Star size={14} fill={isFavorite(player.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              ))}

              {ranked.length === 0 && (
                <div className="p-12 text-center">
                  <span className="crest-frame mx-auto mb-3 flex h-12 w-12 text-lg">👤</span>
                  <p className="display t-muted text-2xl">بازیکنی با این مشخصات پیدا نشد</p>
                  <p className="mt-1 text-[11px] t-faint">
                    {search || position !== 'all' || teamFilter !== 'all'
                      ? 'عبارت جستجو یا فیلترها را تغییر دهید'
                      : `آمار ${statLabel} برای این فید ثبت نشده است`}
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
