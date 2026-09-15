import type { ScoredConditions } from '@borecast/domain';
import { formatTime } from '@/lib/format';

export function TideChart({ hours }: { hours: ScoredConditions[] }) {
  const points = hours.filter((hour) => hour.tide.heightM !== undefined);
  if (points.length < 2) return <p className="muted">Ikke nok tidevannsdata til å tegne kurven.</p>;
  const values = points.map((point) => point.tide.heightM!);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(0.1, maximum - minimum);
  const coordinates = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 34 - ((value - minimum) / range) * 27;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <figure className="tide-chart">
      <svg
        viewBox="0 0 100 40"
        role="img"
        aria-label={`Tidevann fra ${minimum.toFixed(2)} til ${maximum.toFixed(2)} meter relativt til middelvann`}
        preserveAspectRatio="none"
      >
        <line x1="0" x2="100" y1="34" y2="34" className="chart-grid" />
        <line x1="0" x2="100" y1="7" y2="7" className="chart-grid" />
        <polyline points={coordinates} className="chart-line" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption>
        <span>{formatTime(points[0]!.timestamp)}</span>
        <span>
          {minimum.toFixed(2)}–{maximum.toFixed(2)} m MSL
        </span>
        <span>{formatTime(points[points.length - 1]!.timestamp)}</span>
      </figcaption>
    </figure>
  );
}
