# Admin Panel Features Planning

## 1. Admin Panel Overview

### 1.1 Access Control
- Admin panel is a section within the single-page app (NOT a separate route)
- Toggle between customer view and admin view via header dropdown
- Only users with `role: ADMIN` can access admin features
- Non-admin users see "Access Denied" if they somehow navigate to admin section
- Server-side: All admin API routes check `isAdmin()` before processing

### 1.2 Admin Layout
**Design Reference:** Bentilzone admin layout (full-screen, orange sidebar) + Methuen admin dashboard

**Layout:**
```
AdminLayout
├── AdminSidebar (left, w-64, bg-orange-600, fixed)
│   ├── Logo ("NaijaBites Admin")
│   ├── NavigationMenu
│   │   ├── Dashboard (Home icon)
│   │   ├── Restaurants (Store icon)
│   │   ├── Categories (Tag icon)
│   │   ├── Food Menu (Utensils icon)
│   │   ├── Orders (ShoppingCart icon)
│   │   ├── Customers (Users icon)
│   │   └── Earnings (DollarSign icon)
│   └── LogoutButton
├── AdminContent (right, flex-1, bg-gray-50, ml-64)
│   ├── ContentHeader (breadcrumb + action buttons)
│   └── ContentBody (scrollable, p-6)
│       └── [Active Admin Section]
└── BackToStoreButton (top-right, "← Back to Store")
```

**Sidebar Design:**
- Background: `bg-orange-600`
- Text: `text-orange-50`
- Active item: `bg-orange-700 rounded-md`
- Hover: `bg-orange-700/50 rounded-md`
- Icons: Lucide icons, `text-xl`
- Count badges: Red circle with white text (for orders, users)
- Fixed position, full height

**Content Area Design:**
- Background: `bg-gray-50`
- Header: `border-b border-orange-200 py-4 px-6`
- Body: Scrollable with padding
- Max-width: None (full-width content)

---

## 2. Admin Dashboard

### 2.1 Dashboard Stats Cards
**Design Reference:** Methuen admin dashboard + Pizza Fiesta

**Layout:**
- 4-column grid (desktop), 2-column (tablet), 1-column (mobile)
- Each stat card: Icon + Title + Value + Trend indicator

**Stat Cards:**

| Card | Icon | Color | Data Source |
|------|------|-------|-------------|
| Total Restaurants | Store | orange-500 | `count(Restaurant)` |
| Total Food Items | Utensils | blue-500 | `count(Food)` |
| Total Customers | Users | green-500 | `count(User where role=CUSTOMER)` |
| Total Orders | ShoppingCart | purple-500 | `count(Order)` |
| Pending Orders | Clock | yellow-500 | `count(Order where status=PENDING)` |
| Today's Orders | Calendar | indigo-500 | `count(Order where createdAt=today)` |
| Total Earnings | DollarSign | emerald-500 | `sum(Order.totalAmount where paymentStatus=PAID)` |
| Cancelled Orders | XCircle | red-500 | `count(Order where status=CANCELLED)` |

**Card Design:**
```
StatCard
├── CardContainer (bg-white, rounded-xl, shadow-sm, p-6, border-l-4 [color])
│   ├── IconContainer (w-12 h-12, rounded-lg, bg-[color]-50, [color]-500 icon)
│   ├── StatTitle (text-sm, text-gray-500)
│   ├── StatValue (text-3xl, font-bold, text-gray-900)
│   └── StatTrend (text-xs)
│       ├── Up trend: "↑ 12% from yesterday" (green)
│       └── Down trend: "↓ 5% from yesterday" (red)
```

**API:** `GET /api/dashboard/stats`

### 2.2 Recent Orders Table
- 5 most recent orders
- Columns: Order #, Customer, Items, Amount, Status, Date
- "View All" link to Orders section
- Status badges with color coding

### 2.3 Revenue Chart
- Simple bar chart showing last 7 days revenue
- Using lightweight chart (CSS-based or recharts)
- NGN amounts on Y-axis
- Days on X-axis

