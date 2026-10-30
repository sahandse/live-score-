// Node port of natijeh-app/app/src/main/java/com/natijeh/data/mapper/SportsMapper.kt
// Keeps the web app and the Android app on one shared interpretation of the API.

export const IRAN_PREMIER_LEAGUE_ID = '6';

const normalizeFa = (value) => String(value || '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim();

export function cleanLeagueTitle(title) {
  const short = String(title || '').split(' - ')[0].trim();
  return short || String(title || '').trim();
}

export function mapStatus(isLive, status, statusTitle) {
  const label = String(statusTitle || '');
  if (isLive || status === 2) return 'LIVE';
  if (label.includes('نیمه') && !label.includes('پایان')) return 'HALFTIME';
  if (status === 7 || status === 8) return 'FINISHED';
  if (status === 4) return 'POSTPONED';
  if (status === 5) return 'CANCELLED';
  return 'SCHEDULED';
}

export function parseMinute(liveTime, status) {
  if (status === 7 || status === 8) return 90;
  const digits = parseInt(String(liveTime || '').replace(/[^\d]/g, '').slice(0, 3), 10);
  return Number.isFinite(digits) ? digits : 0;
}

export function parseIdFromLink(link, type) {
  if (!link) return null;
  const found = new RegExp(`/${type}/(\\d+)`).exec(String(link));
  return found ? found[1] : null;
}

export function sideId(side) {
  if (side?.id != null && side.id !== 0) return String(side.id);
  const fromLink = parseIdFromLink(side?.link, 'team') ?? parseIdFromLink(side?.link, 'person');
  if (fromLink) return fromLink;
  return side?.name || 'unknown';
}

export function sideOf(side) {
  return {
    id: sideId(side),
    name: String(side?.name || ''),
    logo: String(side?.logo || ''),
  };
}

export function mapEvents(events) {
  return (events || [])
    .map((event) => {
      let type = 'EVENT';
      if (event.eventType === 1) type = event.goalType === 1 || event.goalType === 2 ? 'PENALTY' : 'GOAL';
      else if (event.eventType === 2) type = event.cardType === 2 || event.cardType === 3 ? 'CARD_RED' : 'CARD_YELLOW';
      else if (event.eventType === 3) type = 'PENALTY';
      else if (event.eventType === 4) type = 'SUBSTITUTION';
      else if (event.eventType === 5) type = 'VAR_REVIEW';

      let player = '';
      let playerId = null;
      let extra = '';
      if (type === 'GOAL' || type === 'PENALTY') {
        player = event.strickerName || event.kickerName || event.offendingPlayerName || '';
        playerId = event.strikerId || event.kickerId || null;
        extra = event.assisterName || '';
      } else if (type === 'CARD_YELLOW' || type === 'CARD_RED') {
        player = event.offendingPlayerName || '';
        playerId = event.offendingPlayerId || null;
      } else if (type === 'SUBSTITUTION') {
        player = event.incomingPlayerName || 'بازیکن';
        playerId = event.incomingPlayerId || null;
        extra = event.outgoingPlayerName || '';
      } else {
        player = event.offendingPlayerName || event.strickerName || '';
        playerId = event.strikerId || event.offendingPlayerId || null;
      }

      const minute = event.rawTime ?? parseInt(String(event.time || '').replace(/[^\d]/g, ''), 10) ?? 0;
      return {
        minute: Number.isFinite(minute) ? minute : 0,
        type,
        isHome: event.side === 0,
        player: player || 'بازیکن',
        playerId: playerId && playerId !== 0 ? String(playerId) : '',
        detail: event.description || '',
        extra,
        extraId: event.outgoingPlayerId && event.outgoingPlayerId !== 0 ? String(event.outgoingPlayerId) : '',
      };
    })
    .sort((a, b) => a.minute - b.minute);
}

export function mapStats(periods) {
  const period = (periods || []).find((p) => p.title === 'مجموع') ?? (periods || []).slice(-1)[0];
  const block = period?.stats;
  if (!block) return [];
  const rows = [];
  const toRow = (item, fallbackTitle) => ({
    title: item.title || fallbackTitle,
    home: item.host?.value ?? (item.hostValue != null ? String(item.hostValue) : ''),
    away: item.guest?.value ?? (item.guestValue != null ? String(item.guestValue) : ''),
    homePercent: item.host?.percent ?? item.hostValue ?? 50,
    awayPercent: item.guest?.percent ?? item.guestValue ?? 50,
    positive: item.positive === true,
  });
  if (block.possession) rows.push(toRow(block.possession, 'مالکیت توپ'));
  (block.items || []).forEach((item) => rows.push(toRow(item, '')));
  return rows;
}

const linePosition = (lineCount, line) => {
  if (line === 0) return 'GK';
  if (line === 1) return 'DF';
  if (line === lineCount - 1) return 'FW';
  return 'MF';
};

const mapLineupPlayer = (player, line, position) => ({
  id: player.id && player.id !== 0 ? String(player.id) : '',
  name: player.name || '',
  number: player.shirtNumber ?? 0,
  portrait: player.portrait || '',
  line,
  position,
  rating: typeof player.score === 'number' ? player.score : 0,
  isCaptain: player.isCaptain === true,
});

export function mapLineups(host, guest) {
  const starting = (side) => {
    const lines = side?.formationLines || [];
    return lines.flatMap((row, index) =>
      (row.players || []).map((player) => mapLineupPlayer(player, index, linePosition(lines.length, index)))
    );
  };
  const bench = (side) => (side?.benchedPlayers || []).map((player) => mapLineupPlayer(player, -1, 'SUB'));
  return {
    homeFormation: host?.formation || '-',
    awayFormation: guest?.formation || '-',
    homeCoach: host?.coach?.name || '',
    awayCoach: guest?.coach?.name || '',
    homeStarting: starting(host),
    awayStarting: starting(guest),
    homeBench: bench(host),
    awayBench: bench(guest),
  };
}

export function mapStandings(teams) {
  return (teams || []).map((row) => ({
    rank: row.rank ?? 0,
    teamId: String(row.id ?? 0),
    teamName: row.name || '',
    teamLogo: row.logo || '',
    played: row.played ?? 0,
    won: row.wins ?? 0,
    drawn: row.draws ?? 0,
    lost: row.losses ?? 0,
    goalsFor: row.goalFor ?? 0,
    goalsAgainst: row.goalAgainst ?? 0,
    goalDifference: row.goalDifference ?? (row.goalFor ?? 0) - (row.goalAgainst ?? 0),
    points: row.points ?? 0,
    qualificationColor: row.qualificationColor || '',
    form: (row.recentMatches || []).map((item) => ({
      result: item.resultType === 1 ? 'W' : item.resultType === 2 ? 'L' : 'D',
      tooltip: item.tooltip || '',
      matchId: parseIdFromLink(item.link, 'match') || '',
    })),
  }));
}

export function mapScorers(groups) {
  const byId = new Map();
  const readNumber = (stat) => parseInt(String(stat ?? '').replace(/[^\d]/g, ''), 10) || 0;
  const merge = (group, field) => {
    (group?.items || []).forEach((row) => {
      const id = String(row.id ?? 0);
      if (!id || id === '0') return;
      const entry = byId.get(id) ?? {
        playerId: id,
        name: row.name || '',
        portrait: row.portrait || '',
        teamId: String(row.teamId ?? 0),
        teamName: row.teamName || '',
        teamLogo: row.teamLogo || '',
        shirtNumber: row.shirtNumber ?? 0,
        goals: 0,
        assists: 0,
      };
      entry[field] = readNumber(row.stat);
      byId.set(id, entry);
    });
  };
  const list = groups || [];
  merge(list.find((g) => (g.title || '').includes('گلزن')) ?? list.find((g) => g.type === 1), 'goals');
  merge(list.find((g) => (g.title || '').includes('پاس')) ?? list.find((g) => g.type === 2), 'assists');
  return [...byId.values()].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}

export function mapFixtureRounds(rounds) {
  return (rounds || [])
    .map((round) => ({
      round: round.round || 'هفته',
      selected: round.selected === true,
      matches: (round.dates || []).flatMap((day) =>
        (day.matches || [])
          .filter((match) => match.id != null && match.host && match.guest)
          .map((match) => ({
            id: String(match.id),
            home: sideOf(match.host),
            away: sideOf(match.guest),
            homeScore: match.goals?.host ?? null,
            awayScore: match.goals?.guest ?? null,
            time: match.time || '',
            date: day.date || '',
            utcStart: match.startOnUtc || '',
            status: mapStatus(match.isLive === true, match.status, match.statusTitle),
            statusTitle: match.statusTitle || '',
          }))
      ),
    }))
    .filter((round) => round.matches.length > 0);
}

const squadPositionFa = (role) => {
  const compact = String(role || '').replace(/\u200c/g, '').replace(/\s/g, '');
  if (compact.includes('دروازه')) return 'دروازه‌بان';
  if (compact.includes('مدافع') || compact.includes('دفاع')) return 'مدافع';
  if (compact.includes('هافبک') || compact.includes('میانه')) return 'هافبک';
  if (compact.includes('مهاجم') || compact.includes('حمله')) return 'مهاجم';
  return '';
};

// Squad groups carry Persian role titles, lineups and scorers carry English ones.
const POSITION_FA = { GK: 'دروازه‌بان', DF: 'مدافع', MF: 'هافبک', FW: 'مهاجم', OTHER: 'سایر' };

export function positionCode(value) {
  const raw = String(value || '').toUpperCase().replace(/\s/g, '');
  if (raw === 'GK') return 'GK';
  if (raw === 'DF' || raw === 'D') return 'DF';
  if (raw === 'MF' || raw === 'M' || raw === 'DM' || raw === 'CM' || raw === 'AM') return 'MF';
  if (raw === 'FW' || raw === 'F' || raw === 'ST' || raw === 'LW' || raw === 'RW') return 'FW';
  const fa = squadPositionFa(value);
  if (fa === 'دروازه‌بان') return 'GK';
  if (fa === 'مدافع') return 'DF';
  if (fa === 'هافبک') return 'MF';
  if (fa === 'مهاجم') return 'FW';
  return 'OTHER';
}

export const positionFa = (code) => POSITION_FA[code] ?? '';

export function mapSquad(groups) {
  return (groups || []).flatMap((group) => {
    const code = positionCode(group.role);
    return (group.players || [])
      .filter((player) => player.name)
      .map((player) => ({
        id:
          player.id && player.id !== 0
            ? String(player.id)
            : parseIdFromLink(player.link, 'person') ?? parseIdFromLink(player.link, 'player') ?? '',
        name: player.name || '',
        position: code,
        positionFa: positionFa(code),
        number: player.shirtNumber ?? 0,
        age: player.age ?? 0,
        portrait: player.portrait || '',
        countryFlag: player.countryFlag || '',
      }));
  });
}

export function mapTeamResults(items, teamId) {
  return (items || [])
    .map((item) => ({
      id: item.id ? String(item.id) : parseIdFromLink(item.link, 'match') || '',
      date: item.date || '',
      time: item.time || '',
      home: sideOf(item.host),
      away: sideOf(item.guest),
      homeScore: item.goals?.host ?? null,
      awayScore: item.goals?.guest ?? null,
      leagueName: item.league?.title || item.league?.name || '',
      status: mapStatus(item.isLive === true, item.status, item.statusTitle),
    }))
    .filter((item) => item.id)
    .map((item) => {
      const isHome = item.home.id === teamId;
      const isAway = item.away.id === teamId;
      let versus = 'SCHEDULED';
      if (item.status === 'FINISHED' && item.homeScore != null && item.awayScore != null && (isHome || isAway)) {
        const mine = isHome ? item.homeScore : item.awayScore;
        const other = isHome ? item.awayScore : item.homeScore;
        versus = mine > other ? 'WIN' : mine < other ? 'LOSS' : 'DRAW';
      }
      return { ...item, versus };
    });
}

export function leaguePriority(id, name) {
  const n = normalizeFa(name);
  if (String(id) === IRAN_PREMIER_LEAGUE_ID || n.includes('لیگ برتر ایران') || n.includes('خلیج فارس')) return 0;
  if (n.includes('جام حذفی') && n.includes('ایران')) return 1;
  if (String(id) === '24' || n.includes('آزادگان')) return 2;
  if (n.includes('ایران')) return 3;
  if (n.includes('لیگ قهرمانان اروپا') || n.includes('لیگ نخبگان')) return 10;
  return 20;
}

export function tabHref(leagueTabs, type, relContains) {
  const tab = (leagueTabs || []).find((entry) => entry.type === type);
  if (!tab) return null;
  const links = tab._links || tab.links || [];
  if (relContains) {
    const scoped = links.find((l) => (l.rel || '').includes(relContains) || (l.href || '').includes(relContains));
    if (scoped) return scoped.href;
  }
  const get = links.find((l) => l.rel === 'get' || String(l.method || '').toUpperCase() === 'GET');
  return (get ?? links[0])?.href ?? null;
}
