import { useNavigate } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import type { Match } from '../data/matches';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';

interface Props {
  match: Match;
}

export default function MatchCard({ match }: Props) {
  const navigate = useNavigate();
  const { darkMode, addReminder, removeReminder, hasReminder } = useApp();
  const reminded = hasReminder(match.id);

  // URL format: {leagueId}~{matchId}, the pair the detail page resolves against the feed.
  const matchUrl = `/match/${match.leagueId ? `${match.leagueId}~${match.id}` : match.id}`;

  const handleReminder = () => {
    if (reminded) {
      removeReminder(match.id);
    } else {
      addReminder({
        id: `r_${match.id}`,
        matchId: match.id,
        homeTeam: match.homeTeamPersian,
        awayTeam: match.awayTeamPersian,
        date: match.date,
        time: match.time,
        league: match.leagueName,
      });
    }
  };

  const statusBadge = () => {
    if (match.status === 'live') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
          <span className="text-red-400 text-xs font-bold">{toPersian(match.minute || 0)}′</span>
        </div>
      );
    }
    if (match.status === 'halftime') {
      return <span className="text-amber-400 text-xs font-bold">نیمه اول</span>;
    }
    if (match.status === 'postponed' || match.status === 'cancelled') {
      return (
        <span className="text-orange-400 text-xs font-bold">{match.statusText || (match.status === 'cancelled' ? 'لغو' : 'تعویق')}</span>
      );
    }
    if (match.status === 'finished') {
      return (
        <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {match.statusText && match.statusText !== 'نتیجه نهایی' ? match.statusText : 'پایان'}
        </span>
      );
    }
    return (
      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{match.time}</span>
    );
  };

  const hasScore = match.status !== 'upcoming' && match.homeScore !== null && match.awayScore !== null;
  const scoreColor = match.status === 'live' ? 'text-white' : darkMode ? 'text-gray-100' : 'text-gray-800';

  return (
    <div
      onClick={() => navigate(matchUrl)}
      className={`rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${
        match.status === 'live'
          ? darkMode
            ? 'bg-gray-900/80 border-emerald-900/60 shadow-emerald-950/30'
            : 'bg-emerald-50 border-emerald-200'
          : darkMode
            ? 'bg-gray-900 border-gray-800'
            : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      {/* League row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {match.leagueLogo
            ? <img src={match.leagueLogo} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
            : <span className="text-sm">{match.leagueFlag}</span>
          }
          <span className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{match.leagueName}</span>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
          {match.status === 'upcoming' && (
            <button
              onClick={e => { e.stopPropagation(); handleReminder(); }}
              className={`p-1 rounded-lg transition-colors ${
                reminded
                  ? 'text-emerald-500'
                  : darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              {reminded ? <Bell size={14} /> : <BellOff size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between gap-3">
        {/* Home team */}
        <div className="flex-1 flex flex-col items-end gap-1">
          {match.homeCrest
            ? <img src={match.homeCrest} alt="" className="w-9 h-9 object-contain" />
            : <span className="text-2xl">{match.homeTeamFlag}</span>
          }
          <span className={`text-sm font-semibold text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {match.homeTeamPersian}
          </span>
        </div>

        {/* Score */}
        <div className={`flex items-center gap-1 px-4 py-2 rounded-xl min-w-[80px] justify-center ${
          match.status === 'live'
            ? 'bg-gradient-to-r from-emerald-600 to-blue-600 shadow-lg'
            : darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {hasScore ? (
            <>
              <span className={`text-xl font-black tabular-nums ${scoreColor}`}>{toPersian(match.homeScore ?? 0)}</span>
              <span className={`font-light mx-0.5 ${match.status === 'live' ? 'text-white/60' : darkMode ? 'text-gray-600' : 'text-gray-400'}`}>-</span>
              <span className={`text-xl font-black tabular-nums ${scoreColor}`}>{toPersian(match.awayScore ?? 0)}</span>
            </>
          ) : (
            <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex flex-col items-start gap-1">
          {match.awayCrest
            ? <img src={match.awayCrest} alt="" className="w-9 h-9 object-contain" />
            : <span className="text-2xl">{match.awayTeamFlag}</span>
          }
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {match.awayTeamPersian}
          </span>
        </div>
      </div>
    </div>
  );
}