---

## 3. Restaurant Management

### 3.1 Restaurant List
**Layout:**
- Section header: "Restaurants" + "Add Restaurant" button
- Search bar + Category filter
- Data table with all restaurants

**Table Columns:**
| Column | Width | Content |
|--------|-------|---------|
| Image | 60px | Thumbnail (w-10 h-10, rounded) |
| Name | — | Restaurant name |
| Category | 120px | Category badge |
| Email | 180px | Email (truncated) |
| Phone | 120px | Phone number |
| City | 100px | City |
| Status | 80px | Active/Inactive badge |
| Actions | 100px | Edit + Delete buttons |

**Components:**
```
AdminRestaurants
├── ContentHeader ("Restaurants" + AddButton)
├── FilterBar (Search + CategoryFilter)
└── RestaurantsTable (HeroUI Table)
    ├── TableHeader
    └── TableRows
        └── RestaurantRow (image, name, category, email, phone, city, status, actions)
```

### 3.2 Add/Edit Restaurant Form
**Design Reference:** Methuen add_restaurant.php

**Layout:**
- HeroUI Modal or inline form
- Two-column layout where applicable

**Form Fields:**

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Restaurant Name | Input | Required, min 3 chars | |
| Category | Select | Required | Dropdown from categories |
| Email | Input | Valid email format | Optional |
| Phone | Input | Valid Nigerian phone | Optional |
| Address | Textarea | Required, min 10 chars | |
| City | Select | Required | Nigerian cities list |
| State | Select | Required | Nigerian states list |
| Opening Time | Input (time) | Required | e.g. 08:00 |
| Closing Time | Input (time) | Required | e.g. 22:00 |
| Open Days | Input | Required | e.g. "Mon-Sat" |
| Image | FileUpload | jpg/png/webp, max 2MB | Preview before upload |
| isActive | Switch | Default: true | Toggle active status |

**Image Upload:**
- Click to upload or drag & drop
- Preview thumbnail
- Delete/remove uploaded image
- Upload to `/api/upload` → Returns URL

**Edge Cases:**
- Restaurant name already exists → Show error
- Closing time before opening time → Show validation error
- Image upload fails → Show error, allow retry
- Category deleted while form is open → Refresh categories

### 3.3 Delete Restaurant
- Confirmation modal: "Are you sure? All associated food items will also be deleted."
- Warning: "This action cannot be undone"
- On confirm: DELETE `/api/restaurants?id=X`
- Cascade delete: All foods under this restaurant are deleted
- Orders referencing this restaurant are NOT deleted (they have snapshots)
- Show toast: "Restaurant deleted successfully"

**Edge Cases:**
- Restaurant has active orders → Warn: "This restaurant has X active orders. Delete anyway?"
- Delete fails → Show error toast
- Multiple delete clicks → Debounce, show loading state

---

## 4. Food Category Management

### 4.1 Category List
**Layout:**
- Section header: "Food Categories" + "Add Category" button
- Grid of category cards (3-column)

**Category Card Design:**
```
CategoryCard
├── CardContainer (bg-white, rounded-lg, shadow-sm, overflow-hidden)
│   ├── CategoryImage (h-32, w-full, object-cover)
│   ├── CategoryInfo (p-4)
│   │   ├── CategoryName (font-semibold)
│   │   ├── FoodCount ("X food items" badge)
│   │   └── RestaurantCount ("X restaurants" badge)
│   └── CardActions (flex, border-t)
│       ├── EditButton (flex-1, text-center, hover:bg-gray-50)
│       └── DeleteButton (flex-1, text-center, hover:bg-red-50, text-red-600)
```

### 4.2 Add/Edit Category Form
**Fields:**

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Category Name | Input | Required, unique | e.g. "Nigerian", "Continental", "Chinese" |
| Description | Textarea | Optional | Brief description |
| Image | FileUpload | jpg/png/webp, max 2MB | Category cover image |

