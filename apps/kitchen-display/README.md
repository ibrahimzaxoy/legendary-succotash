# Kitchen Display

The wall-mounted, per-station screen described in `docs/IMPLEMENTATION_PLAN.md`
§8. One of these runs at each kitchen station (Pizza, Hookah, Grill, Bar,
Expo, ...) and shows only the tickets routed to that station.

## How it works

- **Setup (once per device)**: sign in with a manager/owner/kitchen
  account, pick the branch (skipped if the signed-in staff member is
  already scoped to one branch), then pick which station this screen is.
  That choice is persisted to `localStorage` along with the access/refresh
  tokens, so the device stays signed in indefinitely - a KDS is a shared
  kiosk, not something kitchen staff log into per-shift.
- **Routing**: on load it fetches `GET /orders/stations/:stationId/items`
  for its station's currently queued/cooking tickets, then opens a
  WebSocket to the API's `/kitchen` namespace and joins
  `station:{branchId}:{stationId}` - the same room the backend's
  `KitchenGateway` publishes new/updated ticket items into. A screen only
  ever receives events for its own station's room, which is the actual
  mechanism behind "pizza tickets go to the Pizza screen, hookah tickets go
  to the Hookah screen."
- **Bumping**: tapping a ticket's action button advances it
  queued → cooking → ready via `PATCH /orders/items/:id/status`, applied
  optimistically and rolled back if the request fails. A ticket that
  reaches "ready" stays visible (with a checkmark) for a few seconds as
  visual confirmation, then clears itself off the rail.
- **Urgency escalation**: each ticket's border/timer chip shifts
  neutral → amber → red the longer it's been waiting (5 / 10 minute
  thresholds), so an aging ticket is visible from across the kitchen
  without anyone having to read the clock on the card.
- **Session refresh**: access tokens are short-lived (15 min); the API
  client transparently trades the stored refresh token for a new pair on
  a 401 and retries once, which is what lets a device stay logged in for a
  full shift (or longer) unattended.

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```

Sign in with a manager/owner/kitchen-role account that has kitchen
stations set up for its branch (`npm run seed` in `services/api` creates a
demo Owner and a full set of stations).

## Not yet implemented

Per-item prep-time-aware urgency thresholds (currently fixed 5/10 minute
tiers), a printed-ticket fallback for full outages, and the Expo/pass
aggregation view that shows a whole order across every station at once -
all later refinements per the roadmap.
