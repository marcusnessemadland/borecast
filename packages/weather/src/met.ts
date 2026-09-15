import type { SurfSpot } from '@borecast/domain';
import type { ConditionsPatch, ProviderData } from './types';
import { fetchCachedText } from './cache';

interface MetDetails {
  air_temperature?: number;
  precipitation_amount?: number;
  cloud_area_fraction?: number;
  air_pressure_at_sea_level?: number;
  wind_speed?: number;
  wind_speed_of_gust?: number;
  wind_from_direction?: number;
}

interface MetResponse {
  properties?: {
    meta?: { updated_at?: string };
    timeseries?: Array<{
      time: string;
      data?: {
        instant?: { details?: MetDetails };
        next_1_hours?: { details?: { precipitation_amount?: number } };
      };
    }>;
  };
}

export function parseMetLocationforecast(body: string): {
  values: Map<string, ConditionsPatch>;
  generatedAt?: string;
} {
  const json = JSON.parse(body) as MetResponse;
  const values = new Map<string, ConditionsPatch>();
  for (const item of json.properties?.timeseries ?? []) {
    const details = item.data?.instant?.details ?? {};
    values.set(new Date(item.time).toISOString(), {
      weather: {
        ...(details.air_temperature !== undefined
          ? { airTemperatureC: details.air_temperature }
          : {}),
        ...(item.data?.next_1_hours?.details?.precipitation_amount !== undefined
          ? { precipitationMm: item.data.next_1_hours.details.precipitation_amount }
          : {}),
        ...(details.cloud_area_fraction !== undefined
          ? { cloudCoverPercent: details.cloud_area_fraction }
          : {}),
        ...(details.air_pressure_at_sea_level !== undefined
          ? { pressureHpa: details.air_pressure_at_sea_level }
          : {}),
      },
      wind: {
        ...(details.wind_speed !== undefined ? { speedMs: details.wind_speed } : {}),
        ...(details.wind_speed_of_gust !== undefined ? { gustMs: details.wind_speed_of_gust } : {}),
        ...(details.wind_from_direction !== undefined
          ? { directionDeg: details.wind_from_direction }
          : {}),
      },
    });
  }
  return {
    values,
    ...(json.properties?.meta?.updated_at ? { generatedAt: json.properties.meta.updated_at } : {}),
  };
}

export async function loadMetWeather(spot: SurfSpot, userAgent: string): Promise<ProviderData> {
  const url = new URL('https://api.met.no/weatherapi/locationforecast/2.0/compact');
  url.searchParams.set('lat', spot.coordinates.lat.toFixed(4));
  url.searchParams.set('lon', spot.coordinates.lon.toFixed(4));
  const result = await fetchCachedText(
    `met:${spot.id}`,
    url,
    { headers: { 'User-Agent': userAgent, Accept: 'application/json' } },
    1_800,
  );
  const parsed = parseMetLocationforecast(result.body);
  return {
    values: parsed.values,
    source: {
      id: 'met-locationforecast',
      name: 'MET Norway Locationforecast',
      url: 'https://api.met.no/',
      attribution: 'Værdata: MET Norway',
      fetchedAt: result.fetchedAt,
      state: result.state,
      ...(parsed.generatedAt ? { generatedAt: parsed.generatedAt } : {}),
    },
  };
}