**Default Categories (Seed Data):**
1. Nigerian (Local dishes: jollof, egusi, suya, etc.)
2. Continental (Western dishes)
3. Chinese (Asian cuisine)
4. Fast Food (Burgers, pizza, etc.)
5. Drinks & Beverages
6. Desserts & Snacks

### 4.3 Delete Category
- Confirmation modal with warning about cascade delete
- Deleting a category deletes all restaurants and foods in that category
- Warning: "X restaurants and Y food items will be permanently deleted"
- Cannot delete the last category (minimum 1 required)

**Edge Cases:**
- Category has restaurants → Show count in delete confirmation
- Category has foods → Show count in delete confirmation
- Only one category left → Disable delete button, show tooltip
- Category name already exists on edit → Show error

---

## 5. Food Menu Management

### 5.1 Food Items List
**Layout:**
- Section header: "Food Menu" + "Add Food Item" button
- Search bar + Category filter + Restaurant filter + Availability filter
- Data table or card grid

**Table Columns:**
| Column | Width | Content |
|--------|-------|---------|
| Image | 60px | Thumbnail (rounded) |
| Name | — | Food name |
| Category | 120px | Category badge |
| Restaurant | 150px | Restaurant name |
| Price | 100px | ₦ amount |
| Available | 80px | Yes/No badge (green/red) |
| Actions | 100px | Edit + Delete + Toggle Availability |

### 5.2 Add/Edit Food Item Form
**Design Reference:** Pizza Fiesta MenuItemForm + Methuen add_menu.php

**Form Fields:**

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Food Name | Input | Required, min 2 chars | |
| Description | Textarea | Optional | Food description |
| Category | Select | Required | Dropdown from categories |
| Restaurant | Select | Required | Dropdown from restaurants (filtered by category?) |
| Base Price (₦) | NumberInput | Required, min 0 | Nigerian Naira amount |
| Image | FileUpload | jpg/png/webp, max 2MB | Food photo |
| Is Available | Switch | Default: true | Toggle availability |

**Price Input:**
- Prefix: ₦ symbol (red)
- Number format with comma separators
- Step: 100 (minimum increment ₦100)
- Min: 0

**Category-Restaurant Linkage:**
- When category is selected, restaurant dropdown filters to restaurants in that category
- If no restaurants in category, show "Add a restaurant first" message

### 5.3 Toggle Availability
- Quick toggle in the table row
- Switch component: Available (green) ↔ Unavailable (gray)
- No confirmation needed (reversible action)
- Shows toast: "Jollof Rice is now available/unavailable"

### 5.4 Delete Food Item
- Confirmation modal
- Warning: "This food item will be permanently deleted"
- Note: Existing orders with this food item will NOT be affected (they store snapshots)
- On confirm: DELETE `/api/foods?id=X`

**Edge Cases:**
- Food is in active orders → "This item is in X active orders. The orders will not be affected."
- Food image fails to delete → Log error, still delete food record
- Price is 0 → Show warning "Are you sure this item is free?"

---

## 6. Order Management

### 6.1 Orders List
**Layout:**
- Section header: "Manage Orders"
- Filter tabs: All, Pending, Confirmed, Preparing, On the Way, Delivered, Cancelled
- Search by order number or customer name
- Date range filter
- Data table

**Table Columns:**
| Column | Width | Content |
|--------|-------|---------|
| Order # | 120px | Order number (clickable, opens detail) |
| Customer | 150px | Name + Email |
| Items | — | Comma-separated food names (truncated) |
| Restaurant | 120px | Restaurant name |
| Amount | 100px | ₦ total |
| Payment | 80px | Paid/Pending badge |
| Status | 120px | Status badge (color-coded) |
| Date | 120px | Formatted date |
| Actions | 150px | View + Update Status + Delete |

