# EVOS Vercel Recovery

Functional replacement production created on 2026-08-30.

- Project name: `evos-live`
- Production alias: `https://evos-live-evos1.vercel.app`
- Current deployment ID: `dpl_BqaogjKG37ro2bLcVXVQ8sTsFy9j`
- Supabase project: `gzswijcavmkgwqbgtlac`

## Current live flow

- `/` — EVOS landing
- `/receptionist` — searches and ranks the real EVOS marketplace catalogue
- `/marketplace` — loads the 14 currently published marketplace services from Supabase
- `/start` — email/password account creation and login
- `/reserve?ps=<professional_service_id>` — authenticated reservation into `evos_user_bookings`
- `/booking` — signed-in user's EVOS bookings
- `/api/config` — public Supabase client configuration
- `/api/health` — EVOS production health endpoint

## Data verified before deployment

- 14 rows exposed through `evos_marketplace_services`
- 5 active professional availability rows
- `evos_user_bookings` contains marketplace booking, commission snapshot and payment-status fields

## Source of truth

The complete EVOS codebase remains in `Stetico78/evos-app`. The inaccessible legacy Vercel project is no longer a blocker for continued product development. New production work can proceed through `evos-live` while the old project/account linkage is recovered separately.

## Next product priorities

1. Add checkout/payment to reservation.
2. Add WhatsApp confirmation and follow-up.
3. Connect professional notifications and Google Calendar.
4. Replace the compact recovery UI route-by-route with the full EVOS UI from this repository while preserving the working production flow.
