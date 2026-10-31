import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, X } from 'lucide-react';
import { toPersian } from '../hooks/usePersianDate';
import { useApp } from '../context/AppContext';
import MatchCard from '../components/MatchCard';
import { toPersianTeamName } from '../data/teamNames';
import {
  clearFeedCache,
  getFeedLeagues,
  getLeagueScorers,
  getLeagueStandings,
  getMatchFeed,
  type FeedMatch,
  type FeedScorer,
  type FeedStandingRow,
  type Provider,
} from '../services/dataApi';
import type { Match } from '../data/matches';

type Tab = 'live' | 'upcoming' | 'finished' | 'recent';

const IRAN_LEAGUE_ID = '6';

function toLocalMatch(feed: FeedMatch, provider: Provider): Match {
  const faName = (name: string) => (provider === 'espn' ? toPersianTeamName(name, name) : name);
  return {
    id: feed.id,
    homeTeam: feed.home.name,
    homeTeamPersian: faName(feed.home.name),
    homeTeamFlag: '',
    homeCrest: feed.home.logo,
    awayTeam: feed.away.name,
    awayTeamPersian: faName(feed.away.name),
    awayTeamFlag: '',
    awayCrest: feed.away.logo,
    homeScore: feed.homeScore,
    awayScore: feed.awayScore,
    status: feed.status,
    statusText: feed.statusText,
    minute: feed.minute,
    leagueId: feed.leagueId,
    leagueName: feed.leagueName,
    leagueFlag: '',
    leagueLogo: feed.leagueLogo,
    date: feed.persianDate,
    time: feed.time,
    dayOffset: feed.dayOffset,
  };
}

const isFinishedLike = (status: Match['status']) =>
  status === 'finished' || status === 'cancelled' || status === 'postponed';

