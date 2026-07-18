---
Task ID: 1
Agent: Main Agent
Task: Fix all reported issues - NEXTAUTH_SECRET, checkout unauthorized, Paystack, vendor logout, admin login, popular dishes images, favicon

Work Log:
- Added NEXTAUTH_SECRET to .env with dev default value
- Added all required .env variables (Cloudinary, Paystack) with comments explaining each
- Fixed orders API: `session.user.role === 'admin'` → `'ADMIN'` (case sensitivity bug causing 401s)
- Fixed foods API: Added `limit` parameter support for `?limit=8` queries
- Rebuilt CartPanel.tsx: Added auto-fill from profile on checkout, "Auto-fill from Profile" button, proper Paystack payment flow (create order → initialize Paystack → redirect), graceful fallback to COD
- Added LogOut button + signOut import to vendor sidebar layout
- Replaced admin "Go to Login" redirect with proper AdminLoginForm component (email/password fields, orange theme, "Back to Store" link)
- Improved HomeSection.tsx image error handling: onError handlers hide broken images and show fallback, better UtensilsCrossed icon placeholder instead of emoji
- Created favicon.svg (orange bg with fork+knife) and updated layout.tsx metadata
- Removed unused old logo.svg

Stage Summary:
- NEXTAUTH_SECRET now set in .env (fixes JWT_SESSION_ERROR / decryption failed)
- Checkout now properly integrates Paystack: creates order → calls /api/paystack/initialize → redirects to Paystack payment page
- Auto-fill from profile works both automatically (on session data) and via "Auto-fill from Profile" button
- Vendor sidebar now has Logout button (like admin already had)
- Admin shows proper login form instead of "Go to Login" redirect
- Popular dishes now have image error handlers with fallback placeholders
- Favicon updated to orange bg with fork+knife icon
- All lint checks pass clean

---
Task ID: 2
Agent: Main Agent
Task: Fix formatNaira undefined crash and AdminEarnings field name mismatch

Work Log:
- Fixed formatNaira() in src/lib/utils.ts: changed parameter type from `number` to `number | undefined | null`, added nullish coalescing (`amount ?? 0`) to prevent TypeError on undefined
- Fixed AdminSections.tsx line 442: changed `r.orders` → `r.orderCount` and `r.revenue` → `r.earnings` to match the API response shape from /api/dashboard/earnings
- Fixed AdminLayout.tsx line 443: same field name fixes as AdminSections.tsx
- Fixed TypeScript error in /api/dashboard/earnings/route.ts: added explicit type annotation `const dailyData: { date: string; revenue: number; orders: number }[] = []` to prevent `never` type inference on push()
- Verified no other dashboard/vendor routes use wrong `orders` relation on Restaurant model (only User model correctly has `orders` relation)
- Ran lint check: all clean, no errors

Stage Summary:
- formatNaira now safely handles undefined/null inputs (was crashing with "Cannot read properties of undefined (reading 'toLocaleString')")
- AdminEarnings component now uses correct field names matching API response (orderCount/earnings instead of orders/revenue)
- dailyData array in earnings route has proper type annotation (fixes TypeScript ts(2345) error)
- All lint checks pass clean

---
Task ID: 3
Agent: Main Agent
Task: Fix Paystack payment callback — user stuck on Paystack success page with no redirect

Work Log:
- Added `callback_url` to Paystack initialize API: sends `${baseUrl}/payment/callback` so Paystack knows where to redirect after payment (success or failure)
- Added `NEXT_PUBLIC_APP_URL` env variable and fallback logic using request headers for baseUrl detection
- Created `/payment/callback/page.tsx` — full payment result page using TanStack Query to verify the payment reference, with animated success/failed/error states, amount display, reference number, and action buttons (View Orders, Back to Home)
- Created `/payment/layout.tsx` — standalone layout without Header/Footer (payment result is a full-screen standalone page)
- Updated `/api/paystack/verify/route.ts` — on payment success, also updates all sub-orders from PENDING → CONFIRMED and creates SubOrderStatusHistory entries
- Updated `/api/paystack/webhook/route.ts` — same sub-order cascade updates for charge.success webhook event
- Updated mock payment flow in initialize route to redirect to `/payment/callback?reference=...` instead of `/payment/mock`
- Restored `.env` with all required variables (NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL, Cloudinary, Paystack)

Stage Summary:
- Paystack now sends callback_url during initialization → after payment, user is automatically redirected to /payment/callback
- The callback page verifies the payment reference via /api/paystack/verify, shows animated success/failure UI
- Payment success now cascades to sub-orders (PENDING → CONFIRMED) with proper status history
- Webhook also handles sub-order status updates
- All lint checks pass clean
