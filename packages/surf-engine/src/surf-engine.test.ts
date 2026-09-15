import { describe, expect, it } from 'vitest';
import type { SurfConditions } from '@borecast/domain';
import {
  angularDifference,
  calculateScore,
  clamp,
  findBestWindow,
  normalizeDegrees,
  scoreConditions,
  windRelation,
} from './index';

const spot = {
  id: 'test',
  slug: 'test',
  name: 'Test',
  region: 'Test',
  country: 'NO',
  timezone: 'Europe/Oslo',
  coordinates: { lat: 0, lon: 0 },
  orientation: { shoreNormalDeg: 270 },
  scoringProfile: {
    swell: { idealDeg: 270, goodToleranceDeg: 30, maximumToleranceDeg: 90 },
    wind: { calmMs: 2, strongMs: 8, destructiveOnshoreMs: 7 },
    waveHeight: { minimum: 0.2, idealFrom: 0.8, idealTo: 1.8, maximum: 3 },
    period: { minimum: 4, idealFrom: 9, idealTo: 14, maximum: 20 },
    tide: { minimum: -1, idealFrom: 0, idealTo: 1, maximum: 2, calibrated: false },
  },
  skillProfiles: {
    beginner: {
      waveHeight: { minimum: 0.2, idealFrom: 0.3, idealTo: 0.8, maximum: 1.2 },
      maximumPeriodS: 11,
    },
    intermediate: {
      waveHeight: { minimum: 0.3, idealFrom: 0.6, idealTo: 1.5, maximum: 2.3 },
      maximumPeriodS: 15,
    },
    advanced: {
      waveHeight: { minimum: 0.4, idealFrom: 0.8, idealTo: 2.3, maximum: 3.5 },
      maximumPeriodS: 22,
    },
  },
  calibration: { status: 'initial_heuristic' as const, notes: 'test' },
};

function conditions(windDirectionDeg = 90, windSpeedMs = 3): SurfConditions {
  return {
    timestamp: '2026-09-15T08:00:00Z',
    weather: {},
    wind: { speedMs: windSpeedMs, directionDeg: windDirectionDeg, gustMs: windSpeedMs + 2 },
    marine: { waveHeightM: 1.4, swellHeightM: 1.3, swellPeriodS: 12, swellDirectionDeg: 275 },
    tide: { heightM: 0.4, trend: 'rising' },
    daylight: { isDark: false },
    sourceMetadata: [],
  };
}

describe('direction math', () => {
  it('normalizes negative and overflowing degrees', () => {
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(370)).toBe(10);
  });
  it('takes the shortest path over north', () => expect(angularDifference(350, 10)).toBe(20));
  it('classifies relative wind direction', () => {
    expect(windRelation(90, 270)).toBe('offshore');
    expect(windRelation(270, 270)).toBe('onshore');
    expect(windRelation(0, 270)).toBe('cross-shore');
  });
});

describe('score boundaries and interactions', () => {
  it('always clamps to 0–10', () => {
    expect(clamp(-50)).toBe(0);
    expect(clamp(50)).toBe(10);
  });
  it('penalizes destructive onshore wind', () => {
    const clean = calculateScore(conditions(90, 3), spot).total;
    const onshore = calculateScore(conditions(270, 9), spot).total;
    expect(clean).toBeGreaterThan(7);
    expect(onshore).toBeLessThan(clean * 0.6);
  });
});

describe('best window', () => {
  it('turns a long good run into a useful continuous window', () => {
    const hours = Array.from({ length: 10 }, (_, index) => {
      const item = conditions();
      item.timestamp = new Date(Date.parse(item.timestamp) + index * 3_600_000).toISOString();
      item.daylight.isDark = index < 2;
      return scoreConditions(item, spot);
    });
    const window = findBestWindow(hours, 'Europe/Oslo');
    expect(window).toBeDefined();
    expect((Date.parse(window!.end) - Date.parse(window!.start)) / 3_600_000).toBeLessThanOrEqual(
      3,
    );
    expect(window!.isDark).toBe(false);
  });
});
