# API & Backend Planning

## 1. API Architecture Overview

### 1.1 Design Principles
- **RESTful API** — Resource-based endpoints with proper HTTP methods
- **Server-side validation** — All input validated with Zod schemas
- **Authentication** — NextAuth.js session-based, JWT tokens
- **Authorization** — Role-based (CUSTOMER, ADMIN), checked server-side
- **Error handling** — Consistent error response format
- **Price verification** — Server-side price check on checkout

### 1.2 Authentication Middleware

All protected routes check the NextAuth session:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper to get session and check auth
async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return session;
}

// Helper to check admin
async function requireAdmin() {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}
```

### 1.3 Error Response Format

```typescript
interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>; // Validation errors
}

// HTTP Status Codes:
// 200 - Success
// 201 - Created
// 400 - Bad Request (validation error)
// 401 - Unauthorized (not logged in)
// 403 - Forbidden (not admin)
// 404 - Not Found
// 409 - Conflict (duplicate email, etc.)
// 500 - Internal Server Error
```

### 1.4 Success Response Format

```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## 2. Authentication API

### 2.1 POST /api/auth/register

**Request:**
```typescript
{
  name: string;        // Required, min 2 chars
  email: string;       // Required, valid email, unique
  password: string;    // Required, min 8 chars
  phone?: string;      // Optional, valid Nigerian phone
  address?: string;    // Optional
  city?: string;       // Optional
  state?: string;      // Optional
}
```

**Validation (Zod):**
```typescript
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, "Invalid Nigerian phone number").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
```

**Processing:**
1. Validate input with Zod
2. Check email uniqueness
3. Hash password with bcrypt (12 salt rounds)
4. Create user in database with role: CUSTOMER, status: ACTIVE
5. Auto-login via NextAuth (create session)
6. Return user data (excluding password)

**Response (201):**
```typescript
{
  data: {
    id: "clx...",
    name: "John Doe",
    email: "john@example.com",
    role: "CUSTOMER",
  },
  message: "Account created successfully"
}
```

**Error Responses:**
- 400: Validation errors
- 409: "An account with this email already exists"
- 500: "Something went wrong"

### 2.2 POST /api/auth/[...nextauth]

