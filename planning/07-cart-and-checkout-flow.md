# Cart & Checkout Flow Planning

## 1. Cart System Architecture

### 1.1 State Management (Zustand)

The cart is managed entirely on the client side using Zustand with localStorage persistence. This provides instant UI feedback without server round-trips for every cart action.

```typescript
// stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  foodId: string;
  foodName: string;
  foodImage: string | null;
  price: number;           // Unit price (NGN) — verified server-side at checkout
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  categoryId: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  
  // Panel controls
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Item operations
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  incrementQuantity: (foodId: string) => void;
  decrementQuantity: (foodId: string) => void;
  clearCart: () => void;
  
  // Computed values
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getUniqueItemCount: () => number;
  
  // Restaurant check
  getRestaurantId: () => string | null;
}
```

### 1.2 Cart Store Implementation

```typescript
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find(item => item.foodId === newItem.foodId);
        
        if (existingItem) {
          // Increment quantity if item already in cart
          set({
            items: items.map(item =>
              item.foodId === newItem.foodId
                ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                : item
            ),
          });
        } else {
          // Add new item with quantity 1 (or specified quantity)
          set({
            items: [...items, { ...newItem, quantity: newItem.quantity || 1 }],
          });
        }
        
        // Show toast notification
        toast.success(`${newItem.foodName} added to cart`);
        
        // Bounce cart badge animation handled by component
      },
      
      removeItem: (foodId) => {
        const items = get().items;
        const item = items.find(i => i.foodId === foodId);
        set({ items: items.filter(i => i.foodId !== foodId) });
        if (item) toast.success(`${item.foodName} removed from cart`);
      },
      
      updateQuantity: (foodId, quantity) => {
        if (quantity < 1) {
          get().removeItem(foodId);
          return;
        }
        if (quantity > 99) return; // Max 99 per item
        set({
          items: get().items.map(item =>
            item.foodId === foodId ? { ...item, quantity } : item
          ),
        });
      },
      
      incrementQuantity: (foodId) => {
        const item = get().items.find(i => i.foodId === foodId);
        if (item && item.quantity < 99) {
          get().updateQuantity(foodId, item.quantity + 1);
        }
      },
      
      decrementQuantity: (foodId) => {
        const item = get().items.find(i => i.foodId === foodId);
        if (item && item.quantity > 1) {
          get().updateQuantity(foodId, item.quantity - 1);
        }
      },
      
      clearCart: () => {
        set({ items: [] });
        toast.success('Cart cleared');
      },
      
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
      
      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        return subtotal >= 5000 ? 0 : 500;
      },
      
      getTotal: () => {
        return get().getSubtotal() + get().getDeliveryFee();
      },
      
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getUniqueItemCount: () => {
        return get().items.length;
      },
      
      getRestaurantId: () => {
        const items = get().items;
        return items.length > 0 ? items[0].restaurantId : null;
      },
    }),
    {
      name: 'naijabites-cart', // localStorage key
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);
```

### 1.3 Cart Add Flow (Detailed)

**Scenario 1: Simple Add (No modal)**
```
User clicks "Add to Cart" on food card
  → Cart store addItem() called
  → Item added with quantity 1
  → Toast: "Jollof Rice added to cart"
  → Cart badge bounces (animation)
  → Cart panel doesn't open (non-intrusive)
```

**Scenario 2: Add via Food Detail Modal**
```
User clicks food card (not the add button)
  → FoodDetailModal opens
  → Shows: Image, Name, Restaurant, Description, Price
  → Quantity selector: - [1] +
  → User adjusts quantity
  → Price updates dynamically (quantity × unit price)
  → User clicks "Add to Cart — ₦5,000"
  → Cart store addItem() called with quantity
  → Toast: "Jollof Rice added to cart"
  → Modal closes after 500ms delay
  → Cart badge bounces
```

**Scenario 3: Item Already in Cart**
```
User clicks "Add to Cart" for item already in cart
  → Cart store addItem() checks for existing item
  → Quantity incremented by 1
  → Toast: "Jollof Rice quantity updated"
  → Cart badge bounces
```

### 1.4 Cart Remove Flow
```
User clicks delete icon on cart item
  → Cart store removeItem() called
  → Item removed from cart
  → Toast: "Jollof Rice removed from cart"
  → If cart is now empty: Show empty state
```