**Status Badge Colors (Admin):**
| Status | Background | Text | Icon |
|--------|-----------|------|------|
| PENDING | blue-100 | blue-700 | Clock |
| CONFIRMED | indigo-100 | indigo-700 | CheckCircle |
| PREPARING | yellow-100 | yellow-700 | ChefHat |
| ON_THE_WAY | orange-100 | orange-700 | Truck |
| DELIVERED | green-100 | green-700 | CheckCheck |
| CANCELLED | red-100 | red-700 | XCircle |

### 6.2 Order Detail View
**Design Reference:** Methuen view_order.php + Pizza Fiesta order detail

**Layout:**
- Full section view (replaces table)
- Back button to orders list
- Order information sections

**Sections:**
```
OrderDetailView
├── OrderHeader
│   ├── OrderNumber
│   ├── OrderDate
│   ├── StatusBadge (large)
│   └── QuickActions (Update Status dropdown)
├── OrderInfo (2-column grid)
│   ├── CustomerInfo
│   │   ├── CustomerName
│   │   ├── CustomerEmail
│   │   ├── CustomerPhone
│   │   └── DeliveryAddress
│   ├── PaymentInfo
│   │   ├── PaymentMethod (Paystack/COD)
│   │   ├── PaymentStatus
│   │   ├── TransactionRef (if Paystack)
│   │   └── TotalAmount
│   └── RestaurantInfo
│       ├── RestaurantName
│       └── RestaurantAddress
├── OrderItems (table)
│   ├── ItemRow (image, name, qty, unit price, total) × N
│   └── OrderTotals
│       ├── Subtotal
│       ├── DeliveryFee
│       └── TotalAmount (bold)
├── StatusTimeline (visual progress)
├── StatusHistory (timeline of all status changes with timestamps and remarks)
└── UpdateStatusForm
    ├── StatusSelect (dropdown)
    ├── RemarkTextarea (optional)
    └── UpdateButton
```

### 6.3 Update Order Status
**Flow:**
1. Admin selects new status from dropdown
2. Optionally enters remark
3. Clicks "Update Status"
4. PUT `/api/orders` with { id, status, remark }
5. Order status updated
6. New OrderStatusHistory record created
7. If status = DELIVERED: `deliveredAt` set to now
8. If status = CANCELLED: `cancelledAt` set to now
9. Toast: "Order status updated to [status]"

**Status Transition Rules:**
```
PENDING → CONFIRMED (admin confirms)
PENDING → CANCELLED (admin or customer cancels)
CONFIRMED → PREPARING (restaurant starts cooking)
CONFIRMED → CANCELLED
PREPARING → ON_THE_WAY (out for delivery)
PREPARING → CANCELLED
ON_THE_WAY → DELIVERED (delivered)
ON_THE_WAY → CANCELLED (rare)
DELIVERED → (terminal state)
CANCELLED → (terminal state)
```

**Invalid Transitions:**
- Cannot go backwards (e.g., PREPARING → PENDING)
- Cannot change DELIVERED or CANCELLED orders
- Show validation error if invalid transition attempted

### 6.4 Order Status History
- Timeline display of all status changes
- Each entry: Status + Timestamp + Remark (if any) + ChangedBy (admin name or "Customer")
- Chronological order (newest first or oldest first)

**Design:**
```
StatusTimelineEntry
├── TimelineDot (colored by status)
├── TimelineLine (connecting to next entry)
├── StatusText (bold)
├── Timestamp ("Jan 1, 2024 at 10:30 AM")
└── RemarkText (italic, gray, if present)
    └── ChangedByText ("by Admin" / "by Customer")
```

### 6.5 Delete Order
- Only for admin
- Confirmation modal with severe warning
- Hard delete (removes order, order items, and status history)
- Warning: "This action is permanent and cannot be undone"
- Use case: Cleanup test orders, remove fraudulent orders
- Soft delete alternative: Consider adding `isDeleted` flag instead

