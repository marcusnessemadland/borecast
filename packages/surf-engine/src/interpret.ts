import type {
  ScoredConditions,
  SurfConditions,
  SurfInterpretation,
  SurfSpot,
} from '@borecast/domain';
import { compassDirection, windRelation } from './direction';
import { calculateScore, calculateSkillSuitability } from './score';

function wetsuitAdvice(temperature?: number): string | undefined {
  if (temperature === undefined) return undefined;
  if (temperature < 7) return 'Svært kaldt: tykk vinterdrakt, hette, hansker og boots er vanlig.';
  if (temperature < 11) return 'Kaldt vann: vinterdrakt og som regel boots, hansker og hette.';
  if (temperature < 15) return 'Kjølig: en god heldrakt, og vurder boots.';
  if (temperature < 19) return 'Mildt til Jæren å være: lettere heldrakt kan passe.';
  return 'Uvanlig varmt. Baris? Nå begynner vi å snakke — men kjenn på forholdene selv.';
}

function scoreCopy(
  score: number,
  tags: string[],
  seed: number,
): { headline: string; summary: string } {
  if (score < 2)
    return {
      headline: seed % 2 ? 'HELT DØDT' : 'IKKE MYE Å SKRIVE HJEM OM',
      summary: 'Bore har tatt seg fri. Finn på noe annet.',
    };
  if (score < 4)
    return {
      headline: tags.includes('messy') ? 'LITT VASKEMASKIN' : 'TYNT I DAG',
      summary: 'Det kan surfes, men forventningene bør ned et hakk.',
    };
  if (score < 5.5)
    return {
      headline: 'SÅNN PASSE',
      summary: 'Et marginalt vindu. Helt greit om du allerede er i nærheten.',
    };
  if (score < 7)
    return {
      headline: tags.includes('clean') ? 'SMÅTT, MEN CLEAN' : 'DET BLIR GØY',
      summary: 'Surfbare forhold og et brukbart vindu.',
    };
  if (score < 8.5)
    return {
      headline: seed % 2 ? 'BORE LEVERER' : 'PENT OG RYDDIG',
      summary: 'Dette ser ut som en ordentlig bra Bore-økt.',
    };
  if (score < 9.5)
    return {
      headline: seed % 2 ? 'DET FYRER' : 'TA FRI TIDLIG',
      summary: 'Clean, kraftig swell og gode vindforhold. For de erfarne.',
    };
  return {
    headline: 'SJELDEN VARE',
    summary: 'Nær full klaff i modellene. Sjekk faktiske forhold før du hopper uti.',
  };
}

export function interpretConditions(
  conditions: SurfConditions,
  spot: SurfSpot,
): SurfInterpretation {
  const scoreBreakdown = calculateScore(conditions, spot);
  const skillSuitability = calculateSkillSuitability(conditions, spot);
  const tags: string[] = [];
  const windSpeed = conditions.wind.speedMs;
  const windDirection = conditions.wind.directionDeg;
  const relation =
    windDirection === undefined
      ? undefined
      : windRelation(windDirection, spot.orientation.shoreNormalDeg);
  if (relation) tags.push(relation);
  if (relation === 'offshore' && (windSpeed ?? 20) < 6) tags.push('clean');
  if (relation === 'onshore' && (windSpeed ?? 0) > 5) tags.push('messy');
  if ((conditions.marine.swellPeriodS ?? 0) >= 12) tags.push('powerful');
  if ((conditions.marine.secondarySwellHeightM ?? 0) >= 0.45) tags.push('mixed-swell');
  if (
    scoreBreakdown.total >= 8.2 &&
    tags.includes('clean') &&
    (conditions.marine.swellPeriodS ?? 0) >= 11
  )
    tags.push('barrel-potential');
  if (conditions.daylight.isDark) tags.push('night');

  const seed = new Date(conditions.timestamp).getUTCHours();
  const copy = scoreCopy(scoreBreakdown.total, tags, seed);
  const windDescription =
    windSpeed !== undefined && windDirection !== undefined
      ? `${compassDirection(windDirection)} ${windSpeed.toFixed(1)} m/s · ${relation === 'offshore' ? 'offshore' : relation === 'onshore' ? 'onshore' : 'cross-shore'}`
      : 'Vinddata mangler';
  const height = conditions.marine.swellHeightM ?? conditions.marine.waveHeightM;
  const period =
    conditions.marine.swellPeakPeriodS ??
    conditions.marine.swellPeriodS ??
    conditions.marine.wavePeriodS;
  const direction = conditions.marine.swellDirectionDeg ?? conditions.marine.waveDirectionDeg;
  const swellDescription =
    height !== undefined
      ? `${height.toFixed(1)} m${period !== undefined ? ` @ ${period.toFixed(0)} s` : ''}${direction !== undefined ? ` · ${compassDirection(direction)} ${Math.round(direction)}°` : ''}`
      : 'Swelldata mangler';
  const equipmentAdvice = wetsuitAdvice(conditions.marine.seaSurfaceTemperatureC);

  return {
    headline: copy.headline,
    summary:
      conditions.daylight.isDark && scoreBreakdown.total >= 6
        ? `${copy.summary} Det beste skjer i mørket.`
        : copy.summary,
    tags,
    scoreBreakdown,
    skillSuitability,
    windDescription,
    swellDescription,
    ...(equipmentAdvice ? { wetsuitAdvice: equipmentAdvice } : {}),
  };
}

export function scoreConditions(conditions: SurfConditions, spot: SurfSpot): ScoredConditions {
  return { ...conditions, interpretation: interpretConditions(conditions, spot) };
}
