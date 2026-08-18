# Restaurant API

The core backend for the restaurant management system, built as a **modular
monolith** (NestJS + MySQL/TypeORM) per `docs/IMPLEMENTATION_PLAN.md`. Every
module here (`restaurants`, `branches`, `staff`, `auth`, `tables`, `menu`,
`kitchen`, `orders`, `payments`, `deliveries`, `accounting`) maps 1:1 to a
future standalone service if/when the system needs to split out of the
monolith — the module boundaries and event contracts (`kitchen.events.ts`)
are deliberately drawn along those lines already, using an in-process event
emitter today in place of the RabbitMQ broker described in the plan.

## What's implemented (Phase 0 + core of Phase 1)

- **Auth**: JWT for staff, two login flows — email/password (owner, manager,
  admin) and staffId+PIN (fast shared-tablet login for waiter, cashier,
  kitchen, rider). RBAC via `@Roles()` + `RolesGuard`.
- **Restaurants / Branches / Staff**: multi-branch from the start — every
  branch-owned row carries a `branchId`.
- **Tables**: signed QR tokens (`GET /tables/:id/scan?tk=...`), QR PNG
  generation for printing table tents.
- **Menu**: categories, items, variants, modifier groups/options, per-channel
  availability (dine-in/pickup/delivery), the "86" availability toggle.
- **Kitchen routing**: every `MenuItem` declares a `kitchenStationId`; every
  `OrderItem` inherits it and carries its own status independent of the
  order's overall status. `KitchenGateway` (WebSocket, namespace `/kitchen`)
  pushes new/updated ticket items only to the station room they belong to —
  this is what makes "pizza → pizza screen, hookah → hookah screen" work.
- **Orders**: create (covers all four channels), add items to an existing
  order (so a waiter can add to a table that's also self-ordering via QR),
  item-level status updates, automatic order-level `ready` once every item
  is done. `OrdersGateway` (namespace `/orders`) gives customer-facing order
  tracking and a live floor view.
- **Payments**: capturing a payment is cashier-role-gated and closes the
  order — waiters can build orders but never take the money themselves.
  Writes an append-only ledger entry via Accounting.
- **Deliveries**: own-driver model only (`driverStaffId` references a Staff
  row with role `rider`) — manual dispatch endpoint, status timeline.
- **Accounting**: append-only ledger, a basic sales summary endpoint that
  feeds the Management Dashboard.

## Not yet implemented (see the roadmap in the plan doc)

Real payment gateway integration (Stripe et al.), bill splitting, inventory/
COGS, printed-ticket fallback, and all of the frontend clients (mobile app,
table PWA, waiter POS, KDS screens, rider app, Management Dashboard) — this
repo currently only has the backend API.

## Running locally

```bash
cp .env.example .env
docker compose up -d mysql redis   # from the repo root
npm install
npm run start:dev
```

First run needs seed data (there's a chicken-and-egg problem: creating a
restaurant/branch normally requires an authenticated Owner, so the very
first one is inserted directly):

```bash
npm run seed
```

This prints the seeded Owner's login email/password, plus the demo
Restaurant/Branch ids and five demo tables with QR tokens to test against.

## Migrations

`DB_SYNC=true` (see `.env.example`) is a local-dev convenience only — never
enable it against a real database. Once the schema stabilizes:

```bash
npm run migration:generate -- src/database/migrations/Init
npm run migration:run
```
