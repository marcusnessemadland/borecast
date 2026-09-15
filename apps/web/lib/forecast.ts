import type { DataState, ForecastDay, ForecastResponse, ScoredConditions } from '@borecast/domain';
import { boreSpot } from '@borecast/spots';
import { findBestWindow, scoreConditions } from '@borecast/surf-engine';
import { dateKey, loadNormalizedTimeline } from '@borecast/weather';

function dayLabel(date: string, index: number): string {
  if (index === 0) return 'I dag';
  if (index === 1) return 'I morgen';
  return new Intl.DateTimeFormat('nb-NO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: boreSpot.timezone,
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace('.', '');
}

function overallState(states: DataState[]): DataState {
  if (states.includes('demo')) return 'demo';
  if (states.every((state) => state === 'unavailable')) return 'unavailable';
  if (states.includes('stale')) return 'stale';
  if (states.includes('fresh')) return 'fresh';
  return 'cached';
}

function groupDays(hours: ScoredConditions[]): ForecastDay[] {
  const groups = new Map<string, ScoredConditions[]>();
  for (const hour of hours) {
    const key = dateKey(new Date(hour.timestamp), boreSpot.timezone);
    const values = groups.get(key) ?? [];
    values.push(hour);
    groups.set(key, values);
  }
  const today = dateKey(new Date(), boreSpot.timezone);
  return [...groups.entries()]
    .filter(([date]) => date >= today)
    .slice(0, 7)
    .map(([date, values], index) => {
      const peak = values.reduce(
        (best, value) =>
          value.interpretation.scoreBreakdown.total > best.interpretation.scoreBreakdown.total
            ? value
            : best,
        values[0]!,
      );
      const bestWindow = findBestWindow(values, boreSpot.timezone);
      return {
        date,
        label: dayLabel(date, index),
        peakScore: peak.interpretation.scoreBreakdown.total,
        headline: peak.interpretation.headline,
        ...(bestWindow ? { bestWindow } : {}),
        hours: values,
      };
    });
}

export async function getForecast(): Promise<ForecastResponse> {
  const demo = process.env.BORECAST_DEMO_MODE === 'true';
  const generatedAt = new Date().toISOString();
  const timeline = await loadNormalizedTimeline(boreSpot, { demo, now: new Date() });
  const scored = timeline.conditions.map((hour) => scoreConditions(hour, boreSpot));
  const days = groupDays(scored);
  const now = Date.now();
  const current = scored.length
    ? scored.reduce(
        (nearest, hour) =>
          Math.abs(Date.parse(hour.timestamp) - now) < Math.abs(Date.parse(nearest.timestamp) - now)
            ? hour
            : nearest,
        scored[0]!,
      )
    : null;
  const goodDay = days.slice(1).find((day) => day.peakScore >= 7);
  return {
    spot: boreSpot,
    generatedAt,
    state: overallState(timeline.sources.map((source) => source.state)),
    current,
    days,
    sources: timeline.sources,
    ...(goodDay
      ? { nextGoodDay: { date: goodDay.date, label: goodDay.label, peakScore: goodDay.peakScore } }
      : {}),
    ...(timeline.notice ? { notice: timeline.notice } : {}),
  };
}
