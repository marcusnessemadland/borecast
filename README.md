# BoreCast

BoreCast is a production-oriented surf forecast web app for Borestranda on Jæren. It combines atmospheric weather, marine forecasts, tides and daylight into an explainable, deterministic **Bore Score (0.0–10.0)**.

The UI is Norwegian Bokmål. Code and technical documentation are English.

## Requirements

- Node.js 20.9 or newer (Node.js LTS recommended)
- pnpm 10

## Start locally

```text
pnpm install
Copy-Item .env.example apps/web/.env.local    # Windows PowerShell
pnpm dev
```

On macOS, use `cp .env.example apps/web/.env.local` instead. Open <http://localhost:3000>.

Set `MET_USER_AGENT` in `apps/web/.env.local` to a real project URL and contact address. MET Norway rejects anonymous or generic clients. To inspect the complete product without calling providers, set `BORECAST_DEMO_MODE="true"`; the UI labels all generated values as demo data.

## Commands

```text
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

The commands are Node-based and work in PowerShell on Windows and a standard shell on macOS.

## Repository

```text
apps/web               Next.js App Router UI, aggregate API and PWA shell
packages/domain        Framework-neutral domain models
packages/spots         Data-driven surf spot configuration
packages/surf-engine   Pure score, interpretation, suitability and window logic
packages/weather       Provider adapters, parsers, normalization and cache
docs                   Architecture, scoring and provider notes
```

## Forecast API

`GET /api/forecast` returns the provider-neutral seven-day timeline, scored conditions, source state and attribution. Browser components never consume provider JSON directly.

## Important limitations

- The Bore profile is an initial heuristic calibration, not a learned or validated physical model.
- Forecasts are not observations or a safety system.
- Alert rules and browser permission are implemented local-first. Reliable push delivery while a browser is closed still requires a durable subscription store, VAPID configuration and a scheduled server evaluator.

See [architecture](docs/architecture.md), [scoring](docs/scoring.md) and [data sources](docs/data-sources.md).
