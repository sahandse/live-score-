import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import {
  getFeedTeams,
  getLeagueMatches,
  getLeagueStandings,
  getMatchFeed,
  type FeedMatch,
  type FeedStandingRow,
  type FeedTeam,
} from '../services/dataApi';

const positionAccent: Record<string, string> = {
  GK: 'bg-[color-mix(in_srgb,var(--gold)_16%,transparent)] text-[var(--gold)]',
  DF: 'bg-[var(--blue-soft)] text-[var(--blue)]',
  MF: 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]',
  FW: 'bg-[var(--live-soft)] text-[var(--live)]',
  OTHER: 'bg-[var(--surface-3)] t-muted',
};

const squadGroups: { code: string; label: string }[] = [
  { code: 'GK', label: 'دروازه‌بانان' },
  { code: 'DF', label: 'مدافعان' },
  { code: 'MF', label: 'هافبک‌ها' },
  { code: 'FW', label: 'مهاجمان' },
  { code: 'OTHER', label: 'سایر' },
];

const formTone = (result: string) =>
  result === 'W'
    ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,var(--line))]'
    : result === 'L'
      ? 'bg-[var(--live-soft)] text-[var(--live)] border-[color-mix(in_srgb,var(--live)_28%,var(--line))]'
      : 'bg-[var(--surface-3)] t-muted border-[var(--line)]';

const resultLetter = (result: string) => (result === 'W' ? 'ب' : result === 'L' ? 'خ' : 'م');

const statsOf = (team: FeedTeam) => [
  { label: 'بازی', value: team.played, signed: false },
  { label: 'برد', value: team.won, signed: false },
  { label: 'مساوی', value: team.drawn, signed: false },
  { label: 'باخت', value: team.lost, signed: false },
  { label: 'گل زده', value: team.goalsFor, signed: false },
  { label: 'گل خورده', value: team.goalsAgainst, signed: false },
  { label: 'تفاضل', value: team.goalDifference, signed: true },
  { label: 'امتیاز', value: team.points, signed: false },
];

// A club is only a row of teams.json once the sync has crawled its league; the match
// feed still knows its name, logo and table entry, so the page can be built from there.
async function resolveTeam(teamId: string): Promise<FeedTeam | null> {
  const { teams } = await getFeedTeams();
  const known = teams.find((team) => team.id === teamId);
  if (known) return known;

  const feed = await getMatchFeed();
  const match = feed.matches.find((entry) => entry.home.id === teamId || entry.away.id === teamId);
  if (!match) return null;

  const side = match.home.id === teamId ? match.home : match.away;
  const table = await getLeagueStandings(match.leagueId);
  const row = table.find((entry) => entry.teamId === teamId);
  return {
    id: side.id,
    name: side.name,
    logo: side.logo,
    leagueId: match.leagueId,
    leagueName: match.leagueName,
    rank: row?.rank ?? 0,
    points: row?.points ?? 0,
    played: row?.played ?? 0,
    won: row?.won ?? 0,
    drawn: row?.drawn ?? 0,
    lost: row?.lost ?? 0,
    goalsFor: row?.goalsFor ?? 0,
    goalsAgainst: row?.goalsAgainst ?? 0,
    goalDifference: row?.goalDifference ?? 0,
    qualificationColor: row?.qualificationColor ?? '',
    form: row?.form ?? [],
    coach: '',
    formation: '',
    stadium: '',
    squad: [],
  };
}

function teamResult(match: FeedMatch, teamId: string) {
  if (match.status === 'upcoming' || match.homeScore === null || match.awayScore === null) return '';
  const isHome = match.home.id === teamId;
  const own = isHome ? match.homeScore : match.awayScore;
  const other = isHome ? match.awayScore : match.homeScore;
  return own > other ? 'W' : own < other ? 'L' : 'D';
}

