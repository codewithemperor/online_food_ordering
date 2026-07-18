import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    let startDate: Date | undefined;

    switch (period) {
      case 'today': {
        startDate = startOfDay(new Date());
        break;
      }
      case 'week': {
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      }
      case 'month': {
        startDate = startOfMonth(new Date());
        break;
      }
      case 'year': {
        startDate = startOfYear(new Date());
        break;
      }
      default:
        startDate = undefined;
    }

    const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

    // Get earnings aggregates
    const [paystackEarnings, codEarnings] = await Promise.all([
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          ...dateFilter,
          paymentMethod: 'PAYSTACK',
          paymentStatus: 'PAID',
        },
      }),
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          ...dateFilter,
          paymentMethod: 'COD',
          paymentStatus: 'PAID',
        },
      }),
    ]);

    const paystackTotal = paystackEarnings._sum.totalAmount || 0;
    const codTotal = codEarnings._sum.totalAmount || 0;
    const totalEarnings = paystackTotal + codTotal;

    // Get daily data for chart (last 30 days or period-based)
    const daysBack = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : period === 'year' ? 365 : 30;
    const dailyData: { date: string; revenue: number; orders: number }[] = [];

    for (let i = daysBack - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dateStr = format(day, 'yyyy-MM-dd');

      const [dayRevenue, dayOrders] = await Promise.all([
        db.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            paymentStatus: 'PAID',
          },
        }),
        db.order.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        }),
      ]);

      dailyData.push({
        date: dateStr,
        revenue: dayRevenue._sum.totalAmount || 0,
        orders: dayOrders,
      });
    }

    // Top restaurants by earnings — use subOrders since Restaurant
    // has subOrders relation, not orders
    const topRestaurants = await db.restaurant.findMany({
      take: 5,
      include: {
        _count: { select: { subOrders: true } },
        subOrders: {
          where: {
            ...dateFilter,
            order: {
              paymentStatus: 'PAID',
            },
          },
          select: { subtotal: true, deliveryFee: true },
        },
      },
    });

    const topRestaurantsData = topRestaurants
      .map((r) => ({
        id: r.id,
        name: r.name,
        image: r.image,
        orderCount: r._count.subOrders,
        earnings: r.subOrders.reduce((sum, so) => sum + so.subtotal + so.deliveryFee, 0),
      }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    return NextResponse.json({
      data: {
        totalEarnings,
        paystackEarnings: paystackTotal,
        codEarnings: codTotal,
        dailyData,
        topRestaurants: topRestaurantsData,
      },
    });
  } catch (error) {
    console.error('Dashboard earnings error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
