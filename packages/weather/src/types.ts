import type { SourceMetadata, SurfConditions, SurfSpot } from '@borecast/domain';

export type ConditionsPatch = Partial<
  Pick<SurfConditions, 'weather' | 'wind' | 'marine' | 'tide' | 'daylight'>
>;

export interface ProviderData {
  values: Map<string, ConditionsPatch>;
  source: SourceMetadata;
}

export interface TimelineResult {
  conditions: SurfConditions[];
  sources: SourceMetadata[];
  notice?: string;
}

export interface ForecastProvider {
  id: SourceMetadata['id'];
  load(spot: SurfSpot, start: Date): Promise<ProviderData>;
}
