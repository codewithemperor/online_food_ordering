import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRestaurantOwner, requireRestaurantOwnership } from '@/lib/auth-helpers';

// GET — List foods for owned restaurants
export async function GET(request: NextRequest) {
  try {
    const { error, session, restaurantIds } = await requireRestaurantOwner();
    if (error) return error;

    // @ts-expect-error - role is added by our custom session
    const role = session!.user.role;
    const { searchParams } = new URL(request.url);
    const queryRestaurantId = searchParams.get('restaurantId');
    const isAvailable = searchParams.get('isAvailable');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let targetRestaurantIds: string[];
    if (role === 'ADMIN') {
      if (queryRestaurantId) {
        targetRestaurantIds = [queryRestaurantId];
      } else {
        // Admin sees all
        const allRestaurants = await db.restaurant.findMany({ select: { id: true } });
        targetRestaurantIds = allRestaurants.map(r => r.id);
      }
    } else {
      targetRestaurantIds = restaurantIds;
    }

    const where: Record<string, unknown> = {
      restaurantId: { in: targetRestaurantIds },
    };

    if (isAvailable !== null && isAvailable !== undefined && isAvailable !== '') {
      where.isAvailable = isAvailable === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [foods, total] = await Promise.all([
      db.food.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          restaurant: { select: { id: true, name: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.food.count({ where }),
    ]);

    return NextResponse.json({
      data: foods,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Restaurant owner foods GET error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// POST — Add food to owned restaurant
export async function POST(request: NextRequest) {
  try {
    const { error, session, restaurantIds } = await requireRestaurantOwner();
    if (error) return error;

    // @ts-expect-error - role is added by our custom session
    const role = session!.user.role;

    const body = await request.json();
    const { name, description, categoryId, restaurantId, price, image, isAvailable } = body;

    if (!name || !categoryId || !restaurantId || price === undefined) {
      return NextResponse.json(
        { error: 'Name, category, restaurant, and price are required' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Ownership check
    if (role !== 'ADMIN') {
      if (!restaurantIds.includes(restaurantId)) {
        return NextResponse.json({ error: 'Not your restaurant' }, { status: 403 });
      }
    }

    // Verify category and restaurant exist
    const [categoryExists, restaurantExists] = await Promise.all([
      db.category.findUnique({ where: { id: categoryId } }),
      db.restaurant.findUnique({ where: { id: restaurantId } }),
    ]);

    if (!categoryExists) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    if (!restaurantExists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const food = await db.food.create({
      data: {
        name,
        description: description || null,
        categoryId,
        restaurantId,
        price,
        image: image || null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      },
      include: {
        category: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { data: food, message: 'Food created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Restaurant owner foods POST error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// PUT — Update food (ownership check)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, categoryId, restaurantId, price, image, isAvailable } = body;

    if (!id) {
      return NextResponse.json({ error: 'Food ID is required' }, { status: 400 });
    }

    const existing = await db.food.findUnique({
      where: { id },
      include: { restaurant: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    // Ownership check
    const { error: ownershipError } = await requireRestaurantOwnership(existing.restaurantId);
    if (ownershipError) return ownershipError;

    // If changing restaurant, verify new restaurant ownership
    if (restaurantId && restaurantId !== existing.restaurantId) {
      const { error: newOwnershipError } = await requireRestaurantOwnership(restaurantId);
      if (newOwnershipError) return newOwnershipError;
    }

    if (categoryId) {
      const categoryExists = await db.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    }

    if (restaurantId) {
      const restaurantExists = await db.restaurant.findUnique({ where: { id: restaurantId } });
      if (!restaurantExists) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }
    }

    if (price !== undefined && price < 0) {
      return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 });
    }

    const food = await db.food.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(categoryId !== undefined && { categoryId }),
        ...(restaurantId !== undefined && { restaurantId }),
        ...(price !== undefined && { price }),
        ...(image !== undefined && { image }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        category: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      data: food,
      message: 'Food updated successfully',
    });
  } catch (error) {
    console.error('Restaurant owner foods PUT error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// DELETE — Delete food (ownership check, only if no active order items)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Food ID is required' }, { status: 400 });
    }

    const existing = await db.food.findUnique({
      where: { id },
      include: {
        restaurant: { select: { id: true } },
        _count: { select: { orderItems: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    // Ownership check
    const { error: ownershipError } = await requireRestaurantOwnership(existing.restaurantId);
    if (ownershipError) return ownershipError;

    // Check for active order items (non-cancelled sub-orders)
    const activeOrderItems = await db.orderItem.count({
      where: {
        foodId: id,
        subOrder: {
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY'] },
        },
      },
    });

    if (activeOrderItems > 0) {
      // Soft delete: mark as unavailable
      await db.food.update({
        where: { id },
        data: { isAvailable: false },
      });
      return NextResponse.json({
        message: 'Food has active orders — marked as unavailable instead of deleting',
      });
    }

    if (existing._count.orderItems > 0) {
      // Has historical order items but none active — soft delete
      await db.food.update({
        where: { id },
        data: { isAvailable: false },
      });
      return NextResponse.json({
        message: 'Food has order history — marked as unavailable instead of deleting',
      });
    }

    // Hard delete — no order items at all
    await db.food.delete({ where: { id } });

    return NextResponse.json({ message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Restaurant owner foods DELETE error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
