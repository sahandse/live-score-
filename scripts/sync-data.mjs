#!/usr/bin/env node
// Pulls the same public varzesh3 endpoints the natijeh-app Android client uses and
// writes them as static JSON that the GitHub Pages build can serve without CORS.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Varzesh3Client, endpoints } from './lib/varzesh3.mjs';
import {
  IRAN_PREMIER_LEAGUE_ID,
  cleanLeagueTitle,
  leaguePriority,
  mapEvents,
  mapFixtureRounds,
  mapLineups,
  mapScorers,
  mapStandings,
  mapStats,
  mapStatus,
  mapSquad,
  parseMinute,
  positionCode,
  positionFa,
  sideOf,
  tabHref,
} from './lib/mapper.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, process.env.DATA_OUT_DIR || 'public/data');

const OFFSETS = (process.env.DATA_OFFSETS || '-2,-1,0,1,2').split(',').map((v) => parseInt(v, 10));
const MAX_FOCUS_LEAGUES = Number(process.env.DATA_MAX_LEAGUES || 12);
const MAX_FIXTURE_PAGES = Number(process.env.DATA_MAX_FIXTURE_PAGES || 2);
const MAX_DETAILS = Number(process.env.DATA_MAX_DETAILS || 24);
const MAX_SQUADS = Number(process.env.DATA_MAX_SQUADS || 30);

const log = (...args) => console.log(...args);
const warn = (...args) => console.warn(...args);

function normalizeLiveLeague(league, offset) {
  const id = String(league.id ?? '');
  if (!id || league.sport !== 1) return null;
  const name = cleanLeagueTitle(league.title || 'لیگ');
  const logo = league.logo || '';
  const days = (league.dates || []).flatMap((day) =>
    (day.matches || [])
      .filter((match) => match.id != null && match.host && match.guest)
      .map((match) => ({
        id: String(match.id),
        leagueId: id,
        leagueName: name,
        leagueLogo: logo,
        offset,
        persianDate: match.date || day.date || '',
        time: match.time || '',
        utcStart: match.startOnUtc || '',
        status: mapStatus(match.isLive === true, match.status, match.statusTitle),
        statusTitle: match.statusTitle || '',
        liveTime: match.liveTime || '',
        minute: parseMinute(match.liveTime, match.status),
        hasDetails: match.hasDetails === true,
        home: sideOf(match.host),
        away: sideOf(match.guest),
        homeScore: match.goals?.host ?? null,
        awayScore: match.goals?.guest ?? null,
      }))
  );
  return days.length ? { id, name, logo, priority: leaguePriority(id, name), days } : null;
}

function normalizeDetail(raw) {
  if (!raw || raw.id == null) return null;
  const leagueId = tabLeagueIdFromLink(raw.league?.link);
  return {
    id: String(raw.id),
    title: raw.title || '',
    leagueId,
    leagueName: cleanLeagueTitle(raw.league?.title || raw.league?.name || ''),
    leagueLogo: raw.league?.logo || '',
    season: raw.league?.season || '',
    stadium: raw.stadium || '',
    referee: raw.referee || '',
    persianDate: raw.date || '',
    time: raw.time || '',
    utcStart: raw.scheduledStartOnUtc || '',
    status: mapStatus(raw.isLive === true, raw.status, raw.statusTitle),
    statusTitle: raw.statusTitle || '',
    minute: parseMinute(raw.liveTime, raw.status),
    home: sideOf(raw.host),
    away: sideOf(raw.guest),
    homeScore: raw.goals?.host ?? null,
    awayScore: raw.goals?.guest ?? null,
    events: mapEvents(raw.events),
    stats: mapStats(raw.stats),
    lineup: mapLineups(raw.lineup?.host, raw.lineup?.guest),
  };
}

function tabLeagueIdFromLink(link) {
  const found = link ? /\/league\/(\d+)/.exec(String(link).replace(/%[0-9A-F]{2}/gi, '')) : null;
  return found ? found[1] : '';
}

async function fetchLivescore(client, offset) {
  log(`· livescore offset ${offset}`);
  const payload = await client.getJson(endpoints.livescore(offset));
  if (!Array.isArray(payload)) return [];
  return payload.map((league) => normalizeLiveLeague(league, offset)).filter(Boolean);
}

