# Project Overview & Architecture Planning

## 1. Project Identity

**Name:** NaijaBites — Nigerian Food Ordering System  
**Tagline:** "Order your favourite Nigerian meals, delivered fast!"  
**Target Market:** Nigeria (NGN currency, Paystack integration)  
**Project Type:** Nigeria Student Project (Full-Stack Web Application)

---

## 2. Technology Stack (MANDATORY — NON-NEGOTIABLE)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Framework** | Next.js | 16 | App Router, Server Components |
| **Language** | TypeScript | 5 | Strict mode enabled |
| **Styling** | Tailwind CSS | 4 | With custom theme |
| **UI Library** | HeroUI v2 | Latest | Component library (replaces NextUI/shadcn) |
| **Database** | PostgreSQL | Latest | Via Prisma ORM |
| **ORM** | Prisma | Latest | PostgreSQL client |
| **Authentication** | NextAuth.js | v4 | Credentials provider only (NO social login, NO email verification) |
| **Payment** | Paystack | Latest | Nigerian payment gateway (test keys, add later) |
| **State Management** | Zustand | Latest | Client-side cart & UI state |
| **Server State** | TanStack Query | Latest | Data fetching & caching |
| **Icons** | Lucide React | Latest | Icon library |
| **Image Storage** | Local filesystem | — | Upload to `public/uploads/` directory |
| **Animations** | Framer Motion | Latest | Page transitions, micro-interactions |
| **Toast Notifications** | react-hot-toast | Latest | User feedback |
| **Caching** | In-memory | — | No Redis/MySQL middleware |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│  ┌───────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Zustand   │ │ TanStack │ │  Framer Motion   │   │
│  │  (Cart/UI) │ │  Query   │ │  (Animations)    │   │
│  └───────────┘ └──────────┘ └──────────────────┘   │
│  ┌─────────────────────────────────────────────┐    │
│  │           HeroUI v2 Components               │    │
│  │  (Button, Card, Table, Modal, Input, etc.)   │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                        │
                   HTTP/WebSocket
                        │
