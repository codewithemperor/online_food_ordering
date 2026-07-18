import { create } from 'zustand';

interface UIStore {
  showLogin: boolean;
  showRegister: boolean;
  showFoodDetail: string | null;  // foodId
  setShowLogin: (show: boolean) => void;
  setShowRegister: (show: boolean) => void;
  setShowFoodDetail: (foodId: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  showLogin: false,
  showRegister: false,
  showFoodDetail: null,
  setShowLogin: (show) => set({ showLogin: show, showRegister: false }),
  setShowRegister: (show) => set({ showRegister: show, showLogin: false }),
  setShowFoodDetail: (foodId) => set({ showFoodDetail: foodId }),
}));
