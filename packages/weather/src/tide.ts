import type { TideEvent, TideTrend, SurfSpot } from '@borecast/domain';
import type { ConditionsPatch, ProviderData } from './types';
import { fetchCachedText } from './cache';

export interface TidePoint {
  timestamp: string;
  heightM: number;
}

function normalizeKartverketTime(value: string): string {
  const fixed = value.replace(/([+-]\d{2})$/, '$1:00');
  return new Date(fixed).toISOString();
}

export function parseKartverketTide(body: string): TidePoint[] {
  const predictionBlock =
    body.match(/<data[^>]*type=["']prediction["'][^>]*>([\s\S]*?)<\/data>/i)?.[1] ?? body;
  const points: TidePoint[] = [];
  const expression =
    /<waterlevel\b[^>]*value=["'](-?\d+(?:\.\d+)?)["'][^>]*time=["']([^"']+)["'][^>]*\/?\s*>/gi;
  for (const match of predictionBlock.matchAll(expression)) {
    const centimeters = Number(match[1]);
    const time = match[2];
    if (Number.isFinite(centimeters) && time)
      points.push({ timestamp: normalizeKartverketTime(time), heightM: centimeters / 100 });
  }
  return points.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function eventAfter(
  points: TidePoint[],
  index: number,
  type: 'high' | 'low',
): TideEvent | undefined {
  for (let cursor = index + 1; cursor < points.length - 1; cursor += 1) {
    const previous = points[cursor - 1]!;
    const current = points[cursor]!;
    const next = points[cursor + 1]!;
    if (
      (type === 'high' && current.heightM >= previous.heightM && current.heightM > next.heightM) ||
      (type === 'low' && current.heightM <= previous.heightM && current.heightM < next.heightM)
    ) {
      return { timestamp: current.timestamp, heightM: current.heightM, type };
    }
  }
  return undefined;
}

function trend(points: TidePoint[], index: number): TideTrend {
  const current = points[index];
  const next = points[index + 1];
  if (!current || !next) return 'unknown';
  const difference = next.heightM - current.heightM;
  if (Math.abs(difference) < 0.025) return 'high';
  return difference > 0 ? 'rising' : 'falling';
}

export function tidePatches(points: TidePoint[]): Map<string, ConditionsPatch> {
  const values = new Map<string, ConditionsPatch>();
  points.forEach((point, index) => {
    const nextHigh = eventAfter(points, index, 'high');
    const nextLow = eventAfter(points, index, 'low');
    values.set(point.timestamp, {
      tide: {
        heightM: point.heightM,
        trend: trend(points, index),
        ...(nextHigh ? { nextHigh } : {}),
        ...(nextLow ? { nextLow } : {}),
      },
    });
  });
  return values;
}

function localApiTime(date: Date): string {
  return date.toISOString().slice(0, 16);
}

export async function loadTide(spot: SurfSpot, start: Date): Promise<ProviderData> {
  const from = new Date(start);
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 10);
  const url = new URL('https://vannstand.kartverket.no/tideapi.php');
  const parameters: Record<string, string> = {
    tide_request: 'locationdata',
    lat: String(spot.coordinates.lat),
    lon: String(spot.coordinates.lon),
    fromtime: localApiTime(from),
    totime: localApiTime(to),
    datatype: 'pre',
    interval: '60',
    refcode: 'msl',
    lang: 'nb',
    tzone: '0',
    dst: '0',
  };
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  const result = await fetchCachedText(
    `tide:${spot.id}:${from.toISOString().slice(0, 10)}`,
    url,
    { headers: { Accept: 'application/xml,text/xml' } },
    21_600,
  );
  return {
    values: tidePatches(parseKartverketTide(result.body)),
    source: {
      id: 'kartverket-tide',
      name: 'Kartverket vannstand',
      url: 'https://www.kartverket.no/api-og-data/tidevann-og-vannstandsdata',
      attribution: 'Tidevann: Kartverket (CC BY 4.0), høyde relativt til middelvann',
      fetchedAt: result.fetchedAt,
      state: result.state,
    },
  };
}