async function fetchLeagueIndex(client) {
  const league = await client.getJson(endpoints.league(IRAN_PREMIER_LEAGUE_ID));
  if (!league) return [];
  return (league.leagues || [])
    .filter((entry) => entry.id != null)
    .map((entry) => ({
      id: String(entry.id),
      name: cleanLeagueTitle(entry.title || ''),
      logo: entry.logo || '',
    }))
    .sort((a, b) => leaguePriority(a.id, a.name) - leaguePriority(b.id, b.name));
}

async function fetchLeagueData(client, league) {
  const index = await client.getJson(endpoints.league(league.id));
  if (!index) return { ...league, hasData: false };
  const standingUrl = tabHref(index.tabs, 1, 'standing');
  const fixturesUrl = tabHref(index.tabs, 2);
  const scorersUrl = tabHref(index.tabs, 3, 'players');
  const name = cleanLeagueTitle(index.name || index.title || league.name);

  const [standingPayload, scorersPayload, fixtures] = await Promise.all([
    standingUrl ? client.getJson(standingUrl) : null,
    scorersUrl ? client.getJson(scorersUrl) : null,
    fixturesUrl ? fetchFixturePages(client, fixturesUrl) : [],
  ]);

  return {
    id: league.id,
    name,
    logo: index.logo || league.logo || '',
    hasData: Boolean(standingPayload || scorersPayload),
    season: standingPayload?.title || '',
    standings: standingUrl ? mapStandings(standingPayload?.teams) : [],
    scorers: scorersPayload ? mapScorers(scorersPayload) : [],
    fixtures,
  };
}

async function fetchFixturePages(client, startUrl) {
  const rounds = [];
  let url = startUrl;
  for (let page = 0; page < MAX_FIXTURE_PAGES && url; page++) {
    const payload = await client.getJson(url);
    if (!payload?.items) break;
    rounds.push(...mapFixtureRounds(payload.items));
    if (payload.hasMore !== true) break;
    url = (payload._links || []).find((link) => link.rel === 'next')?.href || null;
  }
  const seen = new Set();
  return rounds
    .map((round) => ({
      ...round,
      matches: round.matches.filter((match) => {
        if (seen.has(match.id)) return false;
        seen.add(match.id);
        return true;
      }),
    }))
    .filter((round) => round.matches.length > 0);
}

function pickDetailMatches(matches) {
  const priority = (match) =>
    match.status === 'LIVE' ? 0 : match.status === 'HALFTIME' ? 1 : match.offset === 0 ? 2 : 3;
  return matches
    .filter((match) => match.hasDetails || match.status === 'LIVE')
    .sort((a, b) => priority(a) - priority(b) || String(a.utcStart).localeCompare(String(b.utcStart)))
    .slice(0, MAX_DETAILS)
    .map((match) => match.id);
}

function squadTargets(leagueData, matches) {
  const wanted = [];
  const seen = new Set();
  const push = (id, name, logo, leagueId) => {
    if (!id || id === '0' || id === 'unknown' || seen.has(id)) return;
    seen.add(id);
    wanted.push({ id, name, logo, leagueId });
  };

  const iranian = leagueData.find((league) => league.id === IRAN_PREMIER_LEAGUE_ID);
  (iranian?.standings || []).forEach((row) => push(row.teamId, row.teamName, row.teamLogo, iranian.id));
  leagueData
    .filter((league) => league.id !== IRAN_PREMIER_LEAGUE_ID)
    .forEach((league) =>
      (league.standings || []).slice(0, 2).forEach((row) => push(row.teamId, row.teamName, row.teamLogo, league.id))
    );
  matches
    .filter((match) => match.offset === 0 || match.status === 'LIVE')
    .forEach((match) => {
      push(match.home.id, match.home.name, match.home.logo, match.leagueId);
      push(match.away.id, match.away.name, match.away.logo, match.leagueId);
    });
  return wanted.slice(0, MAX_SQUADS);
}

function buildTeams(leagueData) {
  const byId = new Map();
  leagueData.forEach((league) =>
    (league.standings || []).forEach((row) => {
      byId.set(row.teamId, {
        id: row.teamId,
        name: row.teamName,
        logo: row.teamLogo,
        leagueId: league.id,
        leagueName: league.name,
        rank: row.rank,
        points: row.points,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
        qualificationColor: row.qualificationColor,
        form: row.form,
        coach: '',
        formation: '',
        stadium: '',
      });
    })
  );
  return byId;
}

