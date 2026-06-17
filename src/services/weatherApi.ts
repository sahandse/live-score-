// Open-Meteo weather service — free, no API key required
// https://api.open-meteo.com

const STAD_COORDS: Record<string, [number, number]> = {
  '1':  [40.8135, -74.0745],   // MetLife, New Jersey
  '2':  [32.7473, -97.0945],   // AT&T, Arlington TX
  '3':  [33.9535, -118.3392],  // SoFi, Inglewood CA
  '4':  [25.9580, -80.2389],   // Hard Rock, Miami FL
  '5':  [37.4033, -121.9694],  // Levi's, Santa Clara CA
  '6':  [42.0909, -71.2643],   // Gillette, Foxborough MA
  '7':  [39.9008, -75.1675],   // Lincoln Financial, Philadelphia PA
  '8':  [35.2258, -80.8528],   // Bank of America, Charlotte NC
  '9':  [29.6847, -95.4107],   // NRG, Houston TX
  '10': [39.0489, -94.4839],   // Arrowhead, Kansas City MO
  '11': [34.1614, -118.1677],  // Rose Bowl, Pasadena CA
  '12': [49.2768, -123.1117],  // BC Place, Vancouver BC
  '13': [43.6332, -79.4189],   // BMO Field, Toronto ON
  '14': [19.3029, -99.1505],   // Estadio Azteca, Mexico City
  '15': [25.6694, -100.2464],  // Estadio BBVA, Monterrey
  '16': [20.6812, -103.4614],  // Estadio Akron, Guadalajara
};

export interface WeatherData {
  temp: number;
  icon: string;
  desc: string;
}

const _cache: Record<string, { data: WeatherData; ts: number }> = {};

function wIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  return '⛈️';
}

function wDesc(code: number): string {
  if (code === 0) return 'آفتابی';
  if (code <= 3) return 'کمی ابری';
  if (code <= 48) return 'مه‌آلود';
  if (code <= 67) return 'بارانی';
  if (code <= 77) return 'برفی';
  return 'طوفانی';
}

export async function fetchStadiumWeather(sid: string): Promise<WeatherData | null> {
  const coords = STAD_COORDS[sid];
  if (!coords) return null;

  const cached = _cache[sid];
  if (cached && Date.now() - cached.ts < 1_800_000) return cached.data;

  const [lat, lon] = coords;
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) return null;
    const d = await r.json();
    const temp = Math.round(d.current?.temperature_2m ?? 0);
    const code = d.current?.weather_code ?? 0;
    const data: WeatherData = { temp, icon: wIcon(code), desc: wDesc(code) };
    _cache[sid] = { data, ts: Date.now() };
    return data;
  } catch { return null; }
}

export async function fetchWeatherForMatches(sids: string[]): Promise<Record<string, WeatherData>> {
  const unique = [...new Set(sids.filter(Boolean))];
  const pairs = await Promise.allSettled(
    unique.map(sid => fetchStadiumWeather(sid).then(w => [sid, w] as const)),
  );
  const out: Record<string, WeatherData> = {};
  for (const r of pairs) {
    if (r.status === 'fulfilled' && r.value[1]) {
      out[r.value[0]] = r.value[1];
    }
  }
  return out;
}
