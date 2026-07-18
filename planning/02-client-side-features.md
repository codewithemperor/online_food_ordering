# Client-Side Features Planning

## 1. Home Section

### 1.1 Hero Banner
**Design Reference:** Bentilzone showcase banner + Methuen hero + Pizza Fiesta slider

**Layout:**
- Full-width hero with background image (Nigerian food imagery)
- Left column: Badge ("Lagos' #1 Food Delivery"), Heading ("Order Delicious Nigerian Meals"), Subheading, Search bar, CTA buttons
- Right column: Featured food image with floating food cards (jollof rice, suya, pounded yam)

**Components:**
```
HeroSection
├── HeroBadge ("🛵 Free Delivery on Orders Over ₦5,000")
├── HeroHeading ("Order Delicious Nigerian Meals")
├── HeroSubtext ("From the best restaurants in Lagos, Abuja & beyond")
├── SearchBar (search foods/restaurants by name)
├── CTAButtons ("Order Now" → Menu section, "Browse Restaurants" → Restaurants section)
└── HeroImage (floating food cards with Framer Motion animations)
```

**Interactions:**
- Search bar: Type → filters foods/restaurants in real-time (TanStack Query)
- CTA buttons: Navigate to respective sections
- Floating food cards: Gentle Framer Motion floating animation (y-axis oscillation)
- Background: Parallax scroll effect

**Edge Cases:**
- No restaurants/foods in database → Show "Coming Soon" message
- Search returns no results → Show empty state with suggestion
- Mobile: Stack vertically, hide floating cards, simplify search

### 1.2 Popular Foods Section
**Design Reference:** Methuen "Popular Dishes" + Pizza Fiesta HomeMenu

**Layout:**
- Section header with decorative divider
- 4-column grid (desktop), 2-column (mobile) of food cards
- "View All" link to Menu section

**Data Source:**
- API: `GET /api/foods?sort=popular&limit=8`
- Cached with TanStack Query (5-minute stale time)

**Food Card Design (Bentilzone-inspired):**
```
FoodCard
├── FoodImage (overflowing top, w-40 h-40, object-cover, -mt-8)
├── ActionButton (Add to cart, circular, orange-500 bg)
├── FoodName (semibold, text-lg)
├── FoodDescription (gray-500, text-sm, line-clamp-2)
├── FoodPrice (semibold, text-headingColor, ₦ symbol in red)
└── RestaurantBadge (small, "From Restaurant Name")
```

**Interactions:**
- Hover: Slight scale-up (1.02), drop shadow increase
- Tap: Wiggle animation (Bentilzone pattern)
- "Add to cart": Quick add with default quantity 1, toast notification
- Click on image/name: Open FoodDetailModal

**Edge Cases:**
- No popular foods → Show skeleton placeholders
- Food unavailable (isAvailable=false) → Gray overlay, "Unavailable" badge
- Image missing → Default placeholder image

### 1.3 Featured Restaurants
**Design Reference:** Methuen Isotope filter + Bentilzone category filter

**Layout:**
- Category filter pills (All, Nigerian, Continental, Chinese, Fast Food, etc.)
- 3-column grid of restaurant cards
- Horizontal scroll on mobile

**Restaurant Card Design:**
```
RestaurantCard
├── RestaurantImage (w-full h-48, object-cover, rounded-t-lg)
├── RestaurantInfo (p-4)
│   ├── RestaurantName (font-semibold, text-lg)
│   ├── Category (text-sm, orange-500, badge)
│   ├── Address (text-sm, gray-500)
│   ├── OpenStatus (green "Open Now" / red "Closed")
│   └── Rating (star icon + "4.5" placeholder)
└── ViewMenuButton (orange-500, full-width)
```

**Interactions:**
- Category filter: Click → filter restaurant grid (client-side or API with ?categoryId=)
- "View Menu" button: Navigate to Menu section with restaurant filter pre-selected
- Hover: Card lift with shadow

**Edge Cases:**
- Restaurant closed → "Closed" badge, dimmed card, "View Menu" still works
- No restaurants in category → "No restaurants found" message
- Image missing → Default restaurant placeholder

### 1.4 How It Works Section
**Design Reference:** Methuen "Easy to Order" 3-step

