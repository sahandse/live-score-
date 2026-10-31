export interface Match {
  id: string;
  homeTeam: string;
  homeTeamPersian: string;
  homeTeamFlag: string;
  homeCrest?: string;
  homeTeamId?: string;
  awayTeam: string;
  awayTeamPersian: string;
  awayTeamFlag: string;
  awayCrest?: string;
  awayTeamId?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'live' | 'finished' | 'upcoming' | 'halftime' | 'postponed' | 'cancelled';
  minute?: number;
  statusText?: string;
  leagueId: string;
  leagueName: string;
  leagueFlag: string;
  leagueLogo?: string;
  date: string;
  time: string;
  dayOffset?: number;
  venue?: string;
}
