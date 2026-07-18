# 10 — Admin Portal, Restaurant Portal & Multi-Restaurant Order Flow

## 1. Problem Statement

The current NaijaBites system has critical gaps:
1. **No Admin SuperAdmin portal** that oversees and monitors everything
2. **No Restaurant Owner portal** for restaurants to manage their own orders/menus
3. **No multi-restaurant order splitting** — a customer ordering from 2 restaurants creates confusion
4. **No clear status flow** — who changes what, when, is undefined

This document designs the complete architecture inspired by **Glovo** and **Chowdeck** — adapted for a student project.

---

## 2. Three-Portal Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        NaijaBites Platform                        │
│                                                                   │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │  CUSTOMER    │  │  RESTAURANT      │  │  ADMIN             │  │
│  │  PORTAL      │  │  OWNER PORTAL    │  │  (SUPERADMIN)      │  │
│  │             │  │  PORTAL          │  │  PORTAL             │  │
│  │ - Browse    │  │                  │  │                     │  │
│  │ - Order     │  │ - Accept/Reject  │  │ - Manage ALL       │  │
│  │ - Track     │  │   orders         │  │   restaurants      │  │
│  │ - Pay       │  │ - Update status  │  │ - Manage ALL       │  │
│  │ - Profile   │  │ - Manage menu    │  │   orders           │  │
│  │             │  │ - View earnings  │  │ - Manage users     │  │
│  │             │  │ - Restaurant     │  │ - View earnings    │  │
│  │             │  │   profile        │  │ - Dashboard        │  │
│  │             │  │                  │  │ - Assign owners    │  │
│  └─────────────┘  └──────────────────┘  └────────────────────┘  │
│                                                                   │
│  Role: CUSTOMER    Role: RESTAURANT_OWNER   Role: ADMIN          │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 How Users Switch Portals

The app remains a **single-page app** with client-side navigation. Portal switching is role-based:

| User Role | Default View | Can Switch To |
|-----------|-------------|---------------|
| CUSTOMER | Customer view (home, restaurants, menu, cart, orders, profile) | — |
| RESTAURANT_OWNER | Restaurant Owner Portal (by default) | Customer view (to browse/order) |
| ADMIN | Admin Portal (by default) | Customer view (to browse/order) |

**Implementation:** The Header shows the current portal with a switcher dropdown:
- Admin sees: "Admin Panel" ← → "Switch to Store"
- Restaurant Owner sees: "My Restaurant" ← → "Switch to Store"
- Customer sees: no switcher (always in customer view)

---

## 3. Order Splitting Architecture (Glovo/Chowdeck Model)

### 3.1 The Core Concept

When a customer orders from **multiple restaurants** in one checkout:

```
Customer Cart:
  ├── Jollof Rice (Mama Calabar) — ₦2,500
  ├── Pounded Yam (Mama Calabar) — ₦3,000
  ├── Suya (Suya Spot)           — ₦1,500
  └── Shawarma (Sharp Sharp)     — ₦2,000

On Checkout → System creates:

  ORDER #NB-ORD-001 (Parent — Customer sees this)
  ├── SubOrder #NB-SUB-001-A (Mama Calabar)
  │   ├── Jollof Rice × 1 — ₦2,500
  │   └── Pounded Yam × 1 — ₦3,000
  │   Subtotal: ₦5,500 | Status: PENDING
  │
  ├── SubOrder #NB-SUB-001-B (Suya Spot)
  │   └── Suya × 1 — ₦1,500
  │   Subtotal: ₦1,500 | Status: PENDING
  │
  └── SubOrder #NB-SUB-001-C (Sharp Sharp)
      └── Shawarma × 1 — ₦2,000
      Subtotal: ₦2,000 | Status: PENDING

  Order Total: ₦9,000 + Delivery Fees
```

### 3.2 What Each Role Sees

