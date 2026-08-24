# EVOS Development State

## Current level
Level 4 — Owner administration, subscriber control and production hardening.

## Completed
- GitHub repository `Stetico78/evos-app` active.
- Supabase project `evos` connected and healthy.
- EVOS Core schema active with RLS enabled across public tables.
- Authentication UI active.
- Assessment flow active.
- Evolution profile at `/profile`.
- Booking flow at `/booking` with cancellation, rescheduling, validation, timezone support and mobile navigation.
- Service catalog and booking tables active.
- Recommendation API at `/api/recommend` with persistence in `ai_recommendations` and deterministic fallback.
- Private member dashboard at `/member` with member context for EVOS AI v0.5.
- Public acquisition landing at `/landing` using the existing CRM endpoint and UTM attribution.
- EVOS social operating system and launch-day schedule added under `social/`.
- Hourly EVOS content generation automation active.
- Persistent EVOS plans and memberships already exist in Supabase.
- Plan codes aligned to `free`, `evolution`, `pro` across plans and memberships.
- Initial account bootstrapped as EVOS `owner`.
- Role escalation hardened: normal users cannot promote themselves to admin/owner.
- Secure admin detection function `is_evos_admin()` added.
- Admin RLS access added for profiles, memberships and user bookings.
- Secure admin RPCs added for role management and membership management.
- Admin member overview RPC added with user, email, role, membership and next-booking data.
- Safety rule added to prevent accidental demotion of the last owner.
- Owner/admin dashboard added at `/admin` in GitHub.

## Current architecture
Social / Landing → Account → Assessment → Member Dashboard → Evolution Profile → AI Recommendation → Booking → Follow-up → Membership → Owner/Admin Control.

## Business direction
EVOS must monetize while the platform is still being built. Priorities:
1. Immediate paid services and pilot programs.
2. Recurring membership.
3. Booking/payment flow.
4. Professional profiles and service marketplace.
5. Commission on successful connections/transactions.
6. Professional SaaS subscription and premium visibility.

## Next technical priorities
1. Bring the existing production Vercel project under the connected EVOS team so deployments and logs can be managed directly.
2. Validate `/admin`, `/member`, `/profile`, `/booking`, `/landing` and EVOS AI against the real production deployment.
3. Add admin agenda actions and booking status controls.
4. Add professional profiles and availability.
5. Add collision prevention and booking confirmation rules.
6. Connect payments to `evos_plans` / `evos_memberships`.
7. Add retention hooks, renewals and lifecycle automation.
8. Add internationalization: locale, country, timezone and currency.
9. Add direct social/WhatsApp conversion and follow-up integrations when account connections are available.

## Security state
- RLS is enabled across public tables.
- Current user-facing tables use own-record policies.
- Admin access is restricted to `owner` / `admin` roles through security-definer functions.
- Supabase security advisor still reports leaked-password protection disabled and some future/unused tables with RLS but no policies; these remain intentionally closed and should be addressed before those modules are activated.

## Current blocker
The Vercel project name `evos-app` already exists, but the connected Vercel team `evos` exposes zero projects and cannot access that existing project. GitHub still references `https://evos-app.vercel.app`. The codebase can continue evolving in GitHub and Supabase, but production deploy/log verification remains blocked until that existing Vercel project is moved, transferred or reconnected to the accessible EVOS team.

## Universal-platform direction
EVOS is a universal personalized control system for physical, mental, emotional and business evolution, connecting people with professionals, services, actions and measurable progress. Trust, history, matching, automation and AI should improve decision quality while memberships, professional subscriptions, commissions and premium visibility monetize the platform.