**Layout:**
- 3-step horizontal layout with icons and descriptions
- Step 1: 🍽️ "Choose Restaurant" — Browse restaurants near you
- Step 2: 🛒 "Select Your Meals" — Pick from their menu
- Step 3: 🚚 "Fast Delivery" — Pay & get food delivered

**Design:**
- Each step: Icon (large, orange-500), Title, Description, Step number badge
- Connecting lines/arrows between steps
- Framer Motion: Steps animate in sequentially (stagger)

### 1.5 CTA Section
**Layout:**
- Full-width orange gradient background
- "Hungry? Order Now!" heading
- "Browse Menu" button (white text, orange border)

---

## 2. Restaurants Section

### 2.1 Restaurant Listing
**Design Reference:** Methuen restaurants.php + Bentilzone container

**Layout:**
- Breadcrumb: Home > Restaurants
- Category filter bar (horizontal scrollable pills)
- Search bar (filter by restaurant name)
- Sort options (Name A-Z, Newest, Popular)
- Grid of RestaurantCards (3 cols desktop, 2 cols tablet, 1 col mobile)

**Data Source:**
- API: `GET /api/restaurants?categoryId=X&search=Y&sort=Z`
- TanStack Query with pagination

**Components:**
```
RestaurantsSection
├── SectionHeader ("Restaurants")
├── FilterBar
│   ├── CategoryPills (horizontal scroll)
│   ├── SearchInput
│   └── SortDropdown
└── RestaurantGrid
    └── RestaurantCard (repeated)
```

**Interactions:**
- Category pill click → Filter restaurants, update URL state
- Search input → Debounced search (300ms)
- Sort change → Re-sort displayed list
- "View Menu" → Navigate to Menu section with restaurantId filter

**Edge Cases:**
- No restaurants match filter → Empty state illustration + "Try different filters"
- Loading → Skeleton cards (6 placeholders)
- Error → Retry button

### 2.2 Restaurant Filter
**Category Filter Pills:**
- Design: Bentilzone-style rounded pills
- Active state: `bg-orange-500 text-white`
- Inactive state: `bg-orange-50 text-gray-700 border border-orange-200`
- Horizontal scroll on mobile (hidden scrollbar)
- "All" pill always first

---

## 3. Menu / Food Section

### 3.1 Food Listing
**Design Reference:** Methuen dishes.php + Pizza Fiesta menu page + Bentilzone menu

**Layout:**
- Top: Restaurant selector (if not pre-filtered) + Category filter
- Food grid (4 cols desktop, 2 cols mobile)
- Each food card with add-to-cart functionality

**Data Source:**
- API: `GET /api/foods?categoryId=X&restaurantId=Y&search=Z`
- TanStack Query with filters

**Components:**
```
MenuSection
├── SectionHeader ("Menu")
├── FilterBar
│   ├── RestaurantSelect (HeroUI Select)
│   ├── CategoryPills (horizontal scroll)
│   ├── SearchInput
│   └── AvailabilityToggle (Show only available)
└── FoodGrid
    └── FoodCard (repeated)
```

### 3.2 Food Card (Detailed Design)
**Bentilzone-inspired with enhancements:**

```
FoodCard
├── CardContainer (bg-white, rounded-lg, shadow-sm, hover:shadow-md, transition)
│   ├── ImageContainer (relative, overflow-hidden, rounded-t-lg)
│   │   ├── FoodImage (w-full h-48, object-cover)
│   │   ├── AvailabilityBadge (absolute, top-2 right-2, green/red)
│   │   └── CategoryBadge (absolute, top-2 left-2, orange)
│   ├── ContentContainer (p-4)
│   │   ├── FoodName (font-semibold, text-lg, line-clamp-1)
│   │   ├── RestaurantName (text-sm, text-gray-500)
│   │   ├── FoodDescription (text-sm, text-gray-400, line-clamp-2)
│   │   └── PriceRow (flex, justify-between, items-center)
│   │       ├── Price (font-bold, text-lg)
│   │       │   └── ₦ symbol (text-red-500)
│   │       └── AddToCartButton (circular, bg-orange-500, hover:bg-orange-600)
│   │           └── Plus icon (white)
└── Tap animation: whileTap={{ rotate: [0, -1, 1, -1, 0] }}
```

**Interactions:**
- Click on card (not button) → Open FoodDetailModal
- "Add to cart" button:
  - If food is simple (no sizes/extras) → Add directly to cart with qty 1, show toast
  - If food has options → Open FoodDetailModal with quantity selector
