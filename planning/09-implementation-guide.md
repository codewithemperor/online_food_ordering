# Implementation Guide — Master Agentic Prompt

## 1. Implementation Order & Dependencies

This document provides the complete, ordered implementation plan with agentic prompts for each phase. Each phase builds on the previous one. Phases marked with (Parallel) can be executed simultaneously.

```
Phase 1: Foundation Setup ───────────────────────── [Sequential]
Phase 2: Database & Auth ────────────────────────── [Sequential]
Phase 3: Layout & Navigation ────────────────────── [Sequential]
Phase 4-a: Home Section (Parallel) ─────────────────┐
Phase 4-b: Restaurant Section (Parallel) ────────────┤ [Parallel]
Phase 4-c: Menu Section (Parallel) ──────────────────┘
Phase 5: Cart System ────────────────────────────── [Sequential - depends on Menu]
Phase 6: Checkout & Payment ─────────────────────── [Sequential - depends on Cart]
Phase 7: Orders Section ─────────────────────────── [Sequential - depends on Checkout]
Phase 8-a: Admin Dashboard (Parallel) ──────────────┐
Phase 8-b: Admin Categories (Parallel) ─────────────┤
Phase 8-c: Admin Restaurants (Parallel) ────────────┤ [Parallel]
Phase 8-d: Admin Foods (Parallel) ──────────────────┤
Phase 8-e: Admin Orders (Parallel) ─────────────────┘
Phase 9: Admin Customers & Earnings ─────────────── [Sequential]
Phase 10: Profile Section ───────────────────────── [Sequential]
Phase 11: Polish & Testing ──────────────────────── [Sequential]
```

---

## 2. Phase 1: Foundation Setup

### Agent Prompt
```
You are setting up the FOUNDATION for NaijaBites, a Nigerian food ordering web application.

The project is already initialized as a Next.js 16 project at /home/z/my-project. You need to configure and install dependencies.

## Tasks
1. Install these packages:
   - @heroui/react (HeroUI v2 — follow their official Next.js setup guide)
   - framer-motion
   - zustand
   - @tanstack/react-query
   - react-hot-toast
   - bcryptjs + @types/bcryptjs
   - next-auth@4
   - zod
   - paystack (or use fetch directly for Paystack API)
   - lucide-react (if not already installed)

2. Configure tailwind.config.ts with NaijaBites theme:
   - Primary color: Orange (f97316 family)
   - Custom fonts: Poppins, Josefin Sans, Dancing Script (Google Fonts)
   - Custom colors: brand (#f97316), naira (#dc2626), cart-bg (#1f2937), cart-item (#374151)
   - Custom animations: float, slide-in-right, fade-in
   - Custom container padding (responsive)
   - HeroUI v2 plugin integration
   - Dark mode class strategy

3. Update src/app/globals.css:
   - Tailwind directives
   - Import Google Fonts (Poppins, Josefin Sans, Dancing Script)
   - Custom scrollbar styles (dark for cart, light for general, hidden for horizontal)
   - Custom input focus styles
   - Naira symbol styling
   - Global styles for h1-h4 (Josefin Sans, uppercase for h1)

4. Create the folder structure:
   - src/stores/ (cart-store.ts, navigation-store.ts, ui-store.ts)
   - src/hooks/ (useAuth.ts, useCart.ts, useNavigation.ts, useProfile.ts)
   - src/types/ (index.ts, api.ts)
   - src/lib/ (db.ts, auth.ts, paystack.ts, utils.ts, validators.ts)
   - src/constants/ (index.ts)
   - src/components/layout/
   - src/components/home/
   - src/components/restaurants/
   - src/components/foods/
   - src/components/cart/
   - src/components/checkout/
   - src/components/orders/
   - src/components/profile/
   - src/components/auth/
   - src/components/admin/
   - public/uploads/
   - public/images/

5. Create src/types/index.ts with ALL type definitions:
   - CartItem, Food, Restaurant, Category, Order, OrderItem, OrderStatusHistory
   - UserRole, UserStatus, OrderStatus, PaymentMethod, PaymentStatus
   - NavigationSection, DashboardStats, EarningsData
   - formatNaira() utility function type

6. Create src/lib/utils.ts with utility functions:
   - formatNaira(amount: number): string — "₦X,XXX" format
   - generateOrderNumber(): Promise<string> — "ORD-YYYYMMDD-XXX"
   - truncate(str: string, length: number): string
   - getStatusColor(status: OrderStatus): string — returns Tailwind classes
   - getNigerianStates(): string[]
   - getNigerianCities(): string[]

7. Create src/constants/index.ts with:
   - Nigerian states array (37 states + FCT)
   - Nigerian cities array (30+ cities)
   - Default categories
   - App name: "NaijaBites"
   - Delivery fee: 500, free threshold: 5000

8. Create empty Zustand stores (will fill in later phases):
   - stores/navigation-store.ts (activeSection, filters)
   - stores/cart-store.ts (items, isOpen, methods)
   - stores/ui-store.ts (modals, panels)

9. Verify setup by running `bun run lint` and checking for no errors.

IMPORTANT: Do NOT modify src/app/page.tsx yet. Only set up the foundation.
Do NOT set up Prisma or database yet — that's Phase 2.
```

---

## 3. Phase 2: Database & Auth

