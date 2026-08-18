# EVOS Development State

## Current level
Level 2 — Core product construction.

## Completed
- GitHub repository connected to Vercel.
- Supabase project `evos` active.
- EVOS Core v1 schema applied.
- Authentication UI added to the main application.
- EVOS assessment flow added.
- Evolution profile dashboard added at `/profile`.
- User booking module added at `/booking`.
- User-facing service catalog and booking tables created in Supabase.
- Recommendation API added at `/api/recommend`.
- Recommendations can be persisted in `ai_recommendations`.

## Current architecture
Entry → Account → Assessment → Evolution Profile → Recommendation → Booking → Follow-up.

## Next technical priorities
1. Integrate visible navigation from the main dashboard to `/profile` and `/booking`.
2. Add booking cancellation/rescheduling.
3. Add evolution history and score trends.
4. Add professional/admin agenda view.
5. Connect payments after booking flow is validated.
6. Internationalization: locale, country, timezone and currency by user.

## Owner action needed
None at this moment. Only request intervention for credentials, external authorization, cost-bearing services, or irreversible product decisions.
