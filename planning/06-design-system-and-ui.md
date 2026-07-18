# Design System & UI Planning

## 1. Color System

### 1.1 Primary Palette (Orange-Centric Nigerian Theme)

The design takes inspiration from the Bentilzone restaurant app's orange-centric approach, adapted for a Nigerian food delivery context. Orange represents warmth, appetite stimulation, and Nigerian market vibrancy.

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Primary-50** | `#fff7ed` | `orange-50` | Light backgrounds, hover states |
| **Primary-100** | `#ffedd5` | `orange-100` | Badges, tags, subtle highlights |
| **Primary-200** | `#fed7aa` | `orange-200` | Borders, dividers |
| **Primary-300** | `#fdba74` | `orange-300` | Secondary accents |
| **Primary-400** | `#fb923c` | `orange-400` | Gradient start, light buttons |
| **Primary-500** | `#f97316` | `orange-500` | **Brand color**, CTAs, active states |
| **Primary-600** | `#ea580c` | `orange-600` | Hover states, admin sidebar |
| **Primary-700** | `#c2410c` | `orange-700` | Pressed states, deep accents |
| **Primary-800** | `#9a3412` | `orange-800` | Dark accents |
| **Primary-900** | `#7c2d12` | `orange-900` | Very dark accents |

### 1.2 Semantic Colors

| Purpose | Hex | Tailwind | Usage |
|---------|-----|----------|-------|
| **Success** | `#16a34a` | `green-600` | Delivered, available, confirmed |
| **Success Light** | `#dcfce7` | `green-100` | Success badges bg |
| **Danger** | `#dc2626` | `red-600` | Delete, cancel, errors, ₦ symbol |
| **Danger Light** | `#fee2e2` | `red-100` | Error badges bg |
| **Warning** | `#eab308` | `yellow-500` | Preparing, on-the-way |
| **Warning Light** | `#fef9c3` | `yellow-100` | Warning badges bg |
| **Info** | `#3b82f6` | `blue-500` | Pending, informational |
| **Info Light** | `#dbeafe` | `blue-100` | Info badges bg |

### 1.3 Neutral Colors

| Purpose | Hex | Tailwind | Usage |
|---------|-----|----------|-------|
| **Heading** | `#1f2937` | `gray-800` | Headings, bold text |
| **Body** | `#4b5563` | `gray-600` | Body text, descriptions |
| **Muted** | `#9ca3af` | `gray-400` | Placeholder, secondary text |
| **Light Muted** | `#d1d5db` | `gray-300` | Borders, dividers |
| **Background** | `#f9fafb` | `gray-50` | Page background |
| **Card** | `#ffffff` | `white` | Card backgrounds |
| **Cart Dark** | `#1f2937` | `gray-800` | Cart/checkout panel bg |
| **Cart Item** | `#374151` | `gray-700` | Cart item row bg |
| **Cart Total** | `#1f2937` | `gray-800` | Cart total section bg |

### 1.4 Currency Color
- Nigerian Naira symbol (₦) is always displayed in **red-600** (`#dc2626`)
- Amount follows in **gray-800** (headings) or **gray-300** (cart dark theme)

### 1.5 Tailwind Configuration

```typescript
// tailwind.config.ts
import { heroui } from "@heroui/react";

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        brand: '#f97316',
        naira: '#dc2626',
        cart: {
          bg: '#1f2937',
          item: '#374151',
          total: '#1f2937',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        josefin: ['Josefin Sans', 'sans-serif'],
        dancing: ['Dancing Script', 'cursive'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          md: '3rem',
          lg: '4rem',
          xl: '5rem',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
```

---

## 2. Typography System

### 2.1 Font Families

| Font | Weights | Usage |
|------|---------|-------|
| **Poppins** | 300, 400, 500, 600, 700 | Body text, UI elements, buttons, forms |
| **Josefin Sans** | 400, 600, 700 | Headings, brand name, section titles |
| **Dancing Script** | 400, 700 | Decorative accents, hero subtitles, brand tagline |

### 2.2 Type Scale

