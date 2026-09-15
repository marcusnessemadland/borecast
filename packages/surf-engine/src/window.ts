import type { BestWindow, ScoredConditions } from '@borecast/domain';

function localTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('nb-NO', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function findBestWindow(
  hours: ScoredConditions[],
  timezone: string,
): BestWindow | undefined {
  if (hours.length === 0) return undefined;
  const continuousRuns: ScoredConditions[][] = [];
  let active: ScoredConditions[] = [];
  for (const hour of hours) {
    const eligible =
      hour.interpretation.scoreBreakdown.total >= 5.5 &&
      hour.interpretation.scoreBreakdown.confidence >= 0.5;
    if (eligible) active.push(hour);
    else if (active.length) {
      continuousRuns.push(active);
      active = [];
    }
  }
  if (active.length) continuousRuns.push(active);
  const windows = continuousRuns.flatMap((run) => {
    const samples: ScoredConditions[][] = [];
    for (let duration = 2; duration <= Math.min(4, run.length); duration += 1) {
      for (let start = 0; start <= run.length - duration; start += 1) {
        samples.push(run.slice(start, start + duration));
      }
    }
    return samples;
  });
  const selected = windows.sort((a, b) => {
    const rank = (window: ScoredConditions[]) => {
      const avg =
        window.reduce((sum, hour) => sum + hour.interpretation.scoreBreakdown.total, 0) /
        window.length;
      const daylightRatio = window.filter((hour) => !hour.daylight.isDark).length / window.length;
      const confidence =
        window.reduce((sum, hour) => sum + hour.interpretation.scoreBreakdown.confidence, 0) /
        window.length;
      return avg + window.length * 0.08 + daylightRatio * 0.4 + confidence * 0.15;
    };
    return rank(b) - rank(a);
  })[0];
  if (!selected) return undefined;
  const end = selected[selected.length - 1];
  const scores = selected.map((hour) => hour.interpretation.scoreBreakdown.total);
  const isDark = selected.every((hour) => hour.daylight.isDark);
  const startLabel = localTime(selected[0]!.timestamp, timezone);
  const endLabel = localTime(end!.timestamp, timezone);
  return {
    start: selected[0]!.timestamp,
    end: end!.timestamp,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    peakScore: Math.max(...scores),
    isDark,
    label: `${isDark ? 'Nattvindu' : 'Best'} ${startLabel}–${endLabel}`,
  };
}
