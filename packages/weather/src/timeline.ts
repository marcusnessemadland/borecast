import type { SourceMetadata, SurfConditions, SurfSpot } from '@borecast/domain';
import { createDemoTimeline } from './demo';
import { loadMarine } from './marine';
import { loadMetWeather } from './met';
import { loadDaylight } from './sunrise';
import { loadTide } from './tide';
import type { ConditionsPatch, ProviderData, TimelineResult } from './types';

function unavailable(
  id: SourceMetadata['id'],
  name: string,
  url: string,
  attribution: string,
  message: string,
): ProviderData {
  return {
    values: new Map(),
    source: {
      id,
      name,
      url,
      attribution,
      fetchedAt: new Date().toISOString(),
      state: 'unavailable',
      message,
    },
  };
}

function roundHour(timestamp: string): string {
  const date = new Date(timestamp);
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

function mergePatch(target: SurfConditions, patch: ConditionsPatch): SurfConditions {
  return {
    ...target,
    weather: { ...target.weather, ...patch.weather },
    wind: { ...target.wind, ...patch.wind },
    marine: { ...target.marine, ...patch.marine },
    tide: { ...target.tide, ...patch.tide },
    daylight: { ...target.daylight, ...patch.daylight },
  };
}

export async function loadNormalizedTimeline(
  spot: SurfSpot,
  options?: { demo?: boolean; now?: Date },
): Promise<TimelineResult> {
  const now = options?.now ?? new Date();
  if (options?.demo) {
    const demo = createDemoTimeline(spot, now);
    return {
      conditions: demo.conditions,
      sources: [demo.source],
      notice: 'Demodata er aktivert. Dette er ikke et faktisk varsel.',
    };
  }
  const userAgent = process.env.MET_USER_AGENT;
  const tasks: Array<Promise<ProviderData>> = [
    loadMarine(spot),
    loadTide(spot, now),
    userAgent
      ? loadMetWeather(spot, userAgent)
      : Promise.resolve(
          unavailable(
            'met-locationforecast',
            'MET Norway Locationforecast',
            'https://api.met.no/',
            'Værdata: MET Norway',
            'MET_USER_AGENT mangler.',
          ),
        ),
    userAgent
      ? loadDaylight(spot, now, userAgent)
      : Promise.resolve(
          unavailable(
            'met-sunrise',
            'MET Norway Sunrise',
            'https://api.met.no/weatherapi/sunrise/3.0/documentation',
            'Soldata: MET Norway',
            'MET_USER_AGENT mangler.',
          ),
        ),
  ];
  const settled = await Promise.allSettled(tasks);
  const results = settled.map((result, index): ProviderData => {
    if (result.status === 'fulfilled') return result.value;
    const definitions = [
      [
        'open-meteo-marine',
        'Open-Meteo Marine',
        'https://open-meteo.com/en/docs/marine-weather-api',
        'Marinedata: Open-Meteo',
      ],
      [
        'kartverket-tide',
        'Kartverket vannstand',
        'https://www.kartverket.no/api-og-data/tidevann-og-vannstandsdata',
        'Tidevann: Kartverket (CC BY 4.0)',
      ],
      [
        'met-locationforecast',
        'MET Norway Locationforecast',
        'https://api.met.no/',
        'Værdata: MET Norway',
      ],
      [
        'met-sunrise',
        'MET Norway Sunrise',
        'https://api.met.no/weatherapi/sunrise/3.0/documentation',
        'Soldata: MET Norway',
      ],
    ] as const;
    const definition = definitions[index]!;
    return unavailable(
      definition[0],
      definition[1],
      definition[2],
      definition[3],
      'Kilden svarte ikke. BoreCast viser resten av varselet.',
    );
  });
  const sourceByTimestamp = new Map<string, SourceMetadata[]>();
  const timeline = new Map<string, SurfConditions>();
  for (const result of results) {
    for (const [timestamp, patch] of result.values) {
      const key = roundHour(timestamp);
      const current = timeline.get(key) ?? {
        timestamp: key,
        weather: {},
        wind: {},
        marine: {},
        tide: {},
        daylight: { isDark: false },
        sourceMetadata: [],
      };
      timeline.set(key, mergePatch(current, patch));
      const sources = sourceByTimestamp.get(key) ?? [];
      if (!sources.some((source) => source.id === result.source.id)) sources.push(result.source);
      sourceByTimestamp.set(key, sources);
    }
  }
  const conditions = [...timeline.values()]
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    .map((item) => ({ ...item, sourceMetadata: sourceByTimestamp.get(item.timestamp) ?? [] }));
  const sources = results.map((result) => result.source);
  const unavailableCount = sources.filter((source) => source.state === 'unavailable').length;
  return {
    conditions,
    sources,
    ...(unavailableCount
      ? {
          notice: `${unavailableCount} av ${sources.length} datakilder er utilgjengelige. Resten av varselet vises med lavere sikkerhet.`,
        }
      : {}),
  };
}