- Hover: `hover:drop-shadow-lg`, slight scale

**Edge Cases:**
- Food unavailable → Gray overlay on image, "Unavailable" badge, button disabled
- No image → Default food placeholder
- Long name → Truncate with ellipsis
- Long description → line-clamp-2

### 3.3 Food Detail Modal
**Design Reference:** Pizza Fiesta MenuItemPopUp + enhanced

**Layout:**
- HeroUI Modal (centered, max-w-lg)
- Food image (top, full-width, h-64)
- Food name, restaurant, description
- Quantity selector (- / number / +)
- Price display (updates with quantity)
- "Add to Cart" button (full-width, orange gradient)
- Close button (top-right)

**Components:**
```
FoodDetailModal
├── HeroUI Modal
│   ├── ModalHeader
│   │   ├── FoodImage (background)
│   │   └── CloseButton (absolute, top-right)
│   ├── ModalBody
│   │   ├── FoodName
│   │   ├── RestaurantName (link)
│   │   ├── FoodDescription
│   │   ├── QuantitySelector
│   │   │   ├── MinusButton
│   │   │   ├── QuantityDisplay
│   │   │   └── PlusButton
│   │   └── PriceDisplay (quantity × unit price)
│   └── ModalFooter
│       └── AddToCartButton
```

**Interactions:**
- Quantity selector: Min (1), Max (99), update price in real-time
- "Add to Cart": Add to Zustand cart store, show success toast, close modal after 500ms
- Close: X button or click outside

**Edge Cases:**
- Food becomes unavailable while modal is open → Disable "Add to Cart", show warning
- Quantity exceeds stock (if stock tracking added) → Cap at max available

---

## 4. Cart System

### 4.1 Cart Panel (Slide-in Overlay)
**Design Reference:** Bentilzone cart design (dark theme, slide from right)

**Layout:**
- Fixed position, right side, z-index 100
- Full width on mobile, w-[400px] on desktop
- Slide-in animation with Framer Motion
- Dark background (gray-900) for cart body
- Semi-transparent backdrop

**Components:**
```
CartPanel
├── Backdrop (bg-black/50, click to close)
├── CartContainer (fixed right, slide-in)
│   ├── CartHeader (bg-white, flex, justify-between)
│   │   ├── BackButton (← arrow)
│   │   ├── Title ("Your Cart" + basket icon)
│   │   └── ClearButton ("Clear All")
│   ├── CartBody (bg-gray-900, rounded-t-3xl, scrollable, max-h-[400px])
│   │   ├── CartItemsList
│   │   │   └── CartItem (repeated)
│   │   └── EmptyCartState (illustration + "Cart is empty" + link to menu)
│   └── CartFooter (bg-gray-800, rounded-t-3xl)
│       ├── SubtotalRow
│       ├── DeliveryFeeRow (Free over ₦5000, else ₦500)
│       ├── TotalRow (bold, larger font)
│       └── CheckoutButton (full-width, orange gradient, "Proceed to Checkout")
```

### 4.2 Cart Item
**Design Reference:** Bentilzone cart item row

```
CartItem
├── ItemContainer (bg-gray-700, rounded-lg, p-2)
│   ├── FoodImage (circular, w-16 h-16, rounded-full, object-cover)
│   ├── ItemInfo (flex-1)
│   │   ├── FoodName (text-white, font-semibold)
│   │   ├── RestaurantName (text-gray-400, text-xs)
│   │   └── Price (text-gray-300, font-semibold)
│   ├── QuantityControls (flex, items-center, gap-2)
│   │   ├── MinusButton (w-6 h-6, bg-gray-600, rounded)
│   │   ├── QuantityDisplay (w-8, text-center, text-white)
│   │   └── PlusButton (w-6 h-6, bg-gray-600, rounded)
│   └── DeleteButton (w-8 h-8, bg-red-600, rounded-full)
```

**Interactions:**
- +/- buttons: Update quantity in Zustand store, recalculate price
- Delete button: Remove item from cart, show toast "Item removed"
- Quantity 1 → minus button disabled
- Quantity 99 → plus button disabled

### 4.3 Cart State (Zustand Store)

```typescript
interface CartItem {
  foodId: string;
  foodName: string;
  foodImage: string;
  price: number;        // Unit price at time of adding
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}
```

