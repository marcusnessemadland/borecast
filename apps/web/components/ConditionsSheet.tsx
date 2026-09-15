'use client';

import { useEffect, useRef } from 'react';
import type { ScoredConditions, SurfSpot } from '@borecast/domain';
import { formatTime, ratingLabels, suitabilityLabels, tideLabels } from '@/lib/format';
import { CloseIcon } from './icons';
import { TideChart } from './TideChart';
import { DirectionDiagram } from './DirectionDiagram';

export function ConditionsSheet({
  conditions,
  dayHours,
  spot,
  onClose,
}: {
  conditions: ScoredConditions;
  dayHours: ScoredConditions[];
  spot: SurfSpot;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', listener);
    document.body.classList.add('sheet-open');
    return () => {
      window.removeEventListener('keydown', listener);
      document.body.classList.remove('sheet-open');
      previous?.focus();
    };
  }, [onClose]);
  const score = conditions.interpretation.scoreBreakdown;
  const factors = [
    ['Swellretning', score.swellDirection],
    ['Periode', score.period],
    ['Størrelse', score.waveSize],
    ['Vind', score.wind],
    ['Tidevann', score.tide],
    ['Swellkvalitet', score.swellQuality],
  ] as const;
  return (
    <div
      className="sheet-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="conditions-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conditions-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <div>
            <span className="eyebrow">{formatTime(conditions.timestamp)} · MODELLVARSEL</span>
            <h2 id="conditions-title">Hvorfor {score.total.toFixed(1)}?</h2>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            onClick={onClose}
            aria-label="Lukk detaljer"
          >
            <CloseIcon />
          </button>
        </header>
        <p className="sheet-summary">{conditions.interpretation.summary}</p>
        <div className="factor-list">
          {factors.map(([label, item]) => (
            <div className="factor-row" key={label}>
              <div>
                <strong>{label}</strong>
                <small>{item.reason}</small>
              </div>
              <span className={`rating rating-${item.rating}`}>{ratingLabels[item.rating]}</span>
            </div>
          ))}
        </div>
        <p className="confidence">
          Datagrunnlag: {Math.round(score.confidence * 100)} % komplett. Scoren er en heuristisk
          vurdering, ikke en observasjon.
        </p>
        <div className="detail-grid">
          <section>
            <h3>Nivå</h3>
            {Object.entries(conditions.interpretation.skillSuitability).map(([level, item]) => (
              <div className="compact-row" key={level}>
                <span>
                  {level === 'beginner'
                    ? 'Nybegynner'
                    : level === 'intermediate'
                      ? 'Viderekommen'
                      : 'Erfaren'}
                </span>
                <strong>{suitabilityLabels[item.level]}</strong>
                <small>{item.reason}</small>
              </div>
            ))}
          </section>
          <section>
            <h3>Rådata</h3>
            <dl className="raw-list">
              <div>
                <dt>Total bølge</dt>
                <dd>{conditions.marine.waveHeightM?.toFixed(1) ?? '–'} m</dd>
              </div>
              <div>
                <dt>Primærswell</dt>
                <dd>{conditions.interpretation.swellDescription}</dd>
              </div>
              <div>
                <dt>Vindkast</dt>
                <dd>{conditions.wind.gustMs?.toFixed(1) ?? '–'} m/s</dd>
              </div>
              <div>
                <dt>Tidevann</dt>
                <dd>
                  {conditions.tide.heightM?.toFixed(2) ?? '–'} m ·{' '}
                  {tideLabels[conditions.tide.trend ?? 'unknown']}
                </dd>
              </div>
              <div>
                <dt>Neste flo</dt>
                <dd>
                  {conditions.tide.nextHigh
                    ? `${formatTime(conditions.tide.nextHigh.timestamp)} · ${conditions.tide.nextHigh.heightM.toFixed(2)} m`
                    : '–'}
                </dd>
              </div>
              <div>
                <dt>Neste fjære</dt>
                <dd>
                  {conditions.tide.nextLow
                    ? `${formatTime(conditions.tide.nextLow.timestamp)} · ${conditions.tide.nextLow.heightM.toFixed(2)} m`
                    : '–'}
                </dd>
              </div>
              <div>
                <dt>Luft</dt>
                <dd>{conditions.weather.airTemperatureC?.toFixed(1) ?? '–'} °C</dd>
              </div>
              <div>
                <dt>Vann</dt>
                <dd>{conditions.marine.seaSurfaceTemperatureC?.toFixed(1) ?? '–'} °C</dd>
              </div>
            </dl>
          </section>
        </div>
        <section className="sheet-section">
          <h3>Tidevann gjennom dagen</h3>
          <TideChart hours={dayHours} />
        </section>
        <section className="sheet-section">
          <h3>Retninger ved Bore</h3>
          <DirectionDiagram conditions={conditions} spot={spot} />
        </section>
        {conditions.interpretation.wetsuitAdvice ? (
          <aside className="wetsuit-note">
            <strong>Draktprat</strong>
            <p>{conditions.interpretation.wetsuitAdvice}</p>
          </aside>
        ) : null}
        <p className="safety-note">
          Vær- og bølgemodeller kan ta feil, og forhold endrer seg raskt. Vurder alltid egne
          ferdigheter og det du faktisk ser på stranden.
        </p>
      </section>
    </div>
  );
}
