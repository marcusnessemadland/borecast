import type {
  FactorRating,
  RangePreference,
  ScoreFactor,
  SkillLevel,
  SkillSuitability,
  SurfConditions,
  SurfSpot,
} from '@borecast/domain';
import { angularDifference, compassDirection, windRelation } from './direction';

export function clamp(value: number, minimum = 0, maximum = 10): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function rating(score: number): FactorRating {
  if (score < 2) return 'terrible';
  if (score < 4) return 'poor';
  if (score < 5.5) return 'marginal';
  if (score < 8) return 'good';
  return 'excellent';
}

function rangeScore(value: number, range: RangePreference): number {
  if (value <= range.minimum || value >= range.maximum) return 0;
  if (value >= range.idealFrom && value <= range.idealTo) return 10;
  if (value < range.idealFrom) {
    return 10 * ((value - range.minimum) / (range.idealFrom - range.minimum));
  }
  return 10 * ((range.maximum - value) / (range.maximum - range.idealTo));
}

function unknownFactor(reason: string): ScoreFactor {
  return { score: 5, rating: 'unknown', reason, raw: {} };
}

function factor(score: number, reason: string, raw: ScoreFactor['raw']): ScoreFactor {
  const safeScore = clamp(score);
  return { score: safeScore, rating: rating(safeScore), reason, raw };
}

function waveSizeFactor(conditions: SurfConditions, spot: SurfSpot): ScoreFactor {
  const height = conditions.marine.swellHeightM ?? conditions.marine.waveHeightM;
  if (height === undefined) return unknownFactor('Mangler bølgehøyde.');
  const score = rangeScore(height, spot.scoringProfile.waveHeight);
  let reason = `${height.toFixed(1)} m gir brukbar størrelse.`;
  if (height < spot.scoringProfile.waveHeight.minimum)
    reason = `${height.toFixed(1)} m er i minste laget.`;
  if (height > spot.scoringProfile.waveHeight.idealTo)
    reason = `${height.toFixed(1)} m er kraftig for Bore.`;
  return factor(score, reason, { heightM: height });
}

function periodFactor(conditions: SurfConditions, spot: SurfSpot): ScoreFactor {
  const period =
    conditions.marine.swellPeakPeriodS ??
    conditions.marine.swellPeriodS ??
    conditions.marine.wavePeriodS;
  if (period === undefined) return unknownFactor('Mangler swellperiode.');
  const score = rangeScore(period, spot.scoringProfile.period);
  const reason =
    period >= 12
      ? `${period.toFixed(0)} s gir mye kraft i swellet.`
      : `${period.toFixed(0)} s periode.`;
  return factor(score, reason, { periodS: period });
}

function swellDirectionFactor(conditions: SurfConditions, spot: SurfSpot): ScoreFactor {
  const direction = conditions.marine.swellDirectionDeg ?? conditions.marine.waveDirectionDeg;
  if (direction === undefined) return unknownFactor('Mangler swellretning.');
  const difference = angularDifference(direction, spot.scoringProfile.swell.idealDeg);
  const { goodToleranceDeg, maximumToleranceDeg } = spot.scoringProfile.swell;
  const score =
    difference <= goodToleranceDeg
      ? 10 - (difference / goodToleranceDeg) * 2
      : 8 * (1 - (difference - goodToleranceDeg) / (maximumToleranceDeg - goodToleranceDeg));
  const reason = `${compassDirection(direction)} ${Math.round(direction)}° · ${difference <= goodToleranceDeg ? 'bra vinkel for Bore' : 'skrå vinkel'}.`;
  return factor(score, reason, { directionDeg: direction, differenceDeg: difference });
}

function windFactor(conditions: SurfConditions, spot: SurfSpot): ScoreFactor {
  const { speedMs, directionDeg, gustMs } = conditions.wind;
  if (speedMs === undefined || directionDeg === undefined)
    return unknownFactor('Mangler fullstendige vinddata.');
  const relation = windRelation(directionDeg, spot.orientation.shoreNormalDeg);
  const strengthPenalty = Math.max(0, speedMs - spot.scoringProfile.wind.calmMs) * 0.75;
  const gustPenalty = gustMs === undefined ? 0 : Math.max(0, gustMs - speedMs - 2) * 0.35;
  const base = relation === 'offshore' ? 10 : relation === 'cross-shore' ? 6.4 : 4.2;
  const score = base - strengthPenalty - gustPenalty;
  const norwegian =
    relation === 'offshore' ? 'Offshore' : relation === 'onshore' ? 'Onshore' : 'Cross-shore';
  return factor(
    score,
    `${norwegian} ${speedMs.toFixed(1)} m/s${gustMs ? `, kast ${gustMs.toFixed(1)}` : ''}.`,
    {
      speedMs,
      gustMs,
      directionDeg,
      relation,
    },
  );
}

function tideFactor(conditions: SurfConditions, spot: SurfSpot): ScoreFactor {
  const height = conditions.tide.heightM;
  if (height === undefined) return unknownFactor('Tidevannsdata er ikke tilgjengelig.');
  if (!spot.scoringProfile.tide.calibrated) {
    return factor(
      6,
      `${height.toFixed(2)} m, ${conditions.tide.trend === 'rising' ? 'stigende' : conditions.tide.trend === 'falling' ? 'fallende' : 'rolig'}. Tideprofilen er ikke lokalt kalibrert.`,
      {
        heightM: height,
        trend: conditions.tide.trend,
        calibrated: false,
      },
    );
  }
  return factor(rangeScore(height, spot.scoringProfile.tide), `${height.toFixed(2)} m tidevann.`, {
    heightM: height,
    trend: conditions.tide.trend,
    calibrated: true,
  });
}