function SectionHead({ index, title, meta }: { index: string; title: string; meta?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <span className="kicker num shrink-0">{index}</span>
        <h3 className="display t-ink truncate text-2xl md:text-[26px]">{title}</h3>
      </div>
      {meta && <div className="shrink-0 text-[10px] t-faint">{meta}</div>}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { refreshInterval } = useApp();
  const [tab, setTab] = useState<Tab>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [localMatches, setLocalMatches] = useState<Match[] | null>(null);
  const [provider, setProvider] = useState<Provider>('none');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [leagueOrder, setLeagueOrder] = useState<Record<string, number>>({});
  const [standingsLeague, setStandingsLeague] = useState<{ id: string; name: string; logo: string } | null>(null);
  const [apiStandings, setApiStandings] = useState<FeedStandingRow[] | null>(null);
  const [apiScorers, setApiScorers] = useState<FeedScorer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    if (refresh) clearFeedCache();

    const [feed, leagues] = await Promise.all([getMatchFeed({ refresh }), getFeedLeagues()]);
    const order: Record<string, number> = {};
    leagues.forEach((league) => {
      order[league.id] = league.priority;
    });
    setLeagueOrder(order);
    setProvider(feed.provider);
    setGeneratedAt(feed.generatedAt);

    const primary =
      leagues.find((league) => league.id === IRAN_LEAGUE_ID && league.hasData) ??
      leagues.find((league) => league.hasData) ??
      leagues[0];
    if (primary) {
      setStandingsLeague({ id: primary.id, name: primary.name, logo: primary.logo });
      const [rows, scorers] = await Promise.all([getLeagueStandings(primary.id), getLeagueScorers(primary.id)]);
      setApiStandings(rows.slice(0, 10));
      setApiScorers(scorers.slice(0, 8));
    }

    if (feed.matches.length) {
      setLocalMatches(feed.matches.map((match) => toLocalMatch(match, feed.provider)));
    }
    if (refresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), refreshInterval);
    return () => clearInterval(interval);
  }, [loadData, refreshInterval]);

  const matches = useMemo(() => {
    const source = localMatches ?? [];
    return [...source].sort((a, b) => {
      const rank = (a.leagueId in leagueOrder ? leagueOrder[a.leagueId] : 20) - (b.leagueId in leagueOrder ? leagueOrder[b.leagueId] : 20);
      if (rank !== 0) return rank;
      return a.leagueName.localeCompare(b.leagueName, 'fa') || a.time.localeCompare(b.time);
    });
  }, [localMatches, leagueOrder]);

  const recentMatches = useMemo(
    () => matches.filter((m) => isFinishedLike(m.status) && (m.dayOffset ?? 0) < 0),
    [matches]
  );

  const allMatches = tab === 'recent' ? recentMatches : matches;

  const leagueChips = [
    ...new Map(matches.map((m) => [m.leagueId, { id: m.leagueId, name: m.leagueName, logo: m.leagueLogo }])).values(),
  ].slice(0, 8);

  const filtered = allMatches
    .filter((m) => {
      if (tab === 'live') return m.status === 'live' || m.status === 'halftime';
      if (tab === 'upcoming') return m.status === 'upcoming';
      if (tab === 'finished') return isFinishedLike(m.status);
      return true;
    })
    .filter((m) => {
      if (leagueFilter && m.leagueId !== leagueFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        m.homeTeamPersian.includes(searchQuery.trim()) ||
        m.awayTeamPersian.includes(searchQuery.trim()) ||
        m.homeTeam.toLowerCase().includes(q) ||
        m.awayTeam.toLowerCase().includes(q) ||
        m.leagueName.includes(searchQuery.trim())
      );
    });

  const counts = {
    live: matches.filter((m) => m.status === 'live' || m.status === 'halftime').length,
    upcoming: matches.filter((m) => m.status === 'upcoming').length,
    finished: matches.filter((m) => isFinishedLike(m.status)).length,
    recent: recentMatches.length,
  };

  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === 'live' || m.status === 'halftime'),
    [matches]
  );

  const spotlight = useMemo(() => {
    const live = liveMatches[0];
    if (live) return live;
    const upcoming = matches.find((m) => m.status === 'upcoming');
    return upcoming ?? matches[0] ?? null;
  }, [matches, liveMatches]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'live', label: 'زنده', count: counts.live },
    { key: 'upcoming', label: 'آینده', count: counts.upcoming },
    { key: 'finished', label: 'پایان یافته', count: counts.finished },
    { key: 'recent', label: 'اخیر', count: counts.recent },
  ];

  const sourceLabel =
    provider === 'varzesh3' ? 'ورزش ۳' : provider === 'espn' ? 'ESPN (پشتیبان)' : 'بدون داده';

  const updatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })
    : new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  const heroUrl = spotlight
    ? `/match/${spotlight.leagueId ? `${spotlight.leagueId}~${spotlight.id}` : spotlight.id}`
    : '/';
  const heroHasScore =
    spotlight !== null &&
    spotlight.status !== 'upcoming' &&
    spotlight.homeScore !== null &&
    spotlight.awayScore !== null;
  const heroLive = spotlight?.status === 'live' || spotlight?.status === 'halftime';

  const emptyCopy = searchQuery
    ? `نتیجه‌ای برای «${searchQuery}» پیدا نشد`
    : provider === 'none'
      ? 'هنوز داده‌ای همگام‌سازی نشده است'
      : tab === 'live'
        ? 'الان بازی زنده‌ای در جریان نیست'
        : tab === 'upcoming'
          ? 'بازی پیش‌رویی ثبت نشده است'
          : tab === 'finished'
            ? 'نتیجه‌ای برای نمایش نیست'
            : 'بازی اخیری وجود ندارد';

  return (
    <div className="page">
      <div className="reveal flex items-center justify-between gap-3 text-[10px] t-muted">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            داده {sourceLabel}
          </span>
          <span className="t-faint">·</span>
          <span className="num">{toPersian(matches.length)} بازی</span>
          <span className="hidden t-faint sm:inline">·</span>
          <span className="hidden sm:inline">بروزرسانی {updatedLabel}</span>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="iconbtn !h-7 !w-7 !rounded-lg"
          title="بروزرسانی"
          aria-label="بروزرسانی داده‌ها"
        >
          <RefreshCw size={12} className={loading || refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !localMatches ? (
        <div className="mt-4 space-y-4">
          <div className="skeleton h-[290px]" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-[74px]" />
            ))}
          </div>
          <div className="skeleton h-14" />
          <div className="skeleton h-[92px]" />
          <div className="skeleton h-[92px]" />
        </div>
      ) : (
        <>
          <div className="mt-4 grid items-stretch gap-3 lg:grid-cols-[1.6fr_1fr]">
            {spotlight && (
              <section className="hero reveal reveal-1 p-4 md:p-6" aria-label="بازی شاخص">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {spotlight.leagueLogo ? (
                      <img src={spotlight.leagueLogo} alt="" className="h-4 w-4 object-contain" />
                    ) : (
                      <span className="text-[11px]">⚽</span>
                    )}
                    <span className="truncate text-[11px] font-semibold t-muted">{spotlight.leagueName}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="kicker hidden sm:inline">MATCHDAY</span>
                    {spotlight.status === 'live' ? (
                      <span className="chip chip-live !py-1">
                        <span className="live-dot" />
                        <span className="num">{toPersian(spotlight.minute || 0)}′</span>
                        زنده
                      </span>
                    ) : spotlight.status === 'halftime' ? (
                      <span className="chip chip-live !py-1">نیمه اول</span>
                    ) : spotlight.status === 'finished' ? (
                      <span className="chip !py-1">پایان بازی</span>
                    ) : (
                      <span className="chip !py-1 num">{spotlight.time}</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
                  <div className="flex min-w-0 flex-col items-center gap-3 text-center">
                    <span className="crest-frame h-14 w-14 !rounded-2xl md:h-[72px] md:w-[72px]">
                      {spotlight.homeCrest ? (
                        <img src={spotlight.homeCrest} alt="" className="h-9 w-9 object-contain md:h-11 md:w-11" />
                      ) : (
                        <span className="text-xl">⚽</span>
                      )}
                    </span>
                    <span className="display t-ink max-w-full truncate text-lg md:text-[22px]">
                      {spotlight.homeTeamPersian}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    {heroHasScore ? (
                      <div className="chamfer flex items-center gap-2.5 bg-[var(--ink)] px-4 py-2.5 text-[var(--bg)] md:gap-3 md:px-5 md:py-3">
                        <span className="num text-[32px] font-black leading-none md:text-[44px]">
                          {toPersian(spotlight.homeScore ?? 0)}
                        </span>
                        <span className="text-lg opacity-40 md:text-xl">:</span>
                        <span className="num text-[32px] font-black leading-none md:text-[44px]">
                          {toPersian(spotlight.awayScore ?? 0)}
                        </span>
                      </div>
                    ) : (
                      <div className="chamfer border border-dashed border-[var(--line-strong)] px-5 py-3">
                        <span className="display t-muted text-2xl">VS</span>
                      </div>
                    )}
                    <span className="kicker text-center">
                      {heroLive ? spotlight.statusText || 'در جریان' : spotlight.statusText || 'بازی شاخص'}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col items-center gap-3 text-center">
                    <span className="crest-frame h-14 w-14 !rounded-2xl md:h-[72px] md:w-[72px]">
                      {spotlight.awayCrest ? (
                        <img src={spotlight.awayCrest} alt="" className="h-9 w-9 object-contain md:h-11 md:w-11" />
                      ) : (
                        <span className="text-xl">⚽</span>
                      )}
                    </span>
                    <span className="display t-ink max-w-full truncate text-lg md:text-[22px]">
                      {spotlight.awayTeamPersian}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] t-muted">
                    <span className="num font-bold t-soft">{spotlight.time}</span>
                    <span className="t-faint">·</span>
                    <span>{spotlight.date}</span>
                    {spotlight.status === 'upcoming' && (
                      <>
                        <span className="t-faint">·</span>
                        <span>برگزار نشده</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(heroUrl)}
                    className="chip chip-on"
                  >
                    جزئیات کامل
                    <span aria-hidden="true">←</span>
                  </button>
                </div>

                {spotlight.status === 'live' && (
                  <div className="live-track mt-3">
                    <span style={{ width: `${Math.min(100, ((spotlight.minute || 0) / 90) * 100)}%` }} />
                  </div>
                )}
              </section>
            )}

            <div className="reveal reveal-2 grid grid-cols-2 gap-3">
              <div className="stat-tile stat-tile-live">
                <p className="kicker">زنده</p>
                <p className="display num mt-2 text-[38px] leading-none t-ink">{toPersian(counts.live)}</p>
                <p className="mt-1 text-[10px] t-muted">همین حالا</p>
              </div>
              <div className="stat-tile stat-tile-accent">
                <p className="kicker">کل بازی‌ها</p>
                <p className="display num mt-2 text-[38px] leading-none t-ink">{toPersian(matches.length)}</p>
                <p className="mt-1 text-[10px] t-muted">در فید</p>
              </div>
              <div className="stat-tile">
                <p className="kicker">پیش‌رو</p>
                <p className="display num mt-2 text-[38px] leading-none t-ink">{toPersian(counts.upcoming)}</p>
                <p className="mt-1 text-[10px] t-muted">برنامهٔ آینده</p>
              </div>
              <div className="stat-tile">
                <p className="kicker">پایان یافته</p>
                <p className="display num mt-2 text-[38px] leading-none t-ink">{toPersian(counts.finished)}</p>
                <p className="mt-1 text-[10px] t-muted">نتیجهٔ نهایی</p>
              </div>
            </div>
          </div>

          {liveMatches.length > 0 && (
            <div className="scroll-x -mx-4 mt-4 flex gap-2 px-4 pb-1 md:mx-0 md:px-0">
              {liveMatches.slice(0, 10).map((match) => (
                <button
                  key={match.id}
                  onClick={() => navigate(`/match/${match.leagueId ? `${match.leagueId}~${match.id}` : match.id}`)}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px] transition-colors hover:border-[var(--line-strong)]"
                >
                  <span className="live-dot" />
                  <span className="num font-black t-live">{toPersian(match.minute || 0)}′</span>
                  <span className="h-3 w-px bg-[var(--line)]" />
                  <span className="max-w-[72px] truncate t-soft">{match.homeTeamPersian}</span>
                  <span className="num font-black t-ink">
                    {toPersian(match.homeScore ?? 0)}–{toPersian(match.awayScore ?? 0)}
                  </span>
                  <span className="max-w-[72px] truncate t-soft">{match.awayTeamPersian}</span>
                </button>
              ))}
            </div>
          )}

          <section className="plate reveal reveal-3 mt-5 p-3.5 md:p-4">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
              <div className="field md:w-64 md:shrink-0">
                <Search size={15} className="t-faint shrink-0" />
                <input
                  type="text"
                  placeholder="جستجوی تیم یا لیگ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="جستجوی بازی"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="t-faint hover:text-[var(--ink-soft)]" aria-label="پاک کردن جستجو">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="seg flex-1">
                {tabs.map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`seg-item ${tab === key ? 'seg-item-on' : ''}`}
                  >
                    {label}
                    {count > 0 && <span className="seg-count num">{toPersian(count)}</span>}
                  </button>
                ))}
              </div>
            </div>

            {leagueChips.length > 1 && (
              <div className="scroll-x mt-3 flex gap-2 border-t border-[var(--line)] pt-3">
                <button
                  onClick={() => setLeagueFilter(null)}
                  className={`chip ${!leagueFilter ? 'chip-on' : ''}`}
                >
                  همه
                </button>
                {leagueChips.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => setLeagueFilter(leagueFilter === league.id ? null : league.id)}
                    className={`chip ${leagueFilter === league.id ? 'chip-on' : ''}`}
                  >
                    {league.logo ? (
                      <img src={league.logo} alt="" className="h-4 w-4 object-contain" />
                    ) : (
                      <span>⚽</span>
                    )}
                    <span className="max-w-[92px] truncate">{league.name}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1.55fr_1fr]">
            <section className="reveal reveal-4">
              <SectionHead index="۰۱" title="بازی‌ها" meta={`${toPersian(filtered.length)} بازی`} />
              <div className="space-y-2.5">
                {filtered.length === 0 ? (
                  <div className="plate p-10 text-center">
                    <span className="crest-frame mx-auto mb-3 flex h-12 w-12 text-lg">⚽</span>
                    <p className="display t-muted text-2xl">{emptyCopy}</p>
                    <p className="mt-1 text-[11px] t-faint">
                      {provider === 'none' ? 'اسکریپت همگام‌سازی داده را اجرا کنید' : 'فیلتر یا تب دیگری را امتحان کنید'}
                    </p>
                  </div>
                ) : (
                  filtered.map((match) => <MatchCard key={match.id} match={match} />)
                )}
              </div>
            </section>

            <aside className="space-y-7">
              <section>
                <SectionHead
                  index="۰۲"
                  title={`جدول ${standingsLeague?.name ?? 'لیگ'}`}
                  meta={
                    provider === 'varzesh3' ? (
                      <span className="flex items-center gap-1.5">
                        <span className="live-dot" />
                        زنده
                      </span>
                    ) : undefined
                  }
                />
                <div className="plate overflow-hidden">
                  {!apiStandings || apiStandings.length === 0 ? (
                    <p className="p-8 text-center text-xs t-faint">جدول در دسترس نیست</p>
                  ) : (
                    <>
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th className="w-8 px-3 text-right">#</th>
                              <th className="text-right">تیم</th>
                              <th className="text-center">بازی</th>
                              <th className="text-center">تفاضل</th>
                              <th className="text-center">امتیاز</th>
                            </tr>
                          </thead>
                          <tbody>
                            {apiStandings.map((row) => (
                              <tr key={row.teamId}>
                                <td className="px-3">
                                  <span className="flex items-center justify-end gap-1.5">
                                    {row.qualificationColor && (
                                      <span
                                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: row.qualificationColor }}
                                      />
                                    )}
                                    <span className="rank">{toPersian(row.rank)}</span>
                                  </span>
                                </td>
                                <td>
                                  <span className="flex items-center gap-1.5">
                                    {row.teamLogo && <img src={row.teamLogo} alt="" className="h-4 w-4 shrink-0 object-contain" />}
                                    <span className="max-w-[120px] truncate font-semibold t-soft">{row.teamName}</span>
                                  </span>
                                </td>
                                <td className="num text-center">{toPersian(row.played)}</td>
                                <td
                                  className={`num text-center font-semibold ${
                                    row.goalDifference > 0 ? 't-accent' : row.goalDifference < 0 ? 't-live' : 't-muted'
                                  }`}
                                >
                                  {row.goalDifference > 0 ? '+' : ''}
                                  {toPersian(row.goalDifference)}
                                </td>
                                <td className="num pts text-center">{toPersian(row.points)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center gap-3 border-t border-[var(--line)] px-3 py-2.5 text-[9.5px] t-faint">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                          سهمیه
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
                          سقوط
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </section>

              <section>
                <SectionHead index="۰۳" title="گلزنان برتر" meta={standingsLeague?.name} />
                <div className="plate divide-hair overflow-hidden">
                  {!apiScorers || apiScorers.length === 0 ? (
                    <p className="p-8 text-center text-xs t-faint">گلزنان در دسترس نیستند</p>
                  ) : (
                    apiScorers.map((scorer, index) => (
                      <div key={scorer.playerId} className="flex items-center gap-3 px-3.5 py-2.5">
                        <span
                          className={`display w-5 text-center ${
                            index === 0 ? 't-gold' : index === 1 ? 't-muted' : index === 2 ? 'text-[var(--bronze)]' : 't-faint'
                          } text-lg`}
                        >
                          {toPersian(index + 1)}
                        </span>
                        {scorer.portrait || scorer.teamLogo ? (
                          <img
                            src={scorer.portrait || scorer.teamLogo}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full bg-[var(--surface-2)] object-contain"
                          />
                        ) : (
                          <span className="crest-frame h-8 w-8 !rounded-full text-xs">⚽</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="t-ink truncate text-[12px] font-bold">{scorer.name}</p>
                          <p className="truncate text-[10px] t-faint">{scorer.teamName}</p>
                        </div>
                        <div className="flex shrink-0 items-baseline gap-2">
                          <span className="num t-ink text-[15px] font-black">{toPersian(scorer.goals)}</span>
                          <span className="text-[9px] t-faint">گل</span>
                          {scorer.assists > 0 && (
                            <span className="num text-[10px] font-bold t-blue">{toPersian(scorer.assists)} پاس</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
