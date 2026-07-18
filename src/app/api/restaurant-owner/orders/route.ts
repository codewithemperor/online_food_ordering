import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRestaurantOwner } from '@/lib/auth-helpers';

// Valid sub-order status transitions for RESTAURANT_OWNER
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

// Derive parent order status from sub-orders
function deriveParentStatus(subOrders: { status: string }[]): string {
  const statuses = subOrders.map(s => s.status);
  if (statuses.every(s => s === 'CANCELLED')) return 'CANCELLED';
  if (statuses.every(s => s === 'DELIVERED')) return 'DELIVERED';
  const active = statuses.filter(s => s !== 'CANCELLED');
  if (active.length === 0) return 'CANCELLED';
  const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED'];
  const minIndex = Math.min(...active.map(s => statusOrder.indexOf(s)));
  return statusOrder[minIndex];
}

// GET — List sub-orders for restaurant owner
export async function GET(request: NextRequest) {
  try {
    const { error, session, restaurantIds } = await requireRestaurantOwner();
    if (error) return error;

    // @ts-expect-error - role is added by our custom session
    const role = session!.user.role;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const queryRestaurantId = searchParams.get('restaurantId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

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

    const where: Record<string, unknown> = {
      restaurantId: { in: targetRestaurantIds },
    };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * pageSize;
    const [subOrders, total] = await Promise.all([
      db.subOrder.findMany({
        where,
        include: {
          items: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerPhone: true,
              deliveryAddress: true,
              paymentMethod: true,
              paymentStatus: true,
            },
          },
          restaurant: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.subOrder.count({ where }),
    ]);

    return NextResponse.json({
      data: subOrders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Restaurant owner orders GET error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// PUT — Update sub-order status
export async function PUT(request: NextRequest) {
  try {
    const { error, session, restaurantIds } = await requireRestaurantOwner();
    if (error) return error;

    // @ts-expect-error - role is added by our custom session
    const role = session!.user.role;
    // @ts-expect-error - id is on session user
    const userId = session!.user.id;

    const body = await request.json();
    const { subOrderId, status, estimatedPrepTime, cancelReason } = body;

    if (!subOrderId || !status) {
      return NextResponse.json(
        { error: 'subOrderId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Find the sub-order
    const subOrder = await db.subOrder.findUnique({
      where: { id: subOrderId },
      include: { order: { include: { subOrders: true } } },
    });

    if (!subOrder) {
      return NextResponse.json({ error: 'Sub-order not found' }, { status: 404 });
    }

    // Ownership check for RESTAURANT_OWNER
    if (role !== 'ADMIN' && !restaurantIds.includes(subOrder.restaurantId)) {
      return NextResponse.json({ error: 'Not your restaurant' }, { status: 403 });
    }

    // Validate transition
    if (role === 'ADMIN') {
      // ADMIN can do any transition
      // Still check that we're not transitioning from a terminal state to another state
      if ((subOrder.status === 'DELIVERED' || subOrder.status === 'CANCELLED') && status !== subOrder.status) {
        return NextResponse.json(
          { error: `Cannot transition from ${subOrder.status} to ${status}` },
          { status: 400 }
        );
      }
    } else {
      // RESTAURANT_OWNER — must follow valid transitions
      const allowedTransitions = VALID_TRANSITIONS[subOrder.status] || [];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${subOrder.status} to ${status}. Allowed: ${allowedTransitions.join(', ') || 'none'}` },
          { status: 400 }
        );
      }
    }

    // Additional requirements
    if (status === 'CANCELLED' && !cancelReason) {
      return NextResponse.json(
        { error: 'cancelReason is required when cancelling an order' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = { status };

    if (status === 'CONFIRMED' && estimatedPrepTime !== undefined) {
      updateData.estimatedPrepTime = estimatedPrepTime;
    }

    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = cancelReason;
    }

    if (status === 'READY') {
      updateData.readyAt = new Date();
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    // Update sub-order
    const updatedSubOrder = await db.subOrder.update({
      where: { id: subOrderId },
      data: updateData,
    });

    // Create SubOrderStatusHistory entry
    await db.subOrderStatusHistory.create({
      data: {
        subOrderId,
        status,
        remark: status === 'CANCELLED' ? cancelReason : `Status changed to ${status}`,
        changedBy: userId,
        changedByRole: role,
      },
    });

    // Handle COD payment on DELIVERED
    if (status === 'DELIVERED' && subOrder.order.paymentMethod === 'COD') {
      // Check if all sub-orders of this parent are now DELIVERED
      const allSubOrders = subOrder.order.subOrders.map(so => {
        if (so.id === subOrderId) return { ...so, status: 'DELIVERED' };
        return so;
      });

      const allDelivered = allSubOrders.every(so => so.status === 'DELIVERED');
      if (allDelivered) {
        await db.order.update({
          where: { id: subOrder.orderId },
          data: { paymentStatus: 'PAID' },
        });
      }
    }

    // Recalculate parent order status
    const refreshedSubOrders = await db.subOrder.findMany({
      where: { orderId: subOrder.orderId },
      select: { status: true },
    });

    const newParentStatus = deriveParentStatus(refreshedSubOrders);
    const currentParentStatus = subOrder.order.status;

    if (newParentStatus !== currentParentStatus) {
      const parentUpdateData: Record<string, unknown> = { status: newParentStatus };

      if (newParentStatus === 'CANCELLED') {
        parentUpdateData.cancelledAt = new Date();
        // If all sub-orders cancelled, set cancel reason from parent
        if (!subOrder.order.cancelReason) {
          parentUpdateData.cancelReason = 'All sub-orders cancelled';
        }
      }

      if (newParentStatus === 'DELIVERED') {
        parentUpdateData.deliveredAt = new Date();
      }

      await db.order.update({
        where: { id: subOrder.orderId },
        data: parentUpdateData,
      });

      // Create OrderStatusHistory for parent order
      await db.orderStatusHistory.create({
        data: {
          orderId: subOrder.orderId,
          status: newParentStatus,
          remark: `Auto-derived from sub-order status update`,
          changedBy: userId,
        },
      });
    }

    return NextResponse.json({
      data: updatedSubOrder,
      message: `Sub-order status updated to ${status}`,
    });
  } catch (error) {
    console.error('Restaurant owner orders PUT error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
