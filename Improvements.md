# ManaDriver — Codebase Review & Improvements

_Last reviewed: 2026-05-15 · Branch: `main` · Next.js 16.2.6 / React 19 / Mongoose 9_

## 1. What this project is

**ManaDriver** is a two-sided driver marketplace for India. Customers post driving
jobs (hourly / temporary / permanent, by car type, transmission, city, area, pay);
verified drivers browse, apply, get hired, complete jobs, and both sides rate each
other.

**Stack & architecture**

- **Framework:** Next.js 16 App Router (note: middleware lives in `proxy.ts` — the
  Next 16 rename), React 19, Tailwind v4, ShadCN/base-ui components.
- **Data:** MongoDB via Mongoose 9. Models: `User`, `DriverProfile`,
  `CustomerProfile`, `Job`, `Application`, `Rating`, `Notification`,
  `PasswordResetOtp`.
- **Auth:** JWT access + refresh tokens in httpOnly cookies, Google OAuth (ID-token
  verification), password-reset via emailed OTP (Resend).
- **Storage:** Cloudinary for driver documents.
- **Layering (clean):** route handler → `schemas/*` (Zod) → `services/*` (business
  logic) → `models/*`. Consistent response envelope (`utils/api-response.utils.ts`)
  and typed error hierarchy (`utils/errors.ts`).

The codebase is well-organized and consistent for an MVP. The findings below are
mostly hardening, completeness, and operational-readiness gaps rather than
structural problems.

---

## 2. Priority summary

| # | Area | Issue | Severity |
|---|------|-------|----------|
| S1 | Security | No rate limiting on any auth endpoint | 🔴 Critical |
| S2 | Security | Refresh tokens issued but never used; 7-day access token, no rotation/revocation | 🔴 Critical |
| S3 | Security | Document upload has no size / MIME / content validation | 🔴 Critical |
| S4 | Data | Multi-document writes (account deletion, rating recompute) run without transactions | 🟠 High |
| S5 | Security | Missing security headers (CSP, HSTS, X-Frame-Options, etc.) | 🟠 High |
| S6 | Perf | Job/list queries are unbounded — no pagination | 🟠 High |
| S7 | DX | No tests, no CI, no typecheck/format scripts | 🟠 High |
| S8 | Ops | No production error visibility; logs gated to non-prod only | 🟠 High |
| S9 | Security | No env-var validation at boot; secrets fail late | 🟡 Medium |
| S10 | DX | README is still create-next-app boilerplate | 🟡 Medium |
| — | Various | See section 7 | 🟢 Low |

---

## 3. Critical

### S1 — Add rate limiting to auth endpoints

`/api/auth/login`, `/signup`, `/forgot-password`, `/verify-otp`, and
`/reset-password` have **no throttling**. This allows:

- Password brute-forcing on `login`.
- OTP brute-forcing — the per-OTP attempt cap (`OTP_MAX_ATTEMPTS = 5`) is bypassed
  by simply requesting a fresh OTP repeatedly (`verifyPasswordResetOtp` only ever
  reads the newest unconsumed OTP).
- Email bombing / Resend cost abuse via repeated `forgot-password`.
- Account-enumeration timing on `signup`/`login`.

**Action:** Add IP- + identifier-keyed rate limiting. Options: `@upstash/ratelimit`
(serverless-friendly), or a Mongoose-backed sliding-window collection if you want
zero new infra. Apply in `proxy.ts` for a coarse global cap and per-route for
sensitive endpoints. Suggested limits: login 5/min/IP, forgot-password 3/hr/email,
verify-otp 10/hr/email.

### S2 — Finish the refresh-token flow (or stop issuing refresh tokens)

`signRefresh`/`verifyRefresh` and a 30-day `refreshToken` cookie exist, but:

- There is **no `/api/auth/refresh` route** — the refresh token is dead weight.
- Access tokens last **7 days** (`ACCESS_TOKEN_MAX_AGE`), which is very long for a
  non-revocable token.
- `logout()` in `auth.service.ts` is a documented no-op — a stolen/leaked token
  stays valid for up to 7 days with no server-side revocation.
- `proxy.ts` never refreshes; sessions silently die at the 7-day mark even though a
  valid 30-day refresh token is sitting in the browser.

