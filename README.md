# Sorath PG: PG Discovery, Inquiry & Management Website

Built from the *Sorath PG Requirements Gathering & SRS (Draft v1.0)*.
Stack: **Next.js 14 (App Router) + TypeScript, Tailwind CSS, Framer Motion, React Hook Form + Zod, MongoDB (Mongoose), Cloudinary, Vercel-ready.**

## Quick start

```bash
npm install
cp .env.example .env.local     # set ADMIN_EMAIL / ADMIN_PASSWORD / AUTH_SECRET
npm run dev                    # http://localhost:3000
```

With **no `MONGODB_URI`**, the app runs on an in-memory store pre-filled with clearly-labelled **demo data**
(resets on restart). Admin: http://localhost:3000/admin

### Use MongoDB
```bash
# .env.local
MONGODB_URI=mongodb+srv://...
npm run seed        # optional: loads the demo areas/properties; then edit or delete them in /admin
```

## What's included (SRS coverage)

| SRS | Implemented |
|---|---|
| FR-01/02 | Navigation, hero search (gender, multi-area, budget) |
| FR-03 | PG Finder: combined filters, sort, removable chips, clear all, result count, empty state, URL query sync, mobile bottom-sheet |
| FR-04 | Property detail: Stay Cost Snapshot, facilities (included / paid / none), rules, nearby, map link, Trust panel |
| FR-05/06/07 | Inquiry form (Zod client + server validation, honeypot, rate limit), WhatsApp prefilled message, click-to-call, mobile sticky CTA |
| FR-08 | Gallery slider + fullscreen lightbox: swipe, arrow keys, thumbnails, pause, reduced motion |
| FR-09 | Dark/light toggle, system default on first visit, no flash |
| FR-10-12 | Admin: signed-cookie auth (jose), middleware-protected routes + APIs, property/room/facility/media/rules/nearby CRUD, area CRUD, lead status + notes |
| FR-13 | Visit requests with admin confirm / propose another slot |
| FR-14 | Compare up to 3 properties |
| FR-15 | Metro & Nashta Explorer with distance method + last-verified date |
| FR-16 | Metadata, canonical, sitemap.xml, robots.txt, JSON-LD (no fabricated ratings), `noindex` on filtered URLs and admin |
| FR-17 | Cookie-less anonymous event counters on the admin dashboard |
| Extras | Smart PG Match (explains why each result matches), cinematic hero with video + poster fallback |

## Content integrity (per SRS)
- **No invented facts.** `src/lib/sample-data.ts` is demo-only; every property is `verified: false` and the UI says so.
- Unknown rent/deposit shows **"Not confirmed"**. Metro/food distances show their method and **"Not yet verified"** until a date is set.
- Nearby food/shops are labelled as external businesses. Testimonials are intentionally not rendered until permissioned content exists.
- Call/WhatsApp buttons stay hidden until `NEXT_PUBLIC_PHONE` / `NEXT_PUBLIC_WHATSAPP` are set.

## Hero video
Set `NEXT_PUBLIC_HERO_VIDEO` (short compressed mp4/webm) and optionally `NEXT_PUBLIC_HERO_POSTER`.
The poster + gradient scene renders instantly; video loads on idle and is skipped for reduced-motion, Data-Saver and 2G. A "Pause motion" control is included. No audio.

## Structure
```
src/app            routes (public pages, /admin, /api)
src/components     UI (Hero, PGFinder, PGCard, GallerySlider, InquiryForm, SmartMatch, admin/*)
src/lib            types, repo (Mongo + in-memory), filter engine, validators, auth, sample data
scripts/seed.ts    DB seeding
```

## Deploy (Vercel)
Set env vars from `.env.example` (long random `AUTH_SECRET`, strong `ADMIN_PASSWORD`), set `NEXT_PUBLIC_SITE_URL` to your domain, add `MONGODB_URI`.

## Before launch
- Replace demo data with owner-confirmed data; mark properties `verified`.
- Add real photos/video, logo, phone/WhatsApp/email/address.
- Have Privacy/Terms reviewed by a legal adviser; add Search Console + analytics.
- For multi-instance production, swap `src/lib/rate-limit.ts` for Redis/Upstash.
- Confirm the city and areas (Ahmedabad is only a working assumption from the SRS).
