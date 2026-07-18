import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const restaurantId = searchParams.get('restaurantId');
    const search = searchParams.get('search');
    const isAvailable = searchParams.get('isAvailable');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const limit = searchParams.get('limit');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = limit ? parseInt(limit) : parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};

    if (categoryId) where.categoryId = categoryId;
    if (restaurantId) where.restaurantId = restaurantId;
    if (isAvailable !== null && isAvailable !== undefined && isAvailable !== '')
      where.isAvailable = isAvailable === 'true';
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      where.price = priceFilter;
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
          category: { select: { id: true, name: true, image: true } },
          restaurant: { select: { id: true, name: true, city: true } },
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
    console.error('Get foods error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

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
    console.error('Create food error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { id, name, description, categoryId, restaurantId, price, image, isAvailable } = body;

    if (!id) {
      return NextResponse.json({ error: 'Food ID is required' }, { status: 400 });
    }

    const existing = await db.food.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
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
    console.error('Update food error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Food ID is required' }, { status: 400 });
    }

    const existing = await db.food.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    if (existing._count.orderItems > 0) {
      // Soft delete: mark as unavailable instead of hard delete
      await db.food.update({
        where: { id },
        data: { isAvailable: false },
      });
      return NextResponse.json({
        message: 'Food has order history — marked as unavailable instead of deleting',
      });
    }

    await db.food.delete({ where: { id } });

    return NextResponse.json({ message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Delete food error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
