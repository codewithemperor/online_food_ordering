import { create } from 'zustand';

interface VendorStore {
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (id: string | null) => void;
}

export const useVendorStore = create<VendorStore>((set) => ({
  selectedRestaurantId: null,
  setSelectedRestaurantId: (id) => set({ selectedRestaurantId: id }),
}));
