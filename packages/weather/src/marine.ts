import type { SurfSpot } from '@borecast/domain';
import type { ConditionsPatch, ProviderData } from './types';
import { fetchCachedText } from './cache';

interface MarineResponse {
  generationtime_ms?: number;
  hourly?: Record<string, Array<number | string | null>> & { time?: string[] };
}

const variables = [
  'wave_height',
  'wave_direction',
  'wave_period',
  'wave_peak_period',
  'swell_wave_height',
  'swell_wave_direction',
  'swell_wave_period',
  'swell_wave_peak_period',
  'secondary_swell_wave_height',
  'secondary_swell_wave_direction',
  'secondary_swell_wave_period',
  'sea_surface_temperature',
];

function numberAt(
  hourly: MarineResponse['hourly'],
  key: string,
  index: number,
): number | undefined {
  const value = hourly?.[key]?.[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function parseOpenMeteoMarine(body: string): Map<string, ConditionsPatch> {
  const json = JSON.parse(body) as MarineResponse;
  const values = new Map<string, ConditionsPatch>();
  for (const [index, rawTime] of (json.hourly?.time ?? []).entries()) {
    const timestamp = new Date(rawTime.endsWith('Z') ? rawTime : `${rawTime}Z`).toISOString();
    const hourly = json.hourly;
    values.set(timestamp, {
      marine: {
        ...(numberAt(hourly, 'wave_height', index) !== undefined
          ? { waveHeightM: numberAt(hourly, 'wave_height', index)! }
          : {}),
        ...(numberAt(hourly, 'wave_direction', index) !== undefined
          ? { waveDirectionDeg: numberAt(hourly, 'wave_direction', index)! }
          : {}),
        ...(numberAt(hourly, 'wave_period', index) !== undefined
          ? { wavePeriodS: numberAt(hourly, 'wave_period', index)! }
          : {}),
        ...(numberAt(hourly, 'wave_peak_period', index) !== undefined
          ? { wavePeakPeriodS: numberAt(hourly, 'wave_peak_period', index)! }
          : {}),
        ...(numberAt(hourly, 'swell_wave_height', index) !== undefined
          ? { swellHeightM: numberAt(hourly, 'swell_wave_height', index)! }
          : {}),
        ...(numberAt(hourly, 'swell_wave_direction', index) !== undefined
          ? { swellDirectionDeg: numberAt(hourly, 'swell_wave_direction', index)! }
          : {}),
        ...(numberAt(hourly, 'swell_wave_period', index) !== undefined
          ? { swellPeriodS: numberAt(hourly, 'swell_wave_period', index)! }
          : {}),
        ...(numberAt(hourly, 'swell_wave_peak_period', index) !== undefined
          ? { swellPeakPeriodS: numberAt(hourly, 'swell_wave_peak_period', index)! }
          : {}),
        ...(numberAt(hourly, 'secondary_swell_wave_height', index) !== undefined
          ? { secondarySwellHeightM: numberAt(hourly, 'secondary_swell_wave_height', index)! }
          : {}),
        ...(numberAt(hourly, 'secondary_swell_wave_direction', index) !== undefined
          ? {
              secondarySwellDirectionDeg: numberAt(
                hourly,
                'secondary_swell_wave_direction',
                index,
              )!,
            }
          : {}),
        ...(numberAt(hourly, 'secondary_swell_wave_period', index) !== undefined
          ? { secondarySwellPeriodS: numberAt(hourly, 'secondary_swell_wave_period', index)! }
          : {}),
        ...(numberAt(hourly, 'sea_surface_temperature', index) !== undefined
          ? { seaSurfaceTemperatureC: numberAt(hourly, 'sea_surface_temperature', index)! }
          : {}),
      },
    });
  }
  return values;
}

export async function loadMarine(spot: SurfSpot): Promise<ProviderData> {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine');
  url.searchParams.set('latitude', String(spot.coordinates.lat));
  url.searchParams.set('longitude', String(spot.coordinates.lon));
  url.searchParams.set('hourly', variables.join(','));
  url.searchParams.set('timezone', 'GMT');
  // Buffer UTC values so the app can form seven complete spot-local days.
  url.searchParams.set('past_days', '1');
  url.searchParams.set('forecast_days', '8');
  url.searchParams.set('cell_selection', 'sea');
  const result = await fetchCachedText(
    `marine:${spot.id}`,
    url,
    { headers: { Accept: 'application/json' } },
    3_600,
  );
  return {
    values: parseOpenMeteoMarine(result.body),
    source: {
      id: 'open-meteo-marine',
      name: 'Open-Meteo Marine',
      url: 'https://open-meteo.com/en/docs/marine-weather-api',
      attribution: 'Marinedata: Open-Meteo',
      fetchedAt: result.fetchedAt,
      state: result.state,
    },
  };
}
