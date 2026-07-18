import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

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

export interface RestaurantCartGroup {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  incrementQuantity: (foodId: string) => void;
  decrementQuantity: (foodId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  // Multi-restaurant methods
  getGroupedByRestaurant: () => RestaurantCartGroup[];
  getRestaurantCount: () => number;
  getPerRestaurantSubtotal: (restaurantId: string) => number;
  getPerRestaurantDeliveryFee: (restaurantId: string) => number;
}

// Delivery fee: ₦500 per restaurant if subtotal < ₦5000, free if >= ₦5000
const DELIVERY_FEE = 500;
const FREE_DELIVERY_THRESHOLD = 5000;

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
        const existing = items.find(item => item.foodId === newItem.foodId);
        
        if (existing) {
          set({
            items: items.map(item =>
              item.foodId === newItem.foodId
                ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                : item
            ),
          });
          toast.success(`${newItem.foodName} quantity updated`);
        } else {
          set({ items: [...items, { ...newItem, quantity: newItem.quantity || 1 }] });
          toast.success(`${newItem.foodName} added to cart`);
        }
      },
      
      removeItem: (foodId) => {
        const items = get().items;
        const item = items.find(i => i.foodId === foodId);
        set({ items: items.filter(i => i.foodId !== foodId) });
        if (item) toast.success(`${item.foodName} removed from cart`);
      },
      
      updateQuantity: (foodId, quantity) => {
        if (quantity < 1) { get().removeItem(foodId); return; }
        if (quantity > 99) return;
        set({ items: get().items.map(item => item.foodId === foodId ? { ...item, quantity } : item) });
      },
      
      incrementQuantity: (foodId) => {
        const item = get().items.find(i => i.foodId === foodId);
        if (item && item.quantity < 99) get().updateQuantity(foodId, item.quantity + 1);
      },
      
      decrementQuantity: (foodId) => {
        const item = get().items.find(i => i.foodId === foodId);
        if (item && item.quantity > 1) get().updateQuantity(foodId, item.quantity - 1);
      },
      
      clearCart: () => { set({ items: [] }); toast.success('Cart cleared'); },
      
      // Total subtotal across all restaurants
      getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      
      // Delivery fee: sum of per-restaurant delivery fees
      getDeliveryFee: () => {
        const groups = get().getGroupedByRestaurant();
        return groups.reduce((sum, group) => sum + group.deliveryFee, 0);
      },
      
      // Grand total
      getTotal: () => get().getSubtotal() + get().getDeliveryFee(),
      
      // Total item count across all restaurants
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      
      // Group items by restaurant with calculated subtotals and delivery fees
      getGroupedByRestaurant: () => {
        const items = get().items;
        const groupMap = new Map<string, RestaurantCartGroup>();
        
        for (const item of items) {
          const existing = groupMap.get(item.restaurantId);
          const itemTotal = item.price * item.quantity;
          
          if (existing) {
            existing.items.push(item);
            existing.subtotal += itemTotal;
          } else {
            groupMap.set(item.restaurantId, {
              restaurantId: item.restaurantId,
              restaurantName: item.restaurantName,
              items: [item],
              subtotal: itemTotal,
              deliveryFee: 0, // calculated below
            });
          }
        }
        
        // Calculate delivery fee per restaurant
        const groups = Array.from(groupMap.values());
        for (const group of groups) {
          group.deliveryFee = group.subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
        }
        
        return groups;
      },
      
      // How many restaurants in cart
      getRestaurantCount: () => {
        const ids = new Set(get().items.map(item => item.restaurantId));
        return ids.size;
      },
      
      // Per-restaurant subtotal
      getPerRestaurantSubtotal: (restaurantId: string) => {
        return get().items
          .filter(item => item.restaurantId === restaurantId)
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      
      // Per-restaurant delivery fee
      getPerRestaurantDeliveryFee: (restaurantId: string) => {
        const subtotal = get().getPerRestaurantSubtotal(restaurantId);
        return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      },
    }),
    { name: 'naijabites-cart', partialize: (state) => ({ items: state.items }) }
  )
);
