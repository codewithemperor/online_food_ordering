import { create } from 'zustand';

export type NavigationSection = 'home' | 'restaurants' | 'menu' | 'orders' | 'profile' | 'admin' | 'restaurant-owner';
export type AdminSection = 'dashboard' | 'restaurants' | 'categories' | 'foods' | 'orders' | 'customers' | 'earnings' | 'owners';
export type RestaurantOwnerSection = 'dashboard' | 'orders' | 'menu' | 'earnings' | 'settings';

interface NavigationFilters {
  restaurantId?: string;
  categoryId?: string;
  search?: string;
}

interface NavigationStore {
  activeSection: NavigationSection;
  adminSection: AdminSection;
  restaurantOwnerSection: RestaurantOwnerSection;
  filters: NavigationFilters;
  setActiveSection: (section: NavigationSection) => void;
  setAdminSection: (section: AdminSection) => void;
  setRestaurantOwnerSection: (section: RestaurantOwnerSection) => void;
  setFilter: (key: string, value: string | undefined) => void;
  clearFilters: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeSection: 'home',
  adminSection: 'dashboard',
  restaurantOwnerSection: 'dashboard',
  filters: {},
  setActiveSection: (section) => set({ activeSection: section }),
  setAdminSection: (section) => set({ adminSection: section }),
  setRestaurantOwnerSection: (section) => set({ restaurantOwnerSection: section }),
  setFilter: (key, value) => set((state) => ({
    filters: value ? { ...state.filters, [key]: value } : (() => {
      const { [key]: _, ...rest } = state.filters;
      return rest;
    })()
  })),
  clearFilters: () => set({ filters: {} }),
}));