**Edge Cases:**
- Paid order being deleted → "This is a paid order (₦X,XXX). Are you sure?"
- Order with Paystack reference → Refund should be initiated first
- Order in PREPARING/ON_THE_WAY → Extra warning: "This order is currently being prepared/in transit"
- Bulk delete (future feature)

---

## 7. Customer Management

### 7.1 Customer List
**Layout:**
- Section header: "Customers"
- Search bar (by name, email, phone)
- Filter: All, Active, Blocked
- Data table

**Table Columns:**
| Column | Width | Content |
|--------|-------|---------|
| Avatar | 50px | User avatar (w-8 h-8, rounded-full) |
| Name | 150px | Full name |
| Email | 200px | Email (truncated) |
| Phone | 120px | Phone number |
| Orders | 80px | Order count badge |
| Total Spent | 100px | ₦ total |
| Status | 80px | Active/Blocked badge |
| Joined | 100px | Registration date |
| Actions | 100px | Edit + Block/Unblock |

### 7.2 Customer Detail/Edit
**Layout:**
- Inline editing or modal
- Fields: Name, Phone, Address, Status

**Admin Actions:**
- **Block User:** Sets `status: BLOCKED`, user cannot login
- **Unblock User:** Sets `status: ACTIVE`
- **View Orders:** Navigate to orders filtered by this user
- **Edit Details:** Change name, phone, address

### 7.3 Block/Unblock Customer
**Flow:**
1. Admin clicks "Block" button
2. Confirmation modal: "Block [Name]? They will not be able to login."
3. PUT `/api/users` with { id, status: BLOCKED }
4. If user is currently logged in: Their session should be invalidated
5. Toast: "Customer blocked successfully"

**Edge Cases:**
- Block an admin → Prevent: "Cannot block admin users"
- Unblock a blocked user → "Customer unblocked"
- User has active orders → "This customer has X active orders. Block anyway?"

### 7.4 Delete Customer
- Confirmation modal
- Options: "Delete" vs "Block instead"
- Deleting removes user and all their orders
- Warning: "All X orders will also be permanently deleted"
- Recommendation: Block instead of delete (preserves order data)

---

## 8. Earnings Dashboard

### 8.1 Total Earnings Display
**Layout:**
- Large earnings card with total revenue
- Breakdown by payment method (Paystack vs COD)
- Period selector: Today, This Week, This Month, This Year, All Time

**Components:**
```
AdminEarnings
├── ContentHeader ("Earnings" + PeriodSelector)
├── EarningsSummary (grid, 3 columns)
│   ├── TotalEarnings (₦XXX,XXX, green trend)
│   ├── PaystackEarnings (₦XXX,XXX)
│   └── CODEarnings (₦XXX,XXX)
├── EarningsChart (bar/line chart, daily/weekly/monthly)
├── TopRestaurants (table, sorted by revenue)
│   ├── RestaurantName
│   ├── OrdersCount
│   └── Revenue
└── RecentTransactions (table, last 20 paid orders)
    ├── Date
    ├── OrderNumber
    ├── Customer
    ├── Amount
    ├── Method (Paystack/COD)
    └── Status
```

### 8.2 Earnings Calculation
```sql
-- Total Earnings
SELECT SUM("totalAmount") FROM "orders" WHERE "paymentStatus" = 'PAID';

-- Earnings by period
SELECT DATE("createdAt") as date, SUM("totalAmount") as revenue
FROM "orders" WHERE "paymentStatus" = 'PAID'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- Earnings by restaurant
SELECT r.name, COUNT(o.id) as order_count, SUM(o."totalAmount") as revenue
FROM "orders" o
JOIN "restaurants" r ON o."restaurantId" = r.id
WHERE o."paymentStatus" = 'PAID'
GROUP BY r.id, r.name
ORDER BY revenue DESC;
```

### 8.3 Earnings Chart
- Simple bar chart showing daily revenue
- Nigerian Naira on Y-axis
- Dates on X-axis
- Use CSS-based chart or simple chart library (avoid heavy dependencies)
- Hover tooltip: Date + Revenue

