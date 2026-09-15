import type { SurfSpot } from '@borecast/domain';

// Coordinates verified against Statens vegvesen's official Borestranda listing.
// Direction and thresholds are initial heuristics and must be tuned against observed Bore days.
export const boreSpot: SurfSpot = {
  id: 'bore',
  slug: 'bore',
  name: 'Bore',
  region: 'Jæren',
  country: 'Norge',
  coordinates: { lat: 58.7987905, lon: 5.553825 },
  timezone: 'Europe/Oslo',
  orientation: { shoreNormalDeg: 275 },
  scoringProfile: {
    swell: { idealDeg: 285, goodToleranceDeg: 35, maximumToleranceDeg: 85 },
    wind: { calmMs: 2, strongMs: 8, destructiveOnshoreMs: 7 },
    waveHeight: { minimum: 0.25, idealFrom: 0.85, idealTo: 1.8, maximum: 3.2 },
    period: { minimum: 4, idealFrom: 9, idealTo: 14, maximum: 19 },
    tide: { minimum: -0.5, idealFrom: -0.1, idealTo: 0.75, maximum: 1.25, calibrated: false },
  },
  skillProfiles: {
    beginner: {
      waveHeight: { minimum: 0.2, idealFrom: 0.35, idealTo: 0.8, maximum: 1.15 },
      maximumPeriodS: 11,
    },
    intermediate: {
      waveHeight: { minimum: 0.35, idealFrom: 0.65, idealTo: 1.5, maximum: 2.25 },
      maximumPeriodS: 15,
    },
    advanced: {
      waveHeight: { minimum: 0.45, idealFrom: 0.9, idealTo: 2.25, maximum: 3.5 },
      maximumPeriodS: 22,
    },
  },
  calibration: {
    status: 'initial_heuristic',
    notes: 'Retning, størrelse og tidevann må kalibreres mot lokale observasjoner over tid.',
  },
};

export const spots: SurfSpot[] = [boreSpot];

export function getSpot(slug: string): SurfSpot | undefined {
  return spots.find((spot) => spot.slug === slug);
}
