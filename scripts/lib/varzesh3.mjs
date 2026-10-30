// HTTP client for the public varzesh3 web API — same endpoints as
// natijeh-app/app/src/main/java/com/natijeh/data/remote/Varzesh3Service.kt
// The API sends no CORS headers, so it can only be read from a build step.
import { setTimeout as sleep } from 'node:timers/promises';

export const BASE = 'https://web-api.varzesh3.com/v2.0';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'application/json, text/xml;q=0.9, */*;q=0.8',
  'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
};

function summarize(url) {
  return String(url).replace(BASE, '').split('?')[0];
}

export class Varzesh3Client {
  constructor({ concurrency = 4, retries = 2, timeoutMs = 25_000, logger = console } = {}) {
    this.concurrency = concurrency;
    this.retries = retries;
    this.timeoutMs = timeoutMs;
    this.logger = logger;
    this.stats = { requested: 0, succeeded: 0, failed: 0 };
  }

  async getJson(url) {
    this.stats.requested++;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(url, { headers: HEADERS, signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        this.stats.succeeded++;
        return json;
      } catch (error) {
        if (attempt === this.retries) {
          this.stats.failed++;
          this.logger.warn(`  ! ${summarize(url)} — ${error.message}`);
          return null;
        }
        await sleep(400 * (attempt + 1));
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  }

  // Runs tasks with a fixed worker pool so one slow endpoint cannot stall the sync.
  async pool(tasks) {
    const results = new Array(tasks.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(this.concurrency, tasks.length) }, async () => {
      while (cursor < tasks.length) {
        const index = cursor++;
        results[index] = await tasks[index]();
      }
    });
    await Promise.all(workers);
    return results;
  }
}

export const endpoints = {
  livescore: (offset) => `${BASE}/livescore/${offset === 0 ? 'today' : offset}`,
  match: (id) => `${BASE}/football/matches/${id}`,
  league: (id) => `${BASE}/football/leagues/${id}`,
  team: (id) => `${BASE}/football/teams/${id}`,
  squad: (id) => `${BASE}/football/teams/${id}/squad`,
  teamResults: (id) => `${BASE}/football/teams/${id}/results`,
  teamStanding: (id) => `${BASE}/football/teams/${id}/standing`,
  player: (id) => `${BASE}/football/players/${id}`,
};