### 1.5 Cart Quantity Update Flow
```
User clicks +/- on cart item
  → incrementQuantity() or decrementQuantity() called
  → If quantity reaches 0: Remove item (with confirmation? No, just remove)
  → Price updates in real-time
  → Delivery fee recalculates (threshold: ₦5,000)
  → Total updates
```

### 1.6 Delivery Fee Logic

| Subtotal | Delivery Fee | Display |
|----------|-------------|---------|
| ₦0 (empty) | ₦0 | "—" |
| ₦1 – ₦4,999 | ₦500 | "₦500" |
| ₦5,000+ | ₦0 | "FREE" (green text) |

**Dynamic display:**
- When subtotal crosses ₦5,000 threshold: Show "You qualify for FREE delivery! 🎉"
- When close to threshold: "Add ₦X more for FREE delivery"

---

## 2. Checkout Flow

### 2.1 Checkout Pre-Conditions

Before checkout can proceed, the following must be true:

1. ✅ User is authenticated (if not → show Login modal)
2. ✅ Cart is not empty (if empty → redirect to Menu)
3. ✅ All items are still available (check server-side)
4. ✅ Delivery address is filled
5. ✅ Phone number is provided
6. ✅ Payment method is selected

### 2.2 Checkout Step-by-Step Flow

```
Step 1: Cart Review
├── User opens cart panel
├── Reviews items, quantities, prices
├── Adjusts quantities if needed
├── Sees subtotal, delivery fee, total
└── Clicks "Proceed to Checkout"

Step 2: Delivery Information
├── Checkout panel opens (slides in from right, replaces cart)
├── Pre-filled fields from user profile:
│   ├── Full Name (from user.name)
│   ├── Phone (from user.phone)
│   ├── Address (from user.address)
│   ├── City (from user.city)
│   └── State (from user.state)
├── Delivery Instructions (optional textarea)
├── Validation: Required fields highlighted
└── On valid: Proceed to payment

Step 3: Payment Method Selection
├── Option A: Paystack (Card, Bank, USSD)
│   ├── Radio button selected
│   └── Paystack badge/logo shown
├── Option B: Cash on Delivery
│   ├── Radio button selected
│   └── "Pay when you receive your order" text
└── Selected method stored for order creation

Step 4: Order Summary & Confirmation
├── Compact item list (name + qty + price)
├── Subtotal
├── Delivery fee
├── Total amount (bold, orange)
├── Payment method indicator
├── Delivery address summary
└── "Place Order" button

Step 5a: Paystack Payment Flow
├── User clicks "Pay ₦X,XXX"
├── Loading state on button
├── POST /api/orders (creates order in DB)
│   ├── Server verifies prices
│   ├── Creates order + items
│   └── Returns orderId
├── POST /api/paystack/initialize
│   ├── Creates Paystack transaction
│   └── Returns authorization URL
├── Redirect to Paystack checkout page
│   ├── User enters card/bank details
│   ├── Paystack processes payment
│   └── Redirects to callback URL
├── GET /api/paystack/verify?reference=xxx
│   ├── Verifies payment with Paystack API
│   ├── Updates order: paymentStatus = PAID, status = CONFIRMED
│   └── Creates status history entry
├── Success redirect to orders page
│   ├── Cart cleared
│   ├── Toast: "Order placed successfully! 🎉"
│   └── Show order detail with confirmation
└── If payment fails:
    ├── Redirect back with ?payment=failed
    ├── Toast: "Payment failed. Please try again."
    ├── Cart preserved (order exists but unpaid)
    └── User can retry payment from order detail

Step 5b: Cash on Delivery Flow
├── User clicks "Place Order (COD)"
├── Confirmation dialog: "Confirm cash on delivery order?"
├── POST /api/orders
│   ├── paymentMethod: COD
│   ├── paymentStatus: PENDING
│   └── status: PENDING
├── Order created successfully
├── Cart cleared
├── Toast: "Order placed! Pay on delivery."
└── Redirect to order detail
```

### 2.3 Checkout Panel Design