| Element | Font | Size | Weight | Color | Tailwind Classes |
|---------|------|------|--------|-------|------------------|
| **H1** | Josefin | 3rem (48px) | 700 | heading | `font-josefin text-5xl font-bold text-gray-800` |
| **H2** | Josefin | 2.25rem (36px) | 600 | heading | `font-josefin text-4xl font-semibold text-gray-800` |
| **H3** | Josefin | 1.5rem (24px) | 600 | heading | `font-josefin text-2xl font-semibold text-gray-800` |
| **H4** | Josefin | 1.25rem (20px) | 600 | heading | `font-josefin text-xl font-semibold text-gray-800` |
| **Body** | Poppins | 1rem (16px) | 400 | body | `font-poppins text-base text-gray-600` |
| **Small** | Poppins | 0.875rem (14px) | 400 | muted | `font-poppins text-sm text-gray-400` |
| **Button** | Poppins | 0.875rem (14px) | 500 | white | `font-poppins text-sm font-medium` |
| **Price** | Poppins | 1.125rem (18px) | 600 | heading | `font-poppins text-lg font-semibold text-gray-800` |
| **Naira** | Poppins | 0.75rem (12px) | 600 | naira | `font-poppins text-xs font-semibold text-red-600` |
| **Badge** | Poppins | 0.75rem (12px) | 500 | varies | `font-poppins text-xs font-medium` |

### 2.3 Responsive Type Scale

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| H1 | text-3xl | text-4xl | text-5xl |
| H2 | text-2xl | text-3xl | text-4xl |
| H3 | text-xl | text-2xl | text-2xl |
| Body | text-sm | text-base | text-base |
| Price | text-base | text-lg | text-lg |

---

## 3. Component Design Specifications

### 3.1 Buttons

**Primary Button (CTA):**
```
bg-gradient-to-r from-orange-400 to-orange-600
text-white font-medium text-sm
px-6 py-3 rounded-lg
hover:from-orange-500 hover:to-orange-700
active:scale-[0.98]
shadow-md hover:shadow-lg
transition-all duration-150
```

**Secondary Button:**
```
bg-white text-orange-600
border-2 border-orange-500
px-6 py-3 rounded-lg
hover:bg-orange-50
active:scale-[0.98]
transition-all duration-150
```

**Danger Button:**
```
bg-red-600 text-white
px-4 py-2 rounded-lg
hover:bg-red-700
active:scale-[0.98]
transition-all duration-150
```

**Icon Button (Circular):**
```
w-10 h-10 rounded-full
bg-orange-500 text-white
flex items-center justify-center
hover:bg-orange-600
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.9 }}
```

**Cart Badge:**
```
w-5 h-5 rounded-full bg-red-600
text-white text-xs font-bold
absolute -top-2 -right-2
flex items-center justify-center
```

### 3.2 Cards

**Food Card:**
```
bg-white rounded-xl shadow-sm
overflow-hidden
hover:shadow-md transition-shadow duration-200
border border-gray-100
```
- Image: h-48, w-full, object-cover
- Content: p-4
- Price row: flex justify-between items-center mt-2

**Restaurant Card:**
```
bg-white rounded-xl shadow-sm
overflow-hidden
hover:shadow-md transition-shadow duration-200
border border-gray-100
```
- Image: h-52, w-full, object-cover
- Content: p-4
- Category badge: orange-100 text-orange-700

**Stat Card (Admin):**
```
bg-white rounded-xl shadow-sm p-6
border-l-4 [status-color]
```
- Icon: w-12 h-12 rounded-lg bg-[color]-50
- Value: text-3xl font-bold
- Title: text-sm text-gray-500

**Category Card (Admin):**
```
bg-white rounded-lg shadow-sm
overflow-hidden
border border-gray-100
```

### 3.3 Badges / Status Pills

| Status | Classes |
|--------|---------|
| PENDING | `bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium` |
| CONFIRMED | `bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium` |
| PREPARING | `bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium` |
| ON_THE_WAY | `bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium` |
| DELIVERED | `bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium` |
| CANCELLED | `bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium` |
| PAID | `bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium` |
| ACTIVE | `bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium` |
| BLOCKED | `bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium` |
| Available | `bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs` |
| Unavailable | `bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs` |

### 3.4 Inputs

**Standard Input (Light theme):**
```
w-full px-4 py-2.5
bg-white border border-gray-300 rounded-lg
text-gray-800 placeholder-gray-400
focus:border-orange-500 focus:ring-2 focus:ring-orange-200
transition-colors duration-200
```

**Cart Input (Dark theme):**
```
w-full px-3 py-2
bg-gray-700 border-2 border-gray-600 rounded-md
text-white placeholder-gray-400
focus:border-orange-500 focus:ring-orange-500
```

**Search Input:**
```
w-full pl-10 pr-4 py-2.5
bg-gray-50 border border-gray-200 rounded-lg
text-gray-800
focus:bg-white focus:border-orange-500
```