### Agent Prompt
```
You are setting up the DATABASE and AUTHENTICATION for NaijaBites.

## Prisma Schema
1. Write the complete prisma/schema.prisma with PostgreSQL provider:
   - Enums: Role (CUSTOMER, ADMIN), UserStatus (ACTIVE, BLOCKED), OrderStatus (PENDING, CONFIRMED, PREPARING, ON_THE_WAY, DELIVERED, CANCELLED), PaymentMethod (PAYSTACK, COD), PaymentStatus (PENDING, PAID, FAILED, REFUNDED)
   - Models: User, Category, Restaurant, Food, Order, OrderItem, OrderStatusHistory
   - All fields, relations, indexes as defined in planning/05-database-schema.md
   - Cascade deletes: Category→Restaurant→Food, Order→OrderItem, Order→OrderStatusHistory
   - Use @@map for snake_case table names

2. Create src/lib/db.ts with Prisma client singleton:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
   export const db = globalForPrisma.prisma || new PrismaClient();
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
   ```

3. Set DATABASE_URL in .env:
   - Use the existing PostgreSQL connection or create one

4. Run `bun run db:push` to create tables

5. Create prisma/seed.ts with comprehensive seed data:
   - Admin user: admin@naijabites.ng / admin123 (bcrypt hashed)
   - 6 categories: Nigerian, Continental, Chinese, Fast Food, Drinks & Beverages, Desserts & Snacks
   - 5 restaurants: Mama Put Kitchen (Lagos), The Suya Spot (Lagos), Golden Dragon (Abuja), Burger Palace (Lagos), Continental Bistro (Port Harcourt)
   - 17+ foods with realistic Nigerian names and NGN prices (see planning/04-api-and-backend.md section 12)
   - 1 sample customer: customer@test.com / password123
   - Use upsert for idempotent seeding
   - Add seed script to package.json: "db:seed": "bun prisma/seed.ts"

6. Run the seed script to populate data

## NextAuth Configuration
1. Create src/lib/auth.ts with complete NextAuth options:
   - CredentialsProvider only
   - JWT strategy, 30-day max age
   - authorize(): Find user by email, check status !== BLOCKED, bcrypt compare
   - JWT callback: Add id and role to token
   - Session callback: Add id and role to session
   - Custom error messages
   - pages: signIn → "/"
   - secret: NEXTAUTH_SECRET

2. Create src/app/api/auth/[...nextauth]/route.ts:
   ```typescript
   import NextAuth from "next-auth";
   import { authOptions } from "@/lib/auth";
   const handler = NextAuth(authOptions);
   export { handler as GET, handler as POST };
   ```

3. Create src/app/api/auth/register/route.ts:
   - POST handler with Zod validation
   - Check email uniqueness
   - bcrypt hash password (12 salt rounds)
   - Create user in database
   - Return user data (NO password)

4. Create src/lib/auth-helpers.ts:
   - requireAuth(): Check session, return 401 if not authenticated
   - requireAdmin(): Check session + role, return 403 if not admin

5. Create src/lib/validators.ts with Zod schemas:
   - registerSchema
   - loginSchema
   - categorySchema
   - restaurantSchema
   - foodSchema
   - orderSchema
   - profileSchema
   - deliverySchema

6. Add NEXTAUTH_SECRET and NEXTAUTH_URL to .env

7. Create src/hooks/useAuth.ts:
   - Wrap useSession() from next-auth/react
   - Expose: user, isAuthenticated, isLoading, isAdmin

8. Verify auth works by testing the register and login API endpoints.

IMPORTANT: Ensure all Prisma operations use the db singleton from lib/db.ts.
```

---

## 4. Phase 3: Layout & Navigation

### Agent Prompt
```
You are building the LAYOUT and NAVIGATION for NaijaBites.

The app uses a SINGLE ROUTE (/) with client-side section-based navigation.

## Root Layout (src/app/layout.tsx)
1. Import and wrap with providers:
   - HeroUIProvider
   - SessionProvider (next-auth/react)
   - QueryClientProvider (TanStack Query)
   - Toaster (react-hot-toast, position: top-right)
2. Set html lang="en"
3. Set body: font-poppins, bg-gray-50, min-h-screen, flex flex-col
4. Include Header and Footer components
5. Main content area: flex-1, mt-16 (header offset)
6. Render children (page.tsx)

## Header Component (src/components/layout/Header.tsx)
1. Fixed top, z-50, bg-white/80 backdrop-blur-md, border-b
2. Responsive layout:
   - Desktop: Logo | Nav Links | Cart Badge | User Dropdown
   - Mobile: Hamburger | Centered Logo | Cart Badge | User Icon
3. Logo: "NaijaBites" text (font-josefin, bold, text-orange-500) + fire/fireUtensils icon
4. Nav links: Home, Restaurants, Menu, My Orders (auth only)
   - Active state: text-orange-600, border-b-2 border-orange-600
   - Inactive: text-gray-600, hover:text-orange-600
   - Controlled by navigation-store activeSection
5. Cart button: ShoppingCart icon + Badge (count from cart-store)
   - Click → toggleCart()
   - Badge: w-5 h-5 rounded-full bg-red-600, absolute -top-2 -right-2
   - Bounce animation when count changes
6. User dropdown (HeroUI Dropdown):
   - Authenticated: Avatar + name, Profile, My Orders, Admin Panel (if admin), Divider, Logout
   - Not authenticated: "Login" / "Register" buttons
7. Mobile hamburger menu (full-screen overlay with nav links)
8. Use useAuth() hook for auth state
9. Use navigation-store for active section management

## Footer Component (src/components/layout/Footer.tsx)
1. Sticky footer: mt-auto, bg-gray-900, text-gray-400
2. 4-column grid (desktop), stacked (mobile):
   - Brand: Logo, tagline, social icons
   - Quick Links: Home, Restaurants, Menu, About
   - Contact: Phone, Email, Address (Lagos, Nigeria)
   - Hours: Mon-Sat 8AM-10PM, Sunday 10AM-8PM