**Persistence:**
- Save to localStorage on every mutation
- Load from localStorage on app mount
- Clear localStorage after successful order

**Price Verification:**
- Server-side price check during checkout
- If price changed: Update cart with new price, notify user

### 4.4 Delivery Fee Logic
```typescript
function getDeliveryFee(subtotal: number): number {
  if (subtotal >= 5000) return 0;      // Free delivery over ₦5,000
  return 500;                           // ₦500 flat delivery fee
}
```

**Edge Cases:**
- Cart empty → Disable checkout button, show "Cart is empty"
- Item from different restaurant → Allow (no restaurant restriction)
- Price change detected → Alert user, update price
- Cart total exceeds ₦500,000 → Show confirmation
- LocalStorage corrupted → Reset cart, show message

---

## 5. Checkout Flow

### 5.1 Checkout Panel (Slide-in Overlay)
**Design Reference:** Bentilzone checkout panel (dark theme, payment selector)

**Layout:**
- Same slide-in pattern as cart
- Header: "Secure Checkout" with shield icons
- Step 1: Delivery Information
- Step 2: Payment Method
- Step 3: Order Summary & Pay

**Components:**
```
CheckoutPanel
├── Backdrop
├── CheckoutContainer (fixed right, slide-in)
│   ├── CheckoutHeader ("Secure Checkout" + 🔒)
│   ├── DeliveryForm
│   │   ├── FullName (pre-filled from profile)
│   │   ├── Phone (pre-filled from profile)
│   │   ├── DeliveryAddress (pre-filled from profile)
│   │   ├── City (dropdown: Lagos, Abuja, Port Harcourt, etc.)
│   │   ├── State (dropdown)
│   │   └── DeliveryInstructions (optional textarea)
│   ├── PaymentSelector
│   │   ├── PaystackOption (Card, Bank, USSD)
│   │   │   └── PaystackButton (redirects to Paystack)
│   │   └── CODOption (Cash on Delivery)
│   ├── OrderSummary
│   │   ├── ItemsList (compact)
│   │   ├── Subtotal
│   │   ├── DeliveryFee
│   │   ├── TotalAmount (bold, orange)
│   │   └── PayNowButton
│   └── CheckoutFooter ("Secured by Paystack 🔒")
```

### 5.2 Delivery Form Validation
```typescript
const deliverySchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(11, "Valid Nigerian phone number required").max(14),
  address: z.string().min(10, "Please enter a detailed delivery address"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  deliveryInstructions: z.string().optional(),
});
```

**Nigerian Phone Validation:**
- Format: +234 XXX XXX XXXX or 0XXX XXX XXXX
- Min 11 digits (local format)

### 5.3 Payment Method: Paystack
**Flow:**
1. User selects "Pay with Paystack"
2. Clicks "Pay ₦X,XXX"
3. POST `/api/paystack/initialize` with order data
4. Server creates order in DB → Gets Paystack authorization URL
5. Client redirects to Paystack page
6. User pays (Card/Bank/USSD)
7. Paystack redirects to callback URL
8. GET `/api/paystack/verify?reference=xxx`
9. Server verifies → Updates order (paid: true, status: CONFIRMED)
10. Client shows success message, clears cart

### 5.4 Payment Method: Cash on Delivery
**Flow:**
1. User selects "Cash on Delivery"
2. Clicks "Place Order"
3. POST `/api/orders` with paymentMethod: COD
4. Order created with status: PENDING, paymentStatus: PENDING
5. Show confirmation message
6. Clear cart

### 5.5 Paystack Inline Checkout (Alternative)
Instead of redirecting, can use Paystack inline popup:
```typescript
const paystackConfig = {
  reference: new Date().getTime().toString(),
  email: user.email,
  amount: totalAmount * 100, // Paystack expects kobo
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  onClose: () => {/* closed */},
  callback: (response: any) => {/* verify payment */},
};
```

**Edge Cases:**
- Payment failed → Show error, order remains PENDING, cart preserved
- Payment timeout → Order in limbo, webhook should handle
- Network error during initialization → Retry, show error toast
- Address validation fails → Highlight invalid fields
- Cart empty on checkout → Redirect to menu
- User not logged in → Show login modal first
- Price mismatch (server vs client) → Recalculate, show updated prices, ask for confirmation

