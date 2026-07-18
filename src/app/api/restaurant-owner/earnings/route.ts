import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRestaurantOwner } from '@/lib/auth-helpers';

// GET — Earnings data for restaurant owner
export async function GET(request: NextRequest) {
  try {
    const { error, session, restaurantIds } = await requireRestaurantOwner();
    if (error) return error;

    // @ts-expect-error - role is added by our custom session
    const role = session!.user.role;
    const { searchParams } = new URL(request.url);
    const queryRestaurantId = searchParams.get('restaurantId');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Determine target restaurant IDs
    let targetRestaurantIds: string[];
    if (role === 'ADMIN') {
      if (queryRestaurantId) {
        targetRestaurantIds = [queryRestaurantId];
      } else {
        const allRestaurants = await db.restaurant.findMany({ select: { id: true } });
        targetRestaurantIds = allRestaurants.map(r => r.id);
      }
    } else {
      targetRestaurantIds = restaurantIds;
    }

    // Date range filter
    const dateFilter: Record<string, Date> = {};
    if (fromParam) {
      const fromDate = new Date(fromParam);
      fromDate.setHours(0, 0, 0, 0);
      dateFilter.gte = fromDate;
    }
    if (toParam) {
      const toDate = new Date(toParam);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }

    const deliveredWhere: Record<string, unknown> = {
      restaurantId: { in: targetRestaurantIds },
      status: 'DELIVERED',
    };

    if (fromParam || toParam) {
      deliveredWhere.deliveredAt = dateFilter;
    }

    // Overall earnings aggregates
    const [totalRevenueResult, totalCommissionResult, totalNetEarningsResult] = await Promise.all([
      db.subOrder.aggregate({
        _sum: { subtotal: true },
        where: deliveredWhere,
      }),
      db.subOrder.aggregate({
        _sum: { commissionAmount: true },
        where: deliveredWhere,
      }),
      db.subOrder.aggregate({
        _sum: { restaurantEarnings: true },
        where: deliveredWhere,
      }),
    ]);

    // Per-restaurant breakdown
    const restaurantBreakdown = await db.subOrder.groupBy({
      by: ['restaurantId'],
      where: deliveredWhere,
      _sum: {
        subtotal: true,
        commissionAmount: true,
        restaurantEarnings: true,
      },
      _count: true,
    });

    // Enrich with restaurant info
    const restaurantIdsForBreakdown = restaurantBreakdown.map(r => r.restaurantId);
    const restaurantsInfo = await db.restaurant.findMany({
      where: { id: { in: restaurantIdsForBreakdown } },
      select: { id: true, name: true, commissionRate: true },
    });

    const restaurantMap = new Map(restaurantsInfo.map(r => [r.id, r]));

    const enrichedBreakdown = restaurantBreakdown.map(item => ({
      restaurantId: item.restaurantId,
      restaurant: restaurantMap.get(item.restaurantId) || null,
      totalOrders: item._count,
      totalRevenue: item._sum.subtotal || 0,
      totalCommission: item._sum.commissionAmount || 0,
      netEarnings: item._sum.restaurantEarnings || 0,
    }));

    return NextResponse.json({
      data: {
        totalRevenue: totalRevenueResult._sum.subtotal || 0,
        totalCommission: totalCommissionResult._sum.commissionAmount || 0,
        totalNetEarnings: totalNetEarningsResult._sum.restaurantEarnings || 0,
        dateRange: {
          from: fromParam || null,
          to: toParam || null,
        },
        perRestaurant: enrichedBreakdown,
      },
    });
  } catch (error) {
    console.error('Restaurant owner earnings error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