```
CheckoutPanel
├── Backdrop (bg-black/50, click → close)
├── Panel Container (fixed, right-0, w-full md:w-[400px])
│   ├── Header
│   │   ├── BackButton (← returns to cart panel)
│   │   ├── Title ("Secure Checkout" + 🔒)
│   │   └── Shield Icons (security indicators)
│   ├── Steps Progress Bar (1-2-3-4 indicators)
│   ├── Step Content (scrollable)
│   │   ├── Step 1: Delivery Info Form
│   │   │   ├── FullName (Input, required)
│   │   │   ├── Phone (Input, +234 prefix, required)
│   │   │   ├── Address (Textarea, required)
│   │   │   ├── City (Select, Nigerian cities)
│   │   │   ├── State (Select, Nigerian states)
│   │   │   └── Instructions (Textarea, optional)
│   │   ├── Step 2: Payment Method
│   │   │   ├── Paystack Radio
│   │   │   │   ├── PaystackLogo
│   │   │   │   └── "Card, Bank Transfer, USSD"
│   │   │   └── COD Radio
│   │   │       ├── CashIcon
│   │   │       └── "Pay on delivery"
│   │   └── Step 3: Order Summary
│   │       ├── ItemsList (compact)
│   │       ├── SubtotalRow
│   │       ├── DeliveryFeeRow
│   │       ├── TotalRow (bold)
│   │       └── DeliveryAddressSummary
│   ├── Footer
│   │   ├── TotalAmount (large, bold)
│   │   └── PlaceOrderButton
│   │       ├── Paystack: "Pay ₦X,XXX" (orange gradient)
│   │       └── COD: "Place Order" (orange gradient)
│   └── SecurityFooter
│       └── "Secured by Paystack 🔒" (gray text)
```

### 2.4 Paystack Integration Code

```typescript
// lib/paystack.ts
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface InitializeTransactionParams {
  email: string;
  amount: number;       // In Naira (will be converted to kobo)
  reference: string;
  orderId: string;
  orderNumber: string;
  callbackUrl: string;
}

export async function initializeTransaction(params: InitializeTransactionParams) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100, // Convert to kobo
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        custom_fields: [
          { display_name: "Order Number", variable_name: "order_number", value: params.orderNumber },
        ],
      },
    }),
  });

  const data = await response.json();
  
  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize transaction');
  }

  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  };
}

export async function verifyTransaction(reference: string) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();
  
  if (!data.status) {
    throw new Error('Transaction verification failed');
  }

  return {
    status: data.data.status,       // "success" or "failed"
    reference: data.data.reference,
    amount: data.data.amount / 100, // Convert back from kobo
    paidAt: data.data.paid_at,
    channel: data.data.channel,     // "card", "bank", "ussd"
    metadata: data.data.metadata,
  };
}
```

### 2.5 Order Creation API (Price Verification)

```typescript
// app/api/orders/route.ts (POST handler)
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 });
    }

    const { items, deliveryAddress, deliveryCity, deliveryState, customerPhone, customerName, deliveryInstructions, paymentMethod } = validation.data;

    // CRITICAL: Server-side price verification
    const foodIds = items.map(item => item.foodId);
    const foods = await db.food.findMany({
      where: { id: { in: foodIds } },
      select: { id: true, name: true, image: true, price: true, isAvailable: true },
    });

    // Verify all foods exist and are available
    const unavailableItems = foods.filter(f => !f.isAvailable);
    if (unavailableItems.length > 0) {
      return NextResponse.json({
        error: 'Some items are no longer available',
        details: { unavailableItems: unavailableItems.map(f => f.name) },
      }, { status: 400 });
    }

    const missingItems = foodIds.filter(id => !foods.find(f => f.id === id));
    if (missingItems.length > 0) {
      return NextResponse.json({ error: 'Some items no longer exist' }, { status: 400 });
    }

    // Calculate prices using SERVER-SIDE prices (not client-sent)
    const orderItems = items.map(item => {
      const food = foods.find(f => f.id === item.foodId)!;
      const unitPrice = food.price; // Server price, not client price
      const totalPrice = unitPrice * item.quantity;
      return {
        foodId: food.id,
        foodName: food.name,
        foodImage: food.image,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee = subtotal >= 5000 ? 0 : 500;
    const totalAmount = subtotal + deliveryFee;

    // Check if prices changed from client expectations
    const priceChanges = items.filter(item => {
      const food = foods.find(f => f.id === item.foodId);
      return food && food.price !== item.expectedPrice; // Client sends expected price
    });

    if (priceChanges.length > 0) {
      return NextResponse.json({
        error: 'Prices have changed',
        details: { priceChanges: priceChanges.map(item => {
          const food = foods.find(f => f.id === item.foodId)!;
          return { name: food.name, oldPrice: item.expectedPrice, newPrice: food.price };
        })},
      }, { status: 409 }); // 409 Conflict
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        subtotal,
        deliveryFee,
        totalAmount,
        paymentMethod,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        deliveryAddress,
        deliveryCity,
        deliveryState,
        customerPhone,
        customerName,
        deliveryInstructions,
        items: { create: orderItems },
        statusHistory: {
          create: {
            status: 'PENDING',
            remark: 'Order placed',
            changedBy: session.user.id,
          },
        },
      },
      include: { items: true, statusHistory: true },
    });

    // If Paystack payment, initialize transaction
    if (paymentMethod === 'PAYSTACK') {
      const { authorizationUrl, reference } = await initializeTransaction({
        email: session.user.email!,
        amount: totalAmount,
        reference: `NJB-${orderNumber}-${Date.now()}`,
        orderId: order.id,
        orderNumber: orderNumber,
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/paystack/verify`,
      });

      // Update order with Paystack reference
      await db.order.update({
        where: { id: order.id },
        data: { paystackRef: reference },
      });

      return NextResponse.json({
        data: {
          orderId: order.id,
          orderNumber,
          totalAmount,
          paystackUrl: authorizationUrl,
        },
        message: 'Order created. Redirecting to payment...',
      }, { status: 201 });
    }

    // COD order
    return NextResponse.json({
      data: {
        orderId: order.id,
        orderNumber,
        totalAmount,
      },
      message: 'Order placed successfully!',
    }, { status: 201 });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
