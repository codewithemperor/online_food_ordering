# Task 7 — Vendor Route Builder

## Summary
Created the `/vendor` route group with all sub-routes, split the monolithic RestaurantOwnerLayout.tsx (~1840 lines) into route-based architecture.

## Files Created
1. `src/stores/vendor-store.ts` — Zustand store for selectedRestaurantId
2. `src/components/restaurant-owner/VendorSections.tsx` — Extracted 5 section components + shared helpers
3. `src/app/vendor/layout.tsx` — Full vendor layout with sidebar, auth guard, route-based navigation
4. `src/app/vendor/page.tsx` — Dashboard page
5. `src/app/vendor/orders/page.tsx` — Orders page
6. `src/app/vendor/menu/page.tsx` — Menu page
7. `src/app/vendor/earnings/page.tsx` — Earnings page
8. `src/app/vendor/settings/page.tsx` — Settings page

## Files Updated
- `src/components/layout/Header.tsx` — Portal detection uses pathname, navigation uses router.push()

## Key Decisions
- Used usePathname() for active nav highlighting instead of Zustand state
- Used useVendorStore (Zustand) for shared selectedRestaurantId across pages
- Vendor layout is 'use client' since it needs useSession, useRouter, usePathname
- Each page.tsx is 'use client' and reads selectedRestaurantId from useVendorStore
- All 5 section components are exported from VendorSections.tsx for reuse
- The existing RestaurantOwnerLayout.tsx was NOT deleted (still used by the old / route)

## Testing
- All 6 vendor routes return HTTP 200
- Main page (/) still works
- Lint: 0 errors, 0 warnings
