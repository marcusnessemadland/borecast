import type { SurfSpot } from '@borecast/domain';
import type { ConditionsPatch, ProviderData } from './types';
import { fetchCachedText } from './cache';

interface SunriseResponse {
  properties?: {
    sunrise?: { time?: string } | null;
    sunset?: { time?: string } | null;
  };
}

function dateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function utcOffset(date: Date, timezone: string): string {
  const part =
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find((item) => item.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  return part.replace('GMT', '') || '+00:00';
}

export async function loadDaylight(
  spot: SurfSpot,
  start: Date,
  userAgent: string,
): Promise<ProviderData> {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return date;
  });
  const responses = await Promise.all(
    days.map(async (date) => {
      const day = dateKey(date, spot.timezone);
      const url = new URL('https://api.met.no/weatherapi/sunrise/3.0/sun');
      url.searchParams.set('lat', spot.coordinates.lat.toFixed(4));
      url.searchParams.set('lon', spot.coordinates.lon.toFixed(4));
      url.searchParams.set('date', day);
      url.searchParams.set('offset', utcOffset(date, spot.timezone));
      const result = await fetchCachedText(
        `sun:${spot.id}:${day}`,
        url,
        { headers: { 'User-Agent': userAgent, Accept: 'application/json' } },
        86_400,
      );
      const json = JSON.parse(result.body) as SunriseResponse;
      return {
        day,
        result,
        sunrise: json.properties?.sunrise?.time,
        sunset: json.properties?.sunset?.time,
      };
    }),
  );
  const values = new Map<string, ConditionsPatch>();
  for (const response of responses) {
    for (let hour = 0; hour < 24; hour += 1) {
      const reference = new Date(
        `${response.day}T${String(hour).padStart(2, '0')}:00:00${utcOffset(new Date(`${response.day}T12:00:00Z`), spot.timezone)}`,
      );
      const timestamp = reference.toISOString();
      const isDark =
        response.sunrise && response.sunset
          ? reference < new Date(response.sunrise) || reference >= new Date(response.sunset)
          : false;
      values.set(timestamp, {
        daylight: {
          ...(response.sunrise ? { sunrise: response.sunrise } : {}),
          ...(response.sunset ? { sunset: response.sunset } : {}),
          isDark,
        },
      });
    }
  }
  const states = responses.map((response) => response.result.state);
  const state = states.includes('stale')
    ? 'stale'
    : states.every((item) => item === 'cached')
      ? 'cached'
      : 'fresh';
  return {
    values,
    source: {
      id: 'met-sunrise',
      name: 'MET Norway Sunrise',
      url: 'https://api.met.no/weatherapi/sunrise/3.0/documentation',
      attribution: 'Soloppgang og solnedgang: MET Norway',
      fetchedAt: responses[0]?.result.fetchedAt ?? new Date().toISOString(),
      state,
    },
  };
}

export { dateKey };
