# Mobile App (Delivery & Pickup)

The guest-facing app for outside customers, per
`docs/IMPLEMENTATION_PLAN.md` §7.1.

**This is a PWA, not a native React Native app**, which is what the plan
recommends for real app-store presence. It's built this way for the same
reason as the table PWA and Waiter POS: it needs to be something I can
actually run and verify end-to-end in this environment, and a PWA installs
to the home screen and behaves like an app for everything short of an App
Store listing. Treat this as the functional/API reference for a future
React Native build, not a replacement for one.

## How it works

- **No login** - customers order as guests. There's no customer account
  system in the backend yet, so "remember me" and "your orders" are both
  tracked locally on this device (`localStorage`), not server-side. This
  required two backend fixes: `GET /branches` and `GET /restaurants/:id`
  were staff-only (`JwtAuthGuard`) even though a public storefront
  obviously can't authenticate as staff - now public, same as the menu
  endpoints already were.
- **One restaurant per deployment**: this app is configured via
  `VITE_RESTAURANT_ID` for a single restaurant's own branded app (like
  ordering from one chain's app, not a marketplace across many). It lists
  that restaurant's branches for the customer to pick delivery or pickup
  from - there's no geolocation "nearest branch" matching yet (branches
  don't even store lat/lng today), so it's a plain list.
- **Ordering**: same menu/variant/modifier/cart flow as the table PWA,
  filtered to `availableDelivery`/`availablePickup` items instead of
  `availableDineIn`. Placing an order calls the same `POST /orders` used
  by every other channel, with `channel: mobile_delivery` or
  `mobile_pickup` and no `tableId` - kitchen routing works identically
  regardless of channel, and the Kitchen Display already labels these
  tickets "Delivery"/"Pickup" instead of a table number.
- **Tracking**: live per-item kitchen status over the same `/orders`
  WebSocket namespace every other app uses.

## Payment

**Cash only, collected at delivery or pickup.** There's no real payment
gateway wired up - the plan itself lists "which payment processor" as an
open decision for the business, and building a card form against nothing
would just be fake functionality. Once a processor is chosen, checkout is
the only place that needs to change.

## Running locally

```bash
cp .env.example .env   # set VITE_RESTAURANT_ID from services/api's seed output
npm install
npm run dev
```

## Not yet implemented

Real online payment, push notifications (no FCM/APNs credentials to wire
up), geolocation-based nearest-branch matching, saved multiple addresses,
promo codes/loyalty, and ratings/reviews - all later-phase items per the
roadmap, not core to placing and tracking a delivery/pickup order.
