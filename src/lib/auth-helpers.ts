import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireAdmin() {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  if (session!.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireOwnerOrAdmin(userId: string) {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  if (session!.user.role !== "ADMIN" && session!.user.id !== userId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

// NEW: Require restaurant owner (or admin — admin can do everything)
export async function requireRestaurantOwner() {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null, restaurantIds: [] as string[] };
  
  const role = session!.user.role;
  if (role !== "RESTAURANT_OWNER" && role !== "ADMIN") {
    return { 
      error: NextResponse.json({ error: "Forbidden — Restaurant Owner access required" }, { status: 403 }), 
      session: null, 
      restaurantIds: [] as string[] 
    };
  }

  // Get the restaurant IDs this user owns
  let restaurantIds: string[] = [];
  if (role === "RESTAURANT_OWNER") {
    const restaurants = await db.restaurant.findMany({
      where: { ownerId: session!.user.id },
      select: { id: true },
    });
    restaurantIds = restaurants.map(r => r.id);
  }
  // Admin gets empty array — they can access all restaurants
  
  return { error: null, session, restaurantIds };
}

// NEW: Verify that the current user owns a specific restaurant
export async function requireRestaurantOwnership(restaurantId: string) {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null, restaurant: null };
  
  // Admin has access to everything
  if (session!.user.role === "ADMIN") {
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      return { error: NextResponse.json({ error: "Restaurant not found" }, { status: 404 }), session: null, restaurant: null };
    }
    return { error: null, session, restaurant };
  }
  
  // Restaurant owner can only access their own
  if (session!.user.role !== "RESTAURANT_OWNER") {
    return { 
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), 
      session: null, 
      restaurant: null 
    };
  }
  
  const restaurant = await db.restaurant.findFirst({
    where: { id: restaurantId, ownerId: session!.user.id },
  });
  
  if (!restaurant) {
    return { 
      error: NextResponse.json({ error: "Not your restaurant" }, { status: 403 }), 
      session: null, 
      restaurant: null 
    };
  }
  
  return { error: null, session, restaurant };
}