**Customer sees:** ONE order (#NB-ORD-001) with a per-restaurant breakdown showing each sub-order's status independently.

**Restaurant Owner (Mama Calabar) sees:** Only SubOrder #NB-SUB-001-A with their items. They don't know about the other restaurants.

**Admin sees:** Everything — the parent order AND all sub-orders.

### 3.3 SubOrder Numbering

```
Parent Order:  NB-ORD-20240115-001
SubOrder:      NB-ORD-20240115-001-A  (first restaurant)
SubOrder:      NB-ORD-20240115-001-B  (second restaurant)
SubOrder:      NB-ORD-20240115-001-C  (third restaurant)
```

---

## 4. Order Status Flow — Who Changes What

### 4.1 SubOrder Status Lifecycle

```
                    ┌──────────────┐
                    │   PENDING    │ ← Initial state when order is placed
                    └──────┬───────┘
                           │
              ┌────────────┼─────────────┐
              │            │             │
    ┌─────────▼──────┐    │    ┌────────▼────────┐
    │   CONFIRMED    │    │    │   CANCELLED     │
    │  (Restaurant   │    │    │  (Restaurant    │
    │   Owner        │    │    │   Owner rejects │
    │   accepts)     │    │    │   OR Customer   │
    └────────┬───────┘    │    │   cancels       │
             │            │    └─────────────────┘
    ┌────────▼───────┐    │
    │   PREPARING    │    │    ★ ADMIN can force ANY
    │  (Restaurant   │    │      status change on ANY
    │   Owner starts │    │      sub-order at ANY time
    │   cooking)     │    │
    └────────┬───────┘    │
             │            │
    ┌────────▼───────┐    │
    │     READY      │    │
    │  (Restaurant   │    │
    │   Owner marks  │    │
    │   food ready)  │    │
    └────────┬───────┘    │
             │            │
    ┌────────▼───────┐    │
    │   ON_THE_WAY   │    │
    │  (Restaurant   │    │
    │   Owner marks  │    │
    │   dispatched)  │    │
    └────────┬───────┘    │
             │            │
    ┌────────▼───────┐    │
    │   DELIVERED    │    │
    │  (Restaurant   │    │
    │   Owner or     │    │
    │   Admin marks  │    │
    │   delivered)   │    │
    └────────────────┘    │
```

### 4.2 Status Change Rules Matrix

| From Status | To Status | Who Can Change | Condition |
|------------|-----------|---------------|-----------|
| PENDING | CONFIRMED | Restaurant Owner | Restaurant accepts the order |
| PENDING | CANCELLED | Restaurant Owner | Restaurant rejects (must give reason) |
| PENDING | CANCELLED | Customer | Customer cancels before confirmation |
| PENDING | CONFIRMED | Admin | Admin can force-accept |
| PENDING | CANCELLED | Admin | Admin can force-cancel |
| CONFIRMED | PREPARING | Restaurant Owner | Restaurant starts cooking |
| CONFIRMED | CANCELLED | Admin | Admin can cancel after confirmation |
| PREPARING | READY | Restaurant Owner | Food is ready for pickup |
| PREPARING | CANCELLED | Admin | Admin can cancel during preparation |
| READY | ON_THE_WAY | Restaurant Owner | Dispatched for delivery |
| ON_THE_WAY | DELIVERED | Restaurant Owner | Confirms delivery |
| ON_THE_WAY | DELIVERED | Admin | Admin confirms delivery |
| Any | Any | Admin | Admin has override power |

### 4.3 Parent Order Status Derivation

The parent Order status is **computed** from its SubOrders:

```typescript
function deriveParentStatus(subOrders: SubOrder[]): OrderStatus {
  const statuses = subOrders.map(s => s.status);
  
  // ALL cancelled → parent cancelled
  if (statuses.every(s => s === 'CANCELLED')) return 'CANCELLED';
  
  // ALL delivered → parent delivered
  if (statuses.every(s => s === 'DELIVERED')) return 'DELIVERED';
  
  // Filter out cancelled (they're "done")
  const active = statuses.filter(s => s !== 'CANCELLED');
  
  if (active.length === 0) return 'CANCELLED'; // all cancelled
  
  // Find the "lowest" status among active sub-orders
  const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED'];
  const minIndex = Math.min(...active.map(s => statusOrder.indexOf(s)));
  
  return statusOrder[minIndex] as OrderStatus;
}
```

### 4.4 Customer Order View

When a customer views their order, they see:

```
┌─────────────────────────────────────────────┐
│  Order #NB-ORD-20240115-001                 │
│  Overall: In Progress                       │
│                                              │
│  ┌─ Mama Calabar ──────── PREPARING 🟡 ──┐  │
│  │  Jollof Rice × 1          ₦2,500      │  │
│  │  Pounded Yam × 1          ₦3,000      │  │
│  │  Subtotal:                ₦5,500      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ Suya Spot ─────────── CONFIRMED 🟢 ──┐  │
│  │  Suya × 1                 ₦1,500      │  │
│  │  Subtotal:                ₦1,500      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ Sharp Sharp ───────── ON_THE_WAY 🔵 ─┐  │
│  │  Shawarma × 1             ₦2,000      │  │
│  │  Subtotal:                ₦2,000      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Delivery Fee:    ₦1,500 (₦500 × 3)         │
│  Total:           ₦10,500                    │
│  Payment:         Paid (Paystack)            │
└─────────────────────────────────────────────┘
```

---

## 5. Delivery Fee Model

**Per-Restaurant Delivery Fee (like Chowdeck):**
- Each restaurant charges a delivery fee
- ₦500 per restaurant for orders under ₦5,000 from that restaurant
- FREE delivery per restaurant if that restaurant's subtotal ≥ ₦5,000

```
Example:
  Mama Calabar:  ₦5,500 subtotal → ₦0 delivery (free over ₦5K)
  Suya Spot:     ₦1,500 subtotal → ₦500 delivery
  Sharp Sharp:   ₦2,000 subtotal → ₦500 delivery
  
  Total Delivery Fee: ₦1,000
  Total Order:        ₦10,000
```

---

## 6. Restaurant Owner Portal Design

### 6.1 Navigation

```
RestaurantOwnerLayout
├── RestaurantSidebar (left, w-64, bg-green-700)
│   ├── Logo ("NaijaBites — Restaurant")
│   ├── Restaurant Name + Image
│   ├── NavigationMenu
│   │   ├── Dashboard (LayoutDashboard icon)
│   │   ├── Orders (ShoppingCart icon)
│   │   │   ├── Pending (badge count)
│   │   │   ├── Active
│   │   │   └── Completed
│   │   ├── Menu (Utensils icon)
│   │   ├── Earnings (Banknote icon)
│   │   └── Settings (Settings icon)
│   ├── Toggle: Open/Closed for orders
│   └── SwitchToStoreButton
├── RestaurantContent (right, flex-1, bg-gray-50, ml-64)
│   ├── ContentHeader
│   └── ContentBody
│       └── [Active Restaurant Section]
```

### 6.2 Restaurant Owner Dashboard

```
┌──────────────────────────────────────────────────────┐
│  Dashboard — Mama Calabar                            │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ New      │ │ Active   │ │ Completed │ │ Today's  ││
│  │ Orders   │ │ Orders   │ │ Today     │ │ Earnings ││
│  │    3     │ │    2     │ │    8      │ │  ₦25,000 ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                       │
│  ┌─ Pending Orders (Need Action!) ──────────────────┐│
│  │ #NB-SUB-001-B — Suya Spot items — ₦1,500  [Accept] [Reject] │
│  │ #NB-SUB-001-C — Sharp Sharp items — ₦2,000 [Accept] [Reject] │
│  └──────────────────────────────────────────────────┘│
│                                                       │
│  ┌─ Recent Active Orders ───────────────────────────┐│
│  │ #NB-SUB-001-A — ₦5,500 — PREPARING  [Mark Ready]│
│  │ #NB-SUB-0008  — ₦3,200 — READY      [Dispatch]  │
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### 6.3 Restaurant Owner Order Management

When a restaurant owner clicks on an order:

```
┌──────────────────────────────────────────────────────┐
│  SubOrder #NB-SUB-001-A                              │
│  From Order: #NB-ORD-20240115-001                    │
│  Customer: John Doe • +2348012345678                 │
│  Delivery: 15 Allen Avenue, Ikeja, Lagos             │
│                                                       │
│  Items:                                               │
│  ┌──────────────────────────────────────────┐        │
│  │ Jollof Rice × 2              ₦5,000     │        │
│  │ Pounded Yam & Egusi × 1      ₦3,000     │        │
│  └──────────────────────────────────────────┘        │
│  Subtotal: ₦8,000                                     │
│                                                       │
│  Status Timeline:                                     │
│  ✅ PENDING    — 2:00 PM (Auto)                      │
│  ✅ CONFIRMED  — 2:02 PM (You accepted)              │
│  🔵 PREPARING  — 2:05 PM (You started cooking)       │
│  ⬜ READY      — Pending                             │
│  ⬜ ON_THE_WAY — Pending                             │
│  ⬜ DELIVERED  — Pending                             │
│                                                       │
│  [Mark as Ready]                                      │
│  [Cancel Order]                                       │
└──────────────────────────────────────────────────────┘
```

### 6.4 Restaurant Owner Menu Management

Restaurant owners can ONLY manage foods for their own restaurant:
- Add new food items
- Edit food name, description, price, image
- Toggle food availability (isAvailable)
- CANNOT delete categories, CANNOT change restaurant details (Admin does that)

### 6.5 Restaurant Owner Earnings

```
┌──────────────────────────────────────────────────────┐
│  Earnings — Mama Calabar                             │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Total    │ │ Platform │ │ Your     │             │
│  │ Revenue  │ │ Commission│ │ Earnings │             │
│  │ ₦150,000 │ │ ₦15,000  │ │ ₦135,000 │             │
│  │          │ │ (10%)    │ │ (90%)    │             │
│  └──────────┘ └──────────┘ └──────────┘             │
│                                                       │
│  Commission Rate: 10%                                 │
│                                                       │
│  ┌─ Recent Earnings ────────────────────────────────┐│
│  │ Date       | Orders | Revenue | Commission | Net  ││
│  │ 2024-01-15 |   8    | ₦25,000 | ₦2,500    | ₦22,500│
│  │ 2024-01-14 |   12   | ₦40,000 | ₦4,000    | ₦36,000│
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

---

## 7. Admin (SuperAdmin) Portal — Enhanced

### 7.1 What Admin Can Do (That Restaurant Owner Cannot)

| Feature | Admin | Restaurant Owner |
|---------|-------|-----------------|
| View ALL orders across ALL restaurants | ✅ | ❌ (own only) |
| View ALL sub-orders | ✅ | ❌ (own only) |
| Change ANY sub-order status | ✅ | ❌ (own only, limited) |
| Cancel ANY order | ✅ | ❌ (own sub-orders only) |
| Manage ALL restaurants (CRUD) | ✅ | ❌ |
| Assign restaurant owners | ✅ | ❌ |
| Activate/deactivate restaurants | ✅ | ❌ |
| Manage ALL categories | ✅ | ❌ |
| Manage ALL food items | ✅ | ❌ (own restaurant only) |
| Manage ALL users | ✅ | ❌ |
| Block/unblock users | ✅ | ❌ |
| View platform-wide earnings | ✅ | ❌ (own only) |
| View platform commissions | ✅ | ❌ |
| Manage delivery fees | ✅ | ❌ |

### 7.2 Enhanced Admin Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                             │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Total    │ │ Total    │ │ Platform │ │ Active   │       │
│  │ Orders   │ │ Revenue  │ │ Commission│ │ Restaurants│     │
│  │   156    │ │ ₦850,000 │ │ ₦85,000  │ │    5     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Pending  │ │ Today's  │ │ Today's  │ │ Total    │       │
│  │ SubOrders│ │ Orders   │ │ Revenue  │ │ Customers│       │
│  │    7     │ │    23    │ │ ₦45,000  │ │   89     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  ┌─ Orders Needing Attention ──────────────────────────────┐│
│  │ ⚠️ 3 sub-orders PENDING for 15+ minutes               ││
│  │ ⚠️ 1 restaurant offline with active orders             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ Per-Restaurant Summary ────────────────────────────────┐│
│  │ Restaurant      | Orders Today | Revenue | Status       ││
│  │ Mama Calabar    |      8       | ₦25,000 | 🟢 Online   ││
│  │ Suya Spot       |      5       | ₦8,000  | 🟢 Online   ││
│  │ Sharp Sharp     |      3       | ₦6,000  | 🔴 Offline  ││
│  │ Wok & Roll      |      4       | ₦9,000  | 🟢 Online   ││
│  │ Zobo Palace     |      3       | ₦7,000  | 🟢 Online   ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Admin Orders View

Admin sees the parent order with ALL sub-orders:

```
┌──────────────────────────────────────────────────────────────┐
│  Order #NB-ORD-20240115-001 — John Doe                      │
│  Overall: PREPARING | Total: ₦10,500 | Paid                 │
│                                                               │
│  ┌─ SubOrder A — Mama Calabar — PREPARING ────────────────┐ │
│  │ Jollof Rice × 2 (₦5,000), Pounded Yam × 1 (₦3,000)   │ │
│  │ Subtotal: ₦8,000 | Commission: ₦800 | Earnings: ₦7,200 │ │
│  │ [Change Status ▼] Admin override available              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ SubOrder B — Suya Spot — CONFIRMED ───────────────────┐ │
│  │ Suya × 1 (₦1,500)                                      │ │
│  │ Subtotal: ₦1,500 | Commission: ₦150 | Earnings: ₦1,350 │ │
│  │ [Change Status ▼] Admin override available              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ SubOrder C — Sharp Sharp — ON_THE_WAY ────────────────┐ │
│  │ Shawarma × 1 (₦2,000)                                  │ │
│  │ Subtotal: ₦2,000 | Commission: ₦200 | Earnings: ₦1,800 │ │
│  │ [Change Status ▼] Admin override available              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Delivery: ₦1,000 (₦500 × 2, Mama Calabar free over ₦5K)  │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Cart Changes — Multi-Restaurant Support

### 8.1 Current State
The cart currently allows items from ONE restaurant only (enforced in `addItem`).

### 8.2 New Behavior
The cart now allows items from **multiple restaurants**:
- Items are grouped by restaurant in the cart panel
- Each restaurant group shows its own subtotal
- Delivery fee is calculated per-restaurant
- A warning shows: "Items from N restaurants — each restaurant delivers separately"

### 8.3 Cart Store Changes

```typescript
interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  
  // NEW: Group items by restaurant
  getGroupedByRestaurant: () => Map<string, CartItem[]>;
  getRestaurantCount: () => number;  // how many restaurants in cart
  
  // Existing (modified)
  getSubtotal: () => number;                    // total across all restaurants
  getDeliveryFee: () => number;                 // sum of per-restaurant delivery fees
  getPerRestaurantDeliveryFee: (restaurantId: string) => number;  // per restaurant
  getPerRestaurantSubtotal: (restaurantId: string) => number;     // per restaurant
  
  // REMOVE: getRestaurantId() — no longer single-restaurant
  // REMOVE: single-restaurant restriction in addItem
}
```

---

## 9. Database Schema Changes

### 9.1 New/Modified Models

```prisma
model User {
  // ... existing fields ...
  role      String   @default("CUSTOMER")  // NOW: CUSTOMER | ADMIN | RESTAURANT_OWNER
  // ... 
  ownedRestaurants Restaurant[]  // NEW: for RESTAURANT_OWNER role
}

