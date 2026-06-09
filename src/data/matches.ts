export interface Match {
  id: string;
  homeTeam: string;
  homeTeamPersian: string;
  homeTeamFlag: string;
  awayTeam: string;
  awayTeamPersian: string;
  awayTeamFlag: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'finished' | 'upcoming' | 'halftime';
  minute?: number;
  leagueId: string;
  leagueName: string;
  leagueFlag: string;
  date: string;
  time: string;
  venue?: string;
  events?: MatchEvent[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellowcard' | 'redcard' | 'substitution';
  team: 'home' | 'away';
  player: string;
  playerPersian: string;
}

export const liveMatches: Match[] = [
  {
    id: 'm1', homeTeam: 'Manchester City', homeTeamPersian: 'منچسترسیتی', homeTeamFlag: '🔵',
    awayTeam: 'Arsenal', awayTeamPersian: 'آرسنال', awayTeamFlag: '🔴',
    homeScore: 2, awayScore: 1, status: 'live', minute: 67,
    leagueId: 'epl', leagueName: 'لیگ برتر انگلیس', leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    date: '1404/03/19', time: '23:30', venue: 'Etihad Stadium',
    events: [
      { minute: 23, type: 'goal', team: 'home', player: 'Haaland', playerPersian: 'هالاند' },
      { minute: 45, type: 'goal', team: 'away', player: 'Saka', playerPersian: 'ساکا' },
      { minute: 58, type: 'goal', team: 'home', player: 'De Bruyne', playerPersian: 'دبروینه' },
      { minute: 62, type: 'yellowcard', team: 'away', player: 'Odegaard', playerPersian: 'اودگارد' },
    ]
  },
  {
    id: 'm2', homeTeam: 'Real Madrid', homeTeamPersian: 'رئال مادرید', homeTeamFlag: '⚪',
    awayTeam: 'Barcelona', awayTeamPersian: 'بارسلونا', awayTeamFlag: '🔵🔴',
    homeScore: 1, awayScore: 3, status: 'live', minute: 82,
    leagueId: 'laliga', leagueName: 'لالیگا', leagueFlag: '🇪🇸',
    date: '1404/03/19', time: '22:00', venue: 'Santiago Bernabéu',
    events: [
      { minute: 15, type: 'goal', team: 'away', player: 'Yamal', playerPersian: 'یامال' },
      { minute: 34, type: 'goal', team: 'home', player: 'Mbappé', playerPersian: 'امباپه' },
      { minute: 56, type: 'goal', team: 'away', player: 'Lewandowski', playerPersian: 'لواندوفسکی' },
      { minute: 71, type: 'goal', team: 'away', player: 'Pedri', playerPersian: 'پدری' },
      { minute: 79, type: 'redcard', team: 'home', player: 'Militao', playerPersian: 'میلیتائو' },
    ]
  },
  {
    id: 'm3', homeTeam: 'Bayern Munich', homeTeamPersian: 'بایرن مونیخ', homeTeamFlag: '🔴',
    awayTeam: 'Dortmund', awayTeamPersian: 'دورتموند', awayTeamFlag: '🟡',
    homeScore: 0, awayScore: 0, status: 'halftime', minute: 45,
    leagueId: 'bundesliga', leagueName: 'بوندسلیگا', leagueFlag: '🇩🇪',
    date: '1404/03/19', time: '21:30', venue: 'Allianz Arena',
    events: []
  },
  {
    id: 'm4', homeTeam: 'Persepolis', homeTeamPersian: 'پرسپولیس', homeTeamFlag: '🔴',
    awayTeam: 'Esteghlal', awayTeamPersian: 'استقلال', awayTeamFlag: '🔵',
    homeScore: 1, awayScore: 0, status: 'live', minute: 55,
    leagueId: 'pgpl', leagueName: 'لیگ برتر ایران', leagueFlag: '🇮🇷',
    date: '1404/03/19', time: '18:00', venue: 'Azadi Stadium',
    events: [
      { minute: 38, type: 'goal', team: 'home', player: 'Diabaté', playerPersian: 'دیاباته' },
      { minute: 50, type: 'yellowcard', team: 'away', player: 'Ghayedi', playerPersian: 'قائدی' },
    ]
  },
  {
    id: 'm5', homeTeam: 'PSG', homeTeamPersian: 'پاری سن ژرمن', homeTeamFlag: '🔵',
    awayTeam: 'Lyon', awayTeamPersian: 'لیون', awayTeamFlag: '⚪',
    homeScore: 3, awayScore: 1, status: 'finished', minute: 90,
    leagueId: 'ligue1', leagueName: 'لیگ ۱ فرانسه', leagueFlag: '🇫🇷',
    date: '1404/03/19', time: '19:00', venue: 'Parc des Princes',
    events: [
      { minute: 12, type: 'goal', team: 'home', player: 'Dembélé', playerPersian: 'دمبله' },
      { minute: 28, type: 'goal', team: 'away', player: 'Lacazette', playerPersian: 'لاکازت' },
      { minute: 55, type: 'goal', team: 'home', player: 'Dembélé', playerPersian: 'دمبله' },
      { minute: 88, type: 'goal', team: 'home', player: 'Hakimi', playerPersian: 'حکیمی' },
    ]
  },
  {
    id: 'm6', homeTeam: 'Liverpool', homeTeamPersian: 'لیورپول', homeTeamFlag: '🔴',
    awayTeam: 'Chelsea', awayTeamPersian: 'چلسی', awayTeamFlag: '🔵',
    homeScore: 0, awayScore: 0, status: 'upcoming', minute: undefined,
    leagueId: 'epl', leagueName: 'لیگ برتر انگلیس', leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    date: '1404/03/20', time: '21:00', venue: 'Anfield',
    events: []
  },
  {
    id: 'm7', homeTeam: 'Iran', homeTeamPersian: 'ایران', homeTeamFlag: '🇮🇷',
    awayTeam: 'Japan', awayTeamPersian: 'ژاپن', awayTeamFlag: '🇯🇵',
    homeScore: 0, awayScore: 0, status: 'upcoming', minute: undefined,
    leagueId: 'afc', leagueName: 'مقدماتی جام جهانی', leagueFlag: '🌏',
    date: '1404/03/22', time: '18:30', venue: 'Azadi Stadium',
    events: []
  },
  {
    id: 'm8', homeTeam: 'Inter Milan', homeTeamPersian: 'اینترمیلان', homeTeamFlag: '⚫🔵',
    awayTeam: 'Juventus', awayTeamPersian: 'یوونتوس', awayTeamFlag: '⚫⚪',
    homeScore: 2, awayScore: 2, status: 'finished', minute: 90,
    leagueId: 'seriea', leagueName: 'سری آ', leagueFlag: '🇮🇹',
    date: '1404/03/18', time: '22:45', venue: 'San Siro',
    events: [
      { minute: 20, type: 'goal', team: 'home', player: 'Lautaro', playerPersian: 'لائوتارو' },
      { minute: 37, type: 'goal', team: 'away', player: 'Vlahovic', playerPersian: 'ولاهویچ' },
      { minute: 60, type: 'goal', team: 'away', player: 'Chiesa', playerPersian: 'کیزا' },
      { minute: 85, type: 'goal', team: 'home', player: 'Thuram', playerPersian: 'توروم' },
    ]
  },
];

export const standings = [
  { position: 1, team: 'منچسترسیتی', flag: '🔵', played: 34, won: 26, drawn: 5, lost: 3, gf: 89, ga: 33, points: 83 },
  { position: 2, team: 'آرسنال', flag: '🔴', played: 34, won: 24, drawn: 6, lost: 4, gf: 81, ga: 38, points: 78 },
  { position: 3, team: 'لیورپول', flag: '🔴', played: 34, won: 22, drawn: 8, lost: 4, gf: 78, ga: 41, points: 74 },
  { position: 4, team: 'چلسی', flag: '🔵', played: 34, won: 18, drawn: 7, lost: 9, gf: 67, ga: 52, points: 61 },
  { position: 5, team: 'منچستریونایتد', flag: '🔴', played: 34, won: 15, drawn: 6, lost: 13, gf: 55, ga: 57, points: 51 },
  { position: 6, team: 'توتنهام', flag: '⚪', played: 34, won: 13, drawn: 8, lost: 13, gf: 62, ga: 61, points: 47 },
  { position: 7, team: 'نیوکاسل', flag: '⚫⚪', played: 34, won: 14, drawn: 5, lost: 15, gf: 58, ga: 62, points: 47 },
  { position: 8, team: 'برایتون', flag: '🔵⚪', played: 34, won: 12, drawn: 9, lost: 13, gf: 51, ga: 59, points: 45 },
];
