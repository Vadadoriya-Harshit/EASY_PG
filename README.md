# Luxora PG: PG discovery, inquiry & management website

Next.js 14 (App Router) + TypeScript, Tailwind CSS, Framer Motion, MongoDB (Mongoose / native driver), Nodemailer, Cloudinary (optional).

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (see below)
npm run dev                    # http://localhost:3000   admin: /admin
```

Without `MONGODB_URI` the app runs on an **in-memory demo store** (data resets on restart; the admin sidebar says so).
With it, **a database error is an error**: the site never silently falls back to demo data or writes edits to memory.

For local development without SMTP set `EMAIL_DRIVER=file`: every e-mail (admin codes, vacancy alerts) is written to `./.mail-outbox/*.json` instead of being sent. This driver is refused in production.

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | **production** | 32+ random chars. Signs sessions and e-mail links. There is **no fallback**; admin sign-in does not work in production without it. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first run | Creates the first super admin when the `admin_users` collection is empty. There is **no built-in default password**. |
| `MONGODB_URI` | production | Database. |
| `SMTP_HOST/PORT/USER/PASS`, `SMTP_FROM` | production | Transactional mail (admin OTP, vacancy alerts). |
| `NEXT_PUBLIC_SITE_URL` | production | Absolute links in e-mails, sitemap, canonical URLs. |
| `CRON_SECRET` | optional | Bearer token for `/api/cron/vacancy-notifications` (retry queue). |
| `CLOUDINARY_*` | optional | Signed browser uploads. |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

## Admin authentication

1. Email + password (scrypt hashes; legacy hashes are upgraded on first successful sign-in).
2. 6-digit e-mailed code (CSPRNG, stored only as an HMAC, 5 min lifetime, single use, 5 attempts, 60 s resend cool-down, 5 sends/hour). A short-lived signed challenge cookie proves step 1 was passed.
3. Server-side session record (one active session per account, 4 h max, 30 min idle). Logging out, replacing the session, resetting the password or deleting the user revokes it immediately; a copied cookie stops working.

Every admin route re-checks the session **and the role from the database** (`requireAdmin`). Middleware only performs a cheap signature check. Roles: `superadmin` (users, factory reset, audit log) and `admin` (content, properties, inquiries, vacancy alerts).

Security headers (CSP, HSTS in production, frame/MIME/referrer/permissions policies), same-origin checks on state-changing API calls, rate limits stored in the database (so they hold across serverless instances), an audit log (`/admin/audit`, super admins) that never records passwords, codes or tokens.

## Vacancy e-mail alerts

`subscribe (double opt-in) → confirm → admin sets a room to "Available now" → event → queued e-mails → delivery with retries`

* Visitors subscribe from the footer or a property page (email + consent). A confirmation e-mail must be clicked before anything is sent. Duplicates are merged; answers are identical for new/existing addresses.
* Every e-mail carries one-click unsubscribe (`List-Unsubscribe` + a confirm page; GET never unsubscribes).
* An alert is created only on a real transition: an existing room going from *from-date/unknown* to *now* on an active property. Re-saving an already available room, creating a brand-new room, or draft properties never send. Each (event, subscriber) pair is unique, so retries can not double-send.
* Failures are recorded and retried with back-off (up to 5 attempts). **Admin → Vacancy alerts → Notification log** shows every event and recipient and has a retry button. For unattended retries call `GET /api/cron/vacancy-notifications` with `Authorization: Bearer $CRON_SECRET` from any scheduler (Vercel Cron, GitHub Actions, ...).

## Content management

Everything public that is meant to be edited lives in **Admin → Visual CMS** (navigation, hero slides, amenities, FAQ, about page, contact/branches/footer, SEO title/description/share image) and **Properties** (rooms, rent, availability, photos). Saves revalidate the site: no redeploy. Lists can be reordered by dragging, with the keyboard (focus the grip, arrow keys) or with the up/down buttons; the **Homepage Layout & SEO** tab reorders and hides whole homepage sections. A preview pane shows the last saved version.

## Form builder (Admin → Forms & responses)

Build forms by choosing fields (text, long text, email, phone, number, date, dropdown, radio, checkbox, multiple choice, file upload, section heading), drag them into order (or use the arrow buttons / keyboard), set label, placeholder, help text, default value, required/optional, min/max rules, conditional visibility ("show only when…") and live choices (localities, properties, room types read from your data). A live preview sits beside the builder. Publish to expose `/forms/<address>`; responses, CSV export and file downloads are in the *Responses* tab. Starter templates: enquiry, visit booking, feedback.

* The **same validation code** runs in the browser (inline errors) and on the server (the only trusted check): required/optional, email, 10-digit mobile, numbers, dates, option membership, hidden fields ignored, unknown keys dropped.
* **Uploads**: PDF/JPG/PNG/WebP, 2 MB each, max 3 per field, checked by real file content (magic bytes), stored privately and downloadable only by admins. Files live in the database, so keep volumes small or move them to object storage for heavy use.
* Duplicate submissions (same answers within 10 minutes) are refused, double clicks send one request, honeypot and IP rate limit protect the public endpoint.

## Mobile card slider, OTP screen

`MobileCardSlider` shows exactly one full-width card per step below 640 px (swipe, arrows, dots, keyboard) and the original grid above. The admin sign-in code screen uses six accessible boxes (auto-advance, paste, backspace/arrow keys) and a circular progress ring inside the Verify button that is shown only while the real request is pending.

## SEO (Ahmedabad)

Landing pages built from your live data (no invented claims): `/pg-in-ahmedabad`, `/pg-in-ahmedabad/single-sharing|double-sharing|triple-sharing`, plus boys/girls and per-locality pages, all with unique titles/descriptions, one H1, canonical URLs, breadcrumbs, JSON-LD (LodgingBusiness, WebSite, BreadcrumbList, ItemList, FAQPage) and links between them. Sitemap and robots are generated; admin, forms and vacancy utility pages are noindex. Search Console submission, PageSpeed/Lighthouse and the Rich Results Test must be run by you against the deployed domain.

## Tests

```bash
npm run typecheck
npm run lint
npm test            # 37 unit tests: password hashing, OTP rules, vacancy pipeline, validators
npm run test:e2e    # starts a real dev server on :3101 with no database/SMTP and drives the HTTP API (auth, OTP, roles, vacancy alerts, CMS, drag-and-drop persistence)
npm run test:prod   # builds, then runs the production build against an unreachable DB / no SMTP / no AUTH_SECRET
npm run build
```

The e2e suite never touches a real database or mail server (it blanks `MONGODB_URI`/`SMTP_*` and writes mail to a temp folder). The MongoDB code path is not exercised by these tests; run a staging smoke test against a throw-away database before go-live.

## Deploy

Set the environment above, `NEXT_PUBLIC_SITE_URL` to your domain, serve over HTTPS. Rotate any credential that was ever shared in a zip, chat or repository.