model Restaurant {
  // ... existing fields ...
  ownerId         String?   // NEW: links to User (RESTAURANT_OWNER)
  owner           User?     @relation(fields: [ownerId], references: [id])
  commissionRate  Float     @default(10)  // NEW: platform commission %
  // ...
  subOrders       SubOrder[]  // CHANGED: from orders to subOrders
}

// NEW: SubOrder — the per-restaurant fulfillment order
model SubOrder {
  id               String   @id @default(cuid())
  subOrderNumber   String   @unique
  orderId          String
  order            Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  restaurantId     String
  restaurant       Restaurant @relation(fields: [restaurantId], references: [id])
  status           String   @default("PENDING")
  subtotal         Float
  deliveryFee      Float    @default(0)
  commissionRate   Float    @default(10)
  commissionAmount Float    @default(0)
  restaurantEarnings Float  @default(0)
  estimatedPrepTime Int?    // minutes
  preparedAt       DateTime?
  readyAt          DateTime?
  pickedUpAt       DateTime?
  deliveredAt      DateTime?
  cancelledAt      DateTime?
  cancelReason     String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  items          OrderItem[]
  statusHistory  SubOrderStatusHistory[]
}

// CHANGED: OrderItem now links to SubOrder
model OrderItem {
  id          String   @id @default(cuid())
  subOrderId  String   // CHANGED from orderId
  subOrder    SubOrder @relation(fields: [subOrderId], references: [id], onDelete: Cascade)
  foodId      String
  food        Food     @relation(fields: [foodId], references: [id])
  foodName    String
  foodImage   String?
  quantity    Int      @default(1)
  unitPrice   Float
  totalPrice  Float
}

