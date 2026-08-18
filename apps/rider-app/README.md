# Rider App

In-house delivery driver phone app, per `docs/IMPLEMENTATION_PLAN.md` §10 -
receive dispatch, update delivery status, hand off to the phone's own maps
app for navigation. Built as an installable PWA (same reasoning as the
mobile customer app: a driver's own phone, not a shared kiosk) rather than
the plan's originally-suggested React Native shell, consistent with every
other client in this project being a web app against the same REST/WebSocket
API.

## How it works

- **Device setup + login**: identical pattern to the Waiter POS - a
  manager/owner signs into a phone once to pick its branch, then it's
  discarded in favor of the driver's own PIN login every shift (same
  `GET /staff/branch/:id/login-options` roster the Waiter POS/KDS use,
  filtered client-side to `role: rider`).
- **On shift toggle**: a driver flips themselves on/off shift from the top
  of the deliveries list. This is the actual gap the plan calls out ("an
  active/off-shift flag") - it needed a new `onShift` column on `Staff`, a
  self-scoped `PATCH /staff/me/shift` (a driver can only ever flip their
  own flag, off a JWT not a param), and the Management Dashboard's driver
  picker now only offers riders who are both active *and* on shift, so
  going off shift here actually removes you from dispatch.
- **Live dispatch**: joins a `driver:{staffId}` room on a new
  `DeliveriesGateway` (namespace `/deliveries`, mirroring the Kitchen/Orders
  gateways' pattern) so a new assignment or a status change from elsewhere
  (e.g. a manager updating it from the dashboard) shows up immediately,
  no polling. `GET /deliveries/me` is scoped off the JWT, not a client-
  supplied driver id, so a driver can only ever list their own deliveries.
- **Delivery detail**: customer name/phone (tap to call), address (tap to
  open the phone's default maps app via a plain Google Maps search URL -
  no maps SDK/API key needed), and the order's items/notes/modifiers
  (`GET /orders/:id`, already public).
- **Status progression**: assigned → picked up → on the way → delivered,
  or failed at any point after pickup. `PATCH /deliveries/:id/status` is
  now ownership-checked server-side - a rider can only move a delivery
  that's actually assigned to them (a manager/admin/owner can move any).
  `POST /deliveries` (creating the record) and `assign-driver` are both
  dispatcher-only, closing a gap where either was previously unguarded/
  guarded inconsistently.

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```

Sign in with the owner account from `services/api`'s `npm run seed` to set
up the device, then add a staff member with role `rider` and a PIN from the
Management Dashboard to sign in as a driver.

## Not yet implemented

Live GPS sharing to the customer's tracking screen, proof of delivery
(photo/signature), and delivery fee display beyond the flat `fee` field
already on the `Delivery` record - all later-phase items per the plan, or
dependent on device GPS/camera APIs this pass didn't need. Automatic
nearest-driver dispatch is also still v1 manual assignment from the
Management Dashboard, as the plan describes.
