# Architecture

## Data flow

```text
MET Locationforecast ----\
Open-Meteo Marine --------+--> provider adapters --> normalized hourly timeline
Kartverket tide ----------+            |                       |
MET Sunrise -------------/      cache + stale fallback         v
                                                         deterministic surf engine
                                                                  |
                                                                  v
                                                    Next.js Server Component/API
                                                                  |
                                                                  v
                                                      interactive PWA dashboard
```

Provider responses terminate in `@borecast/weather`. Missing values remain absent. The application does not zero-fill or interpolate unavailable provider fields.

`@borecast/domain` contains serializable framework-neutral types intended to remain usable from a future Expo application. `@borecast/surf-engine` consists of pure functions and has no React or Next.js dependency. New spots are configured in `@borecast/spots`.

## Resilience

The server calls providers concurrently with an eight-second timeout. The small process-local cache respects upstream `Cache-Control`/`Expires` values, uses conditional requests where possible, and can return an expired entry as explicitly stale data during an outage. A multi-instance deployment should replace this process-local cache with a shared cache while preserving the same adapter interface.

Every source is reported as fresh, cached, stale, unavailable or demo. One failed source does not discard values from other sources. Confidence is derived from input completeness and is exposed with every score.

## Server boundary

Provider calls happen in Server Components or the `/api/forecast` Route Handler. API secrets and the MET identity are never sent to the browser.

## Alerts

`AlertRule` is shared domain data. V1 persists rules in local storage and requests notification permission progressively. The service worker accepts standards-based Web Push events, but production background delivery requires:

1. VAPID keys;
2. an opaque device/subscription ID and durable subscription store;
3. a scheduled forecast evaluator;
4. subscription cleanup and rate limiting.

No user account is required by this design.