function writeJson(name, payload) {
  const target = resolve(outDir, name);
  return writeFile(target, JSON.stringify(payload)).then(() =>
    log(`  ✓ ${name} (${(JSON.stringify(payload).length / 1024).toFixed(1)} kB)`)
  );
}

async function main() {
  const startedAt = Date.now();
  const client = new Varzesh3Client();
  await mkdir(outDir, { recursive: true });

  log(`syncing varzesh3 → ${outDir}`);
  const leagueGroups = (await Promise.all(OFFSETS.map((offset) => fetchLivescore(client, offset)))).flat();
  const matches = leagueGroups.flatMap((group) => group.days).sort((a, b) => String(a.utcStart).localeCompare(String(b.utcStart)));
  if (matches.length === 0) throw new Error('varzesh3 livescore returned no matches');

  const byId = new Map();
  leagueGroups.forEach((group) => {
    const existing = byId.get(group.id);
    if (existing) existing.days.push(...group.days);
    else byId.set(group.id, { ...group });
  });
  const liveLeagues = [...byId.values()].sort(
    (a, b) => a.priority - b.priority || a.name.localeCompare(b.name, 'fa')
  );

  log(`· league index`);
  const indexLeagues = await fetchLeagueIndex(client);
  const seenLeagues = new Set();
  const leagues = [...indexLeagues, ...liveLeagues.map((l) => ({ id: l.id, name: l.name, logo: l.logo }))]
    .filter((league) => {
      if (!league.id || seenLeagues.has(league.id)) return false;
      seenLeagues.add(league.id);
      return true;
    })
    .sort((a, b) => leaguePriority(a.id, a.name) - leaguePriority(b.id, b.name));

  const focus = leagues.slice(0, MAX_FOCUS_LEAGUES);
  log(`· league details (${focus.length} leagues)`);
  const leagueData = await client.pool(
    focus.map((league) => async () => {
      const data = await fetchLeagueData(client, league);
      log(`  · ${data.name}: ${data.standings.length} team, ${data.scorers.length} scorer, ${data.fixtures.length} round`);
      return data;
    })
  );

  log(`· match details`);
  const detailIds = pickDetailMatches(matches);
  const detailList = (await client.pool(detailIds.map((id) => () => client.getJson(endpoints.match(id)))))
    .map(normalizeDetail)
    .filter(Boolean);
  const details = Object.fromEntries(detailList.map((detail) => [detail.id, detail]));

  const teams = buildTeams(leagueData);
  detailList.forEach((detail) => {
    [
      [detail.home.id, detail.lineup.homeCoach, detail.lineup.homeFormation, true],
      [detail.away.id, detail.lineup.awayCoach, detail.lineup.awayFormation, false],
    ].forEach(([id, coach, formation, isHome]) => {
      const team = teams.get(id);
      if (!team) return;
      team.coach = team.coach || coach || '';
      team.formation = team.formation || (formation && formation !== '-' ? formation : '');
      // A match venue is only the team's own ground when it hosted the game.
      if (isHome) team.stadium = team.stadium || detail.stadium || '';
    });
  });

  log(`· squads`);
  const targets = squadTargets(leagueData, matches);
  const squadPayloads = await client.pool(
    targets.map((target) => async () => {
      const payload = await client.getJson(endpoints.squad(target.id));
      return { target, squad: payload ? mapSquad(payload) : [] };
    })
  );
  const squads = {};
  squadPayloads.forEach(({ target, squad }) => {
    if (!squad.length) return;
    squads[target.id] = { teamId: target.id, teamName: target.name, teamLogo: target.logo, leagueId: target.leagueId, players: squad };
    const team = teams.get(target.id);
    if (team) team.squadCount = squad.length;
  });

  const players = new Map();
  // A player can arrive from the squad list, the scorers list and a lineup; keep the most specific role seen.
  const pickPosition = (incoming, existing) => {
    const next = positionCode(incoming);
    return next === 'OTHER' ? positionCode(existing) : next;
  };
  const touchPlayer = (entry) => {
    if (!entry.id || entry.id === '0') return;
    const existing = players.get(entry.id) ?? {};
    const position = pickPosition(entry.position, existing.position);
    players.set(entry.id, {
      id: entry.id,
      name: entry.name || existing.name || '',
      portrait: entry.portrait || existing.portrait || '',
      position,
      positionFa: positionFa(position),
      number: entry.number || existing.number || 0,
      age: entry.age || existing.age || 0,
      countryFlag: entry.countryFlag || existing.countryFlag || '',
      teamId: entry.teamId || existing.teamId || '',
      teamName: entry.teamName || existing.teamName || '',
      teamLogo: entry.teamLogo || existing.teamLogo || '',
      goals: entry.goals ?? existing.goals ?? 0,
      assists: entry.assists ?? existing.assists ?? 0,
    });
  };
  Object.values(squads).forEach((squad) =>
    squad.players.forEach((player) =>
      touchPlayer({ ...player, teamId: squad.teamId, teamName: squad.teamName, teamLogo: squad.teamLogo })
    )
  );
  leagueData.forEach((league) =>
    (league.scorers || []).forEach((scorer) =>
      touchPlayer({
        id: scorer.playerId,
        name: scorer.name,
        portrait: scorer.portrait,
        number: scorer.shirtNumber,
        teamId: scorer.teamId,
        teamName: scorer.teamName,
        teamLogo: scorer.teamLogo,
        goals: scorer.goals,
        assists: scorer.assists,
      })
    )
  );
  detailList.forEach((detail) =>
    [...(detail.lineup.homeStarting || []), ...(detail.lineup.awayStarting || [])].forEach((player) =>
      touchPlayer({
        id: player.id,
        name: player.name,
        portrait: player.portrait,
        number: player.number,
        position: player.position,
        teamId: detail.home.id,
        teamName: detail.home.name,
        teamLogo: detail.home.logo,
      })
    )
  );

  const generatedAt = new Date().toISOString();
  const standings = {};
  const scorers = {};
  const fixtures = {};
  leagueData.forEach((league) => {
    if (league.standings.length) standings[league.id] = league.standings;
    if (league.scorers.length) scorers[league.id] = league.scorers;
    if (league.fixtures.length) fixtures[league.id] = league.fixtures;
  });

  await Promise.all([
    writeJson('matches.json', { generatedAt, offsets: OFFSETS, leagues: liveLeagues.map(({ days, ...l }) => l), matches }),
    writeJson('details.json', { generatedAt, items: details }),
    writeJson(
      'leagues.json',
      {
        generatedAt,
        leagues: leagues.map((league) => ({
          ...league,
          priority: leaguePriority(league.id, league.name),
          hasData: leagueData.some(
            (data) =>
              data.id === league.id &&
              (data.standings.length > 0 || data.scorers.length > 0 || data.fixtures.length > 0)
          ),
        })),
      }
    ),
    writeJson('standings.json', { generatedAt, standings }),
    writeJson('scorers.json', { generatedAt, scorers }),
    writeJson('fixtures.json', { generatedAt, fixtures }),
    writeJson('teams.json', { generatedAt, teams: [...teams.values()].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'fa')) }),
    writeJson('squads.json', { generatedAt, squads }),
    writeJson('players.json', {
      generatedAt,
      players: [...players.values()].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'fa')),
    }),
    writeJson('meta.json', {
      generatedAt,
      source: 'https://web-api.varzesh3.com/v2.0',
      upstream: 'github.com/sahandse/natijeh-app',
      offsets: OFFSETS,
      counts: {
        matches: matches.length,
        leagues: leagues.length,
        leaguesWithData: leagueData.length,
        details: detailList.length,
        teams: teams.size,
        squads: Object.keys(squads).length,
        players: players.size,
      },
      requests: client.stats,
      durationMs: Date.now() - startedAt,
    }),
  ]);

  const failedRatio = client.stats.requested ? client.stats.failed / client.stats.requested : 1;
  warn(
    `done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s — ${client.stats.succeeded}/${client.stats.requested} requests ok`
  );
  if (failedRatio > 0.5) throw new Error(`more than half of the varzesh3 requests failed (${client.stats.failed})`);
}

main().catch((error) => {
  console.error(`data sync failed: ${error.message}`);
  process.exit(1);
});
