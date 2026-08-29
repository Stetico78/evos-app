# EVOS Development State

## Current level
Level 5 — Professional marketplace, monetization and production validation.

## Completed
- GitHub repository `Stetico78/evos-app` active.
- Supabase project `evos` connected and healthy.
- EVOS Core schema active with RLS enabled across public tables.
- Authentication UI, assessment, evolution profile, member dashboard and owner/admin dashboard exist.
- Booking flow at `/booking` supports cancellation, rescheduling, validation, timezone support and mobile navigation.
- Public acquisition landing at `/landing` with CRM/UTM attribution.
- Professional marketplace data model active: professionals, professional services, commission rules, availability and marketplace view.
- Public marketplace UI added at `/marketplace` with category filters, professional, modality, duration and price.
- EVOS AI Receptionist prototype added at `/receptionist` with server route `/api/receptionist`: the client explains what they need, EVOS matches up to 3 real marketplace services and sends the client directly to `/reserve`.
- Receptionist matching uses Gemini when configured and a deterministic EVOS rule-engine fallback when the AI service is unavailable.
- Professional reservation UI added at `/reserve` and now shows habitual availability before booking.
- Professional acquisition/pricing UI added at `/professionals`.
- Marketplace commission engine active server-side with price/duration snapshots and EVOS/professional split.
- Professional time collisions blocked server-side.
- Professional working-hours validation active server-side.
- Verified-professional visibility enforced with RLS.
- Credential gate active for clinical/psychological service categories; uncredentialed professionals cannot publish them.
- Owner professional profile bootstrapped as verified/featured.
- Marketplace currently exposes 14 active professional services including tarot, astrology/carta, coaching, training, massage, wellness, relationships, meditation/silence and movement.
- Admin SECURITY DEFINER functions are no longer executable anonymously; signed-in admin RPCs retain internal `is_evos_admin()` authorization checks.

## Marketplace economics
Professional plans currently configured:
1. `launch`: 0 EUR/month + 20% on the first client connection, 0% marketplace commission on repeats, 25% on boosted first acquisition.
2. `growth`: 29.90 EUR/month + 12% on first connection, 0% on repeats, 20% boosted first acquisition.
3. `elite`: 59.90 EUR/month + 8% on first connection, 0% on repeats, 15% boosted first acquisition.

The database computes commission from trusted stored rules and service prices, not browser-submitted fee values.

## Verified tests — 25 Aug 2026
- Growth first booking test: 70.00 EUR gross -> 12% -> 8.40 EUR EVOS fee + 61.60 EUR professional net. Test transaction rolled back.
- Repeat-client test: after a completed booking with the same professional, next 70.00 EUR booking -> 0% EVOS marketplace fee + 70.00 EUR professional net. Test transaction rolled back.
- Professional collision test: an overlapping booking at 10:30 against an existing 10:00–11:00 booking was rejected server-side; temporary base row removed.
- Working-hours test: a 22:00 booking against configured 09:00–20:00 availability was rejected server-side.
- Credential test: attempting to publish psychology for a professional without a verified psychology credential was rejected server-side.
- Anonymous marketplace-view test: role `anon` can read the 14 active verified published services through the security-invoker view.

## Current architecture
Social / Landing -> Account -> Goal / Assessment -> EVOS Guide / AI Receptionist -> Marketplace -> Verified Professional -> Reservation -> Follow-up -> Membership -> Owner/Admin Control.

## Business direction
1. Sell existing EVOS services immediately.
2. Use EVOS AI Receptionist as the first internal proof of AI-assisted lead qualification and booking conversion.
3. Recruit verified professionals and grow service supply.
4. Earn first-connection commissions while leaving repeat marketplace commission at 0%.
5. Grow recurring revenue through professional Growth/Elite subscriptions and member plans.
6. Add payments, payouts and automated fee settlement.
7. Add premium visibility/Boost with transparent acquisition pricing.
8. Build referral, retention and lifecycle loops.

## Next technical priorities
1. Recover/transfer/reconnect the existing production Vercel `evos-app` project into the connected EVOS team.
2. Deploy and visually validate `/receptionist`, `/api/receptionist`, `/marketplace`, `/reserve`, `/professionals`, `/start`, `/booking`, `/member`, `/profile`, `/admin` on production desktop and mobile.
3. Connect the EVOS AI Receptionist flow to checkout so recommendation -> reservation -> payment can complete without manual handoff.
4. Enable/finalize Google OAuth provider configuration and test the complete callback. Until then email magic-link remains the working login route.
5. Replace free-form datetime booking with selectable generated slots from professional availability for a faster client UX.
6. Connect payment provider for checkout, EVOS commission settlement, professional payout ledger, refunds and cancellations.
7. Add professional self-service profile/service/availability management after verification.
8. Add verified credential administration and moderation/suspension flows.
9. Add ratings/reviews only after completed bookings.
10. Add professional search/matching by city, modality, language, price, rating and EVOS recommendation.
11. Connect social/WhatsApp lead capture and follow-up when corresponding account connections are available.

## Security state
- RLS is enabled on marketplace-facing tables.
- Marketplace public data is limited to active + verified professionals/services.
- User bookings remain own-record protected; professional read access is scoped to their own professional bookings.
- Commission amounts are calculated server-side from stored service/plan data.
- Admin RPC anonymous EXECUTE access is revoked; admin actions still check admin/owner identity internally.
- Supabase leaked-password protection remains disabled and must be enabled before wider password-based public use.
- Some future/unused RLS tables intentionally have no policies and remain closed until their modules are activated.
- Clinical/psychological services are credential-gated and remain unpublished without verified accreditation.

## Current blocker
The connected Vercel team `evos` (`team_4tp93g7yjkepAoTV2QPioIx8`) currently returns zero projects. The existing production domain `evos-app.vercel.app` cannot be managed or inspected through the connected team. GitHub and Supabase changes are real and tested, but production deployment, browser validation and real screenshots remain blocked until that Vercel project is transferred/reconnected or an accessible replacement project is created and the domain is migrated.

## Universal-platform direction
EVOS is a universal personalized control system for physical, mental, emotional and business evolution, connecting people with verified professionals, services, actions and measurable progress. Trust, history, matching, automation and AI should improve decision quality while memberships, professional subscriptions, first-connection commissions, premium visibility and future transaction services monetize the platform.
