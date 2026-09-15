# Data sources

Provider behavior and licences must be reviewed again before a commercial launch.

## MET Norway Locationforecast 2.0

Used for local wind, gusts, temperature, precipitation, cloud cover and pressure. Requests are server-only, identify BoreCast through a configured `User-Agent`, limit coordinates to four decimals for cacheability, honor caching headers and retain generated timestamps.

- <https://api.met.no/weatherapi/locationforecast/2.0/documentation>
- Attribution: MET Norway

## Open-Meteo Marine

Used for total waves, primary/secondary swell, direction, period and sea-surface temperature. The adapter requests seven UTC days and chooses a sea grid cell. Open-Meteo modelled sea-level height is deliberately not used as authoritative coastal tide data.

- <https://open-meteo.com/en/docs/marine-weather-api>
- Attribution: Open-Meteo

## Kartverket water level

Used for astronomical tide predictions at Bore's position. The parser isolates Kartverket XML and converts centimetres to metres. Heights request the `msl` reference code (mean sea level); the UI and API retain this reference explicitly. Request intervals are cached for at least six hours when upstream headers do not specify another lifetime.

- <https://www.kartverket.no/api-og-data/tidevann-og-vannstandsdata>
- Licence: CC BY 4.0
- Attribution: Kartverket

## MET Norway Sunrise 3.0

Used for sunrise and sunset per local day with the correct Oslo UTC offset. Night remains in the timeline. `firstLight` and `lastLight` are intentionally absent until a clearly defined civil-twilight source/calculation is introduced; the app does not manufacture them from a fixed offset.

- <https://api.met.no/weatherapi/sunrise/3.0/documentation>
- Attribution: MET Norway

## Bore coordinates

The initial position `58.7987905, 5.553825` is from Statens vegvesen's official Borestranda listing:

- <https://www.nasjonaleturistveger.no/no/turistvegene/jaeren/borestranda/>
