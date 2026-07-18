import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth-helpers';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    // @ts-expect-error - role is added by our custom session
    const isAdmin = session.user.role === 'admin';
    // @ts-expect-error - id is on session user
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Single order lookup
    if (id) {
      const order = await db.order.findUnique({
        where: { id },
        include: {
          subOrders: {
            include: {
              items: true,
              statusHistory: { orderBy: { createdAt: 'desc' } },
              restaurant: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          statusHistory: { orderBy: { createdAt: 'desc' } },
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Non-admin users can only see their own orders
      if (!isAdmin && order.userId !== userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({ data: order });
    }

    const where: Record<string, unknown> = {};

    // Non-admin: only their orders
    if (!isAdmin) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          subOrders: {
            include: {
              items: true,
              statusHistory: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
              restaurant: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    // @ts-expect-error - id is on session user
    const userId = session.user.id;

    const body = await request.json();
    const {
      items,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      customerPhone,
      customerName,
      deliveryInstructions,
      paymentMethod,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (!item.foodId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each item must have a foodId and a valid quantity' },
          { status: 400 }
        );
      }
    }

    // SERVER-SIDE PRICE VERIFICATION: look up each food's current price
    const foodIds = items.map((item: { foodId: string }) => item.foodId);
    const foods = await db.food.findMany({
      where: { id: { in: foodIds } },
      include: { restaurant: true },
    });

    // Verify all foods exist and are available
    const foodMap = new Map(foods.map((f) => [f.id, f]));
    for (const item of items) {
      const food = foodMap.get(item.foodId);
      if (!food) {
        return NextResponse.json(
          { error: `Food item ${item.foodId} not found` },
          { status: 404 }
        );
      }
      if (!food.isAvailable) {
        return NextResponse.json(
          { error: `${food.name} is currently unavailable` },
          { status: 400 }
        );
      }
    }

    // ── GROUP ITEMS BY RESTAURANT ──────────────────────────
    const restaurantGroups = new Map<
      string,
      {
        restaurantId: string;
        restaurant: NonNullable<typeof foods[0]['restaurant']>;
        items: { foodId: string; quantity: number; unitPrice: number; totalPrice: number; foodName: string; foodImage: string | null }[];
        subtotal: number;
      }
    >();

    for (const item of items) {
      const food = foodMap.get(item.foodId)!;
      const restaurantId = food.restaurantId;
      const unitPrice = food.price;
      const totalPrice = unitPrice * item.quantity;

      if (!restaurantGroups.has(restaurantId)) {
        restaurantGroups.set(restaurantId, {
          restaurantId,
          restaurant: food.restaurant!,
          items: [],
          subtotal: 0,
        });
      }

      const group = restaurantGroups.get(restaurantId)!;
      group.items.push({
        foodId: food.id,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        foodName: food.name,
        foodImage: food.image,
      });
      group.subtotal += totalPrice;
    }

    // ── CALCULATE PER-RESTAURANT FEES ──────────────────────
    const subOrderDataList: {
      restaurantId: string;
      subOrderNumber: string;
      subtotal: number;
      deliveryFee: number;
      commissionRate: number;
      commissionAmount: number;
      restaurantEarnings: number;
      items: { foodId: string; quantity: number; unitPrice: number; totalPrice: number; foodName: string; foodImage: string | null }[];
    }[] = [];

    const restaurantEntries = Array.from(restaurantGroups.values());
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < restaurantEntries.length; i++) {
      const group = restaurantEntries[i];
      const subDeliveryFee = group.subtotal >= 5000 ? 0 : 500;
      const commissionRate = group.restaurant.commissionRate ?? 10;
      const commissionAmount = Math.round(group.subtotal * commissionRate) / 100;
      const restaurantEarnings = Math.round((group.subtotal - commissionAmount) * 100) / 100;

      // Sub-order number will be set after we know the order count
      subOrderDataList.push({
        restaurantId: group.restaurantId,
        subOrderNumber: '', // placeholder, filled below
        subtotal: group.subtotal,
        deliveryFee: subDeliveryFee,
        commissionRate,
        commissionAmount,
        restaurantEarnings,
        items: group.items,
      });
    }

    // ── CALCULATE PARENT ORDER TOTALS ──────────────────────
    const parentSubtotal = subOrderDataList.reduce((sum, s) => sum + s.subtotal, 0);
    const parentDeliveryFee = subOrderDataList.reduce((sum, s) => sum + s.deliveryFee, 0);
    const parentTotalAmount = parentSubtotal + parentDeliveryFee;

    // ── GENERATE ORDER NUMBER ──────────────────────────────
    const orderCount = await db.order.count();
    const orderNumber = `NB-${String(orderCount + 1).padStart(6, '0')}-${Date.now().toString(36).toUpperCase()}`;

    // Assign sub-order numbers
    for (let i = 0; i < subOrderDataList.length; i++) {
      const letter = letters[i] || String(i + 1);
      subOrderDataList[i].subOrderNumber = `NB-SUB-${orderCount + 1}-${letter}`;
    }

    // ── CREATE PARENT ORDER WITH SUB-ORDERS IN A TRANSACTION ─
    const order = await db.order.create({
      data: {
        orderNumber,
        userId,
        subtotal: parentSubtotal,
        deliveryFee: parentDeliveryFee,
        totalAmount: parentTotalAmount,
        deliveryAddress,
        deliveryCity: deliveryCity || null,
        deliveryState: deliveryState || null,
        customerPhone: customerPhone || null,
        customerName: customerName || null,
        deliveryInstructions: deliveryInstructions || null,
        paymentMethod: paymentMethod || 'COD',
        statusHistory: {
          create: {
            status: 'PENDING',
            remark: 'Order placed',
          },
        },
        subOrders: {
          create: subOrderDataList.map((subData) => ({
            subOrderNumber: subData.subOrderNumber,
            restaurantId: subData.restaurantId,
            subtotal: subData.subtotal,
            deliveryFee: subData.deliveryFee,
            commissionRate: subData.commissionRate,
            commissionAmount: subData.commissionAmount,
            restaurantEarnings: subData.restaurantEarnings,
            items: {
              create: subData.items.map((item) => ({
                foodId: item.foodId,
                foodName: item.foodName,
                foodImage: item.foodImage,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            },
            statusHistory: {
              create: {
                status: 'PENDING',
                remark: 'Order placed',
                changedByRole: 'SYSTEM',
              },
            },
          })),
        },
      },
      include: {
        subOrders: {
          include: {
            items: true,
            statusHistory: { orderBy: { createdAt: 'desc' } },
            restaurant: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: true,
      },
    });

    return NextResponse.json(
      { data: order, message: 'Order placed successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, remark, cancelReason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { subOrders: true },
    });
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Determine if admin or customer
    const { error: adminError, session: adminSession } = await requireAdmin();

    if (!adminError && adminSession) {
      // ADMIN: should use restaurant-owner orders API for individual sub-order status changes
      // Admin can still cancel the entire parent order here
      if (status === 'CANCELLED') {
        if (!CANCELLABLE_STATUSES.includes(existingOrder.status)) {
          return NextResponse.json(
            { error: `Order cannot be cancelled when status is ${existingOrder.status}` },
            { status: 400 }
          );
        }

        // Cancel the parent order and all its sub-orders
        const updateData: Record<string, unknown> = {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: cancelReason || remark || 'Cancelled by admin',
        };

        if (existingOrder.paymentStatus === 'PAID') {
          updateData.refundNote = 'Refund required — order was paid before cancellation';
        }

        const order = await db.order.update({
          where: { id },
          data: updateData,
        });

        // Cancel all sub-orders that are still cancellable
        const cancellableSubOrders = existingOrder.subOrders.filter(
          (so) => CANCELLABLE_STATUSES.includes(so.status)
        );

        for (const subOrder of cancellableSubOrders) {
          await db.subOrder.update({
            where: { id: subOrder.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancelReason: cancelReason || remark || 'Cancelled by admin — parent order cancelled',
            },
          });

          await db.subOrderStatusHistory.create({
            data: {
              subOrderId: subOrder.id,
              status: 'CANCELLED',
              remark: cancelReason || remark || 'Cancelled by admin — parent order cancelled',
              changedBy: adminSession.user.id,
              changedByRole: 'ADMIN',
            },
          });
        }

        await db.orderStatusHistory.create({
          data: {
            orderId: id,
            status: 'CANCELLED',
            remark: cancelReason || remark || 'Cancelled by admin',
            changedBy: 'admin',
          },
        });

        return NextResponse.json({
          data: order,
          message: 'Order and all sub-orders cancelled successfully',
        });
      }

      // For other status changes, admin should use the restaurant-owner orders API
      if (status && status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Use the restaurant-owner orders API to update individual sub-order statuses' },
          { status: 400 }
        );
      }

      // Admin updating other fields (remark)
      if (remark !== undefined) {
        await db.order.update({
          where: { id },
          data: { remark },
        });
        return NextResponse.json({ message: 'Order updated successfully' });
      }

      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    // CUSTOMER: can only cancel
    const { error: authError, session: authSession } = await requireAuth();
    if (authError) return authError;

    // @ts-expect-error - id is on session user
    const userId = authSession!.user.id;

    if (existingOrder.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (status === 'CANCELLED') {
      if (!CANCELLABLE_STATUSES.includes(existingOrder.status)) {
        return NextResponse.json(
          { error: `Order cannot be cancelled when status is ${existingOrder.status}` },
          { status: 400 }
        );
      }

      // Cancel the parent order
      const updateData: Record<string, unknown> = {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: cancelReason || 'Cancelled by customer',
      };

      if (existingOrder.paymentStatus === 'PAID') {
        updateData.refundNote = 'Refund required — order was paid before cancellation';
      }

      const order = await db.order.update({
        where: { id },
        data: updateData,
      });

      // Cancel all sub-orders that are still cancellable
      const cancellableSubOrders = existingOrder.subOrders.filter(
        (so) => CANCELLABLE_STATUSES.includes(so.status)
      );

      for (const subOrder of cancellableSubOrders) {
        await db.subOrder.update({
          where: { id: subOrder.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: cancelReason || 'Cancelled by customer — parent order cancelled',
          },
        });

        await db.subOrderStatusHistory.create({
          data: {
            subOrderId: subOrder.id,
            status: 'CANCELLED',
            remark: cancelReason || 'Cancelled by customer — parent order cancelled',
            changedBy: userId,
            changedByRole: 'CUSTOMER',
          },
        });
      }

      await db.orderStatusHistory.create({
        data: {
          orderId: id,
          status: 'CANCELLED',
          remark: cancelReason || 'Cancelled by customer',
          changedBy: 'customer',
        },
      });

      return NextResponse.json({
        data: order,
        message: 'Order and all sub-orders cancelled successfully',
      });
    }

    return NextResponse.json(
      { error: 'You can only cancel an order' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update order error:', error);
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
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow deleting cancelled or delivered orders
    if (!['CANCELLED', 'DELIVERED'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Only cancelled or delivered orders can be deleted' },
        { status: 400 }
      );
    }

    await db.order.delete({ where: { id } });

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
