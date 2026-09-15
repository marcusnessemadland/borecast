import type { SourceMetadata, SurfConditions, SurfSpot } from '@borecast/domain';

export function createDemoTimeline(
  spot: SurfSpot,
  now = new Date(),
): { conditions: SurfConditions[]; source: SourceMetadata } {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: spot.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((item) => item.type === type)?.value ?? '';
  const localDate = `${part('year')}-${part('month')}-${part('day')}`;
  const offset =
    new Intl.DateTimeFormat('en-US', {
      timeZone: spot.timezone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(new Date(`${localDate}T12:00:00Z`))
      .find((item) => item.type === 'timeZoneName')
      ?.value.replace('GMT', '') || '+00:00';
  const start = new Date(`${localDate}T00:00:00${offset}`);
  const fetchedAt = new Date().toISOString();
  const source: SourceMetadata = {
    id: 'demo',
    name: 'BoreCast demodata',
    url: '/about',
    attribution: 'Syntetiske demodata — ikke et værvarsel',
    fetchedAt,
    state: 'demo',
    message: 'Demodata er aktivert og må ikke brukes som faktisk surfvarsel.',
  };
  const conditions = Array.from({ length: 168 }, (_, index): SurfConditions => {
    const timestamp = new Date(start.getTime() + index * 3_600_000);
    const localHour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: spot.timezone,
        hour: '2-digit',
        hour12: false,
      }).format(timestamp),
    );
    const day = Math.floor(index / 24);
    const phase = (localHour / 24) * Math.PI * 2;
    const swellHeight = Math.max(0.2, 0.75 + day * 0.08 + Math.sin(phase - 1) * 0.35);
    const tideHeight = Math.sin((index / 12.42) * Math.PI * 2) * 0.45;
    const nextTide = Math.sin(((index + 1) / 12.42) * Math.PI * 2) * 0.45;
    const isDark = localHour < 7 || localHour >= 20;
    return {
      timestamp: timestamp.toISOString(),
      weather: {
        airTemperatureC: 14 + Math.sin(phase - 1.5) * 3,
        cloudCoverPercent: 35 + day * 4,
        precipitationMm: index % 17 === 0 ? 0.6 : 0,
      },
      wind: {
        speedMs: 2.5 + Math.max(0, Math.sin(phase)) * 4 + day * 0.15,
        gustMs: 4.2 + Math.max(0, Math.sin(phase)) * 5,
        directionDeg: localHour < 12 ? 100 + day * 5 : 245 + day * 4,
      },
      marine: {
        waveHeightM: swellHeight + 0.25,
        waveDirectionDeg: 285 + day * 3,
        wavePeriodS: 9 + day * 0.55,
        wavePeakPeriodS: 11 + day * 0.55,
        swellHeightM: swellHeight,
        swellDirectionDeg: 284 + day * 2,
        swellPeriodS: 10 + day * 0.5,
        secondarySwellHeightM: 0.18 + (day % 3) * 0.08,
        secondarySwellDirectionDeg: 320,
        secondarySwellPeriodS: 7,
        seaSurfaceTemperatureC: 14.2,
      },
      tide: { heightM: tideHeight, trend: nextTide > tideHeight ? 'rising' : 'falling' },
      daylight: {
        sunrise: new Date(`${timestamp.toISOString().slice(0, 10)}T05:00:00Z`).toISOString(),
        sunset: new Date(`${timestamp.toISOString().slice(0, 10)}T18:00:00Z`).toISOString(),
        isDark,
      },
      sourceMetadata: [source],
    };
  });
  for (const [index, item] of conditions.entries()) {
    for (let cursor = index + 1; cursor < conditions.length - 1; cursor += 1) {
      const previous = conditions[cursor - 1]!.tide.heightM!;
      const current = conditions[cursor]!.tide.heightM!;
      const next = conditions[cursor + 1]!.tide.heightM!;
      if (!item.tide.nextHigh && current >= previous && current > next) {
        item.tide.nextHigh = {
          timestamp: conditions[cursor]!.timestamp,
          heightM: current,
          type: 'high',
        };
      }
      if (!item.tide.nextLow && current <= previous && current < next) {
        item.tide.nextLow = {
          timestamp: conditions[cursor]!.timestamp,
          heightM: current,
          type: 'low',
        };
      }
      if (item.tide.nextHigh && item.tide.nextLow) break;
    }
  }
  return { conditions, source };
}