// NEW: SubOrder status history
model SubOrderStatusHistory {
  id             String   @id @default(cuid())
  subOrderId     String
  subOrder       SubOrder @relation(fields: [subOrderId], references: [id], onDelete: Cascade)
  status         String
  remark         String?
  changedBy      String?  // userId
  changedByRole  String?  // CUSTOMER | RESTAURANT_OWNER | ADMIN | SYSTEM
  createdAt      DateTime @default(now())
}

// Order (Parent) — restaurantId REMOVED
model Order {
  // ... all existing fields EXCEPT restaurantId and restaurant relation ...
  // ADD:
  subOrders    SubOrder[]
  // KEEP:
  items        OrderItem[]  // convenience: all items across all sub-orders
  statusHistory OrderStatusHistory[]
}
```

---

## 10. API Routes — New & Modified

### 10.1 Restaurant Owner API Routes

```
GET    /api/restaurant-owner/dashboard    — Restaurant owner dashboard stats
GET    /api/restaurant-owner/orders       — List sub-orders for owned restaurants
GET    /api/restaurant-owner/orders/:id   — Get sub-order detail
PUT    /api/restaurant-owner/orders/:id/status — Update sub-order status
GET    /api/restaurant-owner/foods        — List foods for owned restaurant(s)
POST   /api/restaurant-owner/foods        — Add food to owned restaurant
PUT    /api/restaurant-owner/foods/:id    — Update food in owned restaurant
DELETE /api/restaurant-owner/foods/:id    — Delete food from owned restaurant
GET    /api/restaurant-owner/earnings     — Earnings for owned restaurant(s)
PUT    /api/restaurant-owner/profile      — Update restaurant profile/settings
POST   /api/restaurant-owner/toggle-status — Toggle restaurant open/closed
```

### 10.2 Modified Checkout Flow

```
POST /api/orders (checkout)
  1. Validate cart items (server-side price verification)
  2. Group items by restaurantId
  3. Create ONE Order (parent) — total amount, delivery info, payment info
  4. For each restaurant group:
     a. Create SubOrder with restaurant-specific items
     b. Calculate per-restaurant delivery fee
     c. Calculate commission (subtotal × commissionRate / 100)
     d. Calculate restaurant earnings (subtotal - commission)
     e. Create OrderItems under the SubOrder
     f. Create initial SubOrderStatusHistory (PENDING, changedBy: SYSTEM)
  5. Create initial OrderStatusHistory (PENDING, changedBy: SYSTEM)
  6. Initialize Paystack payment (if PAYSTACK method)
  7. Return parent order with sub-orders