function swellQualityFactor(conditions: SurfConditions): ScoreFactor {
  const primary = conditions.marine.swellHeightM;
  const secondary = conditions.marine.secondarySwellHeightM;
  if (primary === undefined) return unknownFactor('Mangler data om swellkomponenter.');
  if (!secondary || secondary < 0.2)
    return factor(9, 'Lite mixed swell · ryddig energibilde.', {
      primaryHeightM: primary,
      secondaryHeightM: secondary ?? 0,
    });
  const ratio = secondary / Math.max(primary, 0.1);
  const angle =
    conditions.marine.swellDirectionDeg !== undefined &&
    conditions.marine.secondarySwellDirectionDeg !== undefined
      ? angularDifference(
          conditions.marine.swellDirectionDeg,
          conditions.marine.secondarySwellDirectionDeg,
        )
      : 45;
  const penalty = ratio * 4 + (angle / 180) * 3;
  return factor(
    9 - penalty,
    ratio > 0.55 ? 'Flere tydelige swellretninger kan gi rot.' : 'Noe mixed swell.',
    {
      primaryHeightM: primary,
      secondaryHeightM: secondary,
      directionDifferenceDeg: angle,
    },
  );
}

export function calculateScore(conditions: SurfConditions, spot: SurfSpot) {
  const waveSize = waveSizeFactor(conditions, spot);
  const period = periodFactor(conditions, spot);
  const swellDirection = swellDirectionFactor(conditions, spot);
  const wind = windFactor(conditions, spot);
  const tide = tideFactor(conditions, spot);
  const swellQuality = swellQualityFactor(conditions);

  let total =
    waveSize.score * 0.22 +
    period.score * 0.18 +
    swellDirection.score * 0.16 +
    wind.score * 0.26 +
    tide.score * 0.08 +
    swellQuality.score * 0.1;
  const relation = typeof wind.raw.relation === 'string' ? wind.raw.relation : undefined;
  const speed = conditions.wind.speedMs ?? 0;
  if (relation === 'onshore' && speed >= spot.scoringProfile.wind.destructiveOnshoreMs)
    total *= 0.57;
  else if (relation === 'onshore' && speed >= 4) total *= 0.76;
  if (waveSize.score < 1.5) total = Math.min(total, 3.2);
  if ((conditions.marine.swellHeightM ?? 0) > spot.scoringProfile.waveHeight.maximum)
    total = Math.min(total, 2.5);

  const expected = [
    conditions.marine.swellHeightM ?? conditions.marine.waveHeightM,
    conditions.marine.swellPeriodS ?? conditions.marine.wavePeriodS,
    conditions.marine.swellDirectionDeg ?? conditions.marine.waveDirectionDeg,
    conditions.wind.speedMs,
    conditions.wind.directionDeg,
    conditions.tide.heightM,
  ];
  const confidence = expected.filter((value) => value !== undefined).length / expected.length;
  total *= 0.88 + confidence * 0.12;

  return {
    total: clamp(total),
    waveSize,
    period,
    swellDirection,
    wind,
    tide,
    swellQuality,
    confidence,
  };
}

function suitabilityFor(
  level: SkillLevel,
  conditions: SurfConditions,
  spot: SurfSpot,
): SkillSuitability[SkillLevel] {
  const profile = spot.skillProfiles[level];
  const height = conditions.marine.swellHeightM ?? conditions.marine.waveHeightM;
  const period =
    conditions.marine.swellPeakPeriodS ??
    conditions.marine.swellPeriodS ??
    conditions.marine.wavePeriodS;
  if (height === undefined || period === undefined)
    return { level: 'unknown', reason: 'For lite data til å vurdere nivå.' };
  const relation =
    conditions.wind.directionDeg === undefined
      ? undefined
      : windRelation(conditions.wind.directionDeg, spot.orientation.shoreNormalDeg);
  if (height >= profile.waveHeight.maximum || period > profile.maximumPeriodS) {
    return { level: 'not_recommended', reason: 'For stort eller kraftig for dette nivået.' };
  }
  if (relation === 'onshore' && (conditions.wind.speedMs ?? 0) > 6) {
    return { level: 'challenging', reason: 'Pålandsvind gjør forholdene rotete og krevende.' };
  }
  if (height >= profile.waveHeight.idealFrom && height <= profile.waveHeight.idealTo) {
    return {
      level: 'ideal',
      reason:
        level === 'beginner'
          ? 'Små, håndterlige bølger med passende kraft.'
          : 'Størrelse og kraft passer nivået godt.',
    };
  }
  return { level: 'suitable', reason: 'Surfbar størrelse, men ikke helt i idealområdet.' };
}

export function calculateSkillSuitability(
  conditions: SurfConditions,
  spot: SurfSpot,
): SkillSuitability {
  return {
    beginner: suitabilityFor('beginner', conditions, spot),
    intermediate: suitabilityFor('intermediate', conditions, spot),
    advanced: suitabilityFor('advanced', conditions, spot),
  };
}
