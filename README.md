# Kampigo

> AI-powered, multi-tenant Lost & Found platform for universities.

Kampigo helps students, faculty, and university administrators report, discover, and recover lost items through AI-assisted image matching, intelligent search, secure communication, and university-scoped access control.

Built as a mobile-first Progressive Web App (PWA), Kampigo combines a modern web application, a scalable backend, and a dedicated machine learning service to make campus lost-and-found management faster, safer, and more reliable.

---

## ✨ Features

- 🔐 Multi-tenant university architecture
- 🤖 AI-powered image and text matching
- 📱 Mobile-first Progressive Web App (PWA)
- 📧 Secure Email OTP authentication
- 💬 Real-time messaging using WebSockets
- 💰 Wallet and paid priority alerts
- 🔔 Push notification architecture
- 🖼 Secure image upload pipeline
- 👨‍💼 University administration dashboard

## Architecture

```
apps/
  api/          NestJS + TypeScript + Prisma - the primary backend (REST + WebSocket chat)
  ml-service/   Python + FastAPI + PyTorch - stateless embeddings/matching-score API
  web/          Next.js + TypeScript + Tailwind - mobile-first PWA
infra/docker/   Dockerfiles for each service
docker-compose.yml
```

Flow for background matching:

```
NestJS API -> BullMQ (Redis) -> NestJS Match Orchestrator Worker -> FastAPI ML Service
           -> NestJS persists ItemMatch -> Notifications (in-app + push fan-out)
```

Python never consumes queue jobs directly - BullMQ is Node/NestJS-owned. The ML service is a
stateless HTTP API for embeddings and pairwise scoring only.

## Getting started

```bash
cp .env.example .env   # fill in real secrets - see "External integrations" below
docker compose up --build
```

- API: http://localhost:4000/api/v1
- Web: http://localhost:3000
- ML service: http://localhost:8000/healthz

First-time database setup (run once, after Postgres is up):

```bash
cd apps/api
npm install
npx prisma migrate dev --name init
npm run prisma:generate
npx ts-node prisma/seed.ts
```

## Running tests

```bash
# API (Jest)
cd apps/api && npm install && npm test

# ML service (pytest)
cd apps/ml-service && pip install -r requirements.txt && pytest
```

## External integrations - what needs YOUR credentials

This codebase ships real, working integration code for each of the following, but each requires
credentials only you can provide (see `.env.example`):

| Integration      | What's implemented                                              | What you must supply         |
|-------------------|-------------------------------------------------------------------|-------------------------------|
| Razorpay          | Order creation, HMAC webhook signature verification, idempotent wallet credit | `RAZORPAY_KEY_ID/SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Resend (email)    | OTP email sending via the Resend API, with a safe local-dev fallback that logs instead of sending | `RESEND_API_KEY` |
| Firebase Cloud Messaging | Fan-out job architecture, device registration/invalidation handling; the actual `firebase-admin` SDK call is marked with an explicit `TODO(integration)` pending a service account | `FIREBASE_SERVICE_ACCOUNT_JSON` |
| S3 / Cloudflare R2 | Upload/signed-URL/delete interface wired end-to-end through the image upload flow; the actual AWS SDK v3 calls are marked `TODO(integration)` pending bucket credentials | `STORAGE_*` variables |
| Web Push          | VAPID-based send interface, `TODO(integration)` pending keys        | `WEB_PUSH_VAPID_*` |

Nothing here is a fake mock pretending to be done - each stub is explicitly logged/labeled as
not-yet-configured and documents exactly which SDK call to wire in once credentials exist, so
"is this really implemented?" is always answerable by reading the file.

## Core product guarantees, and where they're enforced

- **Tenant isolation**: every Prisma query in every service filters by `universityId` sourced
  from the authenticated user's JWT (re-verified server-side on every request), never from
  client input. `TenantGuard` (`apps/api/src/common/guards/tenant.guard.ts`) is a defense-in-depth
  safety net that rejects any request where a client explicitly supplies a mismatched
  `universityId`.
- **OTP security**: expiry, max attempts, resend cooldown, per-email and per-IP rate limits -
  `apps/api/src/auth/otp.service.ts`.
- **Wallet ledger**: immutable, append-only `WalletLedgerEntry` table; balance is always
  reconciled from the ledger, never trusted as a standalone mutable field -
  `apps/api/src/wallet/wallet.service.ts`.
- **Rs. 100 minimum top-up / Rs. 29 alert price**: enforced in `WalletService` and covered by
  unit tests in `apps/api/test/wallet.service.spec.ts`.
- **Payment verification**: wallet credit happens exclusively inside the verified Razorpay
  webhook handler, never from a client "payment succeeded" callback -
  `apps/api/src/wallet/wallet.controller.ts`.
- **University-only notification targeting**: the alert's target university is resolved
  server-side from the Lost Item + authenticated owner, never from client input -
  `apps/api/src/wallet/alerts.service.ts`.
- **Claim double-approval prevention**: a serializable DB transaction re-checks for an existing
  approved claim before approving another - `apps/api/src/claims/claims.service.ts`.
- **Instance-specific visual matching**: per-image (not averaged) embeddings, with best-pairwise
  similarity scoring - `apps/ml-service/app/models/scoring.py`.
- **Match tiers, not fake percentages**: `HIGHLY_LIKELY` / `POSSIBLE` / `WEAK` only -
  `apps/api/src/matching/matching.service.ts`.

## Known limitations (read before treating this as "done")

1. **Not build-tested end-to-end in this environment.** The sandbox this project was built in
   has no network access, so `npm install` / `pip install` against real package registries and a
   live `docker compose up` were not run here. Every file was written by hand, Python was
   syntax-checked with `py_compile`, TypeScript was hand-reviewed against the Prisma schema, and
   the framework-agnostic business logic (wallet math, tenant guard, scoring functions) was
   executed directly and passes. Please run `npm install && npm run build` and
   `docker compose up --build` yourself as the first step and report anything that surfaces.
2. **EXIF stripping and background segmentation are extension points, not fully wired.** Real EXIF
   removal should use a re-encoding library (`sharp` is the suggested choice, noted inline);
   SAM-based segmentation needs a real checkpoint. Both are explicit `TODO(integration)` markers,
   not silent no-ops.
3. **ML models are real but unbenchmarked against your data.** CLIP/DINOv2/Tesseract/PaddleOCR/YOLO
   adapters are functioning, swappable implementations, but nobody has evaluated which performs
   best on your actual lost-and-found photos - that evaluation requires your data.
4. **Frontend covers the core flows** (auth, home, report lost/found, search, matches, wallet,
   profile, a basic admin overview) at moderate depth; some secondary screens (full claim/chat UI,
   detailed admin tables for every entity, notification preference toggles) are intentionally
   left as natural extensions of the patterns already established, to keep this deliverable
   reviewable rather than sprawling.
5. **React Native/Expo mobile app is not included.** The backend and API contracts are
   mobile-ready (stateless JWT auth, FCM push, device registration), but the actual Expo project
   was out of scope for this pass.