**NextAuth Configuration:**
```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (user.status === "BLOCKED") {
          throw new Error("Your account has been blocked");
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirect to home (login modal shows)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

---

## 3. Category API

### 3.1 GET /api/categories

**Access:** Public  
**Query Parameters:** None (returns all)

**Response:**
```typescript
{
  data: [
    {
      id: "clx...",
      name: "Nigerian",
      description: "Traditional Nigerian dishes",
      image: "/uploads/category-nigerian.jpg",
      _count: { restaurants: 5, foods: 25 }
    },
    ...
  ]
}
```

### 3.2 POST /api/categories

**Access:** Admin only  
**Request:**
```typescript
{
  name: string;        // Required, unique
  description?: string;
  image?: string;      // URL from /api/upload
}
```

**Processing:**
1. Verify admin session
2. Validate input
3. Check name uniqueness
4. Create category
5. Return created category

### 3.3 PUT /api/categories

**Access:** Admin only  
**Request:**
```typescript
{
  id: string;          // Required
  name?: string;
  description?: string;
  image?: string;
}
```

**Processing:**
1. Verify admin session
2. Validate input
3. If name changed, check uniqueness
4. Update category
5. Return updated category

### 3.4 DELETE /api/categories?id=xxx

**Access:** Admin only  
**Processing:**
1. Verify admin session
2. Check if category exists
3. Count associated restaurants and foods
4. Cascade delete: Delete all restaurants in category (which cascades to foods)
5. Delete category
6. Return success

**Edge Cases:**
- Category not found → 404
- Last category → 400 "Cannot delete the last category"
- Cascade delete warning should be shown client-side before request

---

## 4. Restaurant API

### 4.1 GET /api/restaurants

**Access:** Public  
**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| categoryId | string | Filter by category |
| search | string | Search by name |
| city | string | Filter by city |
| isActive | boolean | Filter by active status |
| sort | string | Sort: "name", "newest", "popular" |
| page | number | Page number (default 1) |
| pageSize | number | Items per page (default 20) |

**Response:**
```typescript
{
  data: [
    {
      id: "clx...",
      name: "Mama Put Kitchen",
      description: "Authentic Nigerian dishes",
      email: "info@maput.ng",
      phone: "+2348012345678",
      address: "15 Ogundana Street, Allen Avenue",
      city: "Lagos",
      state: "Lagos",
      openTime: "08:00",
      closeTime: "22:00",
      openDays: "Mon-Sat",
      image: "/uploads/mama-put.jpg",
      isActive: true,
      category: { id: "clx...", name: "Nigerian" },
      _count: { foods: 15 }
    },
    ...
  ],
  total: 45,
  page: 1,
  pageSize: 20,
  totalPages: 3
}
```

### 4.2 POST /api/restaurants

**Access:** Admin only  
**Request:**
```typescript
{
  name: string;          // Required, min 2 chars
  categoryId: string;    // Required, must exist
  email?: string;        // Valid email format
  phone?: string;        // Valid Nigerian phone
  address?: string;
  city?: string;
  state?: string;
  openTime?: string;     // HH:MM format
  closeTime?: string;    // HH:MM format
  openDays?: string;     // e.g. "Mon-Sat"
  image?: string;        // URL from upload
  isActive?: boolean;    // Default true
}
```

**Validation:**
- closeTime must be after openTime (if both provided)
- categoryId must exist in database
- name is required

### 4.3 PUT /api/restaurants

**Access:** Admin only  
**Request:** Same as POST but all fields optional except `id`

### 4.4 DELETE /api/restaurants?id=xxx

**Access:** Admin only  
**Cascade:** Deletes all foods under this restaurant  
**Orders referencing this restaurant:** NOT deleted (they store snapshots)

---

## 5. Food API

### 5.1 GET /api/foods

**Access:** Public  
**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| categoryId | string | Filter by category |
| restaurantId | string | Filter by restaurant |
| search | string | Search by name/description |
| isAvailable | boolean | Filter by availability |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| sort | string | "price_asc", "price_desc", "name", "newest" |
| page | number | Page number |
| pageSize | number | Items per page |

**Response:**
```typescript
{
  data: [
    {
      id: "clx...",
      name: "Jollof Rice",
      description: "Delicious Nigerian jollof rice with chicken",
      price: 2500,          // NGN
      image: "/uploads/jollof.jpg",
      isAvailable: true,
      category: { id: "clx...", name: "Nigerian" },
      restaurant: { id: "clx...", name: "Mama Put Kitchen" },
      createdAt: "2024-01-01T00:00:00.000Z"
    },
    ...
  ],
  total: 120,
  page: 1,
  pageSize: 20,
  totalPages: 6
}
```

### 5.2 POST /api/foods

**Access:** Admin only  
**Request:**
```typescript
{
  name: string;          // Required
  description?: string;
  categoryId: string;    // Required
  restaurantId: string;  // Required
  price: number;         // Required, min 0
  image?: string;
  isAvailable?: boolean; // Default true
}
```

**Validation:**
- categoryId must exist
- restaurantId must exist
- price must be >= 0
- restaurant must belong to the selected category (optional validation)

### 5.3 PUT /api/foods

**Access:** Admin only  
**Request:** Same as POST but all fields optional except `id`

### 5.4 DELETE /api/foods?id=xxx

**Access:** Admin only  
**Processing:**
1. Verify admin
2. Delete food item
3. Order items referencing this food are NOT deleted (snapshots)

---

## 6. Order API

### 6.1 GET /api/orders

**Access:** Authenticated (CUSTOMER sees own, ADMIN sees all)  
**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | OrderStatus | Filter by status |
| search | string | Search by order number or customer name |
| userId | string | Admin: filter by user |
| restaurantId | string | Filter by restaurant |
| page | number | Page number |
| pageSize | number | Items per page |
| id | string | Get single order by ID |

**Response:**
```typescript
{
  data: [
    {
      id: "clx...",
      orderNumber: "ORD-20240115-001",
      status: "PREPARING",
      subtotal: 7500,
      deliveryFee: 500,
      totalAmount: 8000,
      paymentMethod: "PAYSTACK",
      paymentStatus: "PAID",
      paystackRef: "ref_xxx",
      deliveryAddress: "15 Ogundana Street",
      deliveryCity: "Lagos",
      customerPhone: "+2348012345678",
      customerName: "John Doe",
      createdAt: "2024-01-15T10:30:00.000Z",
      items: [
        {
          id: "clx...",
          foodName: "Jollof Rice",
          foodImage: "/uploads/jollof.jpg",
          quantity: 2,
          unitPrice: 2500,
          totalPrice: 5000
        },
        {
          id: "clx...",
          foodName: "Chicken Suya",
          foodImage: "/uploads/suya.jpg",
          quantity: 1,
          unitPrice: 2500,
          totalPrice: 2500
        }
      ],
      statusHistory: [
        { status: "PENDING", remark: null, createdAt: "2024-01-15T10:30:00.000Z" },
        { status: "CONFIRMED", remark: "Order confirmed", createdAt: "2024-01-15T10:35:00.000Z" },
        { status: "PREPARING", remark: "Chef started cooking", createdAt: "2024-01-15T10:45:00.000Z" }
      ]
    }
  ],
  total: 50,
  page: 1,
  pageSize: 10,
  totalPages: 5
}
```

### 6.2 POST /api/orders

**Access:** Authenticated  
**Request:**
```typescript
{
  items: [
    { foodId: "clx...", quantity: 2 },
    { foodId: "clx...", quantity: 1 }
  ],
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  customerPhone: string;
  customerName: string;
  deliveryInstructions?: string;
  paymentMethod: "PAYSTACK" | "COD";
}
```

**Processing (CRITICAL — Price Verification):**
1. Verify user session
2. Validate input with Zod
3. **PRICE VERIFICATION:** For each item, look up current price in database
4. Calculate: `unitPrice = food.price` (from DB, NOT from client)
5. Calculate: `totalPrice = unitPrice * quantity`
6. Calculate: `subtotal = sum(item.totalPrice)`
7. Calculate: `deliveryFee = subtotal >= 5000 ? 0 : 500`
8. Calculate: `totalAmount = subtotal + deliveryFee`
9. Generate order number: `ORD-YYYYMMDD-XXX`
10. Create order with items (snapshot food name + image)
11. If paymentMethod === "PAYSTACK": Initialize Paystack transaction
12. Return order data + Paystack URL (if applicable)

**Order Number Generation:**
```typescript
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Count orders today to get sequence number
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  
  const count = await db.order.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd } }
  });
  
  const sequence = (count + 1).toString().padStart(3, '0');
  return `ORD-${dateStr}-${sequence}`;
}
```

**Response (201):**
```typescript
{
  data: {
    orderId: "clx...",
    orderNumber: "ORD-20240115-001",
    totalAmount: 8000,
    paymentMethod: "PAYSTACK",
    paystackUrl: "https://checkout.paystack.com/xxx...", // Only for Paystack
  },
  message: "Order placed successfully"
}
```

### 6.3 PUT /api/orders

**Access:** Admin only (for status updates), Customer (for cancellation)  
**Request (Admin):**
```typescript
{
  id: string;
  status: OrderStatus;
  remark?: string;
}
```

**Request (Customer cancellation):**
```typescript
{
  id: string;
  cancel: true;     // Customer can only cancel
}
```

**Status Transition Validation:**
```typescript
const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["ON_THE_WAY", "CANCELLED"],
  ON_THE_WAY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],    // Terminal
  CANCELLED: [],    // Terminal
};
```

**Processing:**
1. Verify session + authorization
2. Get current order status
3. Validate transition is allowed
4. Update order status
5. Create OrderStatusHistory record
6. If DELIVERED: Set deliveredAt
7. If CANCELLED + was paid: Initiate Paystack refund
8. Return updated order

### 6.4 DELETE /api/orders?id=xxx

**Access:** Admin only  
**Processing:**
1. Verify admin
2. Check if order is paid (extra warning)
3. Delete order items + status history + order
4. Return success

---

## 7. User API

### 7.1 GET /api/users

**Access:** Admin only  
**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by name/email/phone |
| status | UserStatus | Filter by status |
| page | number | Page number |
| pageSize | number | Items per page |

**Response:**
```typescript
{
  data: [
    {
      id: "clx...",
      name: "John Doe",
      email: "john@example.com",
      phone: "+2348012345678",
      address: "15 Ogundana Street",
      city: "Lagos",
      state: "Lagos",
      avatar: "/uploads/avatar.jpg",
      role: "CUSTOMER",
      status: "ACTIVE",
      createdAt: "2024-01-01T00:00:00.000Z",
      _count: { orders: 5 }
    }
  ],
  total: 450,
  page: 1,
  pageSize: 20,
  totalPages: 23
}
```

### 7.2 PUT /api/users

**Access:** Admin only  
**Request:**
```typescript
{
  id: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  status?: UserStatus;  // ACTIVE or BLOCKED
  role?: Role;          // CUSTOMER or ADMIN (careful!)
}
```

**Processing:**
1. Verify admin
2. Cannot block another admin
3. Cannot change own role (admin can't demote themselves)
4. Update user
5. If status changed to BLOCKED: Invalidate sessions (JWT blacklist or short expiry)

### 7.3 DELETE /api/users?id=xxx

**Access:** Admin only  
**Processing:**
1. Verify admin
2. Cannot delete admin users
3. Delete user's orders + order items + status history
4. Delete user
5. Return success

---

## 8. Profile API

### 8.1 GET /api/profile

**Access:** Authenticated  
**Response:**
```typescript
{
  data: {
    id: "clx...",
    name: "John Doe",
    email: "john@example.com",
    phone: "+2348012345678",
    address: "15 Ogundana Street",
    city: "Lagos",
    state: "Lagos",
    avatar: "/uploads/avatar.jpg",
    role: "CUSTOMER",
    createdAt: "2024-01-01T00:00:00.000Z"
  }
}
```

### 8.2 PUT /api/profile

**Access:** Authenticated  
**Request:**
```typescript
{
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  avatar?: string;
}
```

**Processing:**
1. Get user from session (by email)
2. Validate input
3. Update user
4. Return updated profile

---

## 9. Upload API

### 9.1 POST /api/upload

**Access:** Admin only (or authenticated for avatar upload)  
**Request:** FormData with `file` field

**Validation:**
- File type: jpg, jpeg, png, webp only
- File size: Max 2MB
- File name: Sanitized

**Processing:**
1. Verify session
2. Validate file
3. Generate unique filename: `{timestamp}-{randomHex}.{ext}`
4. Save to `public/uploads/`
5. Return URL path: `/uploads/filename.ext`

**Response:**
```typescript
{
  data: {
    url: "/uploads/1705312123-a1b2c3.jpg"
  }
}
```

**Edge Cases:**
- No file provided → 400 "No file uploaded"
- Invalid file type → 400 "Invalid file type. Accepted: jpg, png, webp"
- File too large → 400 "File too large. Maximum size: 2MB"
- Upload directory doesn't exist → Create it
- Write permission error → 500 "Failed to save file"

---

## 10. Paystack Integration API

### 10.1 POST /api/paystack/initialize

**Access:** Authenticated  
**Request:**
```typescript
{
  orderId: string;    // Already created order ID
  email: string;      // Customer email (for Paystack)
  amount: number;     // Total amount in NGN
}
```

**Processing:**
1. Verify session
2. Verify order belongs to user
3. Verify order is PENDING
4. Initialize Paystack transaction:
```typescript
const response = await fetch('https://api.paystack.co/transaction/initialize', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: email,
    amount: amount * 100,  // Paystack expects kobo (multiply by 100)
    reference: `NJB-${orderNumber}-${Date.now()}`,
    callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/paystack/verify`,
    metadata: {
      orderId: orderId,
      orderNumber: orderNumber,
      userId: session.user.id,
    },
  }),
});
```
5. Store `paystackRef` on order
6. Return authorization URL

**Response:**
```typescript
{
  data: {
    authorizationUrl: "https://checkout.paystack.com/xxx...",
    reference: "NJB-ORD-20240115-001-1705312123"
  }
}
```

### 10.2 GET /api/paystack/verify?reference=xxx

**Access:** Public (Paystack callback)  
**Processing:**
1. Get reference from query params
2. Verify with Paystack API:
```typescript
const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  },
});
const data = await response.json();
```
3. If successful:
   - Find order by paystackRef or metadata.orderId
   - Update: `paymentStatus: PAID`, `status: CONFIRMED`
   - Create OrderStatusHistory: "CONFIRMED - Payment verified"
4. Redirect to frontend with success parameter
5. If failed: Update `paymentStatus: FAILED`

**Redirect:**
- Success: `/?section=orders&id=orderId&payment=success`
- Failure: `/?section=orders&id=orderId&payment=failed`

### 10.3 POST /api/paystack/webhook

**Access:** Public (Paystack server-to-server)  
**Processing:**
1. Verify webhook signature:
```typescript
const hash = crypto
  .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
   .update(JSON.stringify(req.body))
  .digest('hex');

if (hash !== req.headers['x-paystack-signature']) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```
2. Process event:
   - `charge.success`: Update order paymentStatus to PAID
   - `charge.failed`: Update order paymentStatus to FAILED
   - `refund.processed`: Update order paymentStatus to REFUNDED
3. Return 200 (must be fast — Paystack retries on failure)

---

## 11. Dashboard API

### 11.1 GET /api/dashboard/stats

**Access:** Admin only  
**Response:**
```typescript
{
  data: {
    totalRestaurants: 15,
    totalFoods: 120,
    totalCustomers: 450,
    totalOrders: 1250,
    pendingOrders: 23,
    todayOrders: 15,
    totalEarnings: 2500000,
    cancelledOrders: 45,
    // Trends (compared to yesterday)
    earningsTrend: { value: 12.5, direction: "up" },
    ordersTrend: { value: 5.2, direction: "up" },
    customersTrend: { value: -2.1, direction: "down" },
  }
}
```

**Implementation:**
```typescript
const [
  totalRestaurants,
  totalFoods,
  totalCustomers,
  totalOrders,
  pendingOrders,
  todayOrders,
  totalEarnings,
  cancelledOrders,
] = await Promise.all([
  db.restaurant.count(),
  db.food.count(),
  db.user.count({ where: { role: "CUSTOMER" } }),
  db.order.count(),
  db.order.count({ where: { status: "PENDING" } }),
  db.order.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  }),
  db.order.aggregate({
    where: { paymentStatus: "PAID" },
    _sum: { totalAmount: true },
  }),
  db.order.count({ where: { status: "CANCELLED" } }),
]);
```

### 11.2 GET /api/dashboard/earnings

**Access:** Admin only  
**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| period | string | "today", "week", "month", "year", "all" |

**Response:**
```typescript
{
  data: {
    totalEarnings: 2500000,
    paystackEarnings: 1800000,
    codEarnings: 700000,
    pendingCODEarnings: 150000,
    refundedAmount: 50000,
    dailyData: [
      { date: "2024-01-15", revenue: 85000, orders: 12 },
      { date: "2024-01-14", revenue: 92000, orders: 15 },
      ...
    ],
    topRestaurants: [
      { id: "clx...", name: "Mama Put Kitchen", orders: 120, revenue: 450000 },
      ...
    ]
  }
}
```

---

## 12. Database Seed Data

### 12.1 Admin User
```typescript
{
  name: "Admin",
  email: "admin@naijabites.ng",
  password: await hash("admin123", 12),
  phone: "+2348012345678",
  role: "ADMIN",
  status: "ACTIVE",
}
```

### 12.2 Categories
```typescript
[
  { name: "Nigerian", description: "Traditional Nigerian dishes - Jollof, Suya, Egusi, Pounded Yam", image: "/uploads/cat-nigerian.jpg" },
  { name: "Continental", description: "Western and European cuisine", image: "/uploads/cat-continental.jpg" },
  { name: "Chinese", description: "Asian and Chinese cuisine", image: "/uploads/cat-chinese.jpg" },
  { name: "Fast Food", description: "Burgers, Pizza, Shawarma and quick bites", image: "/uploads/cat-fastfood.jpg" },
  { name: "Drinks & Beverages", description: "Fresh juices, smoothies, and drinks", image: "/uploads/cat-drinks.jpg" },
  { name: "Desserts & Snacks", description: "Puff-puff, chin-chin, cakes and more", image: "/uploads/cat-desserts.jpg" },
]
```

### 12.3 Sample Restaurants
```typescript
[
  { name: "Mama Put Kitchen", categoryId: "nigerian", email: "info@maput.ng", phone: "+2348011111111", address: "15 Ogundana Street, Allen Avenue", city: "Lagos", state: "Lagos", openTime: "08:00", closeTime: "22:00", openDays: "Mon-Sat" },
  { name: "The Suya Spot", categoryId: "nigerian", email: "suya@spot.ng", phone: "+2348022222222", address: "23 Admiralty Way, Lekki", city: "Lagos", state: "Lagos", openTime: "16:00", closeTime: "23:00", openDays: "Mon-Sun" },
  { name: "Golden Dragon", categoryId: "chinese", email: "info@goldendragon.ng", phone: "+2348033333333", address: "45 Aminu Kano Crescent, Wuse 2", city: "Abuja", state: "FCT", openTime: "10:00", closeTime: "22:00", openDays: "Mon-Sun" },
  { name: "Burger Palace", categoryId: "fastfood", email: "hello@burgerpalace.ng", phone: "+2348044444444", address: "12 Allen Avenue, Ikeja", city: "Lagos", state: "Lagos", openTime: "09:00", closeTime: "23:00", openDays: "Mon-Sun" },
  { name: "Continental Bistro", categoryId: "continental", email: "info@bistro.ng", phone: "+2348055555555", address: "8 Trans Amadi Road", city: "Port Harcourt", state: "Rivers", openTime: "11:00", closeTime: "22:00", openDays: "Mon-Sat" },
]
```

### 12.4 Sample Foods
```typescript
[
  // Nigerian
  { name: "Jollof Rice", description: "Delicious Nigerian jollof rice with chicken", price: 2500, categoryId: "nigerian", restaurantId: "mamaPut" },
  { name: "Pounded Yam & Egusi", description: "Pounded yam with rich egusi soup and assorted meat", price: 3500, categoryId: "nigerian", restaurantId: "mamaPut" },
  { name: "Suya Platter", description: "Spicy grilled beef suya with onions and tomatoes", price: 3000, categoryId: "nigerian", restaurantId: "suyaSpot" },
  { name: "Peppered Snail", description: "Spicy peppered snail in Nigerian sauce", price: 4000, categoryId: "nigerian", restaurantId: "suyaSpot" },
  { name: "Fried Rice & Chicken", description: "Nigerian fried rice with crispy fried chicken", price: 2500, categoryId: "nigerian", restaurantId: "mamaPut" },
  { name: "Ofada Rice & Stew", description: "Local ofada rice with designer stew", price: 2800, categoryId: "nigerian", restaurantId: "mamaPut" },
  
  // Chinese
  { name: "Fried Rice (Chinese)", description: "Chinese-style fried rice with vegetables", price: 2000, categoryId: "chinese", restaurantId: "goldenDragon" },
  { name: "Sweet & Sour Chicken", description: "Crispy chicken in sweet and sour sauce", price: 3000, categoryId: "chinese", restaurantId: "goldenDragon" },
  
  // Fast Food
  { name: "Classic Burger", description: "Beef burger with cheese, lettuce, and special sauce", price: 2500, categoryId: "fastfood", restaurantId: "burgerPalace" },
  { name: "Shawarma", description: "Chicken shawarma with veggies and garlic sauce", price: 2000, categoryId: "fastfood", restaurantId: "burgerPalace" },
  { name: "Pizza Margherita", description: "Classic pizza with mozzarella and tomato sauce", price: 3500, categoryId: "fastfood", restaurantId: "burgerPalace" },
  
  // Continental
  { name: "Grilled Steak", description: "Tender grilled steak with mashed potatoes", price: 5000, categoryId: "continental", restaurantId: "bistro" },
  { name: "Caesar Salad", description: "Fresh Caesar salad with croutons and parmesan", price: 2000, categoryId: "continental", restaurantId: "bistro" },
  
  // Drinks
  { name: "Fresh Zobo", description: "Hibiscus drink with ginger and pineapple", price: 500, categoryId: "drinks", restaurantId: "mamaPut" },
  { name: "Palm Wine", description: "Fresh palm wine", price: 800, categoryId: "drinks", restaurantId: "mamaPut" },
  
  // Desserts
  { name: "Puff Puff", description: "Nigerian fried dough balls", price: 500, categoryId: "desserts", restaurantId: "mamaPut" },
  { name: "Chin Chin", description: "Crunchy Nigerian snack", price: 400, categoryId: "desserts", restaurantId: "mamaPut" },
]
```

---

## 13. Backend Security Checklist

### 13.1 Input Validation
- [x] Zod schemas for all endpoints
- [x] Email format validation
- [x] Nigerian phone format validation
- [x] Password minimum length (8 chars)
- [x] Price must be >= 0
- [x] File type and size validation
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] XSS prevention (React auto-escapes, but sanitize uploaded content)

