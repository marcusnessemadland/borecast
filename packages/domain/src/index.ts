export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type TideTrend = 'rising' | 'falling' | 'high' | 'low' | 'unknown';
export type DataState = 'fresh' | 'cached' | 'stale' | 'unavailable' | 'demo';
export type FactorRating = 'terrible' | 'poor' | 'marginal' | 'good' | 'excellent' | 'unknown';
export type SuitabilityLevel = 'not_recommended' | 'challenging' | 'suitable' | 'ideal' | 'unknown';

export interface TideEvent {
  timestamp: string;
  heightM: number;
  type: 'high' | 'low';
}

export interface SourceMetadata {
  id: 'met-locationforecast' | 'open-meteo-marine' | 'kartverket-tide' | 'met-sunrise' | 'demo';
  name: string;
  url: string;
  attribution: string;
  fetchedAt: string;
  generatedAt?: string;
  state: DataState;
  message?: string;
}

export interface SurfConditions {
  timestamp: string;
  weather: {
    airTemperatureC?: number;
    precipitationMm?: number;
    cloudCoverPercent?: number;
    pressureHpa?: number;
  };
  wind: {
    speedMs?: number;
    gustMs?: number;
    directionDeg?: number;
  };
  marine: {
    waveHeightM?: number;
    waveDirectionDeg?: number;
    wavePeriodS?: number;
    wavePeakPeriodS?: number;
    swellHeightM?: number;
    swellDirectionDeg?: number;
    swellPeriodS?: number;
    swellPeakPeriodS?: number;
    secondarySwellHeightM?: number;
    secondarySwellDirectionDeg?: number;
    secondarySwellPeriodS?: number;
    seaSurfaceTemperatureC?: number;
  };
  tide: {
    heightM?: number;
    trend?: TideTrend;
    nextHigh?: TideEvent;
    nextLow?: TideEvent;
  };
  daylight: {
    sunrise?: string;
    sunset?: string;
    firstLight?: string;
    lastLight?: string;
    isDark: boolean;
  };
  sourceMetadata: SourceMetadata[];
}

export interface ScoreFactor {
  score: number;
  rating: FactorRating;
  reason: string;
  raw: Record<string, number | string | boolean | undefined>;
}

export interface ScoreBreakdown {
  total: number;
  waveSize: ScoreFactor;
  period: ScoreFactor;
  swellDirection: ScoreFactor;
  wind: ScoreFactor;
  tide: ScoreFactor;
  swellQuality: ScoreFactor;
  confidence: number;
}

export interface SkillSuitabilityItem {
  level: SuitabilityLevel;
  reason: string;
}

export type SkillSuitability = Record<SkillLevel, SkillSuitabilityItem>;

export interface SurfInterpretation {
  headline: string;
  summary: string;
  tags: string[];
  scoreBreakdown: ScoreBreakdown;
  skillSuitability: SkillSuitability;
  windDescription: string;
  swellDescription: string;
  wetsuitAdvice?: string;
}

export interface ScoredConditions extends SurfConditions {
  interpretation: SurfInterpretation;
}

export interface RangePreference {
  minimum: number;
  idealFrom: number;
  idealTo: number;
  maximum: number;
}

export interface DirectionalPreference {
  idealDeg: number;
  goodToleranceDeg: number;
  maximumToleranceDeg: number;
}

export interface WindPreference {
  calmMs: number;
  strongMs: number;
  destructiveOnshoreMs: number;
}

export interface TidePreference extends RangePreference {
  calibrated: boolean;
}

export interface SkillProfile {
  waveHeight: RangePreference;
  maximumPeriodS: number;
}

export interface SurfSpot {
  id: string;
  slug: string;
  name: string;
  region: string;
  country: string;
  coordinates: { lat: number; lon: number };
  timezone: string;
  orientation: { shoreNormalDeg: number };
  scoringProfile: {
    swell: DirectionalPreference;
    wind: WindPreference;
    waveHeight: RangePreference;
    period: RangePreference;
    tide: TidePreference;
  };
  skillProfiles: Record<SkillLevel, SkillProfile>;
  calibration: { status: 'initial_heuristic' | 'locally_calibrated'; notes: string };
}

export interface BestWindow {
  start: string;
  end: string;
  averageScore: number;
  peakScore: number;
  isDark: boolean;
  label: string;
}

export interface ForecastDay {
  date: string;
  label: string;
  peakScore: number;
  headline: string;
  bestWindow?: BestWindow;
  hours: ScoredConditions[];
}

export interface ForecastResponse {
  spot: SurfSpot;
  generatedAt: string;
  state: DataState;
  current: ScoredConditions | null;
  nextGoodDay?: { date: string; label: string; peakScore: number };
  days: ForecastDay[];
  sources: SourceMetadata[];
  notice?: string;
}

export interface AlertRule {
  id: string;
  spotId: string;
  enabled: boolean;
  type: 'score_threshold' | 'beginner_friendly' | 'firing' | 'barrel_potential' | 'morning_summary';
  threshold?: number;
}