```

### 10.3 Modified Orders API

```
GET /api/orders
  - Customer: returns their orders with sub-orders
  - Restaurant Owner: returns sub-orders for their restaurants
  - Admin: returns ALL orders with sub-orders

GET /api/orders/:id
  - Customer: their order with sub-orders and per-restaurant breakdown
  - Restaurant Owner: parent order but only their sub-order details
  - Admin: full order with all sub-orders
```

---

## 11. Auth Changes

### 11.1 New Role: RESTAURANT_OWNER

```typescript
export type Role = 'CUSTOMER' | 'ADMIN' | 'RESTAURANT_OWNER';
```

### 11.2 New Auth Helper

```typescript
export async function requireRestaurantOwner() {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  if (session!.user.role !== 'RESTAURANT_OWNER' && session!.user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

// Verify that the restaurant owner owns a specific restaurant
export async function requireRestaurantOwnership(restaurantId: string) {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null, restaurant: null };
  
  if (session!.user.role === 'ADMIN') {
    // Admin has access to everything
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
    return { error: null, session, restaurant };
  }
  
  if (session!.user.role !== 'RESTAURANT_OWNER') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null, restaurant: null };
  }
  
  const restaurant = await db.restaurant.findFirst({
    where: { id: restaurantId, ownerId: session!.user.id }
  });
  
  if (!restaurant) {
    return { error: NextResponse.json({ error: 'Not your restaurant' }, { status: 403 }), session: null, restaurant: null };
  }
  
  return { error: null, session, restaurant };
}
```

### 11.3 Session Enhancement

Add `ownedRestaurantIds` to the JWT session for RESTAURANT_OWNER:

```typescript
// In auth.ts callbacks
async jwt({ token, user }) {
  if (user) {
    token.role = user.role;
    token.id = user.id;
    
    // If restaurant owner, include their restaurant IDs
    if (user.role === 'RESTAURANT_OWNER') {
      const restaurants = await db.restaurant.findMany({
        where: { ownerId: user.id },
        select: { id: true }
      });
      token.ownedRestaurantIds = restaurants.map(r => r.id);
    }
  }
  return token;
}
```

---

## 12. Navigation & UI Flow

### 12.1 Updated NavigationSection Type

```typescript
export type NavigationSection = 
  | 'home' | 'restaurants' | 'menu' | 'orders' | 'profile' 
  | 'admin' | 'restaurant-owner';
