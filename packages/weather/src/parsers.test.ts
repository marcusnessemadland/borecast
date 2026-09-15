import { describe, expect, it } from 'vitest';
import { parseKartverketTide, parseMetLocationforecast, parseOpenMeteoMarine } from './index';

describe('provider parsers', () => {
  it('keeps missing MET values missing', () => {
    const parsed = parseMetLocationforecast(
      JSON.stringify({
        properties: {
          timeseries: [
            { time: '2026-09-15T10:00:00Z', data: { instant: { details: { wind_speed: 3.2 } } } },
          ],
        },
      }),
    );
    const item = parsed.values.get('2026-09-15T10:00:00.000Z');
    expect(item?.wind?.speedMs).toBe(3.2);
    expect(item?.weather?.airTemperatureC).toBeUndefined();
  });

  it('maps Open-Meteo arrays by timestamp', () => {
    const values = parseOpenMeteoMarine(
      JSON.stringify({
        hourly: { time: ['2026-09-15T10:00'], swell_wave_height: [1.3], swell_wave_period: [11] },
      }),
    );
    expect(values.get('2026-09-15T10:00:00.000Z')?.marine?.swellHeightM).toBe(1.3);
  });

  it('parses Kartverket prediction centimeters as meters', () => {
    const points = parseKartverketTide(
      '<tide><data type="prediction" unit="cm"><waterlevel value="42.5" time="2026-09-15T10:00:00+00" flag="pre"/></data></tide>',
    );
    expect(points).toEqual([{ timestamp: '2026-09-15T10:00:00.000Z', heightM: 0.425 }]);
  });
});