**Edge Cases:**
- No earnings in period → Show "₦0" with encouraging message
- COD orders not yet confirmed as paid → Show separately as "Pending COD"
- Refunded orders → Deduct from total, show "Refunded: ₦X,XXX"

---

## 9. Admin API Endpoints (Detailed)

### 9.1 Dashboard Stats
```
GET /api/dashboard/stats

Response:
{
  totalRestaurants: 15,
  totalFoods: 120,
  totalCustomers: 450,
  totalOrders: 1250,
  pendingOrders: 23,
  todayOrders: 15,
  totalEarnings: 2500000,  // in NGN
  cancelledOrders: 45
}
```

### 9.2 Earnings Data
```
GET /api/dashboard/earnings?period=month

Response:
{
  totalEarnings: 2500000,
  paystackEarnings: 1800000,
  codEarnings: 700000,
  dailyData: [
    { date: "2024-01-01", revenue: 85000, orders: 12 },
    { date: "2024-01-02", revenue: 92000, orders: 15 },
    ...
  ],
  topRestaurants: [
    { name: "Mama Put Kitchen", orders: 120, revenue: 450000 },
    ...
  ]
}
```

### 9.3 Restaurant CRUD
```
POST /api/restaurants
Body: { name, categoryId, email, phone, address, city, state, openTime, closeTime, openDays, image }
Response: { restaurant }

PUT /api/restaurants
Body: { id, name?, categoryId?, email?, phone?, address?, city?, state?, openTime?, closeTime?, openDays?, image?, isActive? }
Response: { restaurant }

DELETE /api/restaurants?id=xxx
Response: { success: true }
```

### 9.4 Category CRUD
```
POST /api/categories
Body: { name, description?, image? }
Response: { category }

PUT /api/categories
Body: { id, name?, description?, image? }
Response: { category }

DELETE /api/categories?id=xxx
Response: { success: true }
```

### 9.5 Food CRUD
```
POST /api/foods
Body: { name, description?, categoryId, restaurantId, price, image?, isAvailable? }
Response: { food }

PUT /api/foods
Body: { id, name?, description?, categoryId?, restaurantId?, price?, image?, isAvailable? }
Response: { food }

DELETE /api/foods?id=xxx
Response: { success: true }

GET /api/foods?categoryId=X&restaurantId=Y&search=Z&isAvailable=true
Response: { foods: [...] }
```

### 9.6 Order Management
```
GET /api/orders?status=PENDING&search=ORD-2024&page=1
Response: { orders: [...], total, page, pageSize }

PUT /api/orders
Body: { id, status, remark? }
Response: { order }

DELETE /api/orders?id=xxx
Response: { success: true }
```

### 9.7 User Management
```
GET /api/users?search=john&status=ACTIVE
Response: { users: [...] }

PUT /api/users
Body: { id, name?, phone?, address?, status? }
Response: { user }

DELETE /api/users?id=xxx
Response: { success: true }
```

---

## 10. Admin-Specific Edge Cases

### 10.1 Concurrent Editing
- Two admins editing same restaurant/food → Last write wins
- Show "last modified" timestamp to help resolve conflicts
- Future: Optimistic locking with version field

### 10.2 Data Integrity
- Deleting category with restaurants → Cascade delete with confirmation
- Deleting restaurant with foods → Cascade delete with confirmation
- Deleting food in active orders → Order items preserved (snapshot)
- Deleting customer with orders → Option to block instead

### 10.3 Bulk Operations (Future)
- Bulk delete orders
- Bulk update food availability
- Export data (CSV/PDF)
- Bulk import foods from spreadsheet

### 10.4 Admin Session
- Admin session timeout: 8 hours (longer than customer)
- Admin actions logged (audit trail)
- Only ADMIN role can access admin section
- If admin's role is changed to CUSTOMER: Immediate session invalidation

