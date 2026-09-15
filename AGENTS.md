# AGENTS.md — BoreCast

## 1. Mission

Build **BoreCast**, a complete, production-quality surf conditions web app for Bore/Boretunet on Jæren, Norway.

The first release is a **finished web product**, not a throwaway prototype. It must be architected so native iOS, Android, Apple Watch, and additional surf spots can be added later without rewriting the surf/weather domain layer.

The core product question is:

> **“How good is Bore right now, who is it good for, and when should I surf?”**

Do not merely reproduce weather data. Translate weather, marine, tide, daylight, and spot-specific knowledge into an understandable **Bore Score (0.0–10.0)** and useful surfer-oriented guidance.

Working product name: **BoreCast**. Branding must be easy to rename later.

---

## 2. Product principles

1. **Surf-first, not weather-first.** Raw meteorological data is supporting information. The primary UI answers whether the surf is good.
2. **Explain the score.** Users must be able to understand why a score is high or low.
3. **Useful to all skill levels.** There is one universal Bore Score, with optional beginner/intermediate/advanced suitability detail.
4. **Local personality.** Norwegian copy with restrained surf slang, local humor, and occasional profanity where appropriate.
5. **Do not fake precision.** Forecast/model data is uncertain. Never imply live observations when the source is a forecast model.
6. **Data-driven spots.** Bore is the first spot, but spot behavior/configuration must live in data/config, not hard-coded throughout the UI.
7. **Cross-platform by design.** Development must work on Windows and macOS.
8. **Minimal dependency/testing bloat.** Add libraries and tests where they protect important behavior; do not create ceremony for its own sake.
9. **No AI-generated imagery or AI-generated forecast prose.** Forecast interpretation and copy are deterministic/rule-based.
10. **No account required.** User preferences and alert rules are local-first for v1.

---

## 3. Target platforms

### v1

- Responsive web app.
- Desktop and mobile browsers.
- Installable PWA where supported.
- Web notifications where platform/browser support permits.
- Windows is the primary development environment initially.

### Later

- Native iOS app.
- Native Android app.
- Apple Watch / wearable companion.
- macOS will be used when native Apple builds are required.

### Build/tooling rule

**Do not introduce CMake or C++ into this project.**

This is a TypeScript/JavaScript application. Use Node.js package tooling. CMake is unnecessary unless a future dependency introduces native code that explicitly requires it.

All normal development commands must work from PowerShell on Windows and a standard shell on macOS. Avoid Bash-only scripts and OS-specific path assumptions.

---

## 4. Recommended technology stack

Use current stable versions at implementation time.

### Repository

- Git
- Public GitHub repository
- `pnpm`
- pnpm workspaces / monorepo

### Web

- Next.js
- React
- TypeScript with strict type checking
- Tailwind CSS
- PWA support using a maintained solution compatible with the selected Next.js version

### Native later

- Expo
- React Native
- Expo Notifications

Do **not** build the native app in the initial web implementation, but keep shared packages framework-neutral so Expo can consume them later.

### Persistence

Start local-first:

- `localStorage` / IndexedDB as appropriate for preferences, saved alert rules, UI settings, etc.
- Do not add Supabase or authentication merely because they may be useful later.

If server-side persistence becomes necessary for reliable push notification scheduling, introduce the smallest appropriate backend/storage solution at that time and document the reason.

### Maps

Prefer an open map stack such as MapLibre with an appropriately licensed tile provider if a map materially improves the experience. Do not make the main forecast dependent on a map.

---

## 5. Repository structure

Prefer approximately:

```text
borecast/
├─ apps/
│  └─ web/                    # Next.js application
├─ packages/
│  ├─ domain/                 # domain types and shared models
│  ├─ surf-engine/            # deterministic scoring/interpretation
│  ├─ weather/                # provider-neutral weather interfaces
│  ├─ spots/                  # spot definitions/configuration
│  └─ shared/                 # small truly-shared utilities
├─ docs/
│  ├─ data-sources.md
│  ├─ scoring.md
│  └─ architecture.md
├─ .env.example
├─ AGENTS.md
├─ package.json
└─ pnpm-workspace.yaml
```

Do not create packages merely to satisfy this diagram. Keep the repository understandable.