3. Bottom bar: © 2024 NaijaBites. All rights reserved. | Paystack logo
4. Naira symbol usage where appropriate

## Navigation Store (src/stores/navigation-store.ts)
1. State: activeSection, adminSection, filters (restaurantId, categoryId, search)
2. Actions: setActiveSection, setAdminSection, setFilter, clearFilters
3. Type: Section = 'home' | 'restaurants' | 'menu' | 'orders' | 'profile' | 'admin'
4. Type: AdminSection = 'dashboard' | 'restaurants' | 'categories' | 'foods' | 'orders' | 'customers' | 'earnings'

## Main Page (src/app/page.tsx)
1. "use client" directive
2. Read activeSection from navigation-store
3. Conditionally render sections with AnimatePresence:
   - home → HomeSection
   - restaurants → RestaurantsSection
   - menu → MenuSection
   - orders → OrdersSection (auth required)
   - profile → ProfileSection (auth required)
   - admin → AdminLayout (admin required)
4. Cart panel overlay (always mounted, controlled by cart-store isOpen)
5. Auth modals (login/register, controlled by ui-store)
6. Each section gets Framer Motion section transitions (fade + slide)

## Section Header Component (src/components/layout/SectionHeader.tsx)
1. Reusable component for all section titles
2. Props: title, subtitle?, align? ("left" | "center")
3. Title: font-josefin, text-3xl, font-bold, uppercase
4. Decorative divider below (orange gradient line)
5. Subtitle: text-gray-500, max-w-xl

## Providers Setup
1. Create src/components/Providers.tsx combining:
   - HeroUIProvider
   - SessionProvider
   - QueryClientProvider (with default options: 5min stale time, 1 retry)
   - Toaster configuration (position: top-right, style: orange theme)
2. Use in root layout

IMPORTANT: Keep page.tsx as "use client" since all rendering is client-side with section navigation.
The Footer MUST be sticky (mt-auto in flex column layout).
```

---

## 5. Phase 4-a: Home Section

### Agent Prompt
```
You are building the HOME SECTION for NaijaBites.

## Components to Create
1. src/components/home/HeroSection.tsx
2. src/components/home/PopularFoods.tsx
3. src/components/home/FeaturedRestaurants.tsx
4. src/components/home/HowItWorks.tsx
5. src/components/home/CTASection.tsx
6. src/components/foods/FoodCard.tsx (shared component)

## HeroSection
1. Full-width hero with Nigerian food background image
2. Left column (md:w-1/2):
   - Badge: "🛵 Free Delivery on Orders Over ₦5,000"
   - Heading: "Order Delicious Nigerian Meals" (font-josefin, text-4xl md:text-5xl, uppercase, bold)
   - Subheading: "From the best restaurants in Lagos, Abuja & beyond" (dancing script, text-orange-600)
   - Search bar: Input with Search icon, placeholder "Search for food or restaurants..."
   - Two CTA buttons: "Order Now" (orange gradient) + "Browse Restaurants" (outline)
3. Right column (md:w-1/2):
   - Featured food image or floating food cards with Framer Motion animation
   - Cards show popular items with price
4. Background: gradient overlay on food image
5. Responsive: Stack on mobile, side-by-side on desktop

## PopularFoods
1. Section header: "Popular Dishes" + "View All →" link
2. Grid: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4
3. Fetch: GET /api/foods?sort=newest&limit=8
4. Use TanStack Query (useQuery) with 5-minute stale time
5. Show skeleton cards while loading (6 cards)
6. Show empty state if no foods
7. Each card is FoodCard component

## FoodCard (Shared — used by Home, Menu, Popular)
1. Props: food (Food type), onAddToCart?, onClick?
2. Design:
   - Container: bg-white, rounded-xl, shadow-sm, hover:shadow-md, overflow-hidden, border border-gray-100
   - Image: h-48, w-full, object-cover (or default placeholder)
   - Availability badge (if unavailable: gray overlay + "Unavailable")
   - Content: p-4
     - Name: font-semibold, text-lg, line-clamp-1
     - Restaurant: text-sm, text-gray-500
     - Description: text-sm, text-gray-400, line-clamp-2
     - Price row: flex justify-between items-center
       - Price: font-bold, text-lg, ₦ in red-600
       - Add button: w-10 h-10 rounded-full bg-orange-500, Plus icon white
3. Framer Motion: whileHover scale 1.02, whileTap wiggle
4. Click → FoodDetailModal (if onClick provided)
5. Add button → Add to cart directly (cart-store.addItem)

## FeaturedRestaurants
1. Section header: "Featured Restaurants" + "View All →"
2. Category filter pills (horizontal scroll):
   - "All" (default active), then category names from API
   - Active: bg-orange-500 text-white
   - Inactive: bg-orange-50 text-gray-700 border border-orange-200
3. Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
4. RestaurantCard component:
   - Container: bg-white, rounded-xl, shadow-sm, hover:shadow-md, overflow-hidden
   - Image: h-52, w-full, object-cover
   - Content: p-4
     - Name: font-semibold, text-lg
     - Category badge: bg-orange-100 text-orange-700, text-xs, rounded-full
     - Address: text-sm, text-gray-500
     - Open status: green "Open Now" / red "Closed" (based on current time vs open/close hours)
   - "View Menu" button: full-width, bg-orange-500, text-white
5. Fetch: GET /api/restaurants?limit=6
6. "View Menu" → navigation-store.setActiveSection('menu') + setFilter('restaurantId', id)