---

## 6. Orders Section (Customer)

### 6.1 Orders List
**Layout:**
- Section header: "My Orders"
- Filter tabs: All, Pending, Preparing, On the Way, Delivered, Cancelled
- Order cards (vertical list)

**Components:**
```
OrdersSection
├── SectionHeader ("My Orders")
├── OrderFilterTabs
│   ├── All (count badge)
│   ├── Pending
│   ├── Preparing
│   ├── On the Way
│   ├── Delivered
│   └── Cancelled
└── OrdersList
    └── OrderCard (repeated)
```

### 6.2 Order Card
```
OrderCard
├── CardContainer (bg-white, rounded-lg, shadow-sm, border-l-4 status-color)
│   ├── OrderHeader (flex, justify-between)
│   │   ├── OrderNumber ("ORD-20240101-001")
│   │   ├── OrderDate ("Jan 1, 2024 at 10:30 AM")
│   │   └── StatusBadge (color-coded pill)
│   ├── OrderItems (compact list)
│   │   └── ItemRow (food image, name, qty, price) × N
│   ├── OrderFooter (flex, justify-between)
│   │   ├── TotalAmount ("₦X,XXX")
│   │   ├── PaymentBadge (Paid/COD)
│   │   └── ActionButtons
│   │       ├── ViewDetailButton
│   │       └── CancelButton (if PENDING/CONFIRMED only)
│   └── ProgressBar (status timeline)
```

### 6.3 Order Status Display
| Status | Color | Badge Style | Icon |
|--------|-------|-------------|------|
| PENDING | blue-500 | `bg-blue-100 text-blue-700` | Clock |
| CONFIRMED | indigo-500 | `bg-indigo-100 text-indigo-700` | CheckCircle |
| PREPARING | yellow-500 | `bg-yellow-100 text-yellow-700` | ChefHat |
| ON_THE_WAY | orange-500 | `bg-orange-100 text-orange-700` | Truck |
| DELIVERED | green-500 | `bg-green-100 text-green-700` | CheckCheck |
| CANCELLED | red-500 | `bg-red-100 text-red-700` | XCircle |

### 6.4 Cancel Order Flow
1. User clicks "Cancel Order"
2. Confirmation modal: "Are you sure you want to cancel this order?"
3. If already paid: "Your refund will be processed within 3-5 business days"
4. PUT `/api/orders` with status: CANCELLED
5. If Paystack payment: Initiate refund via Paystack API
6. Show toast: "Order cancelled successfully"

**Edge Cases:**
- Order already being prepared → Can't cancel, show "Contact support"
- Order already delivered → Can't cancel
- Order not found → Show error
- Cancel after payment → Need refund logic
- Multiple rapid cancel clicks → Debounce, idempotent

### 6.5 Order Detail View
**Layout:**
- Full section view (replaces list)
- Back button to orders list
- Order number, date, status timeline
- Items list with images
- Delivery information
- Payment information
- Status timeline (visual progress bar)

**Status Timeline Design:**
```
[●] Order Placed → [●] Confirmed → [●] Preparing → [●] On the Way → [●] Delivered
     10:30 AM        10:35 AM       10:45 AM        11:15 AM        11:45 AM
```
- Completed steps: Filled circles, orange color, connecting line orange
- Current step: Pulsing orange circle
- Future steps: Gray circles, gray connecting line
- Cancelled: Red X on current step

---

## 7. Profile Section

### 7.1 Profile Form
**Layout:**
- Section header: "My Profile"
- Two-column layout (avatar + form)
- Avatar upload with preview

**Components:**
```
ProfileSection
├── SectionHeader ("My Profile")
├── ProfileCard (bg-white, rounded-lg, shadow-sm, p-6)
│   ├── AvatarSection
│   │   ├── AvatarDisplay (w-24 h-24, rounded-full)
│   │   ├── ChangeAvatarButton
│   │   └── AvatarUpload (hidden input, triggered by button)
│   ├── FormFields
│   │   ├── FullName (with icon)
│   │   ├── Email (disabled, read-only)
│   │   ├── Phone (with icon, Nigerian format)
│   │   ├── Address (textarea)
│   │   ├── City (dropdown)
│   │   └── State (dropdown)
│   └── SaveButton (orange gradient, full-width)
```