---

## 6. Data architecture

UI components must **never** depend directly on an external provider's JSON format.

Normalize all provider responses into an internal model such as:

```ts
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
    trend?: 'rising' | 'falling' | 'high' | 'low' | 'unknown';
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
```

Missing provider values must remain missing. Never silently manufacture them.

---

## 7. Primary data sources

### 7.1 MET Norway — weather

Use **MET Norway Locationforecast 2.0** as the preferred source for local atmospheric weather such as:

- wind speed
- wind direction
- gusts when available
- air temperature
- precipitation
- cloud/weather information
- pressure where useful

MET provides forecasts up to nine days and prioritizes the Nordic region. Its Nordic short-term model has high regional relevance.

Important implementation requirements:

- Fetch MET from the **server**, not directly from browser production code.
- Send a legitimate custom `User-Agent` identifying BoreCast with valid project/contact information.
- Respect `Expires`, `Last-Modified`, caching, rate limits, attribution and current Terms of Service.
- Handle 203/403/429 and upstream outages gracefully.
- Never impersonate another client.
- Do not use the YR brand as BoreCast branding.

Official documentation:

- https://api.met.no/
- https://api.met.no/weatherapi/locationforecast/2.0/documentation

### 7.2 Open-Meteo Marine — marine forecast

Use Open-Meteo Marine initially for:

- wave height
- wave direction
- wave period
- peak period
- wind-wave height/direction/period
- primary swell height/direction/period
- secondary swell when available
- sea-surface temperature
- potentially ocean current information

It supports hourly marine variables and a seven-day forecast naturally fits BoreCast.

Important caveat:
Open-Meteo explicitly notes that modeled tide/sea-level accuracy is limited in coastal areas. Therefore do **not** use Open-Meteo modeled sea-level height as the authoritative Bore tide source when Kartverket data is available.

At implementation time verify the current Open-Meteo licence/plan for the intended deployment. Do not assume a free non-commercial endpoint remains suitable if BoreCast becomes commercial.

Official documentation:

- https://open-meteo.com/en/docs/marine-weather-api

### 7.3 Kartverket — tide/water level

Prefer **Kartverket / Norwegian Hydrographic Service** for Norwegian tide/water-level data.

The API is open, requires attribution, and Kartverket documents historical water-level availability for many stations. It currently returns formats including XML/text rather than a modern JSON-only API, so isolate parsing in a provider adapter.

Requirements:

- Find the appropriate station/position for Bore.
- Cache appropriately.
- Attribute Kartverket.
- Do not poll excessively.
- Treat tide reference levels correctly; do not mix incompatible datums.
- Use historical data only where licensing/source semantics permit it.

Official information:

- https://www.kartverket.no/api-og-data/tidevann-og-vannstandsdata
- https://vannstand.kartverket.no/tideapi_en.html

### 7.4 MET Sunrise

Use MET Sunrise 3.0 or another clearly licensed authoritative calculation/source for:

- sunrise
- sunset
- daylight boundaries

For `first light` / `last light`, define precisely whether the app means civil twilight and document it.

### 7.5 Live camera

The product should support a **“Se livekamera”** action when a legitimate public camera is available.

Rules:

- Camera definitions belong to spot configuration.
- Do not scrape, hotlink, proxy, or embed a camera unless its owner permits that use.
- If embedding is not permitted but linking is, open the official camera page.
- Hide the feature entirely when no approved camera is configured.
- A camera image/video is an observation aid and must not automatically alter the score unless a future explicit computer-vision system is designed and validated.

---

## 8. Provider fallback and resilience

Weather APIs fail.

Implement provider adapters behind interfaces. The app must distinguish:

- fresh forecast
- cached forecast
- stale cached forecast
- unavailable data

If a non-critical variable is unavailable, show the rest of the forecast and lower confidence where appropriate rather than failing the whole page.

Cache server-side according to upstream requirements. Avoid every browser independently hammering public APIs.

Show a small “Sist oppdatert” timestamp.

---

## 9. Spot configuration

A surf spot is data.

Example conceptual shape:

```ts
interface SurfSpot {
  id: string;
  slug: string;
  name: string;
  region: string;
  country: string;

  coordinates: {
    lat: number;
    lon: number;
  };

  timezone: string;

  orientation: {
    shoreNormalDeg: number;
  };

  scoringProfile: {
    swell: DirectionalPreference;
    wind: WindPreference;
    waveHeight: RangePreference;
    period: RangePreference;
    tide: TidePreference;
  };

  skillProfiles: {
    beginner: SkillProfile;
    intermediate: SkillProfile;
    advanced: SkillProfile;
  };

  camera?: CameraConfig;
}
```

Do not hard-code the exact Bore coordinates or optimal direction assumptions from guesswork. Before finalizing Bore's production scoring configuration, verify coordinates and calibrate the spot profile using credible local knowledge/data.

Adding another Jæren beach later should primarily mean:

1. add spot configuration;
2. optionally add spot-specific calibration;
3. no rewrite of the forecast engine.

---

## 10. Bore Score

### Output

Universal score:

- `0.0` through `10.0`
- one decimal place in UI
- internally retain greater precision if useful

The score is **spot-specific**, not a generic “ocean quality” number.

### Inputs

At minimum consider:

- swell height
- swell period / peak period
- swell direction
- secondary swell / mixed swell
- total wave height
- local wind speed
- wind direction relative to beach
- gusts
- tide height
- tide phase/trend
- daylight where relevant to “when should I go?” (do not necessarily penalize physical surf quality simply because it is dark)
- data confidence

Water/air temperature affects comfort/equipment advice, **not wave quality**.

### Architecture

Implement the score as composable deterministic components:

```ts
interface ScoreBreakdown {
  total: number;
  waveSize: ScoreFactor;
  period: ScoreFactor;
  swellDirection: ScoreFactor;
  wind: ScoreFactor;
  tide: ScoreFactor;
  swellQuality: ScoreFactor;
  confidence: number;
}
```

Each factor should expose:

- normalized contribution
- human-readable reason
- raw inputs used

Do not bury unexplained magic numbers across UI code. Scoring thresholds/curves belong in spot configuration or the scoring module.

### Avoid a naive weighted average

Surf conditions have interactions. For example:

- good swell + destructive onshore wind can ruin conditions;
- a long-period swell may make nominal wave height much more powerful;
- a score can be high for advanced surfers while conditions are inappropriate for beginners.

Use penalties/gates/interactions where physically sensible rather than pretending every input is independent.

### Calibration

Initial scoring is a **heuristic model** and should be labeled internally as such.

Keep weights/ranges easy to tune after comparing BoreCast against real days at Bore.

Do not use machine learning for v1.

---

## 11. Score colors

Use accessible colors plus labels; never communicate quality by color alone.

Suggested semantic bands:

```text
0.0–1.9   terrible
2.0–3.9   poor
4.0–5.4   marginal
5.5–6.9   fun
7.0–8.4   good
8.5–9.4   firing
9.5–10.0  exceptional
```

Exact colors are a design-token concern and can be tuned visually.

Do not use a rainbow/AI-gradient aesthetic. Prefer solid colors, texture, typography and restrained accents.

A score of 10 should be genuinely rare.

---

## 12. Skill suitability

The universal Bore Score remains primary.

Also calculate separate **suitability**, not competing “scores,” for:

- beginner
- intermediate
- advanced

Example:

```text
Bore Score 8.7

Nybegynner     Ikke anbefalt
Viderekommen   Bra
Erfaren        Perfekt
```

Suitability considers wave size/power, period, wind, currents if reliable, and other relevant factors.

Do not claim a condition is “safe.” Surfing always carries risk and forecast data cannot determine individual safety.

Explain why:

- “Lang periode og mye kraft.”
- “Rolig vind, men for stort for ferske surfere.”
- “Små, rene bølger — fin dag å lære.”

---

## 13. Human interpretation

Every hourly forecast should produce deterministic interpretation fields such as:

```ts
interface SurfInterpretation {
  headline: string;
  summary: string;
  tags: string[];
  scoreBreakdown: ScoreBreakdown;
  skillSuitability: SkillSuitability;
  windDescription: string;
  swellDescription: string;
  wetsuitAdvice?: string;
}
```

Examples of Norwegian voice:

- `Helt dødt i dag, kompis.`
- `Flatt som faen.`
- `Smått, men clean.`
- `Litt vaskemaskin.`
- `Pent og ryddig.`
- `Bore leverer.`
- `Det fyrer.`
- `Barrel-varsel.`
- `Dette er ikke dagen å lære på.`
- `Ta fri tidlig. Det ser jævlig bra ut.`

Do not overdo slang. Important measurements and explanations stay clear and factual.

Avoid English surf slang where a natural Norwegian expression works. Common established surf terms such as `swell`, `offshore`, `onshore` and `barrel` may be used because Norwegian surfers commonly understand them.

Profanity is permitted, but should feel occasional rather than every screen screaming at the user.

---

## 14. Condition labels

The rules engine should be capable of identifying meaningful conditions such as:

- flat/dead
- tiny learner waves
- beginner-friendly
- clean
- glassy/super smooth
- offshore
- cross-shore
- onshore
- windy
- messy/choppy
- powerful long-period swell
- mixed swell
- pumping/firing
- possible barrel conditions
- too large/powerful for beginners
- night surf window
- unusually warm water / possible “baris” conditions

### Barrel language

Do not claim guaranteed barrels from weather data.

Use wording such as:

- `Barrel-potensial`
- `Forholdene kan gi barrels`
- `Ser ut som en dag for de erfarne`

Barrels depend on bathymetry, banks, exact tide, swell and local conditions that coarse forecast models may not fully resolve.

---

## 15. Wetsuit / water comfort

Display sea temperature prominently in detail view.

Provide deterministic equipment guidance, but frame it as general guidance rather than a safety guarantee.

Possible categories:

- very cold: thick winter suit + likely boots/gloves/hood
- cold
- cool
- mild
- unusually warm

Configuration should be editable rather than scattered constants.

The fun summer state may say something like:

> `Baris? Nå begynner vi å snakke.`

Do not recommend bare-skin surfing solely from a single modeled SST threshold without context. Norwegian water can still be cold enough to matter.

---

## 16. Wind presentation

Summary example:

```text
Ø 3.2 m/s
Offshore · clean
```

Detail:

- speed m/s
- gust m/s
- compass direction
- degrees
- offshore/onshore/cross-shore relative to spot orientation
- effect on surf score

Use vector/angular calculations based on spot orientation rather than hard-coded “east = offshore” statements.

---

## 17. Swell presentation

Summary example:

```text
1.4 m @ 12 s
VNV 285°
Bra vinkel for Bore
```

Detail:

- primary swell
- total wave forecast
- secondary swell when meaningful
- height
- mean/peak period where available
- direction degrees + compass
- interpretation relative to spot

Make the distinction between `wave height` and `swell height` clear in help/explanation UI.

---

## 18. Tide presentation

Show:

- current/forecast tide height
- rising/falling
- next high
- next low
- tide curve for the selected day
- how tide contributes to Bore Score

Do not imply one universal “best tide” until the Bore spot profile is calibrated.

---

## 19. Daylight

Show:

- sunrise
- sunset
- first light
- last light
- darkness on hourly timeline

Do not hide nighttime hours. Users explicitly need a full 24-hour forecast.

Make night visually obvious.

If excellent conditions occur in darkness, say so rather than pretending it is a normal daylight session.

---

## 20. Forecast experience

Provide **7 days**, hour by hour.

### Home / overview

The first screen should answer within seconds:

- Bore Score now / nearest forecast hour
- condition headline
- whether it is worth going
- best surf window today
- key swell/wind values
- water temperature
- skill suitability summary
- next notably good day

Example conceptual hierarchy:

```text
BORE

8.7
DET FYRER

Best 07:00–10:00

1.4 m @ 12 s     Ø 3.2 m/s
VNV swell         Offshore

14 °C vann

Erfaren: perfekt
Nybegynner: nei

[Se timene] [Se livekamera]
```

### Seven-day strip

Show each day's:

- peak/representative score
- best surf window
- concise condition
- enough visual differentiation to scan quickly

A daily score must not simply average 24 hours. Derive it from useful surfable windows and expose the best window.

### Hourly view

All 24 hours:

- score
- swell
- wind
- tide
- daylight/night
- temperature
- concise interpretation