**Action:** Implement the intended model: short-lived access token (~15 min),
`/api/auth/refresh` that validates the refresh token and re-issues the access
token, and refresh in `proxy.ts` on expiry. Add a `tokenVersion` field to `User`
incremented on logout / password reset so tokens can be invalidated ("log out
everywhere", and forced invalidation after `resetPassword`).

### S3 — Validate uploaded documents

`app/api/driver/documents/route.ts` accepts any `File` with `size > 0` and
`cloudinary.service.ts` uploads with `resource_type: "auto"`. There is no MIME
allowlist, size cap, or magic-byte check. A driver can upload arbitrary large
files / unexpected types, inflating Cloudinary cost and storing untrusted content.

**Action:** Enforce a size cap (e.g. 5 MB), a MIME/extension allowlist
(`image/jpeg`, `image/png`, `application/pdf`), and verify the file signature
(magic bytes) rather than trusting the client-supplied type. Reject early in the
route before hitting Cloudinary.

---

## 4. High

### S4 — Wrap multi-document writes in transactions

`deleteAccount()` (auth.service.ts) performs ~10 sequential
deletes/updates/Cloudinary calls with no MongoDB session. A failure midway leaves
orphaned applications, ratings, notifications, or a half-deleted account. The same
risk applies to job-accept and rating flows that touch multiple collections.

**Action:** Use `mongoose.startSession()` + `session.withTransaction()` for any
operation spanning more than one document/collection (requires a replica set —
MongoDB Atlas provides this by default). Additionally, `recomputeAverageForUsers`
loops `await updateOne` per user — replace with a single `bulkWrite`, and store a
`ratingCount` alongside `averageRating` so the UI can show "(N ratings)" without
re-aggregating.

### S5 — Add security headers

`next.config.ts` only sets `Cross-Origin-Opener-Policy`. Missing: `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Frame-Options` / `frame-ancestors`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.

**Action:** Extend the `headers()` block (or set them in `proxy.ts`). Start CSP in
`Report-Only` mode to avoid breaking the Google sign-in popup and Cloudinary
images, then enforce.

### S6 — Paginate list endpoints

`services/job.service.ts` runs `JobModel.find(query).sort({ createdAt: -1 }).lean()`
with no `limit`/`skip`. As jobs/applications/notifications grow this returns
unbounded result sets and degrades page load. Indexes exist (good: compound index
on `Application {jobId, driverId}`, `Notification {userId, createdAt}`) but the
query shape is still full-collection.

**Action:** Add cursor or offset pagination (`limit` + `createdAt` cursor) to job
browse, applications, and notifications lists. Add field projections to `.lean()`
calls so only needed fields cross the wire. Verify a compound index covers the
driver job-filter query (city + status + jobType + pay range).

### S7 — Establish a test suite and CI

Commit `f5c901c` says "completed all phases + testing" but there are **no test
files** and no test framework. `package.json` has only `dev/build/start/lint`.

**Action:**
- Add Vitest for unit tests on `services/*` and `utils/*` (auth, jwt, bcrypt,
  rating recompute, cascade delete).
- Add Playwright for critical E2E flows (signup → onboarding → post job → apply →
  hire → rate).
- Add scripts: `"typecheck": "tsc --noEmit"`, `"format"` (Prettier).
- Add a GitHub Actions workflow running `typecheck`, `lint`, `test`, `build` on PR.

### S8 — Production observability

`handleError`, `requestPasswordReset`, and `deleteAccount` only log when
`NODE_ENV !== "production"`. In production, server errors and failed Cloudinary
cleanups are **invisible**. `/api/health` returns static `{status:"healthy"}`
without checking the DB.

**Action:** Integrate an error tracker (Sentry or similar) and a structured logger
(pino) with request IDs. Make `/api/health` actually ping MongoDB
(`mongoose.connection.readyState`) so uptime checks are meaningful.

---

## 5. Medium

### S9 — Validate environment at boot

Secrets (`MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, Cloudinary, Resend,
Google client ID) are read ad-hoc and throw only when first used — a missing
secret can pass `build` and fail on the first relevant request in production.

**Action:** Add a Zod-validated `env.ts` parsed once at startup; fail fast with a
clear message listing every missing/invalid variable. Update `.env.example`
(currently missing the Google OAuth client ID variable that `google.utils.ts`
uses).

### S10 — Replace the boilerplate README

`README.md` is the unmodified create-next-app template. New contributors get no
setup steps, env list, architecture overview, or the **critical** note (from
`AGENTS.md`) that this is Next 16 with middleware renamed to `proxy.ts`.

**Action:** Document: prerequisites, `.env` setup, `npm run dev`, the
service/route/model layering, the auth model, and the Next-16 deviations.

### Other medium items

- **Email verification on signup:** only password reset uses OTP; new accounts are
  never email-verified. Add a verification step before `isProfileComplete` or
  before posting/applying to jobs.
- **OTP generation:** `generateOtpCode()` uses `Math.random()` (acknowledged in a
  comment). `crypto.randomInt(0, 1_000_000)` is a one-line drop-in upgrade with no
  downside.
- **Stale OTPs:** old unconsumed OTP rows for an email are never invalidated when a
  new one is issued — invalidate prior unconsumed OTPs on new request.
- **`next/image` for remote avatars:** Google/Cloudinary `avatarUrl` images need
  `images.remotePatterns` in `next.config.ts`; ensure remote images use
  `next/image` for optimization (local auth-page images already do).
- **Per-page metadata / SEO:** only a global title/description exist. Add per-route
  metadata, OpenGraph/Twitter cards, `sitemap.ts`, and `robots.ts`.

---

## 6. Suggested sequencing

1. **Sprint 1 (security hardening):** S1 rate limiting, S3 upload validation, S5
   headers, S9 env validation. Low effort, high risk reduction.
2. **Sprint 2 (auth correctness):** S2 refresh/revocation flow + email
   verification. Touches auth model — do it as one coherent change.
3. **Sprint 3 (data safety + perf):** S4 transactions, S6 pagination.
4. **Sprint 4 (engineering foundation):** S7 tests/CI, S8 observability, S10 docs —
   then make these gates on future PRs.

---

## 7. Low / nice-to-have

- Add Prettier + a pre-commit hook (lint-staged + husky) for consistent formatting.
- Add `ratingCount` to profiles (see S4) and surface it in the UI.
- Confirm `.env.local` was never committed to git history; rotate secrets if it
  was.
- `me()`/`proxy.ts` trust the role baked into the JWT — a role change requires
  re-login. Acceptable for MVP; document it or revalidate role server-side on
  sensitive actions.
- Consider a shared pagination helper and a `withDb`/`withTransaction` wrapper to
  remove repetition across services.
- Accessibility is generally good (icons `aria-hidden`, semantic headings); do a
  formal pass on form labels, focus states, and color-contrast tokens before
  launch.
- Add `loading.tsx` / `error.tsx` route segments where missing for better
  perceived performance and graceful failures.
- Bundle/perf budget: audit `lucide-react` imports are tree-shaken; run a
  Lighthouse pass on the landing and dashboard routes.