### 10.5 Image Management
- Image upload size: Max 2MB
- Accepted formats: jpg, jpeg, png, webp
- Image dimensions: Minimum 200x200px, maximum 4000x4000px
- Orphaned images cleanup: Cron job to remove images not referenced in DB
- Default placeholder images provided for categories/restaurants/foods

### 10.6 Nigerian Context
- All amounts in Nigerian Naira (₦)
- Nigerian states and cities in dropdowns
- Nigerian phone format validation
- Nigerian food categories and names
- Lagos, Abuja, Port Harcourt as primary cities
- Delivery fee structure for Nigerian logistics

---

## 11. Agentic Prompt for Admin Panel Implementation

```
You are building the ADMIN PANEL of NaijaBites, a Nigerian food ordering web application.

The admin panel is a SECTION within the single-page app (activeSection === 'admin'), using a separate layout with sidebar navigation.

## Admin Layout
1. Build AdminLayout with:
   - Left sidebar (w-64, fixed, bg-orange-600, full-height)
   - Navigation items: Dashboard, Restaurants, Categories, Food Menu, Orders, Customers, Earnings
   - Logo at top, Logout at bottom
   - "Back to Store" button in content header
2. Right content area (ml-64, bg-gray-50, scrollable)
3. Active admin section managed by Zustand sub-state (adminSection)

## Dashboard Section
1. 8 stat cards in responsive grid (Total Restaurants, Foods, Customers, Orders, Pending Orders, Today's Orders, Earnings, Cancelled Orders)
2. Each card: colored icon, title, value, trend indicator
3. Recent orders table (5 rows)
4. Simple revenue bar chart (last 7 days)

## Restaurant Management
1. Table listing with search, category filter
2. Add form in HeroUI Modal: name, category, email, phone, address, city, state, open/close time, days, image upload, active switch
3. Edit form (same as add, pre-populated)
4. Delete with cascade warning modal
5. Nigerian cities/states dropdowns

## Category Management
1. Card grid (3-column) with image, name, food/restaurant counts
2. Add form: name, description, image upload
3. Edit form (pre-populated)
4. Delete with cascade warning
5. Cannot delete last category

## Food Menu Management
1. Table listing with search, category filter, restaurant filter, availability filter
2. Add form: name, description, category, restaurant (filtered by category), price (₦), image, availability switch
3. Quick availability toggle in table
4. Edit form (pre-populated)
5. Delete with confirmation

## Order Management
1. Table with status filter tabs, search, date filter
2. Order detail view with: customer info, payment info, items table, status timeline, status history
3. Update status form: dropdown + remark textarea
4. Status transitions: PENDING→CONFIRMED→PREPARING→ON_THE_WAY→DELIVERED (or CANCELLED)
5. Prevent backward transitions and terminal state changes
6. Delete with severe warning (especially for paid orders)

## Customer Management
1. Table with search, status filter (Active/Blocked)
2. Customer detail/edit form
3. Block/unblock with confirmation
4. Cannot block admin users
5. Delete with warning, recommend blocking instead

## Earnings Section
1. Period selector (Today/Week/Month/Year/All Time)
2. Summary cards: Total, Paystack, COD
3. Revenue chart (daily bar chart)
4. Top restaurants table
5. Recent transactions table

## API Endpoints (All Admin-Protected)
- GET/POST/PUT/DELETE /api/restaurants
- GET/POST/PUT/DELETE /api/categories
- GET/POST/PUT/DELETE /api/foods
- GET/PUT/DELETE /api/orders (admin can see all, update status)
- GET/PUT/DELETE /api/users
- GET /api/dashboard/stats
- GET /api/dashboard/earnings
- POST /api/upload

## Design Requirements
- Orange sidebar (#f97316 family) with white text
- Light content area (bg-gray-50)
- HeroUI Table component for all data tables
- HeroUI Modal for forms
- Orange accent on active items
- Responsive: Sidebar collapses on mobile
- Loading states for all data
- Empty states for all lists
- Toast notifications for all CRUD operations
```