**Price Input:**
```
Prefix: ₦ symbol (text-red-600 font-semibold)
w-full px-4 py-2.5
bg-white border border-gray-300 rounded-lg
text-gray-800 font-semibold
```

### 3.5 Navigation

**Header:**
```
fixed top-0 w-full z-50
bg-white/80 backdrop-blur-md
border-b border-gray-200/50
px-4 md:px-6 lg:px-16
py-3
```

**Nav Link (Active):**
```
text-orange-600 font-semibold
border-b-2 border-orange-600
```

**Nav Link (Inactive):**
```
text-gray-600
hover:text-orange-600 transition-colors duration-150
```

**Admin Sidebar:**
```
fixed left-0 top-0 w-64 h-full
bg-orange-600 text-orange-50
shadow-xl
```

**Admin Nav Item (Active):**
```
bg-orange-700 text-white rounded-md px-3 py-2
font-semibold
```

**Admin Nav Item (Inactive):**
```
hover:bg-orange-700/50 rounded-md px-3 py-2
transition-colors duration-150
```

---

## 4. Layout Patterns

### 4.1 Page Section Layout
```
min-h-screen flex flex-col
├── Header (fixed top)
├── Main (flex-1, mt-16 for header offset)
│   └── Active Section (conditional render)
└── Footer (mt-auto, sticky to bottom)
```

### 4.2 Grid Systems

**Food Grid:**
```
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6
```

**Restaurant Grid:**
```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6
```

**Admin Dashboard Stats:**
```
grid grid-cols-2 md:grid-cols-4 gap-4
```

**Cart/Checkout Panel:**
```
fixed top-0 right-0
w-full md:w-[400px]
h-full
z-[100]
shadow-2xl
```

### 4.3 Container Width
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

### 4.4 Section Spacing
```
py-12 md:py-16 lg:py-20
```

---

## 5. Cart & Checkout Design (Dark Theme Overlay)

### 5.1 Cart Panel

**Header (Light):**
```
bg-white px-4 py-3
flex items-center justify-between
border-b border-gray-200
```

**Body (Dark):**
```
bg-gray-900 rounded-t-3xl
px-6 py-8
min-h-[300px] max-h-[400px] overflow-y-auto
custom-scrollbar (orange-500 thumb)
```

**Footer (Dark):**
```
bg-gray-800 rounded-t-3xl
px-8 py-4
border-t border-gray-700
```

### 5.2 Cart Item Row
```
bg-gray-700 rounded-lg p-2 mb-3
flex items-center gap-3
```
- Image: w-16 h-16 rounded-full object-cover
- Info: flex-1
  - Name: text-white font-semibold
  - Restaurant: text-gray-400 text-xs
  - Price: text-gray-300 font-semibold
- Controls: flex items-center gap-2
  - Minus: w-6 h-6 bg-gray-600 rounded text-white
  - Quantity: w-8 text-center text-white
  - Plus: w-6 h-6 bg-gray-600 rounded text-white
- Delete: w-8 h-8 bg-red-600 rounded-full text-white

### 5.3 Checkout Button
```
w-full py-3 rounded-full
bg-gradient-to-r from-orange-400 to-orange-600
text-white font-semibold text-lg
hover:from-orange-500 hover:to-orange-700
shadow-lg hover:shadow-xl
transition-all duration-200
```

### 5.4 Empty Cart
- SVG illustration (empty cart icon)
- "Your cart is empty" text
- "Browse Menu" link button (orange outline)

---

## 6. Animation Specifications (Framer Motion)

### 6.1 Section Transitions
```typescript
const sectionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};
```

### 6.2 Cart Panel Slide-in
```typescript
const cartPanelVariants = {
  closed: { x: "100%", transition: { duration: 0.3, ease: "easeInOut" } },
  open: { x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
};

const backdropVariants = {
  closed: { opacity: 0 },
  open: { opacity: 0.5 },
};
```

### 6.3 Food Card Interactions
```typescript
const foodCardHover = {
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  whileTap: { rotate: [0, -1, 1, -1, 0], transition: { duration: 0.3 } },
};
```

### 6.4 Floating Elements (Hero)
```typescript
const floatingAnimation = {
  animate: { y: [0, -10, 0] },
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
};
```

### 6.5 Staggered Grid
```typescript
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const staggerChild = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
```

### 6.6 Modal Animation
```typescript
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};
```

### 6.7 Badge Bounce (Cart Count)
```typescript
const badgeBounce = {
  animate: { scale: [1, 1.3, 1] },
  transition: { duration: 0.3 },
};
```

