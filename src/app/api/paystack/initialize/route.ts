import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    // @ts-expect-error - id/email on session user
    const userId = session.user.id;
    // @ts-expect-error - email on session user
    const userEmail = session.user.email;

    const body = await request.json();
    const { orderId, email, amount } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Order ID and amount are required' },
        { status: 400 }
      );
    }

    // Verify the order belongs to the user
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Order has already been paid' },
        { status: 400 }
      );
    }

    const paymentEmail = email || userEmail;
    const reference = `NB-${uuidv4()}`;

    // If Paystack key is configured, make real API call
    if (PAYSTACK_SECRET_KEY) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: paymentEmail,
            amount: Math.round(amount * 100), // Paystack expects amount in kobo
            reference,
            metadata: {
              orderId,
              userId,
            },
          }),
        });

        const data = await response.json();

        if (!data.status) {
          return NextResponse.json(
            { error: data.message || 'Payment initialization failed' },
            { status: 400 }
          );
        }

        // Store reference on order
        await db.order.update({
          where: { id: orderId },
          data: {
            paystackRef: reference,
            paymentMethod: 'PAYSTACK',
          },
        });

        return NextResponse.json({
          data: {
            authorizationUrl: data.data.authorization_url,
            reference: data.data.reference,
          },
        });
      } catch (err) {
        console.error('Paystack API error:', err);
        return NextResponse.json(
          { error: 'Payment service unavailable' },
          { status: 503 }
        );
      }
    }

    // Mock/placeholder response when Paystack key is not configured
    await db.order.update({
      where: { id: orderId },
      data: {
        paystackRef: reference,
        paymentMethod: 'PAYSTACK',
      },
    });

    return NextResponse.json({
      data: {
        authorizationUrl: `/payment/mock?reference=${reference}&orderId=${orderId}`,
        reference,
        _mock: true,
        _message: 'Paystack is not configured. Using mock payment flow.',
      },
    });
  } catch (error) {
    console.error('Paystack initialize error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
