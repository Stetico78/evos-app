# EVOS Vercel Recovery

Recovery production created on 2026-08-30.

- Project name: `evos-live`
- Production alias: `https://evos-live-evos1.vercel.app`
- Deployment ID: `dpl_4QpR3VYF4ALGHbNBFN2GHqbsAyci`
- Purpose: keep EVOS deployable while the legacy `evos-app` Vercel project remains invisible to the connected Vercel team/API.

## Recovery production routes

- `/` — EVOS landing
- `/receptionist` — simple EVOS lead/service routing
- `/marketplace` — service selection
- `/reserve` — reservation request UI
- `/api/health` — health endpoint

## Source of truth

The full EVOS application remains in this repository. The recovery deployment is an operational bridge, not a replacement for the full marketplace/booking/Supabase codebase.

## Next production step

Migrate the full repository routes and server APIs into the accessible Vercel project, then reconnect environment variables and validate production route-by-route.
