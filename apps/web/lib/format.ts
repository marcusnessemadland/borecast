import type { FactorRating, SuitabilityLevel, TideTrend } from '@borecast/domain';

export function formatTime(timestamp: string, timezone = 'Europe/Oslo'): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

export function formatUpdated(timestamp: string): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(new Date(timestamp));
}

export function scoreBand(score: number): string {
  if (score < 2) return 'terrible';
  if (score < 4) return 'poor';
  if (score < 5.5) return 'marginal';
  if (score < 7) return 'fun';
  if (score < 8.5) return 'good';
  if (score < 9.5) return 'firing';
  return 'exceptional';
}

export const ratingLabels: Record<FactorRating, string> = {
  terrible: 'Elendig',
  poor: 'Svakt',
  marginal: 'Marginalt',
  good: 'Bra',
  excellent: 'Svært bra',
  unknown: 'Ukjent',
};

export const suitabilityLabels: Record<SuitabilityLevel, string> = {
  not_recommended: 'Ikke anbefalt',
  challenging: 'Krevende',
  suitable: 'Bra',
  ideal: 'Perfekt',
  unknown: 'Ukjent',
};

export const tideLabels: Record<TideTrend, string> = {
  rising: 'Stigende',
  falling: 'Fallende',
  high: 'Rundt høyvann',
  low: 'Rundt lavvann',
  unknown: 'Ukjent',
};
