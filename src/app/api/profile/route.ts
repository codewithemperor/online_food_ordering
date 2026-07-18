import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    // @ts-expect-error - id is on session user
    const userId = session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    // @ts-expect-error - id is on session user
    const userId = session.user.id;

    const body = await request.json();
    const { name, phone, address, city, state, avatar } = body;

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        avatar: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
