import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { toPersian } from '../hooks/usePersianDate';
import { useApp } from '../context/AppContext';
import {
  getFeedMatchDetail,
  type FeedEvent,
  type FeedLineupPlayer,
  type FeedMatchDetail,
  type FeedStatus,
} from '../services/dataApi';

type Panel = 'events' | 'stats' | 'lineup';

const statusLabel: Record<FeedStatus, string> = {
  live: 'در جریان',
  halftime: 'نیمه اول',
  finished: 'پایان',
  upcoming: 'برگزار نشده',
  postponed: 'تعویق',
  cancelled: 'لغو',
};

function eventIcon(type: string): string {
  if (type === 'GOAL' || type === 'PENALTY') return '⚽';
  if (type === 'CARD_YELLOW') return '🟨';
  if (type === 'CARD_RED') return '🟥';
  if (type === 'SUBSTITUTION') return '🔄';
  if (type === 'VAR_REVIEW') return '📺';
  return '•';
}

function eventCaption(event: FeedEvent): string {
  if (!event.extra) return '';
  if (event.type === 'GOAL' || event.type === 'PENALTY') return `پاس گل: ${event.extra}`;
  if (event.type === 'SUBSTITUTION') return `خروج: ${event.extra}`;
  return event.extra;
}

const groupByLine = (players: FeedLineupPlayer[]) => {
  const lines = new Map<number, FeedLineupPlayer[]>();
  players.forEach((player) => {
    const line = lines.get(player.line) ?? [];
    line.push(player);
    lines.set(player.line, line);
  });
  return [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, group]) => group);
};

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshInterval } = useApp();
  const [detail, setDetail] = useState<FeedMatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [panel, setPanel] = useState<Panel>('events');

  const tilde = id?.indexOf('~') ?? -1;
  const leagueId = id && tilde > 0 ? id.slice(0, tilde) : '';
  const matchId = id ? (tilde > 0 ? id.slice(tilde + 1) : id) : '';

  const fetchMatch = useCallback(
    async (refresh = false) => {
      if (!matchId) {
        setLoading(false);
        return;
      }
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const data = await getFeedMatchDetail(leagueId, matchId, refresh);
      setDetail(data);
      if (data) {
        if (data.events.length) setPanel('events');
        else if (data.stats.length) setPanel('stats');
        else if (data.lineup.homeStarting.length) setPanel('lineup');
      }
      if (refresh) setRefreshing(false);
      else setLoading(false);
    },
    [leagueId, matchId]
  );

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  useEffect(() => {
    if (detail?.status !== 'live') return;
    const interval = setInterval(() => fetchMatch(true), refreshInterval);
    return () => clearInterval(interval);
  }, [detail, fetchMatch, refreshInterval]);

  const panels: { key: Panel; label: string; count: number }[] = detail
    ? [
        { key: 'events', label: 'حوادث', count: detail.events.length },
        { key: 'stats', label: 'آمار', count: detail.stats.length },
        { key: 'lineup', label: 'ترکیب', count: detail.lineup.homeStarting.length + detail.lineup.awayStarting.length },
      ]
    : [];

  const hasScore =
    detail && detail.status !== 'upcoming' && detail.homeScore !== null && detail.awayScore !== null;
  const isLive = detail?.status === 'live';

  const playerRow = (player: FeedLineupPlayer, accent: string) => (
    <div
      key={`${player.id}_${player.number}`}
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-[var(--surface-2)]"
    >
      <span className={`num w-6 shrink-0 text-center text-[11px] font-black ${accent}`}>
        {player.number ? toPersian(player.number) : '·'}
      </span>
      {player.portrait ? (
        <img src={player.portrait} alt="" className="h-6 w-6 shrink-0 rounded-full bg-[var(--surface-3)] object-cover" />
      ) : (
        <span className="h-6 w-6 shrink-0 rounded-full bg-[var(--surface-3)]" />
      )}
      <span className="t-soft min-w-0 flex-1 truncate text-[11.5px] font-medium">
        {player.name}
        {player.isCaptain && <span className="mr-1 text-[var(--gold)]">©</span>}
      </span>
      {player.rating > 0 && (
        <span
          className={`num text-[10.5px] font-bold ${
            player.rating >= 7.5 ? 't-accent' : player.rating >= 6.5 ? 't-muted' : 't-live'
          }`}
        >
          {toPersian(player.rating.toFixed(1))}
        </span>
      )}
    </div>
  );

  return (
    <div className="page page-narrow">
      <button
        onClick={() => navigate(-1)}
        className="chip reveal mb-4"
      >
        <ArrowRight size={13} />
        بازگشت
      </button>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-[280px]" />
          <div className="skeleton h-12" />
          <div className="skeleton h-[220px]" />
        </div>
      ) : !detail ? (
        <div className="plate p-12 text-center">
          <span className="crest-frame mx-auto mb-3 flex h-12 w-12 text-lg">⚽</span>
          <p className="display t-muted text-2xl">اطلاعات این بازی در دسترس نیست</p>
          <p className="mt-1 text-[11px] t-faint">این بازی در آخرین همگام‌سازی داده‌ها نبوده است</p>
        </div>
      ) : (
        <>
          {/* Scoreboard */}
          <section
            className={`hero reveal reveal-1 px-4 pb-5 pt-4 md:px-6 ${isLive ? '!border-[color-mix(in_srgb,var(--live)_38%,var(--line))]' : ''}`}
            aria-label="نتیجه بازی"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <div className="flex min-w-0 items-center gap-2">
                {detail.leagueLogo && <img src={detail.leagueLogo} alt="" className="h-4 w-4 shrink-0 object-contain" />}
                <span className="truncate text-[11px] font-semibold t-muted">
                  {detail.leagueName}
                  {detail.season && <span className="t-faint"> · {toPersian(detail.season)}</span>}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isLive ? (
                  <span className="chip chip-live !py-1">
                    <span className="live-dot" />
                    <span className="num">{toPersian(detail.minute)}′</span>
                    زنده
                  </span>
                ) : (
                  <span className={`chip !py-1 ${detail.status === 'halftime' ? 't-gold' : ''}`}>
                    {detail.statusText || statusLabel[detail.status]}
                  </span>
                )}
                <button
                  onClick={() => fetchMatch(true)}
                  className="iconbtn !h-7 !w-7 !rounded-lg"
                  title="بروزرسانی"
                  aria-label="بروزرسانی بازی"
                >
                  <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-6">
              <div className="flex min-w-0 flex-col items-center gap-3 text-center">
                <span className="crest-frame h-14 w-14 !rounded-2xl md:h-[72px] md:w-[72px]">
                  {detail.home.logo ? (
                    <img src={detail.home.logo} alt="" className="h-9 w-9 object-contain md:h-11 md:w-11" />
                  ) : (
                    <span className="text-xl">🏟️</span>
                  )}
                </span>
                <span className="display t-ink max-w-full truncate text-lg md:text-[22px]">{detail.home.name}</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                {hasScore ? (
                  <div className="chamfer flex items-center gap-2.5 bg-[var(--ink)] px-4 py-2.5 text-[var(--bg)] md:gap-3 md:px-5 md:py-3">
                    <span className="num text-[32px] font-black leading-none md:text-[44px]">
                      {toPersian(detail.homeScore ?? 0)}
                    </span>
                    <span className="text-lg opacity-40 md:text-xl">:</span>
                    <span className="num text-[32px] font-black leading-none md:text-[44px]">
                      {toPersian(detail.awayScore ?? 0)}
                    </span>
                  </div>
                ) : (
                  <div className="chamfer border border-dashed border-[var(--line-strong)] px-5 py-3">
                    <span className="display t-muted text-2xl">VS</span>
                  </div>
                )}
                <span className="num text-[10.5px] font-bold t-soft">{detail.time}</span>
                <span className="text-[10px] t-faint">{detail.persianDate}</span>
              </div>

              <div className="flex min-w-0 flex-col items-center gap-3 text-center">
                <span className="crest-frame h-14 w-14 !rounded-2xl md:h-[72px] md:w-[72px]">
                  {detail.away.logo ? (
                    <img src={detail.away.logo} alt="" className="h-9 w-9 object-contain md:h-11 md:w-11" />
                  ) : (
                    <span className="text-xl">✈️</span>
                  )}
                </span>
                <span className="display t-ink max-w-full truncate text-lg md:text-[22px]">{detail.away.name}</span>
              </div>
            </div>

            {(detail.stadium || detail.referee) && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-[var(--line)] pt-3 text-[10px] t-muted">
                {detail.stadium && <span>🏟️ {detail.stadium}</span>}
                {detail.referee && <span>🧑‍⚖️ داور: {detail.referee}</span>}
              </div>
            )}

            {isLive && (
              <div className="live-track mt-3">
                <span style={{ width: `${Math.min(100, ((detail.minute || 0) / 90) * 100)}%` }} />
              </div>
            )}
          </section>

          {/* Panels */}
          <div className="seg reveal reveal-2 mt-4" role="tablist" aria-label="بخش‌های بازی">
            {panels.map(({ key, label, count }) => (
              <button
                key={key}
                role="tab"
                aria-selected={panel === key}
                onClick={() => setPanel(key)}
                className={`seg-item ${panel === key ? 'seg-item-on' : ''}`}
              >
                {label}
                {count > 0 && <span className="seg-count num">{toPersian(count)}</span>}
              </button>
            ))}
          </div>

          {panel === 'events' && (
            <section className="plate reveal reveal-3 mt-3 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
                <span className="kicker">TIMELINE</span>
                <span className="text-[10px] t-faint">{toPersian(detail.events.length)} رویداد</span>
              </div>
              {detail.events.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="display t-muted text-xl">رویدادی ثبت نشده است</p>
                  <p className="mt-1 text-[10px] t-faint">با آغاز بازی، حوادث اینجا نمایش داده می‌شود</p>
                </div>
              ) : (
                <div className="divide-hair">
                  {detail.events.map((event, i) => (
                    <div key={i} className="flex items-center px-3 py-2.5 md:px-4">
                      <div className="flex min-w-0 flex-1 flex-col items-end">
                        {event.isHome && (
                          <>
                            <span className="t-ink max-w-full truncate text-[12.5px] font-bold">{event.player}</span>
                            {eventCaption(event) && (
                              <span className="max-w-full truncate text-[10px] t-faint">{eventCaption(event)}</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="mx-2 flex min-w-[64px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 md:mx-3 md:min-w-[72px]">
                        <span className="text-sm leading-none">{eventIcon(event.type)}</span>
                        <span className="num text-[10.5px] font-bold t-muted">{toPersian(event.minute)}′</span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col items-start">
                        {!event.isHome && (
                          <>
                            <span className="t-ink max-w-full truncate text-[12.5px] font-bold">{event.player}</span>
                            {eventCaption(event) && (
                              <span className="max-w-full truncate text-[10px] t-faint">{eventCaption(event)}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {panel === 'stats' && (
            <section className="plate reveal reveal-3 mt-3 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
                <span className="kicker">MATCH STATS</span>
                <span className="text-[10px] t-faint">{toPersian(detail.stats.length)} شاخص</span>
              </div>
              {detail.stats.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="display t-muted text-xl">آماری برای این بازی منتشر نشده است</p>
                  <p className="mt-1 text-[10px] t-faint">پس از پایان بازی دوباره بررسی کنید</p>
                </div>
              ) : (
                <div className="space-y-4 p-4 md:p-5">
                  {detail.stats.map((stat, i) => {
                    const total = Math.max(1, stat.homePercent + stat.awayPercent);
                    const homeWidth = (stat.homePercent / total) * 100;
                    return (
                      <div key={i}>
                        <div className="mb-1.5 flex items-center justify-between text-[11px]">
                          <span className="num t-ink font-black">{stat.home}</span>
                          <span className="t-muted">{stat.title}</span>
                          <span className="num t-ink font-black">{stat.away}</span>
                        </div>
                        <div className="flex h-[5px] overflow-hidden rounded-full bg-[var(--surface-3)]">
                          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${homeWidth}%` }} />
                          <div className="h-full flex-1 rounded-full bg-[var(--blue)]" />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-center gap-4 border-t border-[var(--line)] pt-3 text-[9.5px] t-faint">
                    <span className="flex min-w-0 max-w-[45%] items-center gap-1">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span className="truncate">{detail.home.name}</span>
                    </span>
                    <span className="flex min-w-0 max-w-[45%] items-center gap-1">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--blue)]" />
                      <span className="truncate">{detail.away.name}</span>
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}

          {panel === 'lineup' && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(['home', 'away'] as const).map((side) => {
                const starting = side === 'home' ? detail.lineup.homeStarting : detail.lineup.awayStarting;
                const bench = side === 'home' ? detail.lineup.homeBench : detail.lineup.awayBench;
                const formation = side === 'home' ? detail.lineup.homeFormation : detail.lineup.awayFormation;
                const coach = side === 'home' ? detail.lineup.homeCoach : detail.lineup.awayCoach;
                const team = side === 'home' ? detail.home : detail.away;
                const accent = side === 'home' ? 't-accent' : 't-blue';
                return (
                  <section key={side} className="plate reveal reveal-3 self-start overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-[var(--line)] px-3.5 py-2.5">
                      {team.logo && <img src={team.logo} alt="" className="h-5 w-5 shrink-0 object-contain" />}
                      <span className="t-ink min-w-0 flex-1 truncate text-[12.5px] font-bold">{team.name}</span>
                      {formation && (
                        <span className={`num rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-black ${accent}`}>
                          {formation}
                        </span>
                      )}
                    </div>
                    {starting.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <p className="display t-muted text-lg">ترکیب این بازی منتشر نشده است</p>
                        <p className="mt-1 text-[10px] t-faint">معمولاً یک ساعت قبل از بازی اعلام می‌شود</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {groupByLine(starting).map((line, lineIndex) => (
                          <div key={lineIndex} className={lineIndex > 0 ? 'mt-1 border-t border-[var(--line)] pt-1' : ''}>
                            {line.map((player) => playerRow(player, accent))}
                          </div>
                        ))}
                        <div className="mx-2.5 mt-2 border-t border-[var(--line)] pt-2">
                          <p className="px-1 pb-1 text-[9.5px] font-bold t-faint">
                            نیمکت
                            {coach && <span className="mr-1.5 font-normal">· سرمربی: {coach}</span>}
                          </p>
                          {bench.map((player) => playerRow(player, 't-faint'))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          <p className="mt-5 text-center text-[9.5px] t-faint">
            داده‌ها از فید زنده همگام‌سازی می‌شوند · ممکن است چند دقیقه تأخیر داشته باشند
          </p>
        </>
      )}
    </div>
  );
}