```

### 12.2 Updated Navigation Store

```typescript
interface NavigationStore {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  
  adminSection: AdminSection;
  setAdminSection: (section: AdminSection) => void;
  
  // NEW
  restaurantOwnerSection: RestaurantOwnerSection;
  setRestaurantOwnerSection: (section: RestaurantOwnerSection) => void;
  
  // ... existing filters ...
}

export type RestaurantOwnerSection = 
  | 'dashboard' | 'orders' | 'menu' | 'earnings' | 'settings';
```

### 12.3 Header Switcher

```
For ADMIN user:
┌─────────────────────────────────────────────────┐
│ 🍽️ NaijaBites  |  Home  Restaurants  Menu  | 👤 Admin Panel ▼ │
│                                                │ │ Switch to Store │ │
│                                                │ └─────────────────┘ │
└─────────────────────────────────────────────────┘

For RESTAURANT_OWNER user:
┌─────────────────────────────────────────────────┐
│ 🍽️ NaijaBites  |  Home  Restaurants  Menu  | 👤 My Restaurant ▼ │
│                                                │ │ Switch to Store │ │
│                                                │ └─────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 13. Seed Data — Restaurant Owners

### 13.1 New Users

```typescript
// Restaurant owners (each linked to a restaurant)
const owner1 = await prisma.user.upsert({
  where: { email: 'mama@calabar.ng' },
  update: {},
  create: {
    name: 'Mama Calabar',
    email: 'mama@calabar.ng',
    password: await hash('owner123', 12),
    phone: '+2348011111111',
    role: 'RESTAURANT_OWNER',
  },
});

const owner2 = await prisma.user.upsert({
  where: { email: 'suya@spot.ng' },
  update: {},
  create: {
    name: 'Alhaji Suya',
    email: 'suya@spot.ng',
    password: await hash('owner123', 12),
    phone: '+2348022222222',
    role: 'RESTAURANT_OWNER',
  },
});

// ... more owners ...

// Then link owners to restaurants:
await prisma.restaurant.update({
  where: { id: mamaCalabar.id },
  data: { ownerId: owner1.id },
});
```

