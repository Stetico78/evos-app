# EVOS Development State

## Current level
Level 3 — Subscriber experience, intelligent operations and monetization activation.

## Completed
- GitHub repository connected to Vercel architecture.
- Supabase project `evos` active in the application architecture.
- EVOS Core v1 schema applied.
- Authentication UI added to the main application.
- EVOS assessment flow added.
- Evolution profile dashboard added at `/profile`.
- User booking module added at `/booking`.
- Booking cancellation and rescheduling added at `/booking`.
- Booking validation, local timezone and mobile navigation added at `/booking`.
- User-facing service catalog and booking tables created in Supabase.
- Recommendation API added at `/api/recommend`.
- Recommendations can be persisted in `ai_recommendations`.
- Empty AI responses fall back to the EVOS rule engine.
- Each new assessment receives its own persisted recommendation.
- Evolution profile includes editable goal/name, score trends, assessment history, saved recommendations and the next booking.
- Main dashboard links visibly to `/profile` and `/booking`.
- Anonymous reads of profiles, assessments, recommendations and bookings are blocked by Supabase RLS.
- Private member control center added at `/member`.
- Member dashboard aggregates EVOS score, assessments, saved recommendations and future bookings.
- EVOS AI upgraded to v0.5 and can receive current member context: goal, level, latest assessment, latest recommendation and next booking.
- EVOS AI retains a deterministic local fallback so the member dashboard remains useful when the external model is unavailable.
- Public acquisition landing page added at `/landing` for people and professionals.
- Landing leads reuse the existing EVOS CRM endpoint instead of creating a parallel lead store.
- CRM lead creation records same-origin social UTM attribution from the landing page referrer when available.
- EVOS social operating system added under `social/EVOS_SOCIAL_SYSTEM.md`: EVOS is the central brand, the founder account builds authority and Evolution Essence acts as a transformation/wellbeing satellite.
- Launch-day social schedule added under `social/LAUNCH_DAY.md`, balancing Reels/posts with Stories and interaction rather than flooding the feed.
- Hourly EVOS content generation automation configured to alternate client and professional acquisition, with adaptations for the founder personal brand and Evolution Essence.

## Current architecture
Social / Landing → Account → Assessment → Member Dashboard → Evolution Profile → AI Recommendation → Booking → Follow-up → Membership / Retention.

## Business direction
EVOS must monetize while the platform is still being built. Priorities are:
1. Immediate paid services and pilot programs.
2. Recurring membership.
3. Booking/payment flow.
4. Professional profiles and service marketplace.
5. Commission on successful connections/transactions.
6. Professional SaaS subscription and premium visibility.

## Next technical priorities
1. Validate `/member`, `/profile`, `/booking`, `/landing` and EVOS AI with a real authenticated production account and a real lead submission.
2. Restore or connect the production Vercel project to the currently connected EVOS team so deployments and logs can be managed directly.
3. Connect Supabase management access so subscriber status, policies and production data can be administered safely.
4. Add persistent membership records with plan, status, renewal and entitlements.
5. Add owner/admin subscriber dashboard with member search, status, next action and booking overview.
6. Add professional profiles, availability and owner/admin agenda view.
7. Add collision prevention and booking confirmation rules.
8. Connect payments after the member and booking flow is validated.
9. Add retention hooks, renewals and lifecycle automation.
10. Internationalization: locale, country, timezone and currency by user.
11. Add direct social/WhatsApp conversion and follow-up integrations when account connections are available.

## Universal-platform direction
EVOS is intended to become a universal personalized dashboard for physical, mental and emotional evolution, connecting people with professionals and services. Trust, reviews, recommendations, verified history and matching should increase connection quality. EVOS can monetize through memberships, professional subscriptions, commissions and premium visibility.

## Owner action needed
Production deployment management is currently blocked because the connected Vercel team `evos` exposes no projects to the agent, while the repository documentation references `evos-app.vercel.app`. Direct Instagram/Meta account control is not available through the current integrations. Supabase management access also remains an external dependency for database-admin work. Development can continue in GitHub and content generation can continue automatically, but production deploy/log verification, database-admin changes and direct social publishing require the corresponding external connections.
