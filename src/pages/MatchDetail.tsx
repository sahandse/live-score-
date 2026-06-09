import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import {
  getMatch, competitionMap, translateStatus,
  type LiveMatchDetail,
} from '../services/footballApi';

type EventItem = {
  minute: number;
  type: string;
  teamId: number;
  player?: string;
  secondary?: string;
};

function eventIcon(type: string): string {
  if (type === 'goal' || type === 'NORMAL' || type === 'OWN_GOAL' || type === 'PENALTY') return '⚽';
  if (type === 'YELLOW') return '🟨';
  if (type === 'RED' || type === 'YELLOW_RED') return '🟥';
  if (type === 'sub') return '🔄';
  return '•';
}

function eventLabel(type: string): string {
  if (type === 'OWN_GOAL') return 'گل به خودی';
  if (type === 'PENALTY') return 'پنالتی';
  return '';
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { darkMode } = useApp();
  const [match, setMatch] = useState<LiveMatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatch = async (showSpinner = true) => {
    if (!id || id.startsWith('m')) { setLoading(false); return; }
    if (showSpinner) setLoading(true); else setRefreshing(true);
    const data = await getMatch(Number(id));
    setMatch(data);
    if (showSpinner) setLoading(false); else setRefreshing(false);
  };

  useEffect(() => { fetchMatch(); }, [id]);

  const allEvents: EventItem[] = match ? [
    ...(match.goals ?? []).map(g => ({
      minute: g.minute, type: g.type, teamId: g.team.id,
      player: g.scorer?.name, secondary: g.assist ? `پاس: ${g.assist.name}` : eventLabel(g.type) || undefined,
    })),
    ...(match.bookings ?? []).map(b => ({
      minute: b.minute, type: b.card, teamId: b.team.id, player: b.player?.name,
    })),
    ...(match.substitutions ?? []).map(s => ({
      minute: s.minute, type: 'sub', teamId: s.team.id,
      player: s.playerIn?.name, secondary: s.playerOut ? `خروج: ${s.playerOut.name}` : undefined,
    })),
  ].sort((a, b) => a.minute - b.minute) : [];

  const { type: statusType } = match ? translateStatus(match.status) : { type: 'upcoming' as const };
  const comp = match ? (competitionMap[match.competition.code] ?? { name: match.competition.name, flag: '🌍' }) : null;
  const homeScore = match ? (match.score.fullTime.home ?? match.score.halfTime.home ?? 0) : 0;
  const awayScore = match ? (match.score.fullTime.away ?? match.score.halfTime.away ?? 0) : 0;
  const htHome = match?.score.halfTime.home;
  const htAway = match?.score.halfTime.away;

  const cardBg = statusType === 'live'
    ? darkMode ? 'bg-gray-900 border-emerald-900' : 'bg-emerald-50 border-emerald-200'
    : darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Back */}
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
          {[140, 260].map((h, i) => (
            <div key={i} className={`rounded-3xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} style={{ height: h }} />
          ))}
        </div>
      ) : !match ? (
        <div className={`text-center py-16 rounded-3xl ${darkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
          <div className="text-5xl mb-4">⚽</div>
          <p>اطلاعات این بازی در دسترس نیست</p>
          <p className="text-xs mt-2">ممکن است بازی آفلاین یا دیتای نمونه باشد</p>
        </div>
      ) : (
        <>
          {/* Score card */}
          <div className={`rounded-3xl border overflow-hidden mb-4 ${cardBg}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                {match.competition.emblem
                  ? <img src={match.competition.emblem} alt="" className="w-5 h-5 object-contain" />
                  : <span className="text-base">{comp?.flag}</span>
                }
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comp?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {statusType === 'live' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
                    <span className="text-red-400 text-sm font-bold">{toPersian(match.minute ?? 0)}′</span>
                  </div>
                )}
                {statusType === 'halftime' && <span className="text-amber-400 text-sm font-bold">نیمه اول</span>}
                {statusType === 'finished' && <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>پایان</span>}
                {statusType === 'upcoming' && (
                  <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(match.utcDate).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })}
                  </span>
                )}
                <button onClick={() => fetchMatch(false)} className={`p-1.5 rounded-lg ${refreshing ? 'animate-spin' : ''} ${darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}>
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center px-6 py-8">
              {/* Home team — right side in RTL */}
              <div className="flex-1 flex flex-col items-end gap-3">
                {match.homeTeam.crest
                  ? <img src={match.homeTeam.crest} alt="" className="w-16 h-16 object-contain" />
                  : <span className="text-4xl">🏠</span>
                }
                <p className={`text-base font-bold text-right leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {match.homeTeam.shortName || match.homeTeam.name}
                </p>
              </div>

              {/* Center score */}
              <div className="flex flex-col items-center gap-1.5 px-4">
                {statusType === 'upcoming' ? (
                  <span className={`text-3xl font-black ${darkMode ? 'text-gray-500' : 'text-gray-300'}`}>VS</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-5xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(homeScore)}</span>
                    <span className={`text-3xl font-light ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>-</span>
                    <span className={`text-5xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{toPersian(awayScore)}</span>
                  </div>
                )}
                {statusType === 'finished' && htHome !== null && htAway !== null && (
                  <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    نیمه: {toPersian(htHome ?? 0)} - {toPersian(htAway ?? 0)}
                  </span>
                )}
                <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  {new Date(match.utcDate).toLocaleDateString('fa-IR')}
                </span>
              </div>

              {/* Away team — left side in RTL */}
              <div className="flex-1 flex flex-col items-start gap-3">
                {match.awayTeam.crest
                  ? <img src={match.awayTeam.crest} alt="" className="w-16 h-16 object-contain" />
                  : <span className="text-4xl">✈️</span>
                }
                <p className={`text-base font-bold leading-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {match.awayTeam.shortName || match.awayTeam.name}
                </p>
              </div>
            </div>

            {/* Referees */}
            {match.referees?.length > 0 && (
              <div className={`px-5 py-2.5 border-t text-xs ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-100 text-gray-400'}`}>
                داور: {match.referees[0].name}
              </div>
            )}
          </div>

          {/* Event timeline */}
          {allEvents.length > 0 && (
            <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>رویدادهای بازی</h3>
              </div>
              <div>
                {allEvents.map((ev, i) => {
                  const isHome = ev.teamId === match.homeTeam.id;
                  const icon = eventIcon(ev.type);
                  return (
                    <div
                      key={i}
                      className={`flex items-center px-3 py-3 border-b last:border-b-0 ${
                        darkMode ? 'border-gray-800/60 hover:bg-gray-800/30' : 'border-gray-50 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      {/* Right column — home team events (RTL first child = right side) */}
                      <div className="flex-1 flex flex-col items-end">
                        {isHome && (
                          <>
                            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{ev.player}</span>
                            {ev.secondary && <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{ev.secondary}</span>}
                          </>
                        )}
                      </div>

                      {/* Center */}
                      <div className="flex items-center gap-1.5 mx-3 min-w-[64px] justify-center">
                        <span className="text-lg">{icon}</span>
                        <span className={`text-xs font-bold tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{toPersian(ev.minute)}′</span>
                      </div>

                      {/* Left column — away team events (RTL last child = left side) */}
                      <div className="flex-1 flex flex-col items-start">
                        {!isHome && (
                          <>
                            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{ev.player}</span>
                            {ev.secondary && <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{ev.secondary}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No events placeholder */}
          {allEvents.length === 0 && statusType !== 'upcoming' && (
            <div className={`rounded-3xl border text-center py-10 ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-600' : 'bg-white border-gray-100 text-gray-400'}`}>
              <p className="text-sm">رویداد ثبت‌شده‌ای وجود ندارد</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
