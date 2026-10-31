import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, Star, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import {
  getFeedLeagues,
  getFeedTeams,
  getLeagueMatches,
  getLeagueScorers,
  getLeagueStandings,
  getMatchFeed,
  type FeedFixtureRound,
  type FeedLeague,
  type FeedMatch,
  type FeedScorer,
  type FeedStandingRow,
  type FeedTeam,
} from '../services/dataApi';

type LeagueTab = 'standings' | 'scorers' | 'matches' | 'teams';

type LeagueData = {
  standings: FeedStandingRow[];
  scorers: FeedScorer[];
  rounds: FeedFixtureRound[];
  matches: FeedMatch[];
};

export default function Leagues() {
  const { isFavorite, toggleFavorite } = useApp();
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<FeedLeague[]>([]);
  const [teamsByLeague, setTeamsByLeague] = useState<Record<string, FeedTeam[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeagueTab>('standings');
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Record<string, LeagueData>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyWithData, setOnlyWithData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFeedLeagues(), getMatchFeed(), getFeedTeams()]).then(([all, feed, teams]) => {
      if (cancelled) return;
      // Leagues with a table come first; the ones live today are listed even without one.
      const fromFeed = new Set(feed.matches.map((match) => match.leagueId));
      const ranked = [...all].sort(
        (a, b) =>
          Number(b.hasData) - Number(a.hasData) ||
          Number(fromFeed.has(b.id)) - Number(fromFeed.has(a.id)) ||
          a.priority - b.priority ||
          a.name.localeCompare(b.name, 'fa')
      );
      setLeagues(ranked);
      const grouped: Record<string, FeedTeam[]> = {};
      teams.teams.forEach((team) => {
        (grouped[team.leagueId] ??= []).push(team);
      });
      setTeamsByLeague(grouped);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLeague = useCallback(async (leagueId: string) => {
    setLoadingId(leagueId);
    const [standings, scorers, fixtures] = await Promise.all([
      getLeagueStandings(leagueId),
      getLeagueScorers(leagueId),
      getLeagueMatches(leagueId),
    ]);
    setData((prev) => ({
      ...prev,
      [leagueId]: { standings, scorers, rounds: fixtures.rounds, matches: fixtures.matches },
    }));
    const current = fixtures.rounds.findIndex((entry) => entry.selected);
    setRound(current >= 0 ? current : 0);
    setLoadingId(null);
  }, []);

  const handleExpand = (leagueId: string) => {
    if (expanded === leagueId) {
      setExpanded(null);
      return;
    }
    setExpanded(leagueId);
    setRound(0);
    if (!data[leagueId]) void loadLeague(leagueId);
  };

  const visible = useMemo(() => {
    const query = search.trim();
    return leagues.filter((league) => {
      if (onlyWithData && !league.hasData) return false;
      return !query || league.name.includes(query);
    });
  }, [leagues, search, onlyWithData]);

  const panels: { key: LeagueTab; label: string }[] = [
    { key: 'standings', label: 'جدول' },
    { key: 'scorers', label: 'گلزنان' },
    { key: 'matches', label: 'بازی‌ها' },
    { key: 'teams', label: 'تیم‌ها' },
  ];

  const withData = leagues.filter((league) => league.hasData).length;

  return (
    <div className="page">
      <header className="reveal mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="kicker">COMPETITIONS — ۰۱</p>
          <h2 className="display t-ink mt-1 text-[40px] leading-none md:text-5xl">لیگ‌ها</h2>
        </div>
        <div className="text-left">
          <p className="display num t-ink text-2xl leading-none">{toPersian(visible.length)}</p>
          <p className="mt-1 text-[10px] t-faint">لیگ · {toPersian(withData)} با جدول</p>
        </div>
      </header>

      <div className="reveal reveal-1 mb-4 flex flex-col gap-2.5 sm:flex-row">
        <div className="field flex-1">
          <Search size={15} className="t-faint shrink-0" />
          <input
            type="text"
            placeholder="جستجوی لیگ..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="جستجوی لیگ"
          />
          {search && (
            <button onClick={() => setSearch('')} className="t-faint hover:text-[var(--ink-soft)]" aria-label="پاک کردن جستجو">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setOnlyWithData((value) => !value)}
          className={`chip justify-center !py-2.5 ${onlyWithData ? 'chip-on' : ''}`}
        >
          فقط لیگ‌های دارای داده
        </button>
      </div>

      <div className="reveal reveal-2 space-y-2.5">
        {visible.map((league) => {
          const isExpanded = expanded === league.id;
          const leagueData = data[league.id];
          const teams = teamsByLeague[league.id] ?? [];
          const isLoading = loadingId === league.id;

          return (
            <article
              key={league.id}
              className={`plate overflow-hidden lift ${isExpanded ? '!border-[var(--line-strong)]' : ''}`}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleExpand(league.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleExpand(league.id);
                  }
                }}
                className="flex w-full cursor-pointer items-center gap-3 p-3.5 text-right md:p-4"
              >
                <span className="crest-frame h-11 w-11 !rounded-xl">
                  {league.logo ? (
                    <img src={league.logo} alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    <span className="text-lg">🏆</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="display t-ink truncate text-xl">{league.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] t-muted">
                    {league.hasData ? (
                      <span className="flex items-center gap-1 t-accent">
                        <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                        جدول، گلزنان و برنامه بازی‌ها
                      </span>
                    ) : (
                      <span className="t-faint">فقط نتیجه بازی‌های این لیگ</span>
                    )}
                    {teams.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {toPersian(teams.length)} تیم
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(league.id);
                    }}
                    className={`rounded-md p-1.5 transition-colors ${
                      isFavorite(league.id) ? 'text-[var(--gold)]' : 't-faint hover:text-[var(--ink-soft)]'
                    }`}
                    aria-label="لیگ محبوب"
                  >
                    <Star size={15} fill={isFavorite(league.id) ? 'currentColor' : 'none'} />
                  </button>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--line)] t-muted">
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[var(--line)]">
                  {isLoading || !leagueData ? (
                    <div className="space-y-2 p-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton h-8" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="p-3">
                        <div className="seg">
                          {panels.map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setActiveTab(key)}
                              className={`seg-item ${activeTab === key ? 'seg-item-on' : ''}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeTab === 'standings' &&
                        (leagueData.standings.length === 0 ? (
                          <p className="py-8 text-center text-xs t-faint">جدولی برای این لیگ منتشر نشده است</p>
                        ) : (
                          <>
                            <div className="table-wrap">
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th className="w-8 px-3 text-right">#</th>
                                    <th className="text-right">تیم</th>
                                    <th className="text-center">بازی</th>
                                    <th className="hidden text-center sm:table-cell">برد</th>
                                    <th className="hidden text-center sm:table-cell">تساوی</th>
                                    <th className="hidden text-center sm:table-cell">باخت</th>
                                    <th className="text-center">تفاضل</th>
                                    <th className="text-center">امتیاز</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {leagueData.standings.map((row) => {
                                    const gd = row.goalDifference;
                                    return (
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
                                            {row.teamLogo && (
                                              <img src={row.teamLogo} alt="" className="h-4 w-4 shrink-0 object-contain" />
                                            )}
                                            <span className="max-w-[130px] truncate font-semibold t-soft">{row.teamName}</span>
                                          </span>
                                        </td>
                                        <td className="num text-center">{toPersian(row.played)}</td>
                                        <td className="num hidden text-center t-accent sm:table-cell">{toPersian(row.won)}</td>
                                        <td className="num hidden text-center sm:table-cell">{toPersian(row.drawn)}</td>
                                        <td className="num hidden text-center t-live sm:table-cell">{toPersian(row.lost)}</td>
                                        <td
                                          className={`num text-center font-semibold ${
                                            gd > 0 ? 't-accent' : gd < 0 ? 't-live' : 't-muted'
                                          }`}
                                        >
                                          {gd > 0 ? '+' : ''}
                                          {toPersian(gd)}
                                        </td>
                                        <td className="num pts text-center">{toPersian(row.points)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            {leagueData.standings.some((row) => row.qualificationColor) && (
                              <p className="border-t border-[var(--line)] px-4 py-2.5 text-[9.5px] t-faint">
                                رنگ کنار رتبه، سهمیه جدول (قاره‌ای / پلی‌آف / سقوط) را نشان می‌دهد.
                              </p>
                            )}
                          </>
                        ))}

                      {activeTab === 'scorers' &&
                        (leagueData.scorers.length === 0 ? (
                          <p className="py-8 text-center text-xs t-faint">گلزنان این لیگ در دسترس نیستند</p>
                        ) : (
                          <div className="divide-hair">
                            {leagueData.scorers.slice(0, 20).map((scorer, i) => (
                              <div key={scorer.playerId} className="flex items-center gap-3 px-3.5 py-2.5">
                                <span
                                  className={`display w-5 text-center text-lg ${
                                    i === 0 ? 't-gold' : i === 1 ? 't-muted' : i === 2 ? 'text-[var(--bronze)]' : 't-faint'
                                  }`}
                                >
                                  {toPersian(i + 1)}
                                </span>
                                {scorer.portrait ? (
                                  <img
                                    src={scorer.portrait}
                                    alt=""
                                    className="h-8 w-8 shrink-0 rounded-full bg-[var(--surface-2)] object-cover"
                                  />
                                ) : scorer.teamLogo ? (
                                  <img src={scorer.teamLogo} alt="" className="h-7 w-7 shrink-0 object-contain" />
                                ) : (
                                  <span className="crest-frame h-8 w-8 !rounded-full text-xs">⚽</span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="t-ink truncate text-[12px] font-bold">{scorer.name}</p>
                                  <p className="truncate text-[10px] t-faint">{scorer.teamName}</p>
                                </div>
                                <div className="flex shrink-0 items-baseline gap-2.5">
                                  <span className="num t-ink text-sm font-black">{toPersian(scorer.goals)}</span>
                                  <span className="text-[9px] t-faint">گل</span>
                                  {scorer.assists > 0 && (
                                    <span className="num text-[10px] font-bold t-blue">{toPersian(scorer.assists)} پاس</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                      {activeTab === 'matches' && (
                        <div>
                          {leagueData.rounds.length > 0 && (
                            <div className="scroll-x flex gap-2 border-b border-[var(--line)] px-3 py-2.5">
                              {leagueData.rounds.map((entry, i) => (
                                <button
                                  key={entry.round + i}
                                  onClick={() => setRound(i)}
                                  className={`chip ${round === i ? 'chip-on' : ''}`}
                                >
                                  {toPersian(entry.round)}
                                </button>
                              ))}
                            </div>
                          )}
                          {(() => {
                            const rows = leagueData.rounds.length
                              ? leagueData.rounds[round]?.matches ?? []
                              : leagueData.matches;
                            if (rows.length === 0) {
                              return <p className="py-8 text-center text-xs t-faint">بازی‌ای برای این لیگ ثبت نشده است</p>;
                            }
                            return (
                              <div className="divide-hair">
                                {rows.map((match) => (
                                  <div
                                    key={match.id}
                                    onClick={() => navigate(`/match/${league.id}~${match.id}`)}
                                    className={`flex cursor-pointer items-center gap-2 px-3.5 py-3 transition-colors hover:bg-[var(--surface-2)] ${
                                      match.status === 'live' ? 'bg-[var(--live-soft)]' : ''
                                    }`}
                                  >
                                    <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                                      <span className="truncate text-[11px] font-semibold t-soft">{match.home.name}</span>
                                      {match.home.logo && (
                                        <img src={match.home.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />
                                      )}
                                    </div>
                                    <div className="flex min-w-[68px] flex-col items-center gap-0.5">
                                      {match.status === 'upcoming' || match.homeScore === null || match.awayScore === null ? (
                                        <>
                                          <span className="num text-[11px] font-bold t-ink">{match.time}</span>
                                          <span className="text-[9px] t-faint">{match.persianDate}</span>
                                        </>
                                      ) : (
                                        <span className="num text-sm font-black t-ink">
                                          {toPersian(match.homeScore)} - {toPersian(match.awayScore)}
                                        </span>
                                      )}
                                      {match.status === 'live' ? (
                                        <span className="flex items-center gap-1 text-[9px] font-bold t-live">
                                          <span className="live-dot !h-[5px] !w-[5px]" />
                                          <span className="num">{toPersian(match.minute)}′</span>
                                        </span>
                                      ) : (
                                        <span className="text-[9px] t-faint">
                                          {match.statusText || (match.status === 'upcoming' ? 'برگزار نشده' : 'پایان')}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                      {match.away.logo && (
                                        <img src={match.away.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />
                                      )}
                                      <span className="truncate text-[11px] font-semibold t-soft">{match.away.name}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {activeTab === 'teams' &&
                        (teams.length === 0 ? (
                          <p className="py-8 text-center text-xs t-faint">تیم‌های این لیگ در آخرین همگام‌سازی نبوده‌اند</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                            {teams.map((team) => (
                              <div key={team.id} className="inset flex items-center gap-2 p-2.5">
                                {team.logo ? (
                                  <img src={team.logo} alt="" className="h-6 w-6 shrink-0 object-contain" />
                                ) : (
                                  <span className="text-lg">🛡️</span>
                                )}
                                <div className="min-w-0">
                                  <p className="t-soft truncate text-[11px] font-bold">{team.name}</p>
                                  <p className="num truncate text-[9.5px] t-faint">
                                    رتبه {toPersian(team.rank)} · {toPersian(team.points)} امتیاز
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {visible.length === 0 && (
          <div className="plate p-12 text-center">
            <span className="crest-frame mx-auto mb-3 flex h-12 w-12 text-lg">🏆</span>
            <p className="display t-muted text-2xl">لیگی با این نام پیدا نشد</p>
            <p className="mt-1 text-[11px] t-faint">عبارت جستجو یا فیلتر را تغییر دهید</p>
          </div>
        )}
      </div>
    </div>
  );
}