```

---

## 3. Price Change Handling

### 3.1 Scenario: Price Changed Between Add-to-Cart and Checkout

**Detection:**
- Client sends `expectedPrice` with each cart item during checkout
- Server compares `expectedPrice` with actual `food.price`
- If mismatch → 409 Conflict response

**Resolution Options:**

**Option A: Notify and Re-price (Recommended)**
```
Server returns 409 with price changes
  → Client shows modal: "Prices have changed"
  → Lists each changed item: "Jollof Rice: ₦2,500 → ₦3,000"
  → User can: "Update Prices & Continue" or "Remove Changed Items" or "Cancel"
  → If user accepts: Cart store updates prices, re-submit checkout
```

**Option B: Notify and Halt**
```
Server returns 409
  → Client shows: "Some prices have changed. Please review your cart."
  → Cart panel opens with updated prices highlighted
  → User reviews and manually adjusts
  → User re-attempts checkout
```

### 3.2 Scenario: Food Unavailable at Checkout

**Detection:**
- Server checks `food.isAvailable` for all items
- If any item is unavailable → 400 response

**Resolution:**
```
Server returns 400 with unavailable items
  → Client shows modal: "Some items are no longer available"
  → Lists unavailable items
  → Options: "Remove Unavailable Items" or "Cancel Order"
  → If remove: Cart store removes those items, re-submit
```

### 3.3 Scenario: Food Deleted at Checkout

**Detection:**
- Server looks up foodIds, some not found
- 400 response with missing items

**Resolution:**
```
Server returns 400 with missing items
  → Client shows: "Some items are no longer available"
  → Cart store removes missing items
  → Re-submit checkout
```

---

## 4. Order Status Lifecycle

### 4.1 Status Flow Diagram

```
                    ┌─────────────────────────────────┐
                    │          PENDING                 │
                    │  (Order just placed)             │
                    └──────┬──────────┬────────────────┘
                           │          │
                    Admin  │          │  Customer/Admin
                    confirms│          │  cancels
                           │          │
                    ┌──────▼──┐   ┌───▼────────────────┐
                    │CONFIRMED│   │    CANCELLED        │
                    │         │   │  (Refund if paid)   │
                    └──────┬──┘   └────────────────────┘
                           │
                    Admin  │
                    starts │
                    cooking│
                           │
                    ┌──────▼──────┐   ┌────────────────┐
                    │  PREPARING  ├──→│   CANCELLED     │
                    │  (Cooking)  │   └────────────────┘
                    └──────┬──────┘
                           │
                    Out for│
                    delivery│
                           │
                    ┌──────▼──────┐   ┌────────────────┐
                    │  ON_THE_WAY ├──→│   CANCELLED     │
                    │  (Delivery) │   └────────────────┘
                    └──────┬──────┘
                           │
                    Delivered│
                           │
                    ┌──────▼──────┐
                    │  DELIVERED  │
                    │  (Complete) │
                    └─────────────┘
