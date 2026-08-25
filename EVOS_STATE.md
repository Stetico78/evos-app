# EVOS Development State

## Current level
Level 5 — Professional marketplace, monetization and production validation.

## Completed
- GitHub repository `Stetico78/evos-app` active.
- Supabase project `evos` connected and healthy.
- EVOS Core schema active with RLS enabled across public tables.
- Authentication UI active.
- Assessment flow active.
- Evolution profile at `/profile`.
- Booking flow at `/booking` with cancellation, rescheduling, validation, timezone support and mobile navigation.
- Recommendation API at `/api/recommend` with persistence in `ai_recommendations` and deterministic fallback.
- Private member dashboard at `/member` with member context for EVOS AI.
- Public acquisition landing at `/landing` with CRM/UTM attribution.
- EVOS social operating system and hourly content generation workflow active in the repository.
- Persistent EVOS plans and memberships exist in Supabase.
- Initial account bootstrapped as EVOS `owner`.
- Owner/admin dashboard active in GitHub.
- Role escalation hardened: users cannot self-promote to professional/admin/owner.
- Admin SECURITY DEFINER RPC execute permissions hardened against anonymous invocation.
- Professional marketplace data model active: `evos_professionals`, `evos_professional_services`, public security-invoker marketplace view and professional availability.
- Public marketplace UI added at `/marketplace` with category filters, professional, modality, duration and price.
- Professional reservation UI added at `/reserve`.
- Professional acquisition/pricing UI added at `/professionals`.
- Professional onboarding now preserves the secure user role and routes applicants to professional validation instead of attempting client-side role escalation.
- Marketplace commission engine active in database trigger with price/duration snapshots and EVOS/professional split.
- Professional time collisions blocked server-side.
- Professional working-hours validation active server-side.
- Verified-professional visibility enforced with RLS.
- Owner professional profile bootstrapped as verified/featured.
- Current marketplace exposes 14 services including tarot, astrology/carta, coaching, training, massage, wellness, relationships, meditation/silence and movement.

## Marketplace economics
Professional plans currently configured:
1. `launch`: 0 EUR/month + 20% on the first completed-client connection, 0% marketplace commission on repeats, 25% on boosted first acquisition.
2. `growth`: 29.90 EUR/month + 12% on first connection, 0% on repeats, 20% boosted first acquisition.
3. `elite`: 59.90 EUR/month + 8% on first connection, 0% on repeats, 15% boosted first acquisition.

The database computes commission from trusted server-side rules, not from browser-submitted fee values.

## Verified tests
- Marketplace commission test: 35.00 EUR Growth first booking -> 4.20 EUR EVOS fee + 30.80 EUR professional net.
- Repeat-client commission test -> 0% EVOS marketplace fee on the next booking with the same professional after a completed session.
- Professional collision test -> overlapping booking rejected server-side.
- Working-hours test -> booking outside professional availability rejected server-side.
- Anonymous visibility test -> only active + verified professional profiles visible.
- Anonymous marketplace view test -> published services readable through security-invoker view.
- Test booking rows cleaned after validation.

## Current architecture
Social / Landing -> Account -> Goal / Assessment -> EVOS Guide -> Marketplace -> Verified Professional -> Reservation -> Follow-up -> Membership -> Owner/Admin Control.

## Business direction
EVOS must monetize while the platform is being built. Priorities:
1. Sell existing EVOS services immediately.
2. Recruit verified professionals and grow service supply.
3. Earn first-connection commissions while leaving repeat marketplace commission at 0%.
4. Grow recurring revenue through professional Growth/Elite subscriptions and member plans.
5. Add payments, payouts and automated fee settlement.
6. Add premium visibility/Boost with transparent acquisition pricing.
7. Build referral, retention and lifecycle loops.

## Next technical priorities
1. Recover/transfer/reconnect the existing production Vercel `evos-app` project into the connected EVOS team.
2. Deploy and visually validate `/marketplace`, `/reserve`, `/professionals`, `/start`, `/booking`, `/member`, `/profile`, `/admin` on production desktop and mobile.
3. Enable/finalize Google OAuth provider configuration and test complete login callback.
4. Make availability visible/selectable in the booking UI instead of allowing invalid datetime choices.
5. Connect Stripe/payment provider for checkout, EVOS commission settlement, professional payout ledger and refunds/cancellations.
6. Add professional self-service profile/service/availability management after verification.
7. Add professional verification evidence, categories requiring credentials, moderation and suspension flows.
8. Add ratings/reviews only after completed bookings.
9. Add professional search/matching by city, modality, language, price, rating and EVOS recommendation.
10. Add direct social/WhatsApp conversion and follow-up integrations when account connections are available.

## Security state
- RLS is enabled on marketplace-facing tables.
- Marketplace public data is limited to active + verified professionals/services.
- User bookings remain owner-record protected and professional read access is scoped to their own bookings.
- Commission amounts are calculated server-side from stored service/plan data.
- Admin RPC anonymous EXECUTE access has been revoked.
- Supabase still has leaked-password protection disabled; enable before wider public launch.
- Some future/unused RLS tables intentionally have no policies and remain closed until their modules are activated.
- Clinical/psychological services must not be published as such without corresponding professional credentials and verification.

## Current blocker
The connected Vercel team `evos` still exposes zero projects. The existing production project/domain `evos-app.vercel.app` cannot currently be managed or inspected through the connected team. GitHub and Supabase changes are real and testable, but production deployment, browser validation and screenshots remain blocked until that Vercel project is transferred/reconnected or a new accessible production project is explicitly created and the domain migrated.

## Universal-platform direction
EVOS is a universal personalized control system for physical, mental, emotional and business evolution, connecting people with verified professionals, services, actions and measurable progress. Trust, history, matching, automation and AI should improve decision quality while memberships, professional subscriptions, commissions, premium visibility and future transaction services monetize the platform.
