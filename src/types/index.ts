// ─── Role & Status Literal Unions ────────────────────────
export type Role = 'CUSTOMER' | 'ADMIN' | 'RESTAURANT_OWNER';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'PAYSTACK' | 'COD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// ─── Database Model Interfaces ───────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  avatar: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  ownedRestaurants?: Restaurant[];
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  openTime: string | null;
  closeTime: string | null;
  openDays: string | null;
  image: string | null;
  isActive: boolean;
  isAcceptingOrders: boolean;
  categoryId: string;
  ownerId: string | null;
  commissionRate: number;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  foods?: Food[];
  owner?: User;
  subOrders?: SubOrder[];
}

export interface Food {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isAvailable: boolean;
  categoryId: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  restaurant?: Restaurant;
}

// ─── Parent Order (Customer's overall order) ────────────
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paystackRef: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  customerPhone: string | null;
  customerName: string | null;
  deliveryInstructions: string | null;
  remark: string | null;
  cancelReason: string | null;
  refundNote: string | null;
  cancelledAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  subOrders?: SubOrder[];
  statusHistory?: OrderStatusHistory[];
}

// ─── SubOrder (Per-restaurant fulfillment order) ────────
export interface SubOrder {
  id: string;
  subOrderNumber: string;
  orderId: string;
  restaurantId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  commissionRate: number;
  commissionAmount: number;
  restaurantEarnings: number;
  estimatedPrepTime: number | null;
  preparedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  restaurant?: Restaurant;
  items?: OrderItem[];
  statusHistory?: SubOrderStatusHistory[];
}

export interface OrderItem {
  id: string;
  subOrderId: string;
  foodId: string;
  foodName: string;
  foodImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  food?: Food;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  remark: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface SubOrderStatusHistory {
  id: string;
  subOrderId: string;
  status: OrderStatus;
  remark: string | null;
  changedBy: string | null;
  changedByRole: string | null; // CUSTOMER | RESTAURANT_OWNER | ADMIN | SYSTEM
  createdAt: string;
}

// ─── Cart ────────────────────────────────────────────────
export interface CartItem {
  foodId: string;
  foodName: string;
  foodImage: string | null;
  price: number;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  categoryId: string;
}

// ─── Cart grouped by restaurant ─────────────────────────
export interface RestaurantCartGroup {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
}

// ─── Navigation ──────────────────────────────────────────
export type NavigationSection = 'home' | 'restaurants' | 'menu' | 'orders' | 'profile' | 'admin' | 'restaurant-owner';

export type AdminSection = 'dashboard' | 'restaurants' | 'categories' | 'foods' | 'orders' | 'customers' | 'earnings' | 'owners';

export type RestaurantOwnerSection = 'dashboard' | 'orders' | 'menu' | 'earnings' | 'settings';

// ─── Dashboard Stats ─────────────────────────────────────
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalRestaurants: number;
  totalFoods: number;
  totalCategories: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  platformCommission: number;
  pendingSubOrders: number;
}

export interface EarningsData {
  date: string;
  revenue: number;
  orders: number;
}

// ─── Restaurant Owner Dashboard Stats ────────────────────
export interface RestaurantOwnerDashboardStats {
  newOrders: number;
  activeOrders: number;
  completedToday: number;
  todayEarnings: number;
  totalEarnings: number;
  totalOrders: number;
  pendingCount: number;
  restaurantName: string;
  restaurantId: string;
  isAcceptingOrders: boolean;
}

export interface RestaurantEarningsData {
  date: string;
  revenue: number;
  commission: number;
  netEarnings: number;
  orders: number;
}
