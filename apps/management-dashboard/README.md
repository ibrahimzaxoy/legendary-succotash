# Management Dashboard

Owner/admin/manager back-office, per `docs/IMPLEMENTATION_PLAN.md` §12 and
the Management Dashboard callouts throughout the plan - menu & pricing,
tables, staff, live orders/dispatch, and sales reporting, with per-branch
and cross-branch ("All branches") views for owner/admin accounts.

## How it works

- **Login**: email + password (owner/admin/manager only - other roles are
  rejected client-side, though the backend would also reject them via
  role checks on every write endpoint this app calls). Same refresh-token
  session pattern as the Kitchen Display and Waiter POS.
- **Branch switcher**: owner/admin accounts (`branchId: null` on their
  staff record) get a real switcher, including "All branches" - a manager
  account scoped to one branch only ever sees that branch. Everything
  except Reports needs one specific branch selected (menu, tables, staff,
  and dispatch are all branch-scoped operations); Reports is the one view
  that aggregates across branches.
- **Menu**: full category and item management - this needed new backend
  endpoints (`PATCH`/`DELETE` on both `/menu/categories/:id` and
  `/menu/items/:id`, plus `GET /menu/admin/items` so 86'd items are
  visible here even though every ordering app deliberately hides them).
  Deleting an item or category that already has order history is blocked
  server-side (a `RESTRICT` foreign key) with a clear message telling you
  to mark it unavailable instead - order history has to stay intact.
  Variants and modifier groups are creation-time only; there's no editor
  for them after the fact yet.
- **Tables**: create tables and view/print each one's real QR code (reuses
  the existing `GET /tables/:id/qr`, not a mock).
- **Staff**: list and add staff. The role picker deliberately excludes
  owner/admin - granting those from this screen would be a privilege
  escalation path.
- **Live Orders & Dispatch**: every order in progress across the branch,
  and - the actual gap this closes - a working "Assign driver" action for
  ready delivery orders. Nothing in the backend previously created a
  `Delivery` record when a delivery order was placed (that was
  legitimately a dispatcher's job, not the customer's), so this was pure
  orchestration of two existing endpoints (`POST /deliveries` then
  `PATCH /deliveries/:id/assign-driver`) with no further backend changes
  needed. This is exactly the "v1 manual assignment by a branch
  dispatcher/manager from the Management Dashboard's live orders view"
  the plan describes.
- **Reports**: date-range sales summary against the existing
  `GET /accounting/summary`. "All branches" is a client-side sum across
  one call per branch - there's no cross-branch aggregation endpoint, and
  at the scale a single restaurant's branch count runs at, that's an
  honest, sufficient way to build it rather than adding backend
  aggregation machinery that isn't needed yet. Charts follow the
  dataviz skill's method: fixed categorical color order (never cycled,
  validated with the skill's palette script), direct value labels instead
  of axis gridlines, text always in ink/muted tokens rather than the
  series color.

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```

Sign in with the owner account from `services/api`'s `npm run seed`.

## Not yet implemented

Staff editing/deactivation (only create + list exist), tip reports and
per-staff performance, inventory/COGS, end-of-day cash-drawer
reconciliation, and editing a menu item's variants/modifier groups after
creation - all later-phase items per the roadmap, or blocked on backend
capability this pass didn't need to add.
