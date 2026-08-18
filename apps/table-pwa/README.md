# Table PWA

The customer-facing app for in-restaurant QR/barcode table ordering, per
`docs/IMPLEMENTATION_PLAN.md` §7.2. Guests scan the QR code printed on
their table, land here with no install required, browse the branch's
dine-in menu, and order straight to the kitchen.

## How it works

- The table's QR code encodes `/t/{tableId}?tk={signedToken}`. On load, the
  app calls `GET /tables/:id/scan?tk=...` against the API to validate the
  token (see `src/hooks/useTableSession.ts`) and caches the result so a
  page refresh doesn't need to re-scan.
- Before showing the menu, it checks `GET /orders/active-for-table` — if
  another guest at the same table (or a waiter) already started an order,
  this device joins that order instead of creating a second one. Every
  subsequent "Send to kitchen" either creates the order (first guest) or
  appends to it (`POST /orders/:id/items`, everyone after).
- Once an order exists, the app opens a WebSocket to the API's `/orders`
  namespace and joins the `order:{id}` room, so each item's status
  (queued → cooking → ready) updates live as the kitchen bumps it — no
  polling, no refresh.
- There's deliberately no "Pay" button here: per the confirmed design
  decision, dine-in payment always goes through the cashier, so this app's
  job ends at "food is ordered and being tracked."

## Running locally

```bash
cp .env.example .env   # point VITE_API_URL at the running API
npm install
npm run dev
```

You need a table's real `id` + `qrToken` to open a working session — get
them from the API (`GET /tables?branchId=...` while logged in as an
owner/manager, or from `npm run seed` in `services/api`), then visit:

```
http://localhost:5173/t/{tableId}?tk={qrToken}
```

## Not yet implemented

Delivery/pickup ordering (that's the separate mobile app), split billing,
loyalty/promo codes, and localization — all later phases per the roadmap.