## HowItWorks
1. 3-step horizontal layout with connecting lines
2. Steps:
   - 🍽️ "Choose Restaurant" — "Browse our curated list of the best restaurants"
   - 🛒 "Select Your Meals" — "Pick from their delicious menu options"
   - 🚚 "Fast Delivery" — "Pay securely & get food delivered to your door"
3. Each step: Icon (w-16 h-16, orange-500 bg, rounded-full), Title, Description, Step number
4. Framer Motion: Staggered appear animation

## CTASection
1. Full-width, bg-gradient-to-r from-orange-500 to-orange-700
2. "Hungry? Order Now!" heading (white, font-josefin)
3. "Browse Menu" button (white bg, text-orange-600)
4. Click → navigation-store.setActiveSection('menu')

## API Routes Needed (create stubs if not exists)
1. GET /api/foods?sort=newest&limit=8 — Return foods with category and restaurant
2. GET /api/restaurants?limit=6 — Return restaurants with category
3. GET /api/categories — Return all categories

IMPORTANT: Use TanStack Query for data fetching with proper loading/error states.
Show loading skeletons while data loads.
```

---

## 6. Phase 4-b: Restaurant Section

### Agent Prompt
```
You are building the RESTAURANTS SECTION for NaijaBites.

## Components to Create
1. src/components/restaurants/RestaurantsSection.tsx
2. src/components/restaurants/RestaurantCard.tsx (if not created in Phase 4-a)
3. src/components/restaurants/RestaurantFilter.tsx

## RestaurantsSection
1. Section header: "Restaurants" + count
2. FilterBar:
   - Category filter pills (horizontal scroll, "All" + categories from API)
   - Search input (debounced, 300ms)
   - Sort dropdown: Name A-Z, Name Z-A, Newest, Most Popular
3. Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
4. Pagination or infinite scroll
5. Fetch: GET /api/restaurants?categoryId=X&search=Y&sort=Z&page=N
6. TanStack Query with URL-based state
7. Loading: 6 skeleton restaurant cards
8. Empty: Illustration + "No restaurants found" + "Try different filters"

## RestaurantCard (reuse from Home if exists, enhance)
1. Same design as Home FeaturedRestaurants card
2. Additional: Rating placeholder, delivery time estimate
3. "View Menu" button → navigation-store.setActiveSection('menu') + setFilter('restaurantId', id)
4. Restaurant filtering on Menu section should pre-select this restaurant

## RestaurantFilter
1. Category pills: Same style as Home (horizontal scroll)
2. Active: bg-orange-500 text-white rounded-full px-4 py-2
3. Inactive: bg-orange-50 text-gray-700 border border-orange-200 rounded-full px-4 py-2
4. Search: HeroUI Input with Search icon
5. Sort: HeroUI Select with options

## API Route (create if not exists)
1. GET /api/restaurants — Support query params: categoryId, search, sort, page, pageSize
2. Include category relation in response
3. Include _count for foods
4. Server-side filtering and pagination

IMPORTANT: Category filter should fetch categories from GET /api/categories.
Debounce search input to avoid excessive API calls.
```

---

## 7. Phase 4-c: Menu Section

### Agent Prompt
```
You are building the MENU SECTION for NaijaBites.

## Components to Create
1. src/components/foods/MenuSection.tsx
2. src/components/foods/FoodGrid.tsx
3. src/components/foods/FoodFilter.tsx
4. src/components/foods/FoodDetailModal.tsx

## MenuSection
1. Section header: "Menu" + food count
2. FilterBar:
   - Restaurant select (HeroUI Select, filtered by category if set)
   - Category pills (horizontal scroll, "All" + categories)
   - Search input (debounced)
   - Availability toggle (Switch: "Show available only")
3. Food grid: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4
4. Fetch: GET /api/foods?categoryId=X&restaurantId=Y&search=Z&isAvailable=true
5. TanStack Query with 5-minute stale time
6. Loading: 8 skeleton food cards
7. Empty: "No food items found" + "Try different filters"

## FoodFilter
1. Restaurant dropdown: HeroUI Select, options from GET /api/restaurants
2. Category pills: Same pattern as Restaurant filter
3. Search: HeroUI Input with Search icon, debounce 300ms
4. Availability: HeroUI Switch "Available only"
5. Pre-filter: If navigation-store has restaurantId filter, pre-select it

## FoodDetailModal
1. HeroUI Modal (centered, max-w-lg, scrollBehavior="inside")
2. Image: Full-width, h-64, object-cover (top of modal)
3. Close button: Absolute top-right, white circle with X
4. Content:
   - Food name (font-semibold, text-2xl)
   - Restaurant name (text-orange-600, clickable → go to restaurant menu)
   - Description (text-gray-500)
   - Quantity selector: flex items-center gap-3
     - Minus button (w-8 h-8 rounded-full bg-gray-200, disabled when qty=1)
     - Quantity display (w-12 text-center, font-bold)
     - Plus button (w-8 h-8 rounded-full bg-gray-200)
   - Price display: "Total: ₦X,XXX" (updates with quantity)
5. Footer: "Add to Cart — ₦X,XXX" button (full-width, orange gradient)
6. On add: cart-store.addItem(), toast, close modal after 500ms
7. Framer Motion: Modal fade + scale animation

## API Route (create if not exists)
1. GET /api/foods — Support: categoryId, restaurantId, search, isAvailable, sort, page, pageSize
2. Include category and restaurant relations
3. Server-side filtering with Prisma where clauses

IMPORTANT: The menu section is the CORE of the app — make it feel polished.
Food cards must have smooth add-to-cart interactions.
The FoodDetailModal should show quantity updates and price calculation in real-time.
```

---

## 8. Phase 5: Cart System

### Agent Prompt
```
You are building the CART SYSTEM for NaijaBites.

