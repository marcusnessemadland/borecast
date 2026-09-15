import type { ScoredConditions, SurfSpot } from '@borecast/domain';
import { compassDirection } from '@borecast/surf-engine';

export function DirectionDiagram({
  conditions,
  spot,
}: {
  conditions: ScoredConditions;
  spot: SurfSpot;
}) {
  const swell = conditions.marine.swellDirectionDeg ?? conditions.marine.waveDirectionDeg;
  const wind = conditions.wind.directionDeg;
  return (
    <div className="direction-diagram" aria-label="Retningsdiagram for kyst, swell og vind">
      <svg viewBox="0 0 320 190" role="img">
        <path className="diagram-sea" d="M0 0h190c-23 32-7 62-30 95s-3 64-25 95H0Z" />
        <path className="diagram-shore" d="M190 0c-23 32-7 62-30 95s-3 64-25 95" />
        <text x="18" y="26">
          NORDSJØEN
        </text>
        <text x="225" y="26">
          BORE
        </text>
        {swell !== undefined ? (
          <g transform={`translate(80 112) rotate(${swell + 180})`}>
            <path className="swell-arrow" d="M0 0h70m-12-10 12 10-12 10" />
          </g>
        ) : null}
        {wind !== undefined ? (
          <g transform={`translate(232 98) rotate(${wind + 180})`}>
            <path className="wind-arrow" d="M0 0h48m-10-8 10 8-10 8" />
          </g>
        ) : null}
      </svg>
      <div className="diagram-legend">
        <span>
          <i className="legend-swell" />
          Swell{' '}
          {swell !== undefined ? `${compassDirection(swell)} ${Math.round(swell)}°` : 'ukjent'}
        </span>
        <span>
          <i className="legend-wind" />
          Vind {wind !== undefined ? `${compassDirection(wind)} ${Math.round(wind)}°` : 'ukjent'}
        </span>
      </div>
      <p>
        Retninger viser hvor vind og swell kommer fra. Strandnormal:{' '}
        {spot.orientation.shoreNormalDeg}°.
      </p>
    </div>
  );
}