**Validation:**
- Name: Required, min 2 characters
- Phone: Optional, valid Nigerian format if provided
- Address: Optional, min 10 characters if provided
- Email: Read-only (can't change email)

**Edge Cases:**
- Avatar upload fails → Show error, keep old avatar
- Save fails → Show error toast, keep form data
- Session expired while editing → Redirect to login, preserve form data
- Image too large → Show "Max 2MB" error

---

## 8. Auth Modals

### 8.1 Login Modal
**Design Reference:** Pizza Fiesta login + Bentilzone auth forms

**Layout:**
- HeroUI Modal (centered, max-w-md)
- Logo at top
- Email input with icon
- Password input with show/hide toggle
- "Login" button (orange gradient, full-width)
- "Don't have an account? Register" link
- No social login buttons (as specified)

**Validation:**
- Email: Required, valid format
- Password: Required, min 1 char (let server validate)

**Error Display:**
- Invalid credentials: "Invalid email or password"
- Account blocked: "Your account has been blocked. Please contact support."
- Server error: "Something went wrong. Please try again."

### 8.2 Registration Modal
**Layout:**
- HeroUI Modal (centered, max-w-md, scrollable)
- Logo at top
- Full Name input
- Email input
- Phone input (with +234 prefix)
- Password input (with strength indicator)
- Confirm Password input
- Delivery Address textarea
- "Create Account" button
- "Already have an account? Login" link

**Validation:**
- All fields required
- Email: Valid format, unique
- Phone: Valid Nigerian number (11+ digits)
- Password: Min 8 chars, show strength bar (weak/medium/strong)
- Confirm password: Must match
- Address: Min 10 chars

**Password Strength Indicator:**
- Weak (< 8 chars): Red bar, "Too short"
- Medium (8-11 chars): Yellow bar, "Medium"
- Strong (12+ chars with mixed case + numbers): Green bar, "Strong"

**Edge Cases:**
- Email already exists: "An account with this email already exists"
- Password too short: "Password must be at least 8 characters"
- Server error: "Something went wrong. Please try again."
- Registration success: Auto-login, redirect to home, welcome toast

---

## 9. Navigation System

### 9.1 Main Navigation (Header)
**Design Reference:** Bentilzone header (fixed, glassmorphism)

**Layout:**
```
Header (fixed, top-0, z-50, bg-white/80 backdrop-blur-md, border-b)
├── Logo ("NaijaBites" text + icon)
├── NavLinks (desktop, horizontal)
│   ├── Home
│   ├── Restaurants
│   ├── Menu
│   └── My Orders (authenticated only)
├── RightSection
│   ├── CartButton (with badge count)
│   ├── UserDropdown (if authenticated)
│   │   ├── Profile
│   │   ├── My Orders
│   │   ├── Admin Panel (if admin)
│   │   └── Logout
│   └── LoginButton (if not authenticated)
└── MobileMenu (hamburger toggle)
    └── MobileNav (full-screen overlay)
```

**Interactions:**
- Logo click → Navigate to Home section
- Nav links → Update activeSection in Zustand store
- Cart button → Toggle cart panel
- User dropdown → HeroUI DropdownMenu
- Mobile menu → Full-screen overlay with nav links

### 9.2 Section Navigation State

```typescript
type Section = 'home' | 'restaurants' | 'menu' | 'orders' | 'profile' | 'admin';

interface NavigationStore {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  filters: {
    restaurantId?: string;
    categoryId?: string;
    search?: string;
  };
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
}
```

### 9.3 Navigation Flow
- Clicking "View Menu" on restaurant card → `setActiveSection('menu')` + `setFilter('restaurantId', id)`
- Clicking "My Orders" in dropdown → `setActiveSection('orders')`
- Clicking "Admin Panel" → `setActiveSection('admin')`
- Cart panel is separate overlay (not a section)

---

## 10. Responsive Design Specifications

### Mobile (< 768px)
- Single column layouts
- Hamburger menu
- Cart panel: Full width
- Food grid: 2 columns
- Restaurant grid: 1 column
- Section padding: px-4
- Font sizes: Reduced by 1 step

### Tablet (768px - 1024px)
- 2-column grids
- Compact navigation
- Cart panel: w-[350px]
- Food grid: 3 columns
- Restaurant grid: 2 columns

### Desktop (> 1024px)
- Full multi-column layouts
- Full navigation bar
- Cart panel: w-[400px]
- Food grid: 4 columns
- Restaurant grid: 3 columns
- Max-width container: 1280px

### Touch Targets
- Minimum 44px × 44px for all interactive elements
- Cart +/- buttons: 32px minimum
- Food card tap targets: Full card area

---

## 11. Animation Specifications

### Page/Section Transitions
```typescript
// Section transition
const sectionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};
// Duration: 0.3s, ease: easeInOut
```

### Cart Panel Slide-in
```typescript
const cartVariants = {
  closed: { x: "100%" },
  open: { x: 0 },
};
// Duration: 0.3s, ease: easeInOut
// Backdrop: opacity 0 → 0.5
```

### Food Card Hover
```typescript
whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
whileTap={{ rotate: [0, -1, 1, -1, 0] }} // Wiggle (Bentilzone)
```

### Floating Hero Elements
```typescript
animate={{ y: [0, -10, 0] }}
transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
```

### Add to Cart Feedback
```typescript
// Cart badge bounce
animate={{ scale: [1, 1.3, 1] }}
// Duration: 0.3s
```

### Staggered Grid Animation
```typescript
// Food cards appear one by one
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};
const staggerChild = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};
```

---

## 12. Agentic Prompt for Client-Side Implementation

```
You are building the CLIENT-SIDE of NaijaBites, a Nigerian food ordering web application using Next.js 16, HeroUI v2, Tailwind CSS 4, Zustand, TanStack Query, and Framer Motion.

The app uses a SINGLE ROUTE (/) with client-side section-based navigation managed by a Zustand store.

## Setup Phase
1. Install HeroUI v2: `npm install @heroui/react` (follow HeroUI v2 setup guide for Next.js)
2. Configure Tailwind with NaijaBites theme (orange-500 primary, custom fonts Poppins + Josefin Sans)
3. Create Zustand stores: cart-store.ts, navigation-store.ts, ui-store.ts
4. Create type definitions in types/index.ts (CartItem, Food, Restaurant, Category, Order, etc.)
5. Create utility functions: formatNaira(), generateOrderNumber(), etc.
6. Set up TanStack Query provider in root layout

## Layout Components
1. Build Header component (fixed top, glassmorphism bg, logo, nav links, cart badge, user dropdown)
2. Build Footer component (sticky bottom, 4-column: brand, links, hours, contact)
3. Build CartPanel component (slide-in from right, dark theme body, orange gradient checkout button)
4. Build AuthModals (Login + Register as HeroUI Modals)
5. Set up section-based rendering in page.tsx with AnimatePresence

## Sections (Build in Order)
1. HomeSection: Hero with search, PopularFoods grid, FeaturedRestaurants, HowItWorks, CTA
2. RestaurantsSection: Category filter pills, search, restaurant grid with cards
3. MenuSection: Restaurant/category filters, food grid with add-to-cart cards
4. OrdersSection: Filter tabs, order cards with status badges, cancel button
5. ProfileSection: Avatar upload, edit form with validation
6. FoodDetailModal: HeroUI Modal with quantity selector, add to cart

## Design Requirements
- Orange (#f97316) as primary brand color (Nigerian warmth)
- Nigerian Naira (₦) formatting with red symbol
- Dark theme cart panel (gray-900 body, gray-700 item rows)
- Glassmorphism header (bg-white/80 backdrop-blur)
- Framer Motion: section transitions, cart slide-in, food card wiggle on tap, floating hero elements
- Responsive: mobile-first, 1-col → 2-col → 3-col → 4-col grids
- Toast notifications for ALL user actions (add to cart, remove, login, register, errors)
- Loading skeletons for all data-dependent components
- Empty states for all lists

## Cart System (Zustand)
- Store: items[], isOpen, addItem(), removeItem(), updateQuantity(), clearCart()
- Persist to localStorage
- Delivery fee: Free over ₦5,000, else ₦500
- Cart badge on header updates reactively

## Critical Edge Cases
- Food unavailable: Gray overlay, disabled add-to-cart
- Cart empty: Disabled checkout, empty state illustration
- Price change during checkout: Server-side verification, notify user
- Auth required for checkout: Show login modal
- Cancel order: Only if status is PENDING or CONFIRMED
- Nigerian phone validation: 11+ digits
- Max image upload: 2MB
```
