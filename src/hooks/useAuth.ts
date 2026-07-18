'use client';

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isAdmin: session?.user?.role === "ADMIN",
    isCustomer: session?.user?.role === "CUSTOMER",
    isRestaurantOwner: session?.user?.role === "RESTAURANT_OWNER",
    ownedRestaurantIds: (session?.user as any)?.ownedRestaurantIds ?? [],
  };
}
