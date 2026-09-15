'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ForecastResponse, ScoredConditions } from '@borecast/domain';
import { compassDirection } from '@borecast/surf-engine';
import { formatTime, formatUpdated, scoreBand, suitabilityLabels, tideLabels } from '@/lib/format';
import { ArrowIcon, BellIcon, ThermometerIcon, TideIcon, WaveIcon, WindIcon } from './icons';
import { ConditionsSheet } from './ConditionsSheet';

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <span className="metric-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function SkillLine({
  label,
  item,
}: {
  label: string;
  item: ScoredConditions['interpretation']['skillSuitability']['beginner'];
}) {
  return (
    <div className="skill-line">
      <span>{label}</span>
      <strong className={`suitability-${item.level}`}>{suitabilityLabels[item.level]}</strong>
    </div>
  );
}

export function Dashboard({ forecast }: { forecast: ForecastResponse }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [details, setDetails] = useState<ScoredConditions | null>(null);
  const day = forecast.days[dayIndex] ?? forecast.days[0];
  const current =
    dayIndex === 0
      ? forecast.current
      : (day?.hours.find((hour) => hour.timestamp === day.bestWindow?.start) ??
        day?.hours[0] ??
        null);
  const sortedHours = useMemo(() => day?.hours ?? [], [day]);

  if (!forecast.current || !day) {
    return (
      <main className="shell empty-state">
        <span className="eyebrow">BORE · DATA MANGLER</span>
        <h1>Bore er der. Dataene er ikke.</h1>
        <p>Datakildene svarte ikke akkurat nå. Prøv igjen om litt — vi later ikke som vi vet.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Prøv igjen
        </button>
      </main>
    );
  }
  const shown = current ?? forecast.current;
  const score = shown.interpretation.scoreBreakdown.total;
  const band = scoreBand(score);
  const swellDirection = shown.marine.swellDirectionDeg ?? shown.marine.waveDirectionDeg;
  const period =
    shown.marine.swellPeakPeriodS ?? shown.marine.swellPeriodS ?? shown.marine.wavePeriodS;
  const swellHeight = shown.marine.swellHeightM ?? shown.marine.waveHeightM;
  const sourceState =
    forecast.state === 'fresh'
      ? 'Oppdatert'
      : forecast.state === 'cached'
        ? 'Mellomlagret'
        : forecast.state === 'stale'
          ? 'Eldre data'
          : forecast.state === 'demo'
            ? 'Demodata'
            : 'Delvis utilgjengelig';

  return (
    <main>
      {forecast.notice ? (
        <div className={`data-notice notice-${forecast.state}`}>
          <div className="shell">
            <strong>{sourceState}</strong>
            <span>{forecast.notice}</span>
          </div>
        </div>
      ) : null}
      <section className={`hero score-${band}`}>
        <div className="shell hero-grid">
          <div className="hero-copy">
            <div className="hero-topline">
              <span className="eyebrow">
                {forecast.spot.name.toUpperCase()} · {day.label.toUpperCase()}
              </span>
              <span className="freshness">
                <i />
                {sourceState} {formatUpdated(forecast.generatedAt)}
              </span>
            </div>
            <button
              className="score-button"
              onClick={() => setDetails(shown)}
              aria-label={`Bore Score ${score.toFixed(1)}. Åpne forklaring`}
            >
              <span className="score-value">{score.toFixed(1)}</span>
              <span className="score-out-of">/10</span>
            </button>
            <h1>{shown.interpretation.headline}</h1>
            <p className="hero-summary">{shown.interpretation.summary}</p>
            <button className="why-link" onClick={() => setDetails(shown)}>
              Hvorfor denne scoren? <ArrowIcon />
            </button>
          </div>
          <aside className="window-panel">
            <span className="eyebrow">BESTE TIDSPUNKT</span>
            <strong>{day.bestWindow?.label ?? 'Ingen tydelig luke'}</strong>
            <p>
              {day.bestWindow
                ? `Snitt ${day.bestWindow.averageScore.toFixed(1)} · topp ${day.bestWindow.peakScore.toFixed(1)}${day.bestWindow.isDark ? ' · i mørket' : ''}`
                : 'Ingen sammenhengende periode over 5,5 med godt nok datagrunnlag.'}
            </p>
            <div className="hero-actions">
              <a className="button light" href="#hours">
                Se timene
              </a>
              {forecast.spot.camera ? (
                <a
                  className="button ghost-light"
                  href={forecast.spot.camera.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Se livekamera ↗
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <div className="shell dashboard-body">
        <section className="metrics-grid" aria-label="Nøkkelforhold">
          <Metric
            icon={<WaveIcon />}
            label="Primærswell"
            value={
              swellHeight !== undefined
                ? `${swellHeight.toFixed(1)} m @ ${period?.toFixed(0) ?? '–'} s`
                : 'Mangler'
            }
            detail={
              swellDirection !== undefined
                ? `${compassDirection(swellDirection)} ${Math.round(swellDirection)}°`
                : 'Ukjent retning'
            }
          />
          <Metric
            icon={<WindIcon />}
            label="Vind"
            value={
              shown.wind.speedMs !== undefined
                ? `${compassDirection(shown.wind.directionDeg ?? 0)} ${shown.wind.speedMs.toFixed(1)} m/s`
                : 'Mangler'
            }
            detail={shown.interpretation.windDescription.split(' · ')[1] ?? 'Ukjent effekt'}
          />
          <Metric
            icon={<TideIcon />}
            label="Tidevann"
            value={
              shown.tide.heightM !== undefined ? `${shown.tide.heightM.toFixed(2)} m` : 'Mangler'
            }
            detail={tideLabels[shown.tide.trend ?? 'unknown']}
          />
          <Metric
            icon={<ThermometerIcon />}
            label="Vanntemperatur"
            value={
              shown.marine.seaSurfaceTemperatureC !== undefined
                ? `${shown.marine.seaSurfaceTemperatureC.toFixed(1)} °C`
                : 'Mangler'
            }
            detail={shown.interpretation.wetsuitAdvice?.split(':')[0] ?? 'Ingen draktråd'}
          />
        </section>

        <section className="overview-grid">
          <div className="skill-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">HVEM PASSER DET FOR?</span>
                <h2>Én score. Ulike surfere.</h2>
              </div>
            </div>
            <SkillLine label="Nybegynner" item={shown.interpretation.skillSuitability.beginner} />
            <SkillLine
              label="Viderekommen"
              item={shown.interpretation.skillSuitability.intermediate}
            />
            <SkillLine label="Erfaren" item={shown.interpretation.skillSuitability.advanced} />
            <p className="muted small">
              Egnethet er ikke en sikkerhetsvurdering. Sjekk alltid faktiske forhold.
            </p>
          </div>
          <Link className="next-card" href="#forecast">
            <span className="eyebrow">NESTE BRA DAG</span>
            {forecast.nextGoodDay ? (
              <>
                <strong>{forecast.nextGoodDay.label}</strong>
                <span>Bore Score opptil {forecast.nextGoodDay.peakScore.toFixed(1)}</span>
              </>
            ) : (
              <>
                <strong>Ikke i sikte</strong>
                <span>Ingen dag over 7,0 i varselet.</span>
              </>
            )}
            <ArrowIcon />
          </Link>
          <Link className="alert-card" href="/alerts">
            <BellIcon />
            <div>
              <span className="eyebrow">SURFVARSLER</span>
              <strong>Gi meg et pip når det fyrer.</strong>
              <span>Lokale regler, på dine premisser.</span>
            </div>
            <ArrowIcon />
          </Link>
        </section>

        <section id="forecast" className="forecast-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MODELLVARSEL · 7 DAGER</span>
              <h2>Neste sju dager</h2>
            </div>
            <p>Dagsscoren er dagens beste surfbare vindu — ikke et døgnsnitt.</p>
          </div>
          <div className="day-strip" role="tablist" aria-label="Velg dag">
            {forecast.days.map((forecastDay, index) => (
              <button
                key={forecastDay.date}
                role="tab"
                aria-selected={dayIndex === index}
                className={dayIndex === index ? 'selected' : ''}
                onClick={() => setDayIndex(index)}
              >
                <span>{forecastDay.label}</span>
                <strong className={`mini-score score-${scoreBand(forecastDay.peakScore)}`}>
                  {forecastDay.peakScore.toFixed(1)}
                </strong>
                <small>
                  {forecastDay.bestWindow
                    ? forecastDay.bestWindow.label.replace('Best ', '').replace('Nattvindu ', '')
                    : 'Ingen luke'}
                </small>
              </button>
            ))}
          </div>
        </section>

        <section id="hours" className="hours-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HELE DØGNET</span>
              <h2>{day.label}, time for time</h2>
            </div>
            <p>Trykk på en time for scoreforklaring og alle detaljer.</p>
          </div>
          <div className="hour-scroller">
            {sortedHours.map((hour) => {
              const hourScore = hour.interpretation.scoreBreakdown.total;
              const hourHeight = hour.marine.swellHeightM ?? hour.marine.waveHeightM;
              return (
                <button
                  key={hour.timestamp}
                  className={`hour-card ${hour.daylight.isDark ? 'night' : ''}`}
                  onClick={() => setDetails(hour)}
                  aria-label={`${formatTime(hour.timestamp)}, score ${hourScore.toFixed(1)}`}
                >
                  <span className="hour-time">{formatTime(hour.timestamp)}</span>
                  <strong className={`hour-score score-${scoreBand(hourScore)}`}>
                    {hourScore.toFixed(1)}
                  </strong>
                  <span className="hour-condition">{hour.interpretation.headline}</span>
                  <span>
                    <WaveIcon />
                    {hourHeight?.toFixed(1) ?? '–'} m
                  </span>
                  <span>
                    <WindIcon />
                    {hour.wind.speedMs?.toFixed(1) ?? '–'} m/s
                  </span>
                  <span className="hour-light">
                    {hour.daylight.isDark ? '● Natt' : '○ Dagslys'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="source-bar">
          <div>
            <span className="eyebrow">DATASTATUS</span>
            <strong>Sist hentet {formatUpdated(forecast.generatedAt)}</strong>
            <p>Dette er modellprognoser, ikke live observasjoner.</p>
          </div>
          <ul>
            {forecast.sources.map((source) => (
              <li key={source.id}>
                <span className={`source-dot source-${source.state}`} />
                {source.name}
                <small>
                  {source.state === 'unavailable'
                    ? 'Utilgjengelig'
                    : source.state === 'stale'
                      ? 'Eldre cache'
                      : source.state === 'demo'
                        ? 'Demo'
                        : 'OK'}
                </small>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {details ? (
        <ConditionsSheet
          conditions={details}
          dayHours={day.hours}
          spot={forecast.spot}
          onClose={() => setDetails(null)}
        />
      ) : null}
    </main>
  );
}