## Cart Store (src/stores/cart-store.ts)
1. Full Zustand store with persist middleware (localStorage key: 'naijabites-cart')
2. Interface: items[], isOpen, openCart(), closeCart(), toggleCart(), addItem(), removeItem(), updateQuantity(), incrementQuantity(), decrementQuantity(), clearCart(), getSubtotal(), getDeliveryFee(), getTotal(), getItemCount(), getUniqueItemCount()
3. Delivery fee logic: subtotal >= 5000 ? 0 : 500
4. Max quantity: 99 per item
5. Min quantity: 1 (remove if 0)
6. addItem checks for existing item → increment quantity
7. All mutations trigger toast notifications
8. Persist only items array (not isOpen)

## Cart Panel (src/components/cart/CartPanel.tsx)
1. Fixed position, right-0, z-100
2. Framer Motion slide-in from right (x: "100%" → 0)
3. Backdrop: bg-black/50, click → closeCart()
4. Width: w-full (mobile), w-[400px] (md+)
5. Header (bg-white):
   - Back arrow button
   - "Your Cart" + ShoppingCart icon
   - Clear all button (text-red-600, only if items exist)
6. Body (bg-gray-900, rounded-t-3xl, scrollable, max-h-[400px]):
   - Cart items list (CartItem components)
   - Empty state: emptyCart SVG + "Your cart is empty" + "Browse Menu" link
   - Free delivery indicator: If subtotal close to ₦5,000, show "Add ₦X more for FREE delivery!"
7. Footer (bg-gray-800, rounded-t-3xl):
   - Subtotal row: text-gray-400 / text-gray-50
   - Delivery fee: "₦500" or "FREE" (green)
   - Total: font-bold, text-lg, text-white
   - Checkout button: full-width, orange gradient, "Proceed to Checkout"
   - Disabled if cart empty

## Cart Item (src/components/cart/CartItem.tsx)
1. Container: bg-gray-700, rounded-lg, p-2, mb-3
2. Layout: flex items-center gap-3
3. Food image: w-16 h-16 rounded-full object-cover (or placeholder)
4. Info section (flex-1):
   - Name: text-white, font-semibold, line-clamp-1
   - Restaurant: text-gray-400, text-xs
   - Price: text-gray-300, font-semibold, ₦ in red
5. Quantity controls (flex items-center gap-2):
   - Minus: w-6 h-6 bg-gray-600 rounded, text-white, disabled at qty=1
   - Display: w-8 text-center, text-white, font-bold
   - Plus: w-6 h-6 bg-gray-600 rounded, text-white, disabled at qty=99
6. Delete button: w-8 h-8 bg-red-600 rounded-full, Trash icon white
7. All actions call cart-store methods

## Integration
1. Cart button in Header shows itemCount badge
2. Cart badge bounces (Framer Motion) on addItem
3. FoodCard "Add to Cart" calls addItem
4. FoodDetailModal "Add to Cart" calls addItem with quantity
5. "Proceed to Checkout" → Open checkout panel (Phase 6)

IMPORTANT: The cart panel MUST use dark theme (Bentilzone-inspired).
Cart items MUST have real-time price updates when quantity changes.
Cart persists to localStorage so it survives page refreshes.
```

---

## 9. Phase 6: Checkout & Payment

### Agent Prompt
```
You are building the CHECKOUT & PAYMENT system for NaijaBites.

## Checkout Panel (src/components/checkout/CheckoutPanel.tsx)
1. Same slide-in pattern as Cart (fixed right, Framer Motion)
2. Replaces cart panel when checkout is active
3. Steps: Delivery Info → Payment Method → Order Summary

## Delivery Form (src/components/checkout/DeliveryForm.tsx)
1. Pre-filled from user profile (GET /api/profile)
2. Fields (all HeroUI Input/Select/Textarea):
   - Full Name (required)
   - Phone (required, +234 prefix, 11+ digits)
   - Delivery Address (required, textarea)
   - City (required, Select with Nigerian cities)
   - State (required, Select with Nigerian states)
   - Delivery Instructions (optional, textarea)
3. Zod validation (client-side + server-side)
4. Invalid fields: red border, error message below

## Payment Selector (src/components/checkout/PaymentSelector.tsx)
1. HeroUI RadioGroup with two options:
   - Paystack: Icon + "Pay with Card, Bank Transfer or USSD"
   - COD: Icon + "Cash on Delivery — Pay when you receive"
2. Selected method determines checkout button text:
   - Paystack: "Pay ₦X,XXX"
   - COD: "Place Order"

## Order Summary (src/components/checkout/OrderSummary.tsx)
1. Compact items list: name × qty = price
2. Subtotal, delivery fee, total
3. Delivery address summary
4. Payment method indicator

## Checkout Flow
1. User clicks "Proceed to Checkout" in cart
2. Checkout panel slides in
3. Fill delivery form (pre-filled if profile exists)
4. Select payment method
5. Review order summary
6. Click "Pay ₦X,XXX" or "Place Order"

### Paystack Flow
1. Click "Pay ₦X,XXX" → loading state on button
2. POST /api/orders → Create order with server-side price verification
3. POST /api/paystack/initialize → Get Paystack authorization URL
4. Redirect window.location.href = authorizationUrl
5. User pays on Paystack page
6. Paystack redirects to /api/paystack/verify?reference=xxx
7. Server verifies payment → updates order → redirects to app
8. Success: Cart cleared, toast "Order placed successfully! 🎉", navigate to orders
9. Failure: Toast "Payment failed", order exists as PENDING

