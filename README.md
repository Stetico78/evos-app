# EVOS

EVOS is a lightweight, mobile-first evolution dashboard deployed on Vercel and persisted in Supabase.

## Active product flow

Account → EVOS Test → Evolution Profile → Recommendation → Booking → Follow-up

## Main routes

- `/` — dashboard, authentication, assessment, CRM and EVOS Assistant.
- `/profile` — editable evolution profile, latest scores, trends, history and saved recommendations.
- `/booking` — service catalog, new booking, rescheduling and cancellation.
- `/api/recommend` — validated AI recommendation with a deterministic no-cost fallback.
- `/api/config` — public Supabase client configuration.

## Architecture

- Static HTML/CSS/JavaScript with no build step.
- Vercel serverless functions in `api/`.
- Supabase Auth and Row Level Security for user-owned data.
- Gemini is optional; EVOS continues to return useful recommendations when the model is missing or returns incomplete content.

## Verification

```sh
node --test tests/recommend.test.js
node --check api/recommend.js
git diff --check
```

Production: <https://evos-app.vercel.app>

See `EVOS_STATE.md` for the current roadmap and owner dependencies.
