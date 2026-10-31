import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersian } from '../hooks/usePersianDate';
import { getFeedLeagues, getFeedTeams, type FeedLeague, type FeedTeam } from '../services/dataApi';

const formTone = (result: string) =>
  result === 'W'
    ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_28%,var(--line))]'
    : result === 'L'
      ? 'bg-[var(--live-soft)] text-[var(--live)] border-[color-mix(in_srgb,var(--live)_28%,var(--line))]'
      : 'bg-[var(--surface-3)] t-muted border-[var(--line)]';

export default function Teams() {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useApp();
  const [teams, setTeams] = useState<FeedTeam[]>([]);
  const [leagues, setLeagues] = useState<FeedLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFeedTeams(), getFeedLeagues()]).then(([feed, allLeagues]) => {
      if (cancelled) return;
      setTeams(feed.teams);
      setLeagues(allLeagues.filter((league) => feed.teams.some((team) => team.leagueId === league.id)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim();
    return teams.filter((team) => {
      if (leagueFilter && team.leagueId !== leagueFilter) return false;
      if (!query) return true;
      return team.name.includes(query) || team.leagueName.includes(query);
    });
  }, [teams, search, leagueFilter]);

  const squadCount = teams.reduce((sum, team) => sum + team.squad.length, 0);

  return (
    <div className="page">
      <header className="reveal mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="kicker">TEAMS — ۰۲</p>
          <h2 className="display t-ink mt-1 text-[40px] leading-none md:text-5xl">تیم‌ها</h2>
        </div>
        <div className="text-left">
          <p className="display num t-ink text-2xl leading-none">{toPersian(visible.length)}</p>
          <p className="mt-1 text-[10px] t-faint">
            تیم · {toPersian(leagues.length)} لیگ · {toPersian(squadCount)} بازیکن
          </p>
        </div>
      </header>

      <div className="reveal reveal-1 mb-4">
        <div className="field">
          <Search size={15} className="t-faint shrink-0" />
          <input
            type="text"
            placeholder="جستجوی تیم یا لیگ..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="جستجوی تیم"
          />
          {search && (
            <button onClick={() => setSearch('')} className="t-faint hover:text-[var(--ink-soft)]" aria-label="پاک کردن جستجو">
              <X size={14} />
            </button>
          )}
        </div>
        {leagues.length > 1 && (
          <div className="scroll-x -mx-4 mt-3 flex gap-2 px-4 pb-1 md:mx-0 md:px-0">
            <button
              onClick={() => setLeagueFilter(null)}
              className={`chip shrink-0 ${!leagueFilter ? 'chip-on' : ''}`}
            >
              همه لیگ‌ها
            </button>
            {leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setLeagueFilter(leagueFilter === league.id ? null : league.id)}
                className={`chip shrink-0 ${leagueFilter === league.id ? 'chip-on' : ''}`}
              >
                {league.logo && <img src={league.logo} alt="" className="h-4 w-4 object-contain" />}
                <span className="max-w-[110px] truncate">{league.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="reveal reveal-2 space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[86px]" />
          ))}
        </div>
      ) : (
        <div className="reveal reveal-2 space-y-2.5">
          {visible.map((team) => (
            <article
              key={team.id}
              onClick={() => navigate(`/team/${team.id}`)}
              className="matchplate group cursor-pointer"
              aria-label={`صفحهٔ ${team.name}`}
            >
              <div className="flex items-center gap-3 p-3.5 text-right md:p-4">
                <span className="crest-frame h-12 w-12 !rounded-xl md:h-14 md:w-14">
                  {team.logo ? (
                    <img src={team.logo} alt="" className="h-8 w-8 object-contain md:h-9 md:w-9" />
                  ) : (
                    <span className="text-xl">🛡️</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="display t-ink truncate text-xl leading-tight md:text-[23px]">{team.name}</h3>
                    <span className="num t-accent shrink-0 text-[10px] font-bold">{toPersian(team.points)} امتیاز</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] t-muted">
                    <span className="truncate">{team.leagueName}</span>
                    <span className="flex items-center gap-1">
                      رتبه <span className="num font-bold t-soft">{toPersian(team.rank)}</span>
                    </span>
                    {team.squad.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {toPersian(team.squad.length)}
                      </span>
                    )}
                    {team.formation && <span className="num hidden sm:inline">سیستم {team.formation}</span>}
                    {team.coach && <span className="hidden truncate sm:inline">{team.coach}</span>}
                  </div>
                  {team.form.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {team.form.map((turn, i) => (
                        <span
                          key={i}
                          title={turn.tooltip}
                          className={`flex h-5 w-5 items-center justify-center rounded-md border text-[10px] font-black ${formTone(turn.result)}`}
                        >
                          {turn.result === 'W' ? 'ب' : turn.result === 'L' ? 'خ' : 'م'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(team.id);
                    }}
                    className={`rounded-md p-1.5 transition-colors ${
                      isFavorite(team.id) ? 'text-[var(--gold)]' : 't-faint hover:text-[var(--ink-soft)]'
                    }`}
                    aria-label="تیم محبوب"
                  >
                    <Star size={15} fill={isFavorite(team.id) ? 'currentColor' : 'none'} />
                  </button>
                  <span className="flex items-center gap-1 text-[10px] t-faint opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    صفحهٔ تیم
                    <span aria-hidden="true">←</span>
                  </span>
                </div>
              </div>
            </article>
          ))}

          {visible.length === 0 && (
            <div className="plate p-12 text-center">
              <span className="crest-frame mx-auto mb-3 flex h-12 w-12 text-lg">🛡️</span>
              <p className="display t-muted text-2xl">تیمی با این نام پیدا نشد</p>
              <p className="mt-1 text-[11px] t-faint">عبارت جستجو یا فیلتر لیگ را تغییر دهید</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