export default function TeamDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useApp();
  const [team, setTeam] = useState<FeedTeam | null>(null);
  const [table, setTable] = useState<FeedStandingRow[]>([]);
  const [matches, setMatches] = useState<FeedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const resolved = await resolveTeam(id);
    setTeam(resolved);
    if (resolved) {
      const [standings, fixtures] = await Promise.all([
        getLeagueStandings(resolved.leagueId),
        getLeagueMatches(resolved.leagueId),
      ]);
      setTable(standings);
      setMatches(fixtures.matches.filter((match) => match.home.id === resolved.id || match.away.id === resolved.id));
    } else {
      setTable([]);
      setMatches([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      matches
        .filter((match) => match.status === 'upcoming')
        .sort((a, b) => a.utcStart.localeCompare(b.utcStart))
        .slice(0, 5),
    [matches]
  );
  const played = useMemo(
    () =>
      matches
        .filter((match) => match.status !== 'upcoming')
        .sort((a, b) => b.utcStart.localeCompare(a.utcStart))
        .slice(0, 5),
    [matches]
  );
  const timeline = [...upcoming, ...played];

  const around = useMemo(() => {
    if (!team || table.length === 0) return [];
    const index = table.findIndex((row) => row.teamId === team.id);
    if (index < 0) return table.slice(0, 6);
    const start = Math.max(0, Math.min(index - 2, table.length - 7));
    return table.slice(start, start + 7);
  }, [table, team]);

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton h-9 w-28" />
        <div className="skeleton mt-4 h-[190px]" />
        <div className="skeleton mt-3 h-[128px]" />
        <div className="skeleton mt-3 h-[240px]" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="page page-narrow">
        <button onClick={() => navigate('/teams')} className="chip reveal mb-4">
          <ArrowRight size={13} />
          بازگشت به تیم‌ها
        </button>
        <div className="plate p-12 text-center">
          <span className="crest-frame mx-auto mb-3 flex h-12 w-12 text-lg">🛡️</span>
          <p className="display t-muted text-2xl">این تیم در داده‌ها نیست</p>
          <p className="mt-1 text-[11px] t-faint">در آخرین همگام‌سازی، اطلاعات این باشگاه گرفته نشده است</p>
        </div>
      </div>
    );
  }

  const starred = isFavorite(team.id);

  return (
    <div className="page">
      <div className="reveal flex items-center justify-between gap-3">
        <button onClick={() => navigate(-1)} className="chip">
          <ArrowRight size={13} />
          بازگشت
        </button>
        <button
          onClick={() => toggleFavorite(team.id)}
          className={`iconbtn ${starred ? '!border-[color-mix(in_srgb,var(--gold)_45%,var(--line))] !text-[var(--gold)]' : ''}`}
          aria-label={starred ? 'حذف از محبوب‌ها' : 'افزودن به محبوب‌ها'}
        >
          <Star size={16} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </div>

      <section className="hero reveal reveal-1 mt-3 p-4 md:p-6" aria-label="هویه تیم">
        <div className="flex items-start gap-3.5 md:gap-5">
          <span className="crest-frame h-16 w-16 shrink-0 !rounded-2xl md:h-20 md:w-20">
            {team.logo ? (
              <img src={team.logo} alt="" className="h-10 w-10 object-contain md:h-12 md:w-12" />
            ) : (
              <span className="text-2xl">🛡️</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="kicker">CLUB</p>
            <h2 className="display t-ink mt-1 truncate text-[26px] leading-tight md:text-[34px]">{team.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] t-muted">
              <button onClick={() => navigate('/leagues')} className="truncate underline-offset-4 hover:text-[var(--ink)]">
                {team.leagueName}
              </button>
              {team.rank > 0 && (
                <>
                  <span className="t-faint">·</span>
                  <span>
                    رتبه <span className="num font-bold t-soft">{toPersian(team.rank)}</span>
                  </span>
                </>
              )}
              <span className="t-faint">·</span>
              <span>
                <span className="num font-bold t-accent">{toPersian(team.points)}</span> امتیاز
              </span>
            </div>
            {team.form.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[9.5px] t-faint">۵ بازی اخیر</span>
                <div className="flex items-center gap-1.5">
                  {team.form.map((turn, index) => (
                    <span
                      key={index}
                      title={turn.tooltip}
                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-black ${formTone(turn.result)}`}
                    >
                      {resultLetter(turn.result)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3 text-[10.5px] t-muted">
          {team.coach && <span className="chip !py-1">🧑‍✈️ {team.coach}</span>}
          {team.formation && <span className="chip !py-1 num">سیستم {team.formation}</span>}
          {team.stadium && <span className="chip !py-1">🏟️ {team.stadium}</span>}
          {team.qualificationColor && (
            <span className="chip !py-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: team.qualificationColor }} />
              سهمیه جدول
            </span>
          )}
        </div>
      </section>

      <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-7">
          <section className="reveal reveal-2">
            <div className="mb-3 flex items-baseline gap-2.5">
              <span className="kicker num">۰۱</span>
              <h3 className="display t-ink text-2xl">آمار فصل</h3>
            </div>
            <div className="plate grid grid-cols-4 gap-2 p-2.5">
              {statsOf(team).map((stat) => (
                <div key={stat.label} className="inset px-2 py-3 text-center">
                  <p className="display num t-ink text-xl leading-none md:text-2xl">
                    {stat.signed && stat.value > 0 ? '+' : ''}
                    {toPersian(stat.value)}
                  </p>
                  <p className="mt-1.5 text-[9.5px] t-faint">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="reveal reveal-3">
            <div className="mb-3 flex items-baseline gap-2.5">
              <span className="kicker num">۰۲</span>
              <h3 className="display t-ink text-2xl">بازی‌های این تیم</h3>
              <span className="mr-auto text-[10px] t-faint">{toPersian(matches.length)} بازی در فید</span>
            </div>
            <div className="plate divide-hair overflow-hidden">
              {timeline.length === 0 ? (
                <p className="p-10 text-center text-xs t-faint">بازی این تیم در فید امروز نیست</p>
              ) : (
                timeline.map((match) => {
                  const outcome = teamResult(match, team.id);
                  const isLive = match.status === 'live' || match.status === 'halftime';
                  return (
                    <button
                      key={`${match.leagueId}_${match.id}`}
                      onClick={() => navigate(`/match/${match.leagueId}~${match.id}`)}
                      className={`flex w-full items-center gap-2 px-3 py-3 text-right transition-colors hover:bg-[var(--surface-2)] ${
                        isLive ? 'bg-[var(--live-soft)]' : ''
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                        <span className="truncate text-[11px] font-semibold t-soft">{match.home.name}</span>
                        {match.home.logo && <img src={match.home.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />}
                      </div>
                      <div className="flex min-w-[70px] shrink-0 flex-col items-center gap-0.5">
                        {match.homeScore === null || match.awayScore === null || match.status === 'upcoming' ? (
                          <>
                            <span className="num text-[11px] font-bold t-ink">{match.time}</span>
                            <span className="text-[9px] t-faint">{match.persianDate}</span>
                          </>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            {outcome && (
                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded border text-[9px] font-black ${formTone(outcome)}`}
                              >
                                {resultLetter(outcome)}
                              </span>
                            )}
                            <span className="num text-sm font-black t-ink">
                              {toPersian(match.homeScore)} - {toPersian(match.awayScore)}
                            </span>
                          </span>
                        )}
                        <span className={`text-[9px] ${isLive ? 'font-bold t-live' : 't-faint'}`}>
                          {isLive ? (
                            <span className="flex items-center gap-1">
                              <span className="live-dot !h-[5px] !w-[5px]" />
                              <span className="num">{toPersian(match.minute)}′</span>
                            </span>
                          ) : (
                            match.statusText || (match.status === 'upcoming' ? 'برگزار نشده' : 'پایان')
                          )}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        {match.away.logo && <img src={match.away.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />}
                        <span className="truncate text-[11px] font-semibold t-soft">{match.away.name}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-7">
          <section className="reveal reveal-2">
            <div className="mb-3 flex items-baseline gap-2.5">
              <span className="kicker num">۰۳</span>
              <h3 className="display t-ink truncate text-2xl">جدول {team.leagueName}</h3>
            </div>
            <div className="plate overflow-hidden">
              {around.length === 0 ? (
                <p className="p-8 text-center text-xs t-faint">جدولی برای این لیگ منتشر نشده است</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="w-8 px-3 text-right">#</th>
                        <th className="text-right">تیم</th>
                        <th className="text-center">تفاضل</th>
                        <th className="text-center">امتیاز</th>
                      </tr>
                    </thead>
                    <tbody>
                      {around.map((row) => {
                        const isCurrent = row.teamId === team.id;
                        return (
                          <tr
                            key={row.teamId}
                            onClick={() => navigate(`/team/${row.teamId}`)}
                            className={isCurrent ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' : 'cursor-pointer'}
                          >
                            <td className="px-3">
                              <span className="rank">{toPersian(row.rank)}</span>
                            </td>
                            <td>
                              <span className="flex items-center gap-1.5">
                                {row.teamLogo && <img src={row.teamLogo} alt="" className="h-4 w-4 shrink-0 object-contain" />}
                                <span className={`max-w-[120px] truncate ${isCurrent ? 'font-bold t-ink' : 'font-semibold t-soft'}`}>
                                  {row.teamName}
                                </span>
                              </span>
                            </td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="reveal reveal-3">
            <div className="mb-3 flex items-baseline gap-2.5">
              <span className="kicker num">۰۴</span>
              <h3 className="display t-ink text-2xl">ترکیب</h3>
              <span className="mr-auto text-[10px] t-faint">{toPersian(team.squad.length)} بازیکن</span>
            </div>
            {team.squad.length === 0 ? (
              <div className="plate p-10 text-center">
                <p className="display t-muted text-xl">ترکیب این تیم ثبت نشده است</p>
                <p className="mt-1 text-[10px] t-faint">در آخرین همگام‌سازی داده‌ها گرفته نشده است</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {squadGroups.map((group) => {
                  const players = team.squad.filter((player) => player.position === group.code);
                  if (players.length === 0) return null;
                  return (
                    <div key={group.code} className="plate divide-hair overflow-hidden">
                      <div className="flex items-center justify-between border-b border-[var(--line)] px-3.5 py-2">
                        <span className="kicker">{group.label}</span>
                        <span className="num text-[10px] t-faint">{toPersian(players.length)}</span>
                      </div>
                      {players.map((player) => (
                        <div key={player.id} className="flex items-center gap-2.5 px-3 py-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black ${
                              positionAccent[player.position] ?? positionAccent.OTHER
                            }`}
                          >
                            {player.number ? toPersian(player.number) : player.positionFa.slice(0, 1)}
                          </div>
                          {player.portrait && (
                            <img
                              src={player.portrait}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full bg-[var(--surface-3)] object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="t-soft truncate text-[11.5px] font-semibold">{player.name}</p>
                            <p className="num truncate text-[10px] t-faint">
                              {player.positionFa || 'سایر'}
                              {player.age > 0 && ` · ${toPersian(player.age)} ساله`}
                            </p>
                          </div>
                          {(player.goals > 0 || player.assists > 0) && (
                            <div className="shrink-0 text-left">
                              <p className="num text-[10.5px] font-bold t-accent">{toPersian(player.goals)} ⚽</p>
                              {player.assists > 0 && <p className="num text-[10px] t-blue">{toPersian(player.assists)} 🎯</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