### 13.2 Authentication & Authorization
- [x] bcrypt password hashing (12 salt rounds)
- [x] JWT session with secret
- [x] Admin role check on all admin endpoints
- [x] User can only access own orders/profile
- [x] Block check on login
- [x] No session fixation (NextAuth handles this)

### 13.3 API Security
- [x] Rate limiting (consider adding)
- [x] CORS (Next.js default same-origin)
- [x] CSRF (Next.js API routes have built-in protection for same-origin)
- [x] Paystack webhook signature verification
- [x] No sensitive data in responses (password never returned)
- [x] File upload validation (type, size)
- [x] Environment variables for secrets

### 13.4 Data Integrity
- [x] Prisma cascade deletes for related data
- [x] Order item snapshots (food name/image stored at order time)
- [x] Server-side price verification on checkout
- [x] Order number uniqueness
- [x] Email uniqueness constraint

---

## 14. Agentic Prompt for Backend Implementation

```
You are building the BACKEND of NaijaBites, a Nigerian food ordering web application using Next.js 16 API Routes, Prisma ORM, and PostgreSQL.

## Prisma Setup
1. Define complete schema in prisma/schema.prisma (all models from the planning doc)
2. Run `bun run db:push` to create tables
3. Create seed script (prisma/seed.ts) with admin user, categories, restaurants, foods
4. Create lib/db.ts with Prisma client singleton

## NextAuth Configuration
1. Create lib/auth.ts with CredentialsProvider only
2. Configure JWT strategy (30-day expiry)
3. Add role (CUSTOMER/ADMIN) to JWT token and session
4. Custom authorize() with bcrypt compare and block check
5. Pages: signIn redirects to "/" (client-side modal)

## API Routes (Build in Order)
1. /api/auth/register — Zod validation, bcrypt hash, create user
2. /api/categories — Full CRUD, admin protection on write
3. /api/restaurants — Full CRUD with filtering, admin protection on write
4. /api/foods — Full CRUD with filtering/search, admin protection on write
5. /api/orders — Create (price verification!), List (role-based), Update status (admin), Delete (admin)
6. /api/users — List (admin), Update (admin), Delete (admin)
7. /api/profile — Get (authenticated), Update (authenticated)
8. /api/upload — File upload to public/uploads/
9. /api/paystack/initialize — Create Paystack checkout session
10. /api/paystack/verify — Verify payment callback
11. /api/paystack/webhook — Paystack webhook handler
12. /api/dashboard/stats — Admin dashboard statistics
13. /api/dashboard/earnings — Earnings data

## Critical Implementation Notes
- ALL admin-protected routes MUST verify session.user.role === 'ADMIN'
- Order creation MUST verify prices server-side (look up current food prices, ignore client-sent prices)
- Order number format: ORD-YYYYMMDD-XXX (auto-generated, unique)
- Nigerian Naira: All amounts in whole Naira (no kobo), Paystack expects kobo (multiply by 100)
- Paystack integration: Initialize → Redirect → Verify → Webhook backup
- File uploads: Save to public/uploads/ with unique names
- Error responses: Consistent format with error, message, details
- Zod validation on ALL endpoints
- bcrypt with 12 salt rounds for passwords
- Never return password in any response
```
