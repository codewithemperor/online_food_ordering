import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Find order by reference
    const order = await db.order.findFirst({
      where: { paystackRef: reference },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found for this reference' },
        { status: 404 }
      );
    }

    // If Paystack key is configured, verify with Paystack API
    if (PAYSTACK_SECRET_KEY) {
      try {
        const response = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        const data = await response.json();

        if (!data.status) {
          return NextResponse.json(
            { error: data.message || 'Verification failed' },
            { status: 400 }
          );
        }

        const paymentStatus = data.data.status;

        if (paymentStatus === 'success') {
          // Update order payment status
          const updatedStatus = order.status === 'PENDING' ? 'CONFIRMED' : order.status;
          await db.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              status: updatedStatus,
            },
          });

          // Also update all sub-orders to CONFIRMED if they're still PENDING
          await db.subOrder.updateMany({
            where: { orderId: order.id, status: 'PENDING' },
            data: { status: 'CONFIRMED' },
          });

          // Create status history for parent order
          await db.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: updatedStatus,
              remark: 'Payment confirmed via Paystack',
              changedBy: 'system',
            },
          });

          // Create status history for each sub-order
          const subOrders = await db.subOrder.findMany({
            where: { orderId: order.id },
            select: { id: true },
          });
          for (const so of subOrders) {
            await db.subOrderStatusHistory.create({
              data: {
                subOrderId: so.id,
                status: 'CONFIRMED',
                remark: 'Payment confirmed via Paystack — order confirmed automatically',
                changedByRole: 'SYSTEM',
              },
            });
          }

          return NextResponse.json({
            data: {
              status: 'success',
              reference,
              amount: data.data.amount / 100,
              orderId: order.id,
            },
          });
        } else if (paymentStatus === 'failed') {
          await db.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'FAILED' },
          });

          return NextResponse.json({
            data: {
              status: 'failed',
              reference,
              orderId: order.id,
            },
          });
        } else {
          return NextResponse.json({
            data: {
              status: 'pending',
              reference,
              orderId: order.id,
            },
          });
        }
      } catch (err) {
        console.error('Paystack verify API error:', err);
        return NextResponse.json(
          { error: 'Payment verification service unavailable' },
          { status: 503 }
        );
      }
    }

    // Mock/placeholder: when Paystack is not configured
    // Mark as paid for testing purposes
    const mockUpdatedStatus = order.status === 'PENDING' ? 'CONFIRMED' : order.status;
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        status: mockUpdatedStatus,
      },
    });

    // Also update all sub-orders to CONFIRMED if still PENDING
    await db.subOrder.updateMany({
      where: { orderId: order.id, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });

    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: mockUpdatedStatus,
        remark: 'Payment confirmed (mock - Paystack not configured)',
        changedBy: 'system',
      },
    });

    // Create status history for each sub-order
    const mockSubOrders = await db.subOrder.findMany({
      where: { orderId: order.id },
      select: { id: true },
    });
    for (const so of mockSubOrders) {
      await db.subOrderStatusHistory.create({
        data: {
          subOrderId: so.id,
          status: 'CONFIRMED',
          remark: 'Mock payment confirmed — order confirmed automatically',
          changedByRole: 'SYSTEM',
        },
      });
    }

    return NextResponse.json({
      data: {
        status: 'success',
        reference,
        orderId: order.id,
        _mock: true,
        _message: 'Mock payment verified. Paystack is not configured.',
      },
    });
  } catch (error) {
    console.error('Paystack verify error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