### COD Flow
1. Click "Place Order" → Confirmation dialog
2. POST /api/orders → Create order with paymentMethod: COD
3. Cart cleared, toast "Order placed! Pay on delivery."
4. Navigate to orders section

## API Routes
1. POST /api/orders — Full order creation with price verification
   - Validate items exist and are available
   - Use SERVER-SIDE prices (ignore client prices)
   - Calculate subtotal, delivery fee, total
   - Generate order number
   - Create order + items + status history
   - Return orderId + paystackUrl (if Paystack)

2. POST /api/paystack/initialize — Initialize Paystack transaction
   - Call Paystack API
   - Return authorization URL

3. GET /api/paystack/verify — Verify Paystack payment
   - Verify with Paystack API
   - Update order paymentStatus and status
   - Redirect to frontend with success/failure

4. POST /api/paystack/webhook — Paystack webhook handler
   - Verify HMAC-SHA512 signature
   - Handle charge.success, charge.failed, refund.processed

5. GET /api/profile — Get current user profile (for pre-filling delivery form)

## Paystack Library (src/lib/paystack.ts)
1. initializeTransaction(): Call Paystack API, return auth URL
2. verifyTransaction(): Verify payment, return status
3. initiateRefund(): Cancel/refund a transaction

## Price Change Handling
1. Client sends expectedPrice with each item
2. Server compares with actual food.price
3. If mismatch → 409 response with price changes
4. Client shows modal: "Prices have changed" with options to update or cancel
5. If user accepts → Update cart prices, re-submit

IMPORTANT: Server-side price verification is CRITICAL. Never trust client-sent prices.
Paystack integration uses NGN (multiply amount by 100 for kobo).
Handle ALL error cases (network failure, payment failure, price changes, unavailable items).
```

---

## 10. Phase 7: Orders Section

### Agent Prompt
```
You are building the ORDERS SECTION for NaijaBites.

## Components to Create
1. src/components/orders/OrdersSection.tsx
2. src/components/orders/OrderCard.tsx
3. src/components/orders/OrderDetail.tsx

## OrdersSection
1. Section header: "My Orders"
2. Filter tabs: All, Pending, Confirmed, Preparing, On The Way, Delivered, Cancelled
   - HeroUI Tabs component
   - Each tab shows count badge
3. Fetch: GET /api/orders?status=X
4. TanStack Query with auto-refresh (30 seconds for active orders)
5. Vertical list of OrderCards
6. Loading: 3 skeleton order cards
7. Empty: "No orders yet" + "Start Ordering" button

## OrderCard
1. Container: bg-white, rounded-lg, shadow-sm, border-l-4 (status color)
2. Header: Order number + Date + Status badge (color-coded pill)
3. Items: Compact list (food image w-8 h-8 + name + qty + price)
4. Footer: Total amount + Payment badge + View Detail button + Cancel button (if PENDING/CONFIRMED)
5. Status badge colors:
   - PENDING: blue-100/blue-700
   - CONFIRMED: indigo-100/indigo-700
   - PREPARING: yellow-100/yellow-700
   - ON_THE_WAY: orange-100/orange-700
   - DELIVERED: green-100/green-700
   - CANCELLED: red-100/red-700

## OrderDetail
1. Full section view (replaces order list)
2. Back button → return to orders list
3. Order header: Order number, date, large status badge
4. Customer info card: Name, email, phone, address
5. Payment info card: Method, status, reference (if Paystack)
6. Order items table: Image, Name, Qty, Unit Price, Total
7. Order totals: Subtotal, Delivery Fee, Total (bold)
8. Status timeline: Visual progress bar showing current status
9. Status history: Timeline of all changes (date + status + remark)
10. Cancel button (if PENDING or CONFIRMED): Confirmation modal

## Cancel Order Flow
1. Click "Cancel Order"
2. Confirmation modal: "Are you sure you want to cancel this order?"
3. If paid: "Your refund will be processed within 3-5 business days."
4. PUT /api/orders with { id, cancel: true }
5. Server: Validate can cancel (PENDING or CONFIRMED only)
6. If was paid via Paystack: Initiate refund
7. Update status to CANCELLED
8. Toast: "Order cancelled successfully"

