import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRestaurantOwner } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { error, session, restaurantIds } = await requireRestaurantOwner();
    if (error) return error;

    // @ts-expect-error - role is added by our custom session
    const role = session!.user.role;
    const { searchParams } = new URL(request.url);
    const queryRestaurantId = searchParams.get('restaurantId');

    // Determine which restaurant IDs to query
    let targetRestaurantIds: string[];

    if (role === 'ADMIN') {
      if (queryRestaurantId) {
        // Admin querying a specific restaurant
        const restaurant = await db.restaurant.findUnique({
          where: { id: queryRestaurantId },
        });
        if (!restaurant) {
          return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
        }
        targetRestaurantIds = [queryRestaurantId];
      } else {
        // Admin sees all restaurants
        const allRestaurants = await db.restaurant.findMany({ select: { id: true } });
        targetRestaurantIds = allRestaurants.map(r => r.id);
      }
    } else {
      // RESTAURANT_OWNER — only their restaurants
      targetRestaurantIds = restaurantIds;
      if (targetRestaurantIds.length === 0) {
        return NextResponse.json({ error: 'No restaurants found for this owner' }, { status: 404 });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      newOrders,
      activeOrders,
      completedToday,
      todayEarningsResult,
      totalEarningsResult,
      totalOrders,
      restaurants,
    ] = await Promise.all([
      // New (PENDING) sub-orders
      db.subOrder.count({
        where: {
          restaurantId: { in: targetRestaurantIds },
          status: 'PENDING',
        },
      }),
      // Active (CONFIRMED/PREPARING/READY/ON_THE_WAY) sub-orders
      db.subOrder.count({
        where: {
          restaurantId: { in: targetRestaurantIds },
          status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY'] },
        },
      }),
      // Completed today (DELIVERED) sub-orders
      db.subOrder.count({
        where: {
          restaurantId: { in: targetRestaurantIds },
          status: 'DELIVERED',
          deliveredAt: { gte: today },
        },
      }),
      // Today's earnings (sum of restaurantEarnings from DELIVERED sub-orders today)
      db.subOrder.aggregate({
        _sum: { restaurantEarnings: true },
        where: {
          restaurantId: { in: targetRestaurantIds },
          status: 'DELIVERED',
          deliveredAt: { gte: today },
        },
      }),
      // Total earnings
      db.subOrder.aggregate({
        _sum: { restaurantEarnings: true },
        where: {
          restaurantId: { in: targetRestaurantIds },
          status: 'DELIVERED',
        },
      }),
      // Total orders (all sub-orders)
      db.subOrder.count({
        where: {
          restaurantId: { in: targetRestaurantIds },
        },
      }),
      // Restaurant info
      db.restaurant.findMany({
        where: { id: { in: targetRestaurantIds } },
        select: {
          id: true,
          name: true,
          isAcceptingOrders: true,
          image: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        newOrders,
        activeOrders,
        completedToday,
        todayEarnings: todayEarningsResult._sum.restaurantEarnings || 0,
        totalEarnings: totalEarningsResult._sum.restaurantEarnings || 0,
        totalOrders,
        restaurants,
      },
    });
  } catch (error) {
    console.error('Restaurant owner dashboard error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
