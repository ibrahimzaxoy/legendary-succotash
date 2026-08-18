# Waiter POS

Tablet app for a waiter to pick a table, build an order on a guest's
behalf, and track it through the kitchen — per
`docs/IMPLEMENTATION_PLAN.md` §7.3.

## How it works

- **Device setup (once per tablet)**: a manager/owner signs in to pick the
  branch this tablet belongs to, then their session is discarded — the
  branch choice is all that's kept (`src/pages/DeviceSetup.tsx`).
- **Shift login (every waiter, every shift)**: a "tap your name" picker
  (`GET /staff/branch/:branchId/login-options` — a new, intentionally
  minimal, unauthenticated endpoint that reveals only name/role, never a
  secret) followed by a 4-digit PIN pad. This is the standard shared-tablet
  pattern real POS hardware uses, and it's what makes order attribution
  (`waiterStaffId`) meaningful.
- **Floor view**: every table, color-coded — free, cooking (amber),
  ready (pulsing green), awaiting payment/served, needs cleaning, or
  reserved. Tapping a free table starts a new order; tapping an occupied
  one opens it. This required two backend additions: `PATCH
  /tables/:id/status` (staff can only set free/needs_cleaning/reserved —
  OCCUPIED is system-derived, set automatically when an order is created)
  and `GET /orders/active` (every in-progress order for the branch, one
  query instead of one per table).
- **Ordering**: the same menu/variant/modifier flow as the table PWA,
  adapted for a tablet (docked cart panel instead of a bottom sheet).
  Creating an order for a free table uses `channel: dine_in_waiter`;
  adding to a table that's already got an order (started by a guest via
  QR, or by this waiter earlier) appends to that same order via the
  existing `POST /orders/:id/items` — the exact merge behavior a second
  guest's phone gets from the table PWA.
- **Order detail**: live per-item kitchen status over the same
  `/orders` WebSocket the table PWA uses. "Mark served" is a new
  `PATCH /orders/:id/serve` — the waiter's own signal that food reached
  the table, distinct from the kitchen-driven "ready" status, matching the
  sequence diagram in the plan doc exactly.
- Closing the check and taking payment is deliberately **not** in this
  app — per the confirmed design, only the cashier role does that. A
  served table shows "awaiting payment" until a cashier closes it
  elsewhere, at which point the table auto-flips to `needs_cleaning`.

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```

Sign in during device setup with an owner/manager account
(`npm run seed` in `services/api` creates one), then any waiter accounts
with a PIN set will show up in the staff picker.

## Known limitation

The floor view isn't fully event-sourced yet: kitchen "item ready" events
push an immediate refresh, but a few transitions (a cashier closing a
check on another device, another waiter marking something served) aren't
broadcast over WebSocket yet, so the floor also polls every 20s as a
safety net. Worth adding dedicated events for those later.

## Not yet implemented

Bill splitting, discounts, voiding items, and transferring a table's order
elsewhere — the plan calls these out as permission-gated, audited actions,
and the backend doesn't yet have a reason-code/audit trail for them, so
building fake buttons for them here would be worse than leaving them out.
Also out of scope: offline-first behavior (the plan recommends React
Native + a local queue for this specific app since restaurant Wi-Fi is
unreliable during service — this build is a regular web app, consistent
with the other front-of-house apps so far, and needs that hardening pass
before real deployment).