### 6.8 Admin Sidebar Nav Item
```typescript
const navItemHover = {
  whileHover: { x: 4, transition: { duration: 0.15 } },
};
```

---

## 7. Responsive Design Rules

### 7.1 Breakpoint Behavior

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| Default | < 640px | Single column, stacked layouts, full-width cart |
| sm | ≥ 640px | Minor adjustments |
| md | ≥ 768px | 2-column grids, tablet cart width (350px) |
| lg | ≥ 1024px | 3-4 column grids, desktop cart width (400px), full header nav |
| xl | ≥ 1280px | Max container width, comfortable spacing |

### 7.2 Mobile-Specific
- Hamburger menu replaces desktop nav
- Cart panel is full-width
- Single-column grids everywhere
- Reduced padding (px-4 vs px-8)
- Touch-friendly: 44px minimum touch targets
- Swipe gestures for cart (future)
- Bottom sticky bar for cart access (future)

### 7.3 Touch Targets
- Buttons: min 44px × 44px
- Nav links: min 44px height
- Food card "Add to Cart" button: 40px × 40px
- Cart +/- buttons: 32px × 32px (with 6px padding for touch area)
- Filter pills: min 44px height

### 7.4 Responsive Images
- Next.js `<Image>` component with `sizes` prop
- Food cards: `sizes="(max-width: 768px) 50vw, 25vw"`
- Restaurant cards: `sizes="(max-width: 768px) 100vw, 33vw"`
- Hero: `fill` with `priority`

---

## 8. Empty States & Loading States

### 8.1 Loading Skeletons

**Food Card Skeleton:**
```
<div className="bg-white rounded-xl overflow-hidden animate-pulse">
  <div className="h-48 bg-gray-200" />
  <div className="p-4">
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
    <div className="flex justify-between">
      <div className="h-5 bg-gray-200 rounded w-1/4" />
      <div className="h-10 w-10 bg-gray-200 rounded-full" />
    </div>
  </div>
</div>
```

**Restaurant Card Skeleton:**
```
<div className="bg-white rounded-xl overflow-hidden animate-pulse">
  <div className="h-52 bg-gray-200" />
  <div className="p-4">
    <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
    <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
    <div className="h-4 bg-gray-100 rounded w-1/3" />
  </div>
</div>
```

**Table Row Skeleton:**
```
<div className="animate-pulse flex items-center gap-4 p-4">
  <div className="w-10 h-10 bg-gray-200 rounded-full" />
  <div className="flex-1">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/4" />
  </div>
  <div className="h-4 bg-gray-200 rounded w-20" />
</div>
```

### 8.2 Empty States

**Empty Cart:**
- Illustration: Shopping cart SVG with sad face
- Text: "Your cart is empty"
- Action: "Browse Menu" button (orange outline)

**No Orders:**
- Illustration: Clipboard SVG
- Text: "No orders yet"
- Action: "Start Ordering" button

**No Search Results:**
- Illustration: Magnifying glass SVG
- Text: "No results found"
- Subtitle: "Try a different search term or filter"

**No Foods Available:**
- Illustration: Empty plate SVG
- Text: "No food items available"
- Subtitle: "Check back later or try a different category"

**No Restaurants:**
- Illustration: Store SVG
- Text: "No restaurants found"
- Subtitle: "Try a different category or location"

---

## 9. Scrollbar Styling

### 9.1 Cart/Checkout Scrollbar (Dark Theme)
```css
.cart-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.cart-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.cart-scrollbar::-webkit-scrollbar-thumb {
  background: #f97316;
  border-radius: 3px;
}
.cart-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #ea580c;
}
```

### 9.2 General Scrollbar (Light Theme)
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
```

### 9.3 Hidden Scrollbar (Horizontal Scroll)
```css
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

## 10. HeroUI v2 Component Mapping

### 10.1 Component Replacements