Allow selecting an hour to open full details and score explanation.

---

## 21. “Why this score?” UI

This is a first-class feature.

A user tapping the score should see something like:

```text
Hvorfor 8.7?

Swellretning     Svært bra
Periode          12 s · bra
Størrelse        Bra
Vind             Offshore · +++
Tidevann         Bra
Mixed swell      Lite

Konklusjon:
Clean, kraftig swell og lett offshore. Dette er en
veldig bra Bore-dag, men ikke spesielt nybegynnervennlig.
```

Prefer explanations over fake mathematical precision such as “wind contributed exactly 17.31%.”

---

## 22. Best-window algorithm

Calculate useful continuous windows rather than merely selecting the single highest-scoring hour.

A best window should consider:

- score threshold
- continuity
- duration
- daylight unless user is viewing night explicitly
- abrupt degradation
- confidence

Examples:

- `Best 07:00–10:00`
- `Bra fra 18:00 til sent`
- `Kort vindu rundt 14:00`

Do not hide a better nighttime window; label it as night.

---

## 23. Notifications

Design notification domain models now.

Required user-configurable concepts:

- notify when Bore Score exceeds a threshold
- notify when conditions become beginner-friendly
- notify for exceptional/firing conditions
- optional barrel-potential alert
- morning/day-ahead surf alert
- configurable quiet hours
- notification permission state

Example:

```ts
interface AlertRule {
  id: string;
  spotId: string;
  enabled: boolean;
  type: 'score_threshold' | 'beginner_friendly' | 'firing' | 'barrel_potential' | 'morning_summary';
  threshold?: number;
}
```

### Web

Implement Web Push/PWA notifications only using supported browser mechanisms and explicit user permission.

iOS web push has platform requirements; detect capability and explain installation/permission requirements rather than presenting a broken button.

### Native later

The shared alert model should work with Expo/React Native. Native delivery can use Expo Notifications/APNs/FCM later.

### Important architecture note

Reliable alerts while the user's device/browser is closed require server-side scheduling/evaluation and push infrastructure. `localStorage` alone cannot accomplish this.

Therefore:

- preferences may be local;
- v1 can include full notification support if a minimal server-side subscription/scheduler store is required;
- do not add user accounts merely to implement notifications;
- identify devices/subscriptions with random opaque IDs, not personal accounts.

Never expose push secrets in the client.

---

## 24. PWA

The web app should be installable where supported.

Include:

- manifest
- icons
- sensible standalone display
- service worker strategy
- offline shell / graceful cached state
- install guidance only where useful

Do not make PWA behavior compromise normal website behavior.

---

## 25. History

Where provider licensing and API availability permit, support historical conditions/forecast data.

Potential uses:

- past daily Bore Scores
- compare today with recent days
- calibration/debugging of scoring model

Do not download or persist enormous historical datasets for v1 without a clear product use.

Keep history provider interfaces separate from forecast interfaces.

---

## 26. Live camera UI

If configured:

```text
[ Se livekamera ]
```

Possible detail:

- camera owner/source
- last update if known
- external/embedded indicator

Never label a stale still image as live.

---

## 27. Map

Include a useful, restrained spot map if practical.

It may show:

- Bore location
- coastline/spot marker
- swell direction arrow
- wind direction arrow

The map should explain direction visually, not become a generic map feature.

No AI-generated map imagery.

---

## 28. Design direction

Visual direction:

**playful surf/skate aesthetic + minimalist native feel**

Avoid:

- generic AI/SaaS look
- excessive gradients
- glowing blobs
- glassmorphism everywhere
- corporate dashboard appearance
- dozens of cards inside cards

Prefer:

- strong typography
- generous whitespace
- simple surfaces
- solid semantic score colors
- subtle surf/skate personality
- small hand-drawn/sticker-like accents only where tasteful
- tactile buttons
- excellent mobile layout
- system/native-feeling interaction
- dark mode and light mode if it can be done cleanly

The forecast must remain highly readable outdoors on a phone.

Use icons where they genuinely improve scanning.

---

## 29. Language

Primary UI language: **Norwegian Bokmål**.

Keep user-facing strings centralized so localization can be added later.

Code, identifiers, comments and technical documentation should be in English.

Examples:

- `I dag`
- `Neste 7 dager`
- `Beste tidspunkt`
- `Hvorfor denne scoren?`
- `Vind`
- `Swell`
- `Tidevann`
- `Vanntemperatur`
- `Soloppgang`
- `Solnedgang`
- `Se livekamera`

---

## 30. Humor rules

BoreCast should have personality without obscuring information.

Good:

- short punchline near a clear score
- occasional local/surfer phrasing
- slightly irreverent notifications
- context-sensitive copy

Bad:

- random joke every hour
- profanity replacing actual explanation
- fake certainty
- insulting beginners
- jokes in safety-critical/error messages

Build copy as deterministic catalogs selected by condition tags, score band and context. Avoid returning exactly the same line every day; multiple approved variants per state are fine.

Example notification variants:

```text
Bore våkner i morgen.
8.6 fra 07–10. Lett offshore. Du vet hva du må gjøre.

Det fyrer før jobb.
Bore 9.0 kl. 07. Kaffen får vente.

Flatt som faen.
Sov videre.
```

---

## 31. Safety and uncertainty

This app is a surf forecast aid, not a safety system.

Never claim:

- “safe”
- guaranteed wave size at the beach
- guaranteed barrels
- guaranteed currents
- exact live conditions from model forecasts

Where appropriate include concise disclaimer/help copy:

- forecasts can be wrong;
- conditions can change quickly;
- users must assess their own ability and actual conditions.

Do not plaster warnings over the main UI.

---

## 32. API/security rules

- API secrets only on server.
- `.env*` secrets excluded from Git.
- commit `.env.example`.
- public provider URLs are fine; private keys are not.
- validate upstream responses.
- set request timeouts.
- handle malformed/partial responses.
- cache responsibly.
- sanitize any externally sourced text.
- avoid unnecessary collection of personal data.
- no account/profile tracking in v1.
- document attribution requirements in the UI/footer/about view.

---

## 33. Time and units

Canonical:

- timezone: configured per spot; Bore uses `Europe/Oslo`
- display time in spot-local time
- meters
- seconds
- m/s
- °C
- degrees + compass labels

Be rigorous around DST.

Provider timestamps should be parsed as actual instants, not manipulated as strings.

---

## 34. Data freshness

Expose:

- forecast generated/updated time where provider supplies it
- BoreCast fetch/cache time
- stale state

Do not refetch every render.

The server should aggregate provider data into a single normalized endpoint for the frontend.

Conceptually:

```text
MET weather --------\
Open-Meteo marine ---+--> provider adapters --> normalized timeline
Kartverket tide -----+                         --> surf engine
Sun/daylight --------/                         --> BoreCast API
                                                  |
                                                  v
                                                UI/PWA
```

---

## 35. Testing philosophy

Avoid testing bloat.

Required:

- TypeScript strict mode
- linting/formatting
- a small number of focused unit tests for **surf-engine math and boundary cases**
- tests for direction normalization and score clamping
- provider parser tests using small saved fixtures where useful

Do not:

- chase arbitrary coverage percentages
- snapshot every component
- write trivial tests that merely repeat implementation
- build a huge E2E suite before it protects real behavior

Before considering work complete:

- TypeScript compilation succeeds
- production build succeeds
- lint succeeds
- relevant focused tests succeed

Codex should fix failures caused by its changes rather than ignoring them.

---

## 36. Cross-platform development rules

Everything must work on Windows and macOS.

Use:

- Node.js LTS
- pnpm
- VS Code-compatible tooling
- cross-platform Node scripts

Avoid package scripts such as:

```json
"bad": "rm -rf dist && FOO=bar command"
```

Prefer Node APIs or cross-platform packages when shell behavior differs.

Do not assume:

- `/tmp`
- POSIX path separators
- executable `.sh` scripts
- GNU-only utilities
- case-sensitive filesystem

CI should run at least on a Linux runner; if practical add a Windows build job because Windows is a primary development platform.

Native iOS builds will necessarily require macOS/Xcode later; shared packages and web code must remain platform-neutral.

---

## 37. Developer experience for a C++ developer new to web

Keep the code explicit.

Prefer:

- typed domain objects
- pure functions
- small modules
- obvious data flow
- documented boundaries
- dependency injection/interfaces at provider boundaries

