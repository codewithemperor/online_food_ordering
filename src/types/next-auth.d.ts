import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string; // CUSTOMER | ADMIN | RESTAURANT_OWNER
      image?: string | null;
      ownedRestaurantIds?: string[];
    };
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    ownedRestaurantIds?: string[];
  }
}
