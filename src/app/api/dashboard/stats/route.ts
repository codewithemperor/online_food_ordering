import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalRestaurants,
      totalFoods,
      totalCustomers,
      totalOrders,
      pendingOrders,
      todayOrders,
      totalEarnings,
      cancelledOrders,
      totalCategories,
      todayEarnings,
      monthlyEarnings,
      pendingSubOrders,
      platformCommission,
    ] = await Promise.all([
      db.restaurant.count(),
      db.food.count(),
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.order.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { createdAt: { gte: today } } }),
      db.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'PAID' } }),
      db.order.count({ where: { status: 'CANCELLED' } }),
      db.category.count(),
      db.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'PAID', createdAt: { gte: today } } }),
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      db.subOrder.count({ where: { status: 'PENDING' } }),
      db.subOrder.aggregate({
        _sum: { commissionAmount: true },
        where: { status: { in: ['DELIVERED'] } },
      }),
    ]);

    return NextResponse.json({
      data: {
        totalRestaurants,
        totalFoods,
        totalCustomers,
        totalOrders,
        pendingOrders,
        todayOrders,
        totalRevenue: totalEarnings._sum.totalAmount || 0,
        cancelledOrders,
        totalCategories,
        todayRevenue: todayEarnings._sum.totalAmount || 0,
        monthlyRevenue: monthlyEarnings._sum.totalAmount || 0,
        pendingSubOrders,
        platformCommission: platformCommission._sum.commissionAmount || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