```

### 4.2 Status Duration Estimates

| Status | Typical Duration | Auto-transition? |
|--------|-----------------|------------------|
| PENDING | 1-5 minutes | No (admin action required) |
| CONFIRMED | 5-15 minutes | No (admin action) |
| PREPARING | 15-45 minutes | No (admin action) |
| ON_THE_WAY | 15-60 minutes | No (admin action) |
| DELIVERED | Terminal | N/A |
| CANCELLED | Terminal | N/A |

### 4.3 Status Change Notifications

For each status change, the customer should see:
- Updated status badge on order card
- Status timeline update on order detail
- (Future: Push notification / SMS)

---

## 5. Paystack Webhook Handling

### 5.1 Webhook Events to Handle

| Event | Action |
|-------|--------|
| `charge.success` | Update order: paymentStatus = PAID, status = CONFIRMED |
| `charge.failed` | Update order: paymentStatus = FAILED |
| `refund.processed` | Update order: paymentStatus = REFUNDED |
| `transfer.failed` | Log for investigation |

### 5.2 Webhook Implementation

```typescript
// app/api/paystack/webhook/route.ts
import { headers } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('x-paystack-signature');

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'charge.success': {
        const reference = event.data.reference;
        const order = await db.order.findFirst({
          where: { paystackRef: reference },
        });

        if (order && order.paymentStatus !== 'PAID') {
          await db.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
            },
          });

          await db.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: 'CONFIRMED',
              remark: `Payment confirmed via Paystack (${event.data.channel})`,
              changedBy: 'system',
            },
          });
        }
        break;
      }

      case 'charge.failed': {
        const reference = event.data.reference;
        const order = await db.order.findFirst({
          where: { paystackRef: reference },
        });

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'FAILED' },
          });
        }
        break;
      }

      case 'refund.processed': {
        const reference = event.data.reference;
        const order = await db.order.findFirst({
          where: { paystackRef: reference },
        });

        if (order) {
          await db.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'REFUNDED' },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

---

## 6. Refund Flow

### 6.1 When Refunds Are Needed
- Customer cancels a PAID order
- Admin cancels a PAID order
- Double payment (duplicate transaction)
- Payment for unavailable items

### 6.2 Refund Process

```typescript
// lib/paystack.ts (add refund function)
export async function initiateRefund(transactionReference: string, amount?: number) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction: transactionReference,
      amount: amount ? amount * 100 : undefined, // Partial refund in kobo; undefined = full refund
      reason: 'Order cancellation',
    }),
  });

  const data = await response.json();
  return data;
}
```

### 6.3 Refund Flow on Cancellation
```
Admin/User cancels a PAID order
  → PUT /api/orders { id, status: CANCELLED }
  → Server checks: Was this order PAID via Paystack?
  → If yes:
    → Call initiateRefund(paystackRef)
    → Update order: paymentStatus = REFUNDED
    → Create status history: "Order cancelled, refund initiated"
    → Return: "Order cancelled. Refund will be processed within 3-5 business days."
  → If COD:
    → Update order: status = CANCELLED
    → No refund needed
```

---

## 7. Edge Cases & Error Handling

### 7.1 Cart Edge Cases

| Case | Handling |
|------|----------|
| Empty cart checkout | Disable checkout button, show empty state |
| Cart total is ₦0 | Not possible (min 1 item with price > 0) |
| Negative quantity | Prevented by UI (min 1) and server validation |
| Quantity > 99 | Prevented by UI and server validation (max 99) |
| All items from different restaurants | Allowed (no restaurant restriction) |
| Item becomes unavailable while in cart | Show "Unavailable" badge, disable checkout for that item |
| localStorage corrupted | Reset cart, show message |
| localStorage quota exceeded | Clear old items, show warning |
| Two browser tabs | Cart may diverge (acceptable for v1) |

### 7.2 Checkout Edge Cases

| Case | Handling |
|------|----------|
| Not logged in | Show Login modal first |
| Session expired during checkout | Redirect to login, preserve cart |
| Network error during order creation | Show error toast, allow retry |
| Network error during Paystack init | Show error toast, allow retry |
| Paystack page closed without paying | Order exists (PENDING), user can retry from orders |
| Double-click "Place Order" | Debounce button, disable after first click |
| Browser back during Paystack | Paystack handles redirect |
| Payment success but verify fails | Webhook backup will update order |
| Price changed during checkout | 409 response, show price change modal |
| Food deleted during checkout | 400 response, remove from cart |
| Partial payment (Paystack) | Not possible with Paystack Checkout |
| Paystack downtime | Show "Payment service unavailable, try COD" |

### 7.3 Order Edge Cases

| Case | Handling |
|------|----------|
| Cancel paid order | Initiate refund via Paystack |
| Cancel COD order | Just update status |
| Order stuck in PENDING | Admin can update status or cancel |
| Order stuck in payment | Check Paystack dashboard, use webhook |
| Multiple orders same time | Each gets unique order number |
| Very large order (₦100k+) | Allow, no cap (admin can review) |
| Order with many items (50+) | Allow, paginate in detail view |

---

## 8. Agentic Prompt for Cart & Checkout Implementation

```
You are implementing the CART & CHECKOUT system for NaijaBites, a Nigerian food ordering web application.

## Cart Store (Zustand + localStorage)
1. Create stores/cart-store.ts with full interface (items, open/close panel, add/remove/update, computed values)
2. Persist only items to localStorage (key: 'naijabites-cart')
3. Computed: getSubtotal(), getDeliveryFee() (free over ₦5,000), getTotal(), getItemCount()
4. addItem: Check for existing item → increment qty or add new
5. removeItem: Filter out by foodId, show toast
6. updateQuantity: Min 1 (remove if 0), max 99
7. clearCart: Empty items array
8. Cart badge bounce animation on add

## Cart Panel UI
1. Slide-in from right (Framer Motion, x: "100%" → 0)
2. Dark theme body (bg-gray-900, rounded-t-3xl)
3. Light header (bg-white, back arrow + "Your Cart" + clear button)
4. Cart item rows: bg-gray-700, circular food image, +/- controls, delete button
5. Footer: Subtotal, delivery fee, total, "Proceed to Checkout" button (orange gradient)
6. Empty state: SVG illustration + "Cart is empty" + "Browse Menu" link
7. Custom scrollbar (orange-500 thumb)
8. Delivery fee logic: Free over ₦5,000, else ₦500

## Checkout Panel UI
1. Same slide-in pattern (replaces cart panel)
2. Step-by-step: Delivery Info → Payment Method → Order Summary
3. Delivery form: Name, Phone (+234), Address, City (dropdown), State (dropdown), Instructions
4. Pre-filled from user profile
5. Payment: Paystack (Card/Bank/USSD) or Cash on Delivery
6. Order summary: Compact items list, totals, delivery address
7. "Pay ₦X,XXX" (Paystack) or "Place Order" (COD)
8. Security footer: "Secured by Paystack 🔒"

## Checkout API Integration
1. POST /api/orders — Create order with server-side price verification
2. Client sends expectedPrice for each item, server compares with actual price
3. If price changed: 409 response with price changes, client shows modal
4. If item unavailable: 400 response, client shows modal
5. If Paystack: POST /api/paystack/initialize → redirect to Paystack
6. If COD: Order created with PENDING status, show confirmation

## Paystack Integration
1. Initialize transaction: Call Paystack API, get authorization URL
2. Redirect user to Paystack checkout page
3. On callback: GET /api/paystack/verify → verify transaction
4. On success: Update order (PAID, CONFIRMED), clear cart, redirect to orders
5. On failure: Show error, preserve cart, order exists as PENDING
6. Webhook backup: POST /api/paystack/webhook for server-to-server confirmation
7. Verify webhook signature with HMAC-SHA512

## Refund Flow
1. Cancel paid order → initiate Paystack refund
2. Cancel COD order → just update status
3. Refund processed within 3-5 business days (message to user)

## Edge Cases to Handle
- Empty cart checkout: Disabled button
- Not logged in: Show login modal
- Price changes: 409 response, show update modal
- Unavailable items: 400 response, remove from cart
- Network errors: Error toast, retry button
- Double-click: Debounce, disable button
- Payment closed: Order exists as PENDING, can retry
- localStorage corruption: Reset cart

## Nigerian Context
- Currency: Nigerian Naira (₦) with red symbol
- Phone: +234 prefix, 11-digit validation
- Cities: Lagos, Abuja, Port Harcourt, etc.
- States: All 37 Nigerian states/FCT
- Delivery fee: ₦500 flat, free over ₦5,000
- Paystack: Supports Card, Bank Transfer, USSD (Nigerian methods)
```
