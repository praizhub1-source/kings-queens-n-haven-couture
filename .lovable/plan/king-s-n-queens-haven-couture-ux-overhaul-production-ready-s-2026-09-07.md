# King's n Queens Haven Couture — UX Overhaul + Production-Ready Store Studio

Verified in this pass: 3 existing migrations; `products`/`categories`/`store_settings` public-read + admin-write policies; `user_roles` with `has_role` (only `admin` in the `app_role` enum, and no insert/update/delete policies); `ensureAdmin` in `src/lib/admin.functions.ts` still bootstraps the first signed-in account as permanent admin; `/admin` is a single 135-line file with client-only role gating; five remaining TypeScript errors, all TS7030 ("not all code paths return a value") in `src/routes/admin.tsx` (lines 123, 127, 133, 135) caused by `if (error) return toast.error(...)` inside async handlers; WhatsApp message builder already includes name/phone/delivery/note, per-item quantities, prices or "price pending", and a priced total.

## 1. Files, schema, RLS and functions to change

### Database (one migration)
- Extend `app_role` enum with `owner` and `staff`.
- `user_roles`: add owner/admin management policies (insert/update/delete gated by `has_role(auth.uid(),'owner')`), keep read-own, add `GRANT`s.
- New `public.profiles` (user_id, display_name, status active/disabled, timestamps) with grants, RLS, and updated_at trigger; readable by owner/admin, self-updatable.
- New `public.staff_invites` (email, role, token hash, invited_by, expires_at, accepted_at, revoked_at) — no anon access; all reads/writes through server functions.
- New `public.ownership_transfers` (from_user, to_email, token hash, status, expires_at, confirmed_at) with the same server-only access model.
- New security-definer helpers: `is_staff(uuid)`, `is_owner(uuid)`, plus a guard trigger so the last remaining owner cannot be deleted.
- Tighten existing product/category/settings write policies from `admin` to `is_staff()` (owner + admin + staff), so role tiers actually mean something.

