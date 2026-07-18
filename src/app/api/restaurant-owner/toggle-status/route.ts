import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRestaurantOwnership } from '@/lib/auth-helpers';

// POST — Toggle restaurant isAcceptingOrders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    // Ownership check (admin can toggle any, owner can only toggle their own)
    const { error: ownershipError, restaurant } = await requireRestaurantOwnership(restaurantId);
    if (ownershipError) return ownershipError;

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Toggle the isAcceptingOrders flag
    const updated = await db.restaurant.update({
      where: { id: restaurantId },
      data: { isAcceptingOrders: !restaurant.isAcceptingOrders },
      select: {
        id: true,
        name: true,
        isAcceptingOrders: true,
      },
    });

    return NextResponse.json({
      data: updated,
      message: updated.isAcceptingOrders
        ? `${updated.name} is now accepting orders`
        : `${updated.name} is now paused for new orders`,
    });
  } catch (error) {
    console.error('Toggle restaurant status error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
