import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};

    if (categoryId) where.categoryId = categoryId;
    if (city) where.city = city;
    if (isActive !== null && isActive !== undefined && isActive !== '')
      where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const restaurants = await db.restaurant.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, image: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { foods: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const {
      name,
      categoryId,
      email,
      phone,
      address,
      city,
      state,
      openTime,
      closeTime,
      openDays,
      image,
      isActive,
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const categoryExists = await db.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const restaurant = await db.restaurant.create({
      data: {
        name,
        categoryId,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        openTime: openTime || null,
        closeTime: closeTime || null,
        openDays: openDays || null,
        image: image || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { data: restaurant, message: 'Restaurant created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create restaurant error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const {
      id,
      name,
      categoryId,
      email,
      phone,
      address,
      city,
      state,
      openTime,
      closeTime,
      openDays,
      image,
      isActive,
      description,
      ownerId,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.restaurant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (categoryId) {
      const categoryExists = await db.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
    }

    const restaurant = await db.restaurant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(categoryId !== undefined && { categoryId }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(openTime !== undefined && { openTime }),
        ...(closeTime !== undefined && { closeTime }),
        ...(openDays !== undefined && { openDays }),
        ...(image !== undefined && { image }),
        ...(isActive !== undefined && { isActive }),
        ...(description !== undefined && { description }),
        ...(ownerId !== undefined && { ownerId }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      data: restaurant,
      message: 'Restaurant updated successfully',
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
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
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.restaurant.findUnique({
      where: { id },
      include: { _count: { select: { foods: true, subOrders: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (existing._count.subOrders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete restaurant with associated orders' },
        { status: 400 }
      );
    }

    await db.restaurant.delete({ where: { id } });

    return NextResponse.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