### Server functions (new files under `src/lib/`)
- `admin.functions.ts` — rewrite: `getMyAccess()` returns role + profile; bootstrap only when zero owners exist AND assigns `owner`, recorded as bootstrap; no "first account is permanent" semantics.
- `team.functions.ts` — list users, invite staff/admin, change role, disable/enable, revoke/remove. All `requireSupabaseAuth` + server-side owner/admin check before any `supabaseAdmin` use (loaded via `await import` inside the handler).
- `ownership.functions.ts` — start transfer (owner only, buyer email), accept transfer (invited account), finalize (promote buyer to owner, downgrade previous owner to admin or revoke per owner's choice), cancel.
- `account.functions.ts` — change email, change password, update display name, sign out other sessions; password reset via `supabase.auth.resetPasswordForEmail` from the client.
- `src/routes/api/public/accept-invite.tsx` — token landing that validates the invite server-side and hands off to `/auth`.

### Frontend files
- Split `src/routes/admin.tsx` (currently one dense file) into `src/routes/_admin/` route + panel components under `src/components/admin/*`: Overview, Products, Categories, Homepage, Store Settings, Media Library, Team, Account & Security.
- Fix the five TS7030 errors by converting `return toast.error(...)` into braced statements.
- Storefront: `src/routes/index.tsx`, `shop.tsx`, `product.$slug.tsx`, `cart.tsx`, `about.tsx`, `contact.tsx`, `policies.tsx`, `src/components/site/*` (Header, Footer, ProductCard, CartDrawer, WhatsAppFab), new `SearchCommand`, `FilterSheet`, `Skeletons`, `EmptyState`.
- `src/lib/store.ts` — add paginated/filtered product queries and a lightweight search index query.

## 2. UI/UX changes by page

- **Header/nav** — sticky condensing bar, database-driven category menu, prominent search trigger (⌘K on desktop, full-screen sheet on mobile), cart count with animated badge, visible focus states.
- **Search** — instant suggestions across product names, categories and descriptions, recent searches, keyboard navigation, "no results" with category fallbacks, debounced and client-indexed to stay fast.
- **Home** — keep full-bleed fragrance campaign hero (never boxed), then category rail, featured edit, editorial fragrance storytelling with a horizontal scroll story, new arrivals, brand story, WhatsApp CTA, layered footer preserved.
- **Shop** — results-count header, sort control, filter sheet on mobile / rail on desktop (category, availability, price known/pending, new/featured), applied-filter chips, load-more pagination (not all 21 at once), skeleton and empty states.
- **Product detail** — full-bleed gallery with thumbnails and swipe, sticky purchase panel, clear "Price available soon" state, stock badge, related products, WhatsApp enquiry for pending-price items.
- **Cart** — animated drawer plus full page, quantity steppers, per-line pending-price labels, totals summary, validated details form with inline errors, WhatsApp handoff preview.
- **About / Contact / Policies** — editorial layouts fed entirely from store settings; contact shows WhatsApp 0550545074 and phone 0207114171 from the database.
- **Global** — skeletons everywhere data loads, real empty states, focus-visible rings, aria labels, `prefers-reduced-motion` honoured, transform/opacity-only motion, hero preload only, everything else lazy with responsive `sizes`.
- **Admin (Store Studio)** — sidebar + topbar shell, responsive cards on mobile, save/cancel bars, inline validation, optimistic toasts, destructive confirmations, empty states, media library grid with upload/replace/delete.

## 3. Ownership and staff model

Roles: `owner` (exactly one, full control incl. team and transfer), `admin` (full store + limited team), `staff` (catalogue only, no team/settings-critical actions).

- Bootstrap: allowed only while zero owners exist; the bootstrapping account becomes `owner` and is fully replaceable.
- Invite: owner/admin submits email + role → server creates the auth user via admin API (or an invite row) and emails a set-password link. No credentials in client code.
- Manage: list users with role/status, change role, disable (blocks sign-in and fails role checks), revoke sessions, remove.
- Transfer ownership: owner enters buyer email → buyer receives invite and sets credentials → buyer accepts → owner confirms an explicit irreversible warning dialog → buyer becomes `owner`, previous owner is downgraded to `admin` or removed per owner's choice. Trigger prevents ever reaching zero owners.
- Every privileged action re-verifies the caller's role server-side through the authenticated client before touching `supabaseAdmin`; UI gating is cosmetic only. Disabled accounts fail `is_staff()` so stale sessions lose access on the next request.

## 4. Blockers and risks

- Sending invite/reset emails depends on the backend's built-in mail; deliverability on the default sender is limited — a custom email domain may be needed later.
- Supabase JWTs stay valid until expiry, so a revoked user can retain read access for a short window unless every write path checks `is_staff()`; the plan does check server-side on each call.
- Products currently paginate client-side; the search index needs a slim column projection to stay cheap.
- The media bucket is private and served through the proxy route — no CDN caching beyond the route's own headers.
- This is a large pass; if credits run short, Track B (admin/ownership) should ship complete before Track A polish.

## 5. Ordered implementation plan

1. Fix the five TS7030 errors so the project compiles.
2. Ship the role/ownership migration (enum, profiles, invites, transfers, policies, helpers, guards).
3. Rewrite `admin.functions.ts` and add team/ownership/account server functions with server-side role verification.
4. Restructure `/admin` into the Store Studio shell with the eight sections.
5. Build Team and Account & Security UIs, including the transfer-ownership flow and its irreversible warning.
6. Rebuild Products, Categories, Homepage, Settings and Media panels on the new shell.
7. Storefront data layer: paginated/filtered queries and the search index.
8. Storefront UX pass: header/search, shop filters, product detail, cart and checkout.
9. Content pages, footer and global states (skeletons, empties, accessibility, reduced motion).
10. Performance pass and end-to-end verification: routes, forms, admin→storefront reflection, WhatsApp message correctness.
