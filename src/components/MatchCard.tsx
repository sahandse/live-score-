import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import type { Match } from '../data/matches';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';

interface Props {
  match: Match;
}

export default function MatchCard({ match }: Props) {
  const navigate = useNavigate();
  const { addReminder, removeReminder, hasReminder } = useApp();
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

  const isLive = match.status === 'live' || match.status === 'halftime';
  const hasScore = match.status !== 'upcoming' && match.homeScore !== null && match.awayScore !== null;

  const status = () => {
    if (match.status === 'live') {
      return (
        <span className="chip chip-live !px-2 !py-1 !text-[10px]">
          <span className="live-dot" />
          <span className="num">{toPersian(match.minute || 0)}′</span>
        </span>
      );
    }
    if (match.status === 'halftime') {
      return <span className="chip chip-live !px-2 !py-1 !text-[10px]">نیمه اول</span>;
    }
    if (match.status === 'postponed' || match.status === 'cancelled') {
      return <span className="text-[10px] font-bold t-gold">{match.statusText || (match.status === 'cancelled' ? 'لغو' : 'تعویق')}</span>;
    }
    if (match.status === 'finished') {
      return (
        <span className="text-[10px] font-medium t-muted">
          {match.statusText && match.statusText !== 'نتیجه نهایی' ? match.statusText : 'پایان'}
        </span>
      );
    }
    return <span className="chip !px-2 !py-1 !text-[10px] num">{match.time}</span>;
  };

  return (
    <article
      onClick={() => navigate(matchUrl)}
      className={`matchplate group cursor-pointer ${isLive ? 'matchplate-live' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {match.leagueLogo ? (
            <img src={match.leagueLogo} alt="" className="h-4 w-4 shrink-0 object-contain opacity-90" />
          ) : (
            <span className="crest-frame h-4 w-4 !rounded-[5px] text-[8px]">⚽</span>
          )}
          <span className="truncate text-[10.5px] font-semibold t-muted">{match.leagueName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {status()}
          {match.status === 'upcoming' && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleReminder();
              }}
              className={`rounded-md p-1 transition-colors ${
                reminded ? 'text-[var(--gold)]' : 't-faint hover:text-[var(--ink-soft)]'
              }`}
              aria-label={reminded ? 'حذف یادآور' : 'یادآور بازی'}
            >
              {reminded ? <Bell size={13} fill="currentColor" /> : <Bell size={13} />}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (match.homeTeamId) navigate(`/team/${match.homeTeamId}`);
          }}
          className="group/name flex min-w-0 items-center justify-end gap-2.5 bg-transparent text-right"
        >
          <span className="match-team min-w-0 truncate group-hover/name:underline">{match.homeTeamPersian}</span>
          <span className="crest-frame h-8 w-8 shrink-0">
            {match.homeCrest ? (
              <img src={match.homeCrest} alt="" className="h-5 w-5 object-contain" />
            ) : (
              <span className="text-[11px]">⚽</span>
            )}
          </span>
        </button>

        {hasScore ? (
          <div className={`score ${isLive ? 'score-live' : ''}`}>
            <span className="num">{toPersian(match.homeScore ?? 0)}</span>
            <span className="score-sep">:</span>
            <span className="num">{toPersian(match.awayScore ?? 0)}</span>
          </div>
        ) : (
          <div className="score score-empty">{match.status === 'upcoming' ? 'VS' : '—'}</div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (match.awayTeamId) navigate(`/team/${match.awayTeamId}`);
          }}
          className="group/name flex min-w-0 items-center justify-start gap-2.5 bg-transparent text-left"
        >
          <span className="crest-frame h-8 w-8 shrink-0">
            {match.awayCrest ? (
              <img src={match.awayCrest} alt="" className="h-5 w-5 object-contain" />
            ) : (
              <span className="text-[11px]">⚽</span>
            )}
          </span>
          <span className="match-team min-w-0 truncate group-hover/name:underline">{match.awayTeamPersian}</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2 text-[10px] t-faint">
        <span className="num">{match.date}</span>
        <span className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          جزئیات
          <span aria-hidden="true">←</span>
        </span>
      </div>
    </article>
  );
}
