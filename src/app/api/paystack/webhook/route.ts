import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHmac } from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    // Verify HMAC signature
    if (PAYSTACK_SECRET_KEY) {
      const signature = request.headers.get('x-paystack-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      const expectedSignature = createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = payload.event;

    // Handle different Paystack events
    switch (event) {
      case 'charge.success': {
        const { reference, amount, status } = payload.data || {};

        if (status === 'success' && reference) {
          const order = await db.order.findFirst({
            where: { paystackRef: reference },
          });

          if (order && order.paymentStatus !== 'PAID') {
            // Verify amount matches
            const paidAmount = amount / 100; // Convert from kobo
            if (Math.abs(paidAmount - order.totalAmount) < 1) {
              await db.order.update({
                where: { id: order.id },
                data: {
                  paymentStatus: 'PAID',
                  status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
                },
              });

              await db.orderStatusHistory.create({
                data: {
                  orderId: order.id,
                  status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
                  remark: `Payment confirmed via Paystack webhook. Reference: ${reference}`,
                  changedBy: 'system',
                },
              });
            } else {
              console.warn(
                `Amount mismatch for order ${order.id}: expected ${order.totalAmount}, got ${paidAmount}`
              );
            }
          }
        }
        break;
      }

      case 'charge.failed': {
        const { reference } = payload.data || {};

        if (reference) {
          const order = await db.order.findFirst({
            where: { paystackRef: reference },
          });

          if (order) {
            await db.order.update({
              where: { id: order.id },
              data: { paymentStatus: 'FAILED' },
            });
          }
        }
        break;
      }

      case 'refund.processed': {
        const { reference } = payload.data || {};

        if (reference) {
          const order = await db.order.findFirst({
            where: { paystackRef: reference },
          });

          if (order) {
            await db.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'REFUNDED',
                refundNote: `Refund processed via Paystack. Reference: ${reference}`,
              },
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Paystack event: ${event}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    // Still return 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true });
  }
}