### 13.2 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@naijabites.ng | admin123 |
| Customer | customer@test.com | password123 |
| Restaurant Owner (Mama Calabar) | mama@calabar.ng | owner123 |
| Restaurant Owner (Suya Spot) | suya@spot.ng | owner123 |
| Restaurant Owner (Sharp Sharp) | sharp@sharp.ng | owner123 |
| Restaurant Owner (Wok & Roll) | wok@roll.ng | owner123 |
| Restaurant Owner (Zobo Palace) | zobo@palace.ng | owner123 |

---

## 14. Implementation Order

```
Step 1: Schema Migration
  - Update prisma/schema.prisma with SubOrder, SubOrderStatusHistory models
  - Add ownerId to Restaurant
  - Add RESTAURANT_OWNER role
  - Remove restaurantId from Order (or make it nullable for backwards compat)
  - Run db:push

Step 2: Types & Auth Updates
  - Update types/index.ts with SubOrder types, new Role, RestaurantOwnerSection
  - Update auth.ts with RESTAURANT_OWNER JWT handling
  - Add requireRestaurantOwner(), requireRestaurantOwnership() auth helpers

Step 3: Seed Data
  - Create restaurant owner users
  - Link owners to existing restaurants
  - Run seed

Step 4: Cart Store Update
  - Remove single-restaurant restriction
  - Add multi-restaurant grouping methods
  - Per-restaurant delivery fee calculation

Step 5: Navigation & Page Updates
  - Add 'restaurant-owner' to NavigationSection
  - Add restaurantOwnerSection to navigation store
  - Add RestaurantOwnerLayout to page.tsx switch

Step 6: Restaurant Owner API Routes
  - /api/restaurant-owner/dashboard
  - /api/restaurant-owner/orders (+ status updates)
  - /api/restaurant-owner/foods
  - /api/restaurant-owner/earnings
  - /api/restaurant-owner/profile

Step 7: Restaurant Owner UI
  - RestaurantOwnerLayout component
  - RestaurantDashboard
  - RestaurantOrders (with accept/reject/status flow)
  - RestaurantMenu
  - RestaurantEarnings
  - RestaurantSettings

Step 8: Update Checkout Flow
  - Modify POST /api/orders to create SubOrders
  - Group items by restaurant
  - Calculate commissions and delivery fees

Step 9: Update Customer Orders View
  - Show per-restaurant breakdown in OrdersSection
  - Sub-order status timeline
  - Allow cancel before confirmation

Step 10: Update Admin Portal
  - Show sub-orders in admin order view
  - Per-restaurant summary on dashboard
  - Commission tracking
  - Restaurant owner management (assign/remove owners)

Step 11: Header Update
  - Add portal switcher for ADMIN and RESTAURANT_OWNER
  - Show appropriate navigation based on current portal
```