┌─────────────────────────────────────────────────────┐
│              NEXT.JS 16 (App Router)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  Server      │  │  API Routes │  │  Middleware │  │
│  │  Components  │  │  (/api/*)   │  │  (auth)     │  │
│  └─────────────┘  └─────────────┘  └────────────┘  │
│  ┌──────────────────────────────────────────────┐   │
│  │              Prisma ORM                       │   │
│  │  (Schema → PostgreSQL Client)                 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌─────────┐  │
│  │Users │ │Categ.│ │Rest. │ │Foods │ │ Orders   │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └─────────┘  │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│              Paystack Payment Gateway                │
│  (Card, Bank Transfer, USSD, Mobile Money)          │
└─────────────────────────────────────────────────────┘
```

---

## 4. Route Architecture

Since the project runs on a **single visible route** (`/`), all features are implemented as **client-side tabs/sections/modals** — NOT as separate Next.js routes.

### Client-Side Navigation (Tab/Section Based)

| Section | Component | Access |
|---------|-----------|--------|
| Home | `HomeSection` | Public |
| Restaurants | `RestaurantsSection` | Public |
| Menu | `MenuSection` | Public |
| Cart | `CartPanel` (slide-in overlay) | Authenticated |
| My Orders | `OrdersSection` | Authenticated |
| Profile | `ProfileSection` | Authenticated |
| Checkout | `CheckoutPanel` (slide-in overlay) | Authenticated |

### Admin Navigation (Tab-Based within Admin View)

| Section | Component | Access |
|---------|-----------|--------|
| Dashboard | `AdminDashboard` | Admin Only |
| Restaurants | `AdminRestaurants` | Admin Only |
| Food Categories | `AdminCategories` | Admin Only |
| Food Menu | `AdminMenuItems` | Admin Only |
| Orders | `AdminOrders` | Admin Only |
| Customers | `AdminCustomers` | Admin Only |
| Earnings | `AdminEarnings` | Admin Only |

### API Routes (Backend)

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/[...nextauth]` | NextAuth handler | Public |
| GET | `/api/categories` | List all categories | Public |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories` | Update category | Admin |
| DELETE | `/api/categories` | Delete category | Admin |
| GET | `/api/restaurants` | List all restaurants | Public |
| POST | `/api/restaurants` | Create restaurant | Admin |
| PUT | `/api/restaurants` | Update restaurant | Admin |
| DELETE | `/api/restaurants` | Delete restaurant | Admin |
| GET | `/api/foods` | List foods (with filters) | Public |
| POST | `/api/foods` | Create food item | Admin |
| PUT | `/api/foods` | Update food item | Admin |
| DELETE | `/api/foods` | Delete food item | Admin |
| GET | `/api/orders` | List orders (own/admin) | Authenticated |
| POST | `/api/orders` | Create order | Authenticated |
| PUT | `/api/orders` | Update order status | Admin |
| DELETE | `/api/orders` | Cancel/delete order | Admin/Auth |
| GET | `/api/users` | List all users | Admin |
| PUT | `/api/users` | Update user | Admin |
| DELETE | `/api/users` | Delete user | Admin |
| GET | `/api/profile` | Get current user profile | Authenticated |
| PUT | `/api/profile` | Update current user profile | Authenticated |
| POST | `/api/upload` | Upload image | Admin |
| POST | `/api/paystack/initialize` | Initialize Paystack payment | Authenticated |
| GET | `/api/paystack/verify` | Verify Paystack payment | Public (webhook) |
| GET | `/api/dashboard/stats` | Dashboard statistics | Admin |
| GET | `/api/dashboard/earnings` | Earnings data | Admin |

---

## 5. Database Schema (PostgreSQL via Prisma)

### Complete Schema Design

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String    // bcrypt hashed
  phone         String?
  address       String?
  city          String?
  state         String?
  avatar        String?   // URL to uploaded image
  role          Role      @default(CUSTOMER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  orders        Order[]
  
  @@map("users")
}

enum Role {
  CUSTOMER
  ADMIN
}

enum UserStatus {
  ACTIVE
  BLOCKED
}

model Category {
  id            String    @id @default(cuid())
  name          String    @unique
  description   String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  restaurants   Restaurant[]
  foods         Food[]
  
  @@map("categories")
}

model Restaurant {
  id            String    @id @default(cuid())
  name          String
  description   String?
  email         String?
  phone         String?
  address       String?
  city          String?
  state         String?
  openTime      String?   // e.g. "08:00"
  closeTime     String?   // e.g. "22:00"
  openDays      String?   // e.g. "Mon-Sat"
  image         String?
  isActive      Boolean   @default(true)
  categoryId    String
  category      Category  @relation(fields: [categoryId], references: [id], onDelete=Cascade)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  foods         Food[]
  orders        Order[]
  
  @@map("restaurants")
}

model Food {
  id            String    @id @default(cuid())
  name          String
  description   String?
  price         Float     // Base price in NGN
  image         String?
  isAvailable   Boolean   @default(true)
  categoryId    String
  category      Category  @relation(fields: [categoryId], references: [id], onDelete=Cascade)
  restaurantId  String
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete=Cascade)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  orderItems    OrderItem[]
  
  @@map("foods")
}

model Order {
  id            String    @id @default(cuid())
  orderNumber   String    @unique // Auto-generated e.g. "ORD-20240101-001"
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  restaurantId  String?
  restaurant    Restaurant? @relation(fields: [restaurantId], references: [id])
  status        OrderStatus @default(PENDING)
  subtotal      Float     // Sum of items before delivery
  deliveryFee   Float     @default(0) // Delivery fee
  totalAmount   Float     // subtotal + deliveryFee
  paymentMethod PaymentMethod @default(PAYSTACK)
  paymentStatus PaymentStatus @default(PENDING)
  paystackRef   String?   // Paystack transaction reference
  deliveryAddress String?
  deliveryCity    String?
  deliveryState   String?
  customerPhone   String?
  customerName    String?
  remark        String?
  cancelledAt   DateTime?
  deliveredAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  items         OrderItem[]
  statusHistory OrderStatusHistory[]
  
  @@map("orders")
}

enum OrderStatus {
  PENDING        // Just placed, awaiting confirmation
  CONFIRMED      // Restaurant confirmed
  PREPARING      // Food being prepared
  ON_THE_WAY     // Out for delivery
  DELIVERED      // Successfully delivered
  CANCELLED      // Cancelled by user or admin
}

enum PaymentMethod {
  PAYSTACK       // Paystack (card, transfer, USSD)
  COD            // Cash on Delivery
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model OrderItem {
  id            String    @id @default(cuid())
  orderId       String
  order         Order     @relation(fields: [orderId], references: [id], onDelete=Cascade)
  foodId        String
  foodName      String    // Snapshot at order time
  foodImage     String?   // Snapshot at order time
  quantity      Int       @default(1)
  unitPrice     Float     // Price per unit at order time
  totalPrice    Float     // quantity * unitPrice
  
  @@map("order_items")
}

model OrderStatusHistory {
  id            String    @id @default(cuid())
  orderId       String
  order         Order     @relation(fields: [orderId], references: [id], onDelete=Cascade)
  status        OrderStatus
  remark        String?
  changedBy     String?   // User ID or "system"
  createdAt     DateTime  @default(now())
  
  @@map("order_status_history")
}

model AdminStats {
  id            String    @id @default(cuid())
  totalOrders   Int       @default(0)
  totalRevenue  Float     @default(0)
  totalUsers    Int       @default(0)
  totalFoods    Int       @default(0)
  totalRestaurants Int    @default(0)
  updatedAt     DateTime  @updatedAt
  
  @@map("admin_stats")
}
```

### ER Diagram

```
Category (1) ──→ (N) Restaurant (1) ──→ (N) Food
Category (1) ──→ (N) Food (via direct category link for filtering)

User (1) ──→ (N) Order (1) ──→ (N) OrderItem ──→ Food (snapshot)
Order (1) ──→ (N) OrderStatusHistory
Restaurant (1) ──→ (N) Order (via restaurant context)
```

---

## 6. Design System (Based on Bentilzone + Nigerian Context)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#f97316` (orange-500) | Brand color, CTAs, active states, accents |
| `primary-dark` | `#ea580c` (orange-600) | Hover states, admin sidebar |
| `primary-light` | `#fb923c` (orange-400) | Light accents, gradients |
| `primary-50` | `#fff7ed` (orange-50) | Light backgrounds |
| `accent` | `#16a34a` (green-600) | Success, delivered status, admin edit |
| `danger` | `#dc2626` (red-600) | Delete, cancel, errors, cart badge |
| `warning` | `#eab308` (yellow-500) | Preparing, on-the-way status |
| `info` | `#2563eb` (blue-600) | Pending status, information |
| `dark` | `#1f2937` (gray-800) | Dark backgrounds, text |
| `darker` | `#111827` (gray-900) | Cart body, checkout panels |
| `heading` | `#1f2937` | Headings, bold text |
| `body` | `#4b5563` (gray-600) | Body text |
| `muted` | `#9ca3af` (gray-400) | Muted/secondary text |
| `background` | `#f9fafb` (gray-50) | Page background |
| `card` | `#ffffff` | Card backgrounds |
| `cart-bg` | `#1f2937` | Cart panel dark background |
| `cart-item` | `#374151` (gray-700) | Cart item row bg |
| `naira` | `#dc2626` (red-600) | ₦ currency symbol color |

### Nigerian Naira (₦) Formatting

```typescript
// Utility function for Nigerian Naira formatting
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}
```

### Typography

| Font | Usage | Import |
|------|-------|--------|
| `Poppins` | Body text, UI elements | Google Fonts (300,400,500,600,700) |
| `Josefin Sans` | Headings, brand name | Google Fonts (400,600,700) |
| `Dancing Script` | Decorative accents (like "Give You Glory" in Methuen) | Google Fonts (400,700) |

### Spacing & Sizing System

| Token | Value | Usage |
|-------|-------|-------|
| `container-padding` | `1rem → 2rem → 3rem → 4rem` | Responsive container padding |
| `section-gap` | `3rem → 4rem` | Between page sections |
| `card-padding` | `1rem → 1.5rem` | Card internal padding |
| `card-radius` | `0.75rem` | Card border radius |
| `button-radius` | `0.5rem` / `9999px` (pill) | Button border radius |
| `food-card-width` | `280px → 320px` | Food item card min-width |

### Responsive Breakpoints

| Breakpoint | Value | Target |
|-----------|-------|--------|
| `sm` | 576px | Small phones landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

---

## 7. Authentication Design

### Registration Flow
1. User fills form: Full Name, Email, Phone, Password (min 8 chars), Confirm Password, Delivery Address
2. Server validates: required fields, email uniqueness, password match, password strength
3. Password hashed with bcrypt (12 salt rounds)
4. User created with role=CUSTOMER, status=ACTIVE
5. Auto-login after registration (redirect to home)
6. **NO email verification** (as specified)
7. **NO social login** (as specified)

### Login Flow
1. User enters Email + Password
2. NextAuth Credentials provider validates
3. bcrypt password comparison
4. JWT token created (30-day expiry)
5. Redirect to home with auth state

### Session Management
- JWT strategy (no database sessions)
- Token contains: userId, email, name, role
- Client-side: `useSession()` hook from NextAuth
- Admin check: `session.user.role === 'ADMIN'`

### Default Admin Account
- Email: `admin@naijabites.ng`
- Password: `admin123` (to be changed on first login)
- Seeded via Prisma seed script

---

## 8. Paystack Integration Design

### Payment Flow
```
User clicks "Pay Now"
  → POST /api/paystack/initialize
    → Create order in DB (status: PENDING, paymentStatus: PENDING)
    → Call Paystack API to initialize transaction
    → Return authorization_url
  → Client redirects to Paystack checkout page
    → User pays via Card/Bank Transfer/USSD
  → Paystack redirects to callback URL
    → GET /api/paystack/verify?reference=xxx
    → Verify transaction with Paystack API
    → Update order: paymentStatus: PAID, status: CONFIRMED
    → Redirect user to order confirmation
  → Paystack webhook (backup)
    → POST /api/paystack/webhook
    → Verify webhook signature
    → Update order payment status
```

### Environment Variables (Paystack)
```
PAYSTACK_SECRET_KEY=sk_test_xxxxx  # User will add test key
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx  # User will add test key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=xxxxx
```

### Supported Payment Methods (via Paystack)
- Debit/Credit Card (Visa, Mastercard, Verve)
- Bank Transfer
- USSD
- Mobile Money

### COD (Cash on Delivery)
- Alternative payment option
- Order created with paymentMethod: COD, paymentStatus: PENDING
- Admin can manually mark as PAID after delivery

---

## 9. File Upload Design

### Image Upload Strategy
- **Storage:** Local filesystem (`public/uploads/`)
- **Naming:** `{timestamp}-{randomString}.{ext}`
- **Accepted formats:** jpg, jpeg, png, webp
- **Max size:** 2MB
- **Endpoint:** `POST /api/upload` (admin only)
- **Returns:** Relative URL path `/uploads/filename.jpg`

### Upload Flow
1. Admin selects file in form
2. Client-side validation (type, size)
3. POST to `/api/upload` with FormData
4. Server validates, generates unique filename
5. Saves to `public/uploads/`
6. Returns URL path
7. URL stored in database field

---

## 10. Key Architecture Decisions

### Decision 1: Single Route vs Multi-Route
**Choice:** Single route (`/`) with client-side navigation  
**Reason:** Project constraint — only `/` route is visible to users  
**Implementation:** Zustand store manages `activeSection` state, components conditionally rendered

### Decision 2: HeroUI v2 vs shadcn/ui
**Choice:** HeroUI v2 (as specified by user)  
**Reason:** User explicitly requested HeroUI v2  
**Impact:** Replace all shadcn/ui component imports with HeroUI equivalents

### Decision 3: PostgreSQL vs SQLite
**Choice:** PostgreSQL (as specified by user)  
**Reason:** User explicitly requested PostgreSQL, better for production  
**Impact:** Prisma schema uses PostgreSQL provider

### Decision 4: Order Grouping
**Choice:** Orders are grouped entities with multiple items (NOT one-item-per-order like Methuen)  
**Reason:** Methuen's design of one row per dish is a critical flaw  
**Implementation:** Order → OrderItem relationship, single order with multiple items

### Decision 5: Paystack vs Stripe
**Choice:** Paystack (Nigerian payment gateway)  
**Reason:** Nigerian project, NGN currency, local payment methods (USSD, Verve)  
**Impact:** Different API integration than Stripe

### Decision 6: No Email Verification / No Social Login
**Choice:** Skip both as specified  
**Reason:** Student project, simplify onboarding  
**Impact:** Simpler auth flow, but need CAPTCHA or rate limiting to prevent spam

### Decision 7: Client-Side Cart
**Choice:** Zustand + localStorage persistence  
**Reason:** Performance (no server round-trip for cart operations), works offline  
**Risk:** Cart items could become stale if food prices change  
**Mitigation:** Verify prices server-side during checkout

---

## 11. Project Folder Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Main page (single route)
│   ├── globals.css                   # Global styles + Tailwind
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts     # User registration
│   │   │   └── [...nextauth]/route.ts # NextAuth handler
│   │   ├── categories/route.ts       # Category CRUD
│   │   ├── restaurants/route.ts      # Restaurant CRUD
│   │   ├── foods/route.ts            # Food CRUD + filtering
│   │   ├── orders/route.ts           # Order CRUD
│   │   ├── users/route.ts            # User management
│   │   ├── profile/route.ts          # Profile CRUD
│   │   ├── upload/route.ts           # Image upload
│   │   ├── paystack/
│   │   │   ├── initialize/route.ts   # Initialize payment
│   │   │   ├── verify/route.ts       # Verify payment
│   │   │   └── webhook/route.ts      # Paystack webhook
│   │   └── dashboard/
│   │       ├── stats/route.ts        # Dashboard statistics
│   │       └── earnings/route.ts     # Earnings data
│   └── favicon.ico
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # Fixed top navigation
│   │   ├── Footer.tsx                # Sticky bottom footer
│   │   ├── HeroSlider.tsx            # Homepage hero carousel
│   │   └── SectionHeader.tsx         # Reusable section title
│   ├── home/
│   │   ├── HeroSection.tsx           # Hero with search
│   │   ├── PopularFoods.tsx          # Popular dishes grid
│   │   ├── FeaturedRestaurants.tsx   # Restaurant cards
│   │   ├── HowItWorks.tsx            # 3-step process
│   │   └── CTASection.tsx            # Call to action
│   ├── restaurants/
│   │   ├── RestaurantCard.tsx        # Single restaurant card
│   │   ├── RestaurantList.tsx        # Grid of restaurants
│   │   └── RestaurantFilter.tsx      # Category filter buttons
│   ├── foods/
│   │   ├── FoodCard.tsx              # Single food item card
│   │   ├── FoodGrid.tsx              # Grid of food items
│   │   ├── FoodFilter.tsx            # Category/restaurant filter
│   │   └── FoodDetailModal.tsx       # Food detail popup
│   ├── cart/
│   │   ├── CartPanel.tsx             # Slide-in cart overlay
│   │   ├── CartItem.tsx              # Single cart item row
│   │   └── CartSummary.tsx           # Cart totals section
│   ├── checkout/
│   │   ├── CheckoutPanel.tsx         # Slide-in checkout overlay
│   │   ├── DeliveryForm.tsx          # Address & phone form
│   │   ├── PaymentSelector.tsx       # Paystack/COD selector
│   │   └── OrderSummary.tsx          # Order total breakdown
│   ├── orders/
│   │   ├── OrdersList.tsx            # User's orders table
│   │   ├── OrderCard.tsx             # Single order card
│   │   └── OrderDetail.tsx           # Order detail view
│   ├── profile/
│   │   ├── ProfileForm.tsx           # Edit profile form
│   │   └── ProfileAvatar.tsx         # Avatar upload
│   ├── auth/
│   │   ├── LoginForm.tsx             # Login form
│   │   └── RegisterForm.tsx          # Registration form
│   ├── admin/
│   │   ├── AdminLayout.tsx           # Admin panel layout
│   │   ├── AdminDashboard.tsx        # Stats cards + charts
│   │   ├── AdminRestaurants.tsx      # Restaurant CRUD
│   │   ├── AdminCategories.tsx       # Category CRUD
│   │   ├── AdminMenuItems.tsx        # Food menu CRUD
│   │   ├── AdminOrders.tsx           # Order management
│   │   ├── AdminCustomers.tsx        # Customer management
│   │   ├── AdminEarnings.tsx         # Earnings view
│   │   ├── AdminSidebar.tsx          # Admin navigation
│   │   └── AdminTable.tsx            # Reusable data table
│   └── ui/                           # HeroUI v2 components (auto-generated)
├── hooks/
│   ├── useAuth.ts                    # Auth state hook
│   ├── useCart.ts                    # Cart state hook
│   ├── useNavigation.ts              # Section navigation hook
│   └── useProfile.ts                 # Profile data hook
├── stores/
│   ├── cart-store.ts                 # Zustand cart store
│   ├── navigation-store.ts           # Zustand navigation store
│   └── ui-store.ts                   # Zustand UI state store
├── lib/
│   ├── db.ts                         # Prisma client singleton
│   ├── paystack.ts                   # Paystack SDK wrapper
│   ├── auth.ts                       # NextAuth configuration
│   ├── utils.ts                      # Utility functions
│   └── validators.ts                 # Input validation schemas
├── types/
│   ├── index.ts                      # Shared TypeScript types
│   └── api.ts                        # API request/response types
├── constants/
│   │   └── index.ts                  # App constants
│   └── data/
│       └── seed-data.ts              # Database seed data
prisma/
├── schema.prisma                     # Database schema
└── seed.ts                           # Seed script
public/
├── uploads/                          # Uploaded images
├── images/                           # Static images
│   ├── hero/                         # Hero slider images
│   ├── food/                         # Default food images
│   ├── restaurants/                  # Default restaurant images
│   └── icons/                        # Custom icons
└── favicon.ico
```

---

## 12. Agentic Prompt for Implementation

### Phase 1: Foundation Setup
```
Set up the Next.js 16 project with:
1. Install HeroUI v2, Zustand, TanStack Query, Framer Motion, react-hot-toast, bcryptjs, paystack
2. Configure Tailwind CSS 4 with custom NaijaBites theme (orange primary, Nigerian context)
3. Set up Prisma with PostgreSQL schema (all models as defined above)
4. Run db:push to create tables
5. Create seed script with default admin, sample categories, restaurants, foods
6. Configure NextAuth.js v4 with Credentials provider only
7. Set up folder structure as defined
8. Create utility functions (formatNaira, generateOrderNumber, etc.)
9. Create TypeScript type definitions
10. Create Zustand stores (cart, navigation, UI)
```

### Phase 2: Layout & Navigation
```
Build the application shell:
1. Root layout with HeroUI Provider, TanStack Query Provider, Session Provider, Toaster
2. Header component with: Logo, navigation tabs (Home, Restaurants, Menu, Orders), user dropdown, cart badge
3. Footer component (sticky to bottom)
4. Navigation store managing active section
5. Section-based rendering in page.tsx
6. Auth modals (login/register as overlays)
7. Cart panel (slide-in from right)
8. Admin mode toggle (switches to admin layout)
```

### Phase 3: Client-Side Features
```
Build all customer-facing features:
1. Home section with hero, popular foods, featured restaurants, how-it-works
2. Restaurants section with category filter, grid of restaurant cards
3. Menu section with food cards, category/restaurant filters, add-to-cart
4. Cart panel with items, quantity controls, remove, totals, checkout button
5. Checkout panel with delivery form, payment selector (Paystack/COD), order summary
6. Orders section with order list, status badges, order detail
7. Profile section with edit form, avatar upload
8. Food detail modal
```

### Phase 4: API Routes
```
Build all backend API routes:
1. Auth routes (register, NextAuth handler)
2. Category CRUD routes
3. Restaurant CRUD routes
4. Food CRUD routes with filtering (by category, restaurant, search)
5. Order routes (create, list, update status, cancel)
6. User management routes (admin)
7. Profile routes
8. Image upload route
9. Paystack integration (initialize, verify, webhook)
10. Dashboard stats and earnings routes
```

### Phase 5: Admin Panel
```
Build the admin panel:
1. Admin layout with sidebar navigation
2. Dashboard with stat cards and charts
3. Restaurant management (CRUD table + forms)
4. Category management (CRUD table + forms)
5. Food menu management (CRUD table + forms with image upload)
6. Order management (table with status update, detail view, remarks)
7. Customer management (user list, edit, block/unblock)
8. Earnings view (total revenue, breakdown by period, charts)
```

### Phase 6: Integration & Polish
```
Final integration and polish:
1. Paystack test integration end-to-end
2. Price verification during checkout (server-side)
3. Loading states and error handling on all components
4. Toast notifications for all user actions
5. Responsive design testing (mobile, tablet, desktop)
6. Framer Motion animations (page transitions, hover effects, slide-ins)
7. Empty states for all lists
8. Form validation (client + server side)
9. Image optimization with Next.js Image component
10. Final testing and bug fixes
```
