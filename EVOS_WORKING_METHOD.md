# EVOS Working Method

This document is the permanent project rule for EVOS product development.

## Core principle
Do not implement features mechanically. Before proposing a version as ready, evaluate it from three perspectives:
1. Customer using it for the first time.
2. EVOS operator who must execute and control the work.
3. Business owner who needs reliability, margin, traceability and repeatability.

## Required workflow
1. Understand the real business outcome.
2. Design the complete end-to-end process before polishing UI.
3. Build the smallest usable version.
4. Test it as a real customer with natural, messy language.
5. Test it as an EVOS operator, including delays, corrections and exceptions.
6. Proactively identify missing data, confusing steps, duplicated questions, unsafe assumptions and revenue leaks.
7. Propose improvements before waiting for user feedback.
8. Only call a feature ready when the whole critical flow works.

## Conversation design
- Extract every usable fact from the customer's free-text message before asking another question.
- Never ask again for information already provided unless it is ambiguous or must be explicitly confirmed.
- Ask one clear question at a time when possible.
- Keep a warm, human, concise receptionist personality.
- Never claim the record is complete while required information remains missing.
- Each operational field must be Confirmed, Not required, or Pending.

## Portes & Montajes quote lifecycle
1. Conversation starts.
2. EVA extracts and stores work data.
3. EVA asks only missing/ambiguous information.
4. Customer confirms complete work sheet.
5. EVOS saves request and assigns quote/reference number.
6. Status: Awaiting EVOS validation.
7. Operator validates route/distance, availability, operational difficulty and final price.
8. Customer receives validated quote.
9. Customer can Accept, Request changes, or Decline.
10. On Accept: status Pending payment; payment link is issued.
11. On successful payment: status Work confirmed.
12. Chat and quote history remain attached until work resolution.
13. Operator marks work Completed.
14. Customer receives completion message and rating/review request.
15. Approved completion can trigger a loyalty/referral reward or cross-service EVOS offer.

## Pricing rule
Never show an invented wide price range as if it were a real quote. If route, distance, volume or operational conditions have not been validated, show 'Pending EVOS validation'. Final quote must be one explicit price or a clearly defined contractual formula.

## Data expected for Portes & Montajes
- Service type.
- Full origin: country, city, street, number, floor/door where relevant.
- Full destination: country, city, street, number, floor/door where relevant.
- Origin and destination access: floor, lift, stairs, parking/loading access.
- Requested date and time or time window.
- Flexibility: fixed only / alternative day / alternative time window.
- Objects, package count and approximate volume.
- Largest-item dimensions when relevant.
- Assembly/disassembly requirement.
- Customer first name and surname.
- Phone.
- Email.
- Photos when useful.
- Customer observations or constraints that can simplify the work or affect cost.

## Product rule
EVOS is a platform, not isolated tools. Reuse shared identity, CRM, payments, messaging, rewards, customer history and cross-service benefits across Portes & Montajes, Training and future EVOS services.