| Traditional | HeroUI v2 | Usage |
|-------------|-----------|-------|
| `<button>` | `<Button>` | All buttons |
| `<input>` | `<Input>` | Form inputs |
| `<select>` | `<Select>` + `<SelectItem>` | Dropdowns |
| `<table>` | `<Table>` + `<TableHeader>` + `<TableBody>` + `<TableCell>` + `<TableRow>` + `<TableColumn>` | Data tables |
| `<dialog>` | `<Modal>` + `<ModalContent>` + `<ModalHeader>` + `<ModalBody>` + `<ModalFooter>` | Modals/dialogs |
| Custom tabs | `<Tabs>` + `<Tab>` | Filter tabs, admin nav |
| Custom dropdown | `<Dropdown>` + `<DropdownTrigger>` + `<DropdownMenu>` + `<DropdownItem>` | User menu, actions |
| Custom avatar | `<Avatar>` | User avatars |
| Custom badge | `<Badge>` | Cart count, notifications |
| Custom chip | `<Chip>` | Status badges, category tags |
| Custom switch | `<Switch>` | Availability toggle, active toggle |
| Custom card | `<Card>` + `<CardBody>` + `<CardHeader>` + `<CardFooter>` | Food, restaurant, stat cards |
| Custom toast | `react-hot-toast` | Notifications |
| Custom spinner | `<Spinner>` | Loading states |
| Custom progress | `<Progress>` | Order progress bar |
| Custom divider | `<Divider>` | Section dividers |
| Custom checkbox | `<Checkbox>` | Filters, options |
| Custom radio | `<RadioGroup>` + `<Radio>` | Payment method selection |
| Custom popover | `<Popover>` + `<PopoverTrigger>` + `<PopoverContent>` | Tooltips, quick actions |
| Custom accordion | `<Accordion>` + `<AccordionItem>` | Admin forms, FAQ |
| Custom navbar | `<Navbar>` + `<NavbarBrand>` + `<NavbarContent>` + `<NavbarItem>` | Header navigation |
| Custom pagination | `<Pagination>` | Table pagination |

### 10.2 HeroUI Theme Customization

```typescript
// providers.tsx or layout.tsx
import { HeroUIProvider } from "@heroui/react";

function Providers({ children }) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}

// Theme colors are inherited from Tailwind config
// Primary color maps to orange-500 (#f97316)
```

---

## 11. Agentic Prompt for Design Implementation

```
You are implementing the DESIGN SYSTEM for NaijaBites, a Nigerian food ordering web application using HeroUI v2 and Tailwind CSS 4.

## Tailwind Configuration
1. Extend theme with: brand color (#f97316 orange), naira color (#dc2626 red), cart colors (gray-800/700)
2. Custom fonts: Poppins (body), Josefin Sans (headings), Dancing Script (decorative)
3. Custom animations: float, slide-in-right, fade-in
4. Custom container padding (responsive)
5. Integrate HeroUI v2 plugin

## HeroUI v2 Setup
1. Install @heroui/react
2. Wrap app in HeroUIProvider in root layout
3. Configure HeroUI theme to use orange as primary color
4. All components use HeroUI equivalents (Button, Input, Select, Table, Modal, etc.)

## CSS Custom Styles (globals.css)
1. Custom scrollbar styles (dark theme for cart, light for general)
2. Hidden scrollbar for horizontal scroll areas
3. Custom input focus styles
4. Naira symbol styling
5. Gradient button styles
6. Glassmorphism header backdrop

## Component Design Patterns
1. Food cards: White bg, rounded-xl, shadow-sm, hover:shadow-md, overflow-hidden image
2. Restaurant cards: Similar to food but taller image (h-52)
3. Cart panel: Slide-in from right, dark theme body (gray-900), light header (white)
4. Cart items: Dark rows (gray-700), circular food images, +/- controls
5. Status badges: Color-coded pills with consistent padding
6. Buttons: Orange gradient CTAs, white secondary, red danger, circular icon buttons
7. Forms: HeroUI Input with orange focus ring, Nigerian phone prefix
8. Admin sidebar: Orange-600 bg, white text, hover:orange-700

## Nigerian Design Context
1. Naira (₦) currency always in red-600
2. Orange brand color representing Nigerian warmth/vibrancy
3. Nigerian food images and names
4. Nigerian cities/states in dropdowns
5. Mobile-friendly for Nigerian mobile-first users

## Animation Patterns (Framer Motion)
1. Section transitions: fade + slide (0.3s)
2. Cart panel: slide from right (0.3s)
3. Food card: hover scale (1.02), tap wiggle
4. Hero: floating animation (3s loop)
5. Grid: staggered children (0.05s delay each)
6. Modal: fade + scale (0.2s)
7. Cart badge: bounce on update

## Responsive Requirements
1. Mobile-first approach
2. 1-col → 2-col → 3-col → 4-col grids
3. Full-width cart on mobile, 400px on desktop
4. Hamburger menu on mobile
5. 44px minimum touch targets
6. Responsive font sizes
7. Sticky footer on all pages
```