Avoid:

- clever React abstractions
- excessive custom hooks
- global state libraries without a concrete need
- hidden framework magic where a simple server function works
- deeply nested generic types
- microservices

Add a concise `README.md` with exact commands:

```text
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

Explain environment variables and where the application is served.

---

## 38. Performance

The main forecast should feel immediate.

- server-fetch/cache external data
- minimize client JavaScript
- use Server Components where they genuinely help
- lazy-load heavy map/camera functionality
- avoid shipping charting libraries merely for simple SVG lines
- optimize for mobile
- avoid unnecessary polling

---

## 39. Accessibility

- score color always has text/number
- adequate contrast
- keyboard-accessible controls
- semantic HTML
- readable font sizes
- respect reduced motion
- charts have textual equivalents
- direction arrows are accompanied by degrees/labels

---

## 40. Suggested pages/views

Keep navigation small.

### `/`

Main Bore dashboard:

- current/nearest score
- headline
- best window
- key conditions
- skill suitability
- seven-day forecast
- hourly timeline
- notification CTA
- live camera CTA if available

### `/forecast/[date]` or equivalent stateful detail

- 24-hour timeline
- score details
- swell/wind/tide/daylight
- best window

### `/conditions/[timestamp]` or modal/sheet

- full raw conditions
- “why this score?”
- skill details
- wetsuit guidance

### `/alerts`

- local alert rules
- notification permission/setup

### `/about`

- what Bore Score means
- data sources/attribution
- uncertainty/disclaimer
- app version

A separate route is not required for every conceptual view if sheets/modals provide a better mobile experience.

---

## 41. V1 definition of done

The web release is considered complete when a user can:

1. Open BoreCast and immediately understand current/near-current Bore quality.
2. See a 0–10 Bore Score with semantic color and Norwegian interpretation.
3. See the best surf window.
4. Browse seven days.
5. Inspect every hour, including nighttime.
6. See wind speed/direction and offshore/onshore interpretation.
7. See wave/swell height, period and direction.
8. See tide and tide trend/events.
9. See sea temperature and wetsuit/comfort guidance.
10. See sunrise/sunset/daylight.
11. See beginner/intermediate/advanced suitability.
12. Open “why this score?” and understand the main contributors.
13. Install the site as a PWA where supported.
14. Configure supported surf alerts/notifications.
15. Open an approved live camera when one exists.
16. See a useful spot/direction map if the implementation has reliable map data.
17. Use the site comfortably on mobile and desktop.
18. Receive graceful cached/error behavior if one provider fails.
19. See correct source attribution.
20. Build the repository on Windows and macOS without changing source code.

Do not defer core surf information to a hypothetical “v2.”

---

## 42. Initial implementation sequence for Codex

When starting from an empty repository, proceed in this order:

### Phase A — foundation

1. Create pnpm workspace.
2. Create Next.js TypeScript web app.
3. Configure strict TypeScript, lint/format, cross-platform scripts.
4. Create domain/weather/spot/surf-engine modules.
5. Add Bore spot config with clearly marked calibration values.
6. Add README and `.env.example`.

### Phase B — data

7. Implement MET Locationforecast server adapter.
8. Implement Open-Meteo Marine adapter.
9. Implement Kartverket tide adapter.
10. Implement daylight provider/calculation.
11. Normalize data onto one hourly timeline in `Europe/Oslo`.
12. Add caching, timeout, stale-data handling and attribution metadata.

### Phase C — intelligence

13. Implement directional utilities.
14. Implement Bore Score.
15. Implement skill suitability.
16. Implement best-window detection.
17. Implement deterministic Norwegian copy engine.
18. Implement wetsuit/temperature guidance.
19. Add focused surf-engine tests.

### Phase D — product UI

20. Build mobile-first dashboard.
21. Build seven-day view.
22. Build 24-hour detail.
23. Build “why this score?”
24. Add tide visualization.
25. Add direction visualization/map.
26. Add camera configuration/action.
27. Add responsive desktop treatment.
28. Add accessible score color tokens.

### Phase E — install/alerts

29. Add PWA.
30. Implement local alert-rule UI.
31. Implement supported web push architecture, including required server-side subscription/scheduling if real background notifications are promised.
32. Add capability detection and clear iOS/PWA setup behavior.

### Phase F — hardening

33. Verify source licenses/attribution in the deployed UI.
34. Verify production build.
35. Verify Windows commands.
36. Verify macOS-compatible scripts.
37. Test upstream failure/stale cache behavior.
38. Check mobile outdoor readability.
39. Document score calibration knobs.
40. Deploy.

Do not stop after scaffolding. Continue until the v1 definition of done is met unless blocked by an external requirement such as an unavailable/unauthorized camera source or deployment credentials.

---

## 43. Things Codex must not do

- Do not add CMake.
- Do not add C++.
- Do not require Docker for normal local development.
- Do not add authentication without a demonstrated requirement.
- Do not introduce Supabase just because it is common.
- Do not hard-code Bore assumptions throughout components.
- Do not call MET directly from production browser code.
- Do not expose secrets.
- Do not invent live camera URLs.
- Do not scrape cameras without permission.
- Do not use AI to generate forecast copy.
- Do not use AI-generated imagery.
- Do not build a generic purple/blue gradient SaaS dashboard.
- Do not add testing frameworks/coverage infrastructure beyond what protects important logic.
- Do not silently replace missing real data with plausible-looking values.
- Do not call modeled forecast values “live.”
- Do not treat a high score as a safety guarantee.
- Do not make 10/10 common.

---

## 44. Decisions that are intentionally configurable

Do not block implementation waiting for perfect answers to these. Put them in config and document them:

- exact Bore coordinates if not yet verified
- beach orientation
- optimal swell direction window
- ideal tide window
- wave-size scoring curves
- period curves
- beginner/intermediate/advanced thresholds
- score band colors
- wetsuit temperature thresholds
- copy variants
- camera URL/embed policy
- notification default thresholds

Use sensible provisional values only when clearly marked `CALIBRATION_REQUIRED`. Never present unverified local assumptions as established facts.

---

## 45. Future expansion

Architecture should make these possible without polluting v1:

### More spots

`BoreCast` may become a broader `JærenSurfCast`-style product.

A new spot should be primarily configuration plus calibration.

### Native app

Create `apps/mobile` with Expo and reuse:

- domain models
- weather normalized contracts
- surf-engine
- spots
- interpretation/copy rules
- alert models

Web-specific UI stays web-specific. Do **not** contort the Next.js UI today merely to share every button with React Native tomorrow.

### Apple Watch

Potential future glance:

- current score
- next best window
- wind
- swell
- alert

### Widgets

Potential iOS/Android home-screen widgets can consume the same normalized BoreCast API.

---

## 46. Current external-source notes

These notes were verified when this AGENTS.md was authored and must be rechecked if APIs change:

- MET Locationforecast currently provides forecasts for up to nine days and requires proper client identification/User-Agent for server requests.
- MET explicitly recommends respecting caching headers and warns against direct production browser usage patterns that cannot provide the expected User-Agent behavior.
- MET's Nordic forecast region is a priority and uses high-resolution regional modeling for the short range.
- Open-Meteo Marine currently provides hourly wave, wind-wave, swell, secondary/tertiary swell where models support it, SST, currents and modeled sea-level variables, with seven days as the default forecast and longer forecast options available.
- Open-Meteo warns that coastal modeled tide/sea-level accuracy is limited.
- Kartverket's water-level/tide API is open and requires source attribution; excessive polling should be avoided.
- Kartverket states historical water-level data exists for many stations, often back to the late 1980s.
- MET exposes Sunrise 3.0 for sun/moon events.

Before production deployment, read the providers' current terms rather than relying only on this summary.

---

## 47. Product north star

A successful BoreCast screen should not make a surfer interpret meteorology.

It should turn:

```text
swell 1.4 m
period 12 s
direction 285°
wind 3.2 m/s from 95°
tide rising
water 14 °C
```

into something closer to:

```text
8.7 — DET FYRER

Clean swell og lett offshore.
Best 07–10.

Ikke dagen å lære på,
men de erfarne bør komme seg ut.

[Hvorfor 8.7?]
```

Then let the user drill down into every raw number if they want to.

That is BoreCast.
