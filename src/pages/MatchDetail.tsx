import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
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
  const { darkMode } = useApp();
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
    const interval = setInterval(() => fetchMatch(true), 120_000);
    return () => clearInterval(interval);
  }, [detail, fetchMatch]);

  const panels: { key: Panel; label: string; count: number }[] = detail
    ? [
        { key: 'events', label: 'حوادث', count: detail.events.length },
        { key: 'stats', label: 'آمار', count: detail.stats.length },
        { key: 'lineup', label: 'ترکیب', count: detail.lineup.homeStarting.length + detail.lineup.awayStarting.length },
      ]
    : [];

  const hasScore =
    detail && detail.status !== 'upcoming' && detail.homeScore !== null && detail.awayScore !== null;

  const shell = (children: ReactNode, key?: string) => (
    <div key={key} className={`rounded-3xl border overflow-hidden mb-4 ${
      darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {children}
    </div>
  );

  const playerRow = (player: FeedLineupPlayer, accent: string) => (
    <div
      key={`${player.id}_${player.number}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
    >
      <span className={`w-7 text-center text-xs font-black tabular-nums ${accent}`}>
        {player.number ? toPersian(player.number) : '·'}
      </span>
      {player.portrait ? (
        <img src={player.portrait} alt="" className="w-7 h-7 rounded-full object-cover bg-gray-700 flex-shrink-0" />
      ) : (
        <span className="w-7 h-7 rounded-full bg-gray-700/40 flex-shrink-0" />
      )}
      <span className={`flex-1 text-xs font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        {player.name}
        {player.isCaptain && <span className="text-yellow-400 mr-1">©</span>}
      </span>
      {player.rating > 0 && (
        <span
          className={`text-xs font-bold tabular-nums ${
            player.rating >= 7.5 ? 'text-emerald-400' : player.rating >= 6.5 ? 'text-gray-400' : 'text-red-400'
          }`}
        >
          {toPersian(player.rating.toFixed(1))}
        </span>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-5 text-sm font-medium transition-colors ${
          darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <ArrowRight size={16} />
        بازگشت
      </button>

      {loading ? (
        <div className="space-y-4">
          {[180, 240].map((height, i) => (
            <div key={i} className={`rounded-3xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ height }} />
          ))}
        </div>
      ) : !detail ? (
        <div className={`text-center py-16 rounded-3xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
          <div className="text-5xl mb-4">⚽</div>
          <p>اطلاعات این بازی در دسترس نیست</p>
          <p className="text-xs mt-2">این بازی در آخرین همگام‌سازی داده‌ها نبوده است</p>
        </div>
      ) : (
        <>
          {/* Score card */}
          <div className={`rounded-3xl border overflow-hidden mb-4 ${
            detail.status === 'live'
              ? darkMode ? 'bg-gray-900 border-emerald-900' : 'bg-emerald-50 border-emerald-200'
              : darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between px-5 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 min-w-0">
                {detail.leagueLogo && <img src={detail.leagueLogo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
                <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {detail.leagueName}
                  {detail.season && <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}> · {toPersian(detail.season)}</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {detail.status === 'live' && <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />}
                <span className={`text-sm font-bold ${
                  detail.status === 'live' ? 'text-red-400' : detail.status === 'halftime' ? 'text-amber-400' : darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {detail.status === 'live' ? `${toPersian(detail.minute)}′` : detail.statusText || statusLabel[detail.status]}
                </span>
                <button
                  onClick={() => fetchMatch(true)}
                  className={`p-1.5 rounded-lg ${refreshing ? 'animate-spin' : ''} ${darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                  title="بروزرسانی"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            <div className="flex items-center px-5 py-7">
              <div className="flex-1 flex flex-col items-center gap-2">
                {detail.home.logo ? (
                  <img src={detail.home.logo} alt="" className="w-16 h-16 object-contain" />
                ) : (
                  <span className="text-4xl">🏟️</span>
                )}
                <p className={`text-sm font-bold text-center leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {detail.home.name}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1 px-4 min-w-[110px]">
                {hasScore ? (
                  <div className="flex items-center gap-2">
                    <span className={`text-4xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {toPersian(detail.homeScore ?? 0)}
                    </span>
                    <span className={`text-2xl font-light ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>-</span>
                    <span className={`text-4xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {toPersian(detail.awayScore ?? 0)}
                    </span>
                  </div>
                ) : (
                  <span className={`text-3xl font-black ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>VS</span>
                )}
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{detail.persianDate}</span>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{detail.time}</span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-2">
                {detail.away.logo ? (
                  <img src={detail.away.logo} alt="" className="w-16 h-16 object-contain" />
                ) : (
                  <span className="text-4xl">✈️</span>
                )}
                <p className={`text-sm font-bold text-center leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {detail.away.name}
                </p>
              </div>
            </div>

            {(detail.stadium || detail.referee) && (
              <div className={`px-5 py-2.5 border-t flex flex-wrap gap-x-4 gap-y-1 text-xs ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                {detail.stadium && <span>🏟️ {detail.stadium}</span>}
                {detail.referee && <span>🧑‍⚖️ داور: {detail.referee}</span>}
              </div>
            )}
          </div>

          {/* Panels */}
          <div className={`flex gap-1 p-1 rounded-2xl mb-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            {panels.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setPanel(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  panel === key
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 rounded-full font-bold ${
                    panel === key ? 'bg-white/20' : darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
                  }`}>{toPersian(count)}</span>
                )}
              </button>
            ))}
          </div>

          {panel === 'events' && shell(
            detail.events.length === 0 ? (
              <p className={`text-center py-8 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>رویدادی ثبت نشده است</p>
            ) : (
              <div className="divide-y">
                {detail.events.map((event, i) => (
                  <div key={i} className={`flex items-center px-3 py-3 ${darkMode ? 'border-gray-800/60' : 'border-gray-50'}`}>
                    <div className="flex-1 flex flex-col items-end">
                      {event.isHome && (
                        <>
                          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{event.player}</span>
                          {eventCaption(event) && (
                            <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{eventCaption(event)}</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mx-3 min-w-[64px] justify-center">
                      <span className="text-lg">{eventIcon(event.type)}</span>
                      <span className={`text-xs font-bold tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(event.minute)}′</span>
                    </div>
                    <div className="flex-1 flex flex-col items-start">
                      {!event.isHome && (
                        <>
                          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{event.player}</span>
                          {eventCaption(event) && (
                            <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{eventCaption(event)}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {panel === 'stats' && shell(
            detail.stats.length === 0 ? (
              <p className={`text-center py-8 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>آمار این بازی منتشر نشده است</p>
            ) : (
              <div className="p-4 space-y-4">
                {detail.stats.map((stat, i) => {
                  const total = Math.max(1, stat.homePercent + stat.awayPercent);
                  const homeWidth = (stat.homePercent / total) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.home}</span>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{stat.title}</span>
                        <span className={`font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.away}</span>
                      </div>
                      <div className={`flex h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="bg-emerald-500 h-full" style={{ width: `${homeWidth}%` }} />
                        <div className="bg-blue-500 h-full flex-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {panel === 'lineup' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {(['home', 'away'] as const).map((side) => {
                const starting = side === 'home' ? detail.lineup.homeStarting : detail.lineup.awayStarting;
                const bench = side === 'home' ? detail.lineup.homeBench : detail.lineup.awayBench;
                const formation = side === 'home' ? detail.lineup.homeFormation : detail.lineup.awayFormation;
                const coach = side === 'home' ? detail.lineup.homeCoach : detail.lineup.awayCoach;
                const team = side === 'home' ? detail.home : detail.away;
                const accent = side === 'home' ? 'text-emerald-400' : 'text-blue-400';
                return shell(
                  <>
                    <div className={`flex items-center gap-2 px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                      {team.logo && <img src={team.logo} alt="" className="w-5 h-5 object-contain" />}
                      <span className={`text-sm font-bold flex-1 truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{team.name}</span>
                      <span className={`text-xs font-black ${accent}`}>{formation}</span>
                    </div>
                    {starting.length === 0 ? (
                      <p className={`text-center py-8 text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        ترکیب این بازی منتشر نشده است
                      </p>
                    ) : (
                      <div className="p-2">
                        {groupByLine(starting).map((line, lineIndex) => (
                          <div key={lineIndex}>{line.map((player) => playerRow(player, accent))}</div>
                        ))}
                        <p className={`px-3 pt-3 pb-1 text-xs font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                          نیمکت {coach ? `· ${coach}` : ''}
                        </p>
                        {bench.map((player) => playerRow(player, darkMode ? 'text-gray-500' : 'text-gray-400'))}
                      </div>
                    )}
                  </>,
                  side
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