## API Routes (create or enhance)
1. GET /api/orders — List orders (user's own, or all for admin)
   - Query: status, search, page, pageSize, id (for single order)
   - Include items and statusHistory
2. PUT /api/orders — Update order (cancel for customer, status for admin)
3. GET /api/orders?id=X — Single order with full details

IMPORTANT: Orders should auto-refresh for active orders (PENDING through ON_THE_WAY).
Show clear status badges and progress indicators.
```

---

## 11. Phase 8: Admin Panel

### Agent Prompt (for all admin sub-phases)
```
You are building the ADMIN PANEL for NaijaBites.

The admin panel is a section within the single-page app (activeSection === 'admin'), with its own layout (sidebar + content area).

## Admin Layout (src/components/admin/AdminLayout.tsx)
1. Full-screen layout: flex, h-screen
2. Left sidebar (w-64, fixed, bg-orange-600):
   - Logo: "NaijaBites" + "Admin" badge (font-josefin)
   - Navigation items (vertical list):
     - Dashboard (LayoutDashboard icon)
     - Restaurants (Store icon)
     - Categories (Tag icon)
     - Food Menu (UtensilsCrossed icon)
     - Orders (ShoppingCart icon) + count badge
     - Customers (Users icon) + count badge
     - Earnings (DollarSign icon)
   - Active: bg-orange-700 rounded-md font-semibold
   - Hover: bg-orange-700/50 rounded-md
   - Logout at bottom (mt-auto)
3. Right content area (flex-1, bg-gray-50, overflow-y-auto):
   - Header: "Back to Store" button (top-right)
   - Content header: Section title + action buttons
   - Scrollable content body with padding
4. Controlled by navigation-store adminSection
5. Only accessible if useAuth().isAdmin === true

## Admin Dashboard (src/components/admin/AdminDashboard.tsx)
1. 8 stat cards in grid (2 cols mobile, 4 cols desktop):
   - Total Restaurants (orange-500 icon)
   - Total Food Items (blue-500 icon)
   - Total Customers (green-500 icon)
   - Total Orders (purple-500 icon)
   - Pending Orders (yellow-500 icon)
   - Today's Orders (indigo-500 icon)
   - Total Earnings (emerald-500 icon)
   - Cancelled Orders (red-500 icon)
2. Each card: Icon + Title + Value + Trend
3. Recent orders table (5 rows)
4. Simple revenue chart (7-day bar chart — use CSS or lightweight library)
5. Fetch: GET /api/dashboard/stats

## Admin Categories (src/components/admin/AdminCategories.tsx)
1. Category cards grid (3 cols) + "Add Category" button
2. CategoryCard: Image, name, food/restaurant counts, edit/delete actions
3. Add/Edit form (HeroUI Modal): Name, Description, Image upload
4. Delete: Confirmation modal with cascade warning
5. API: GET/POST/PUT/DELETE /api/categories

## Admin Restaurants (src/components/admin/AdminRestaurants.tsx)
1. Data table (HeroUI Table) + "Add Restaurant" button
2. Search + Category filter
3. Columns: Image, Name, Category, City, Status, Actions
4. Add/Edit form (HeroUI Modal):
   - Name, Category (Select), Email, Phone, Address, City (Select), State (Select)
   - Open/Close Time, Open Days, Image upload, Active switch
5. Delete: Cascade warning
6. API: GET/POST/PUT/DELETE /api/restaurants

## Admin Foods (src/components/admin/AdminMenuItems.tsx)
1. Data table + "Add Food" button
2. Search + Category filter + Restaurant filter + Availability filter
3. Columns: Image, Name, Category, Restaurant, Price (₦), Available, Actions
4. Quick availability toggle (Switch in table)
5. Add/Edit form (HeroUI Modal):
   - Name, Description, Category (Select), Restaurant (Select, filtered by category)
   - Price (₦ prefix), Image upload, Available switch
6. Delete: Confirmation
7. API: GET/POST/PUT/DELETE /api/foods

## Admin Orders (src/components/admin/AdminOrders.tsx)
1. Data table with status filter tabs
2. Columns: Order #, Customer, Items, Amount, Payment, Status, Date, Actions
3. Order detail view: Full detail with update status form
4. Update status: Dropdown + Remark textarea + Update button
5. Status transitions: PENDING→CONFIRMED→PREPARING→ON_THE_WAY→DELIVERED (or CANCELLED)
6. Prevent backward transitions
7. Delete: Severe warning for paid orders
8. API: GET/PUT/DELETE /api/orders (admin sees all, can update status)

## Image Upload (src/components/common/ImageUploader.tsx)
1. Click to upload or drag & drop
2. Preview before upload
3. POST /api/upload → Returns URL
4. Validation: jpg/png/webp, max 2MB
5. Loading state during upload
6. Delete uploaded image option

## Upload API (src/app/api/upload/route.ts)
1. Admin-only (or authenticated for avatar)
2. Accept FormData with 'file' field
3. Validate: type (jpg/jpeg/png/webp), size (< 2MB)
4. Generate unique filename: `{timestamp}-{randomHex}.{ext}`
5. Save to public/uploads/
6. Return: { data: { url: "/uploads/filename.jpg" } }

## All Admin API Routes (create if not exists)
1. GET/POST/PUT/DELETE /api/categories — Admin-only write operations
2. GET/POST/PUT/DELETE /api/restaurants — Admin-only write operations
3. GET/POST/PUT/DELETE /api/foods — Admin-only write operations, filtering support
4. GET/PUT/DELETE /api/orders — Admin can see all, update status, delete
5. GET/PUT/DELETE /api/users — Admin-only, list/update/delete users
6. GET /api/dashboard/stats — Dashboard statistics
7. GET /api/dashboard/earnings — Earnings data with period filter
8. POST /api/upload — Image upload

IMPORTANT: ALL admin API routes MUST verify session.user.role === 'ADMIN'.
Use HeroUI Table component for all data tables.
All forms use Zod validation.
Toast notifications for all CRUD operations.
```

---

## 12. Phase 9: Admin Customers & Earnings

### Agent Prompt
```
You are building the CUSTOMER MANAGEMENT and EARNINGS sections for NaijaBites Admin Panel.

## Admin Customers (src/components/admin/AdminCustomers.tsx)
1. Data table with search + status filter (All, Active, Blocked)
2. Columns: Avatar, Name, Email, Phone, Orders Count, Total Spent, Status, Joined, Actions
3. Actions: Edit (modal form), Block/Unblock, Delete
4. Block: Confirmation modal "Block [Name]? They won't be able to login."
5. Unblock: "Unblock [Name]? They will be able to login again."
6. Cannot block admin users
7. Delete: Warning modal, recommend blocking instead
8. Edit form: Name, Phone, Address, City, State, Status
9. API: GET/PUT/DELETE /api/users

## Admin Earnings (src/components/admin/AdminEarnings.tsx)
1. Period selector: Today, This Week, This Month, This Year, All Time (HeroUI Tabs)
2. Summary cards (3 cols):
   - Total Earnings (₦XXX,XXX)
   - Paystack Earnings (₦XXX,XXX)
   - COD Earnings (₦XXX,XXX)
3. Revenue chart: Simple bar chart showing daily revenue (CSS or lightweight)
4. Top restaurants table: Name, Orders, Revenue (sorted by revenue desc)
5. Recent transactions table: Date, Order #, Customer, Amount, Method, Status
6. API: GET /api/dashboard/earnings?period=month

## Users API Enhancements
1. GET /api/users — Add: search (name/email/phone), status filter, pagination
2. Include order count and total spent for each user
3. PUT /api/users — Block/unblock, edit details
4. DELETE /api/users — Delete with order cascade warning

IMPORTANT: Calculate total spent per customer from paid orders only.
Earnings should only count PAID orders (paymentStatus = 'PAID').
```

---

## 13. Phase 10: Profile Section

### Agent Prompt
```
You are building the PROFILE SECTION for NaijaBites.

## Profile Section (src/components/profile/ProfileSection.tsx)
1. Section header: "My Profile"
2. Two-column layout (avatar + form)
3. Avatar section:
   - Current avatar (w-24 h-24 rounded-full) or initials
   - "Change Photo" button → file upload
   - Upload to /api/upload → update avatar URL
   - Delete photo option
4. Form fields (HeroUI Input):
   - Full Name (with User icon)
   - Email (disabled, read-only, gray bg)
   - Phone (with Phone icon, +234 prefix)
   - Address (Textarea)
   - City (Select, Nigerian cities)
   - State (Select, Nigerian states)
5. Save button (orange gradient, full-width)
6. Pre-filled from GET /api/profile
7. Save: PUT /api/profile with validation
8. Toast on success/error

## Profile API (src/app/api/profile/route.ts)
1. GET: Return current user profile (from session email)
2. PUT: Update name, phone, address, city, state, avatar
   - Cannot change email or role from profile
   - Zod validation
3. Avatar upload: If avatar field changed, it's already uploaded via /api/upload

## Auth Modals (src/components/auth/LoginForm.tsx, RegisterForm.tsx)
1. Login: HeroUI Modal, email + password, show/hide toggle, "Login" button
2. Register: HeroUI Modal, full form with password strength indicator
3. Both: Error display, loading state, link to other form
4. Use next-auth/react signIn() for login
5. Use POST /api/auth/register + signIn() for registration
6. Modals controlled by ui-store (showLogin, showRegister)

IMPORTANT: Email is read-only in profile — users cannot change their email.
Password change is NOT included in v1 (can be added later).
```

---

## 14. Phase 11: Polish & Testing

### Agent Prompt
```
You are doing the FINAL POLISH and testing for NaijaBites.

## Tasks
1. Check all components for:
   - Loading states (skeletons)
   - Empty states (illustrations + messages)
   - Error states (retry buttons)
   - Responsive design (test mobile, tablet, desktop layouts)

2. Verify all interactions:
   - Registration → auto-login → welcome toast
   - Login → redirect home → user dropdown shows
   - Browse menu → add to cart → cart badge updates
   - Cart operations: add, remove, increment, decrement, clear
   - Checkout with Paystack → redirect → verify → success
   - Checkout with COD → order created → redirect to orders
   - Cancel order → confirmation → status update → refund (if paid)
   - Admin: All CRUD operations work
   - Admin: Order status updates work
   - Admin: Dashboard stats are accurate

3. Verify Nigerian context:
   - ₦ (Naira) symbol everywhere
   - Nigerian cities and states in dropdowns
   - Nigerian food names in seed data
   - Phone format +234

4. Verify security:
   - Admin routes protected
   - User can only see own orders
   - Price verification on checkout
   - File upload validation
   - Password hashing

5. Run `bun run lint` and fix any issues

6. Check dev server log for any runtime errors

7. Verify sticky footer on short and long pages

8. Test with empty database (no seed data) — should show appropriate empty states

9. Add any missing toast notifications

10. Ensure Framer Motion animations are smooth (no jank)

11. Fix any TypeScript errors

IMPORTANT: Do NOT run `bun run build`. Only use `bun run lint` for code quality checks.
Test the app in the browser using the Preview Panel.
```

---

## 15. Summary: All Planning Files

| File | Content |
|------|---------|
| `01-project-overview-and-architecture.md` | Tech stack, route architecture, database schema, design system, auth design, Paystack integration, file upload, key decisions, folder structure |
| `02-client-side-features.md` | Home, Restaurants, Menu, Cart, Checkout, Orders, Profile sections — detailed component design, interactions, edge cases |
| `03-admin-panel-features.md` | Admin layout, Dashboard, Restaurant/Category/Food management, Order management, Customer management, Earnings — detailed specs |
| `04-api-and-backend.md` | All API endpoints with request/response formats, validation schemas, Paystack integration code, seed data, security checklist |
| `05-database-schema.md` | Complete Prisma schema, ER diagram, indexes, data integrity rules, migration strategy, query patterns |
| `06-design-system-and-ui.md` | Color palette, typography, component specs, layout patterns, HeroUI mapping, responsive rules, animations, scrollbar styling |
| `07-cart-and-checkout-flow.md` | Cart store implementation, add/remove/update flows, checkout panel, Paystack integration, price change handling, order lifecycle |
| `08-authentication-and-security.md` | Registration/login flows, NextAuth config, JWT structure, authorization system, security measures, environment variables |
| `09-implementation-guide.md` | This file — master agentic prompt with ordered phases and detailed agent instructions |
