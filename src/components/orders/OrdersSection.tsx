'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/ui-store';
import { Package, Clock, ChefHat, Truck, CheckCircle, XCircle, ArrowLeft, Eye, Store, UtensilsCrossed } from 'lucide-react';
import { formatNaira, getStatusColor } from '@/lib/utils';
import { useState } from 'react';

interface OrderItem { id: string; foodName: string; foodImage: string | null; quantity: number; unitPrice: number; totalPrice: number; }
interface SubOrderStatusHistory { id: string; status: string; remark: string | null; changedBy: string | null; changedByRole: string | null; createdAt: string; }
interface SubOrder {
  id: string; subOrderNumber: string; restaurantId: string; status: string;
  subtotal: number; deliveryFee: number; commissionRate: number; commissionAmount: number; restaurantEarnings: number;
  estimatedPrepTime: number | null; readyAt: string | null; deliveredAt: string | null; cancelledAt: string | null; cancelReason: string | null;
  createdAt: string;
  restaurant?: { id: string; name: string; image: string | null };
  items?: OrderItem[];
  statusHistory?: SubOrderStatusHistory[];
}
interface StatusHistory { id: string; status: string; remark: string | null; createdAt: string; }
interface Order {
  id: string; orderNumber: string; status: string; subtotal: number; deliveryFee: number; totalAmount: number;
  paymentMethod: string; paymentStatus: string; deliveryAddress: string | null; deliveryCity: string | null;
  customerPhone: string | null; customerName: string | null; createdAt: string;
  items?: OrderItem[]; statusHistory?: StatusHistory[];
  subOrders?: SubOrder[];
}

const statusTabs = [
  { key: '', label: 'All', icon: Package },
  { key: 'PENDING', label: 'Pending', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'ON_THE_WAY', label: 'On The Way', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

function StatusBadge({ status }: { status: string }) {
  const colors = getStatusColor(status);
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>{status.replace(/_/g, ' ')}</span>;
}

const subOrderStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
  PREPARING: 'bg-orange-100 text-orange-700 border-orange-200',
  READY: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  ON_THE_WAY: 'bg-purple-100 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

function SubOrderCard({ subOrder }: { subOrder: SubOrder }) {
  const [expanded, setExpanded] = useState(false);
  const statusClass = subOrderStatusColors[subOrder.status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className={`border rounded-lg overflow-hidden ${statusClass.replace('text-', 'border-').split(' ').find(c => c.startsWith('border-')) || 'border-gray-200'}`}
         style={{ borderLeftWidth: '4px' }}>
      {/* Header */}
      <div
        className="bg-white p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {subOrder.restaurant?.image ? (
            <img src={subOrder.restaurant.image} alt={subOrder.restaurant.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Store className="w-4 h-4 text-orange-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm text-gray-900">{subOrder.restaurant?.name || 'Restaurant'}</p>
            <p className="text-xs text-gray-500">{subOrder.subOrderNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-gray-900">{formatNaira(subOrder.subtotal)}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>{subOrder.status.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && subOrder.items && (
        <div className="bg-white border-t border-gray-100 p-3 space-y-2">
          {subOrder.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              {item.foodImage ? (
                <img src={item.foodImage} alt={item.foodName} className="w-8 h-8 rounded object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs">🍽️</div>
              )}
              <span className="flex-1 text-gray-700">{item.foodName} × {item.quantity}</span>
              <span className="font-medium text-gray-900">{formatNaira(item.totalPrice)}</span>
            </div>
          ))}
          {subOrder.deliveryFee > 0 && (
            <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-50">
              <span>Delivery fee</span>
              <span>{formatNaira(subOrder.deliveryFee)}</span>
            </div>
          )}

          {/* Status Timeline */}
          {subOrder.statusHistory && subOrder.statusHistory.length > 0 && (
            <div className="pt-2 border-t border-gray-50 mt-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Status Timeline</p>
              <div className="space-y-1">
                {subOrder.statusHistory.slice().reverse().map((sh, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div key={sh.id} className="flex items-start gap-2 text-xs">
                      <span className={`mt-0.5 ${isLatest ? 'text-green-500' : 'text-gray-400'}`}>{isLatest ? '●' : '○'}</span>
                      <div>
                        <span className={`font-medium ${isLatest ? 'text-gray-900' : 'text-gray-500'}`}>{sh.status.replace(/_/g, ' ')}</span>
                        {sh.remark && <span className="text-gray-400 ml-1">— {sh.remark}</span>}
                        <span className="text-gray-400 ml-1">{new Date(sh.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onView }: { order: Order; onView: (o: Order) => void }) {
  const borderColor: Record<string, string> = { PENDING: 'border-l-blue-500', CONFIRMED: 'border-l-indigo-500', PREPARING: 'border-l-yellow-500', ON_THE_WAY: 'border-l-orange-500', DELIVERED: 'border-l-green-500', CANCELLED: 'border-l-red-500' };
  const hasSubOrders = order.subOrders && order.subOrders.length > 0;
  const restaurantCount = hasSubOrders ? order.subOrders!.length : 1;

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor[order.status] || 'border-l-gray-300'} p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          {hasSubOrders && restaurantCount > 1 && (
            <p className="text-xs text-orange-600 mt-1">📦 {restaurantCount} restaurants — each delivers separately</p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Sub-order breakdown */}
      {hasSubOrders ? (
        <div className="space-y-2 mb-3">
          {order.subOrders!.map((sub) => (
            <SubOrderCard key={sub.id} subOrder={sub} />
          ))}
        </div>
      ) : (
        /* Fallback: flat items list (for orders without sub-orders) */
        <div className="space-y-1 mb-3">
          {order.items?.slice(0, 3).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.foodName} × {item.quantity}</span>
              <span className="text-gray-800">{formatNaira(item.totalPrice)}</span>
            </div>
          ))}
          {(order.items?.length || 0) > 3 && <p className="text-xs text-gray-400">+{(order.items?.length || 0) - 3} more items</p>}
        </div>
      )}

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div>
          <span className="font-bold text-lg text-gray-900">{formatNaira(order.totalAmount)}</span>
          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus === 'PAID' ? 'Paid' : order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Pending'}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onView(order)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
            <Eye className="w-4 h-4" /> View
          </button>
          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
            <button onClick={async () => {
              if (!confirm('Cancel this order? All restaurant sub-orders will be cancelled.')) return;
              const res = await fetch('/api/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: order.id, status: 'CANCELLED' }) });
              if (res.ok) window.location.reload();
            }} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const hasSubOrders = order.subOrders && order.subOrders.length > 0;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h2>
            <p className="text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Delivery Info</h3>
            <p className="text-sm text-gray-600">{order.customerName}</p>
            <p className="text-sm text-gray-600">{order.customerPhone}</p>
            <p className="text-sm text-gray-600">{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ''}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
            <p className="text-sm text-gray-600">Method: {order.paymentMethod === 'PAYSTACK' ? 'Paystack (Card/Bank/USSD)' : 'Cash on Delivery'}</p>
            <p className="text-sm text-gray-600">Status: <span className={order.paymentStatus === 'PAID' ? 'text-green-600 font-semibold' : 'text-yellow-600'}>{order.paymentStatus}</span></p>
          </div>
        </div>

        {/* Sub-order breakdown */}
        {hasSubOrders ? (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order by Restaurant</h3>
            <div className="space-y-4">
              {order.subOrders!.map((sub) => (
                <div key={sub.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Restaurant header */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {sub.restaurant?.image ? (
                        <img src={sub.restaurant.image} alt={sub.restaurant.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Store className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{sub.restaurant?.name}</p>
                        <p className="text-xs text-gray-500">{sub.subOrderNumber}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${(subOrderStatusColors[sub.status] || 'bg-gray-100 text-gray-700')}`}>{sub.status.replace(/_/g, ' ')}</span>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-2">
                    {sub.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        {item.foodImage ? <img src={item.foodImage} alt={item.foodName} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-lg">🍽️</div>}
                        <div className="flex-1"><p className="font-medium text-gray-900">{item.foodName}</p><p className="text-xs text-gray-500">Qty: {item.quantity} × {formatNaira(item.unitPrice)}</p></div>
                        <span className="font-semibold text-gray-900">{formatNaira(item.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatNaira(sub.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery Fee</span>
                      <span>{sub.deliveryFee === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatNaira(sub.deliveryFee)}</span>
                    </div>

                    {/* Status timeline */}
                    {sub.statusHistory && sub.statusHistory.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 mt-2">
                        <p className="text-xs font-medium text-gray-500 mb-2">Status Timeline</p>
                        <div className="space-y-2">
                          {sub.statusHistory.slice().reverse().map((sh) => (
                            <div key={sh.id} className="flex items-start gap-2 text-xs">
                              <span className="mt-0.5 text-green-500">●</span>
                              <div>
                                <span className="font-medium text-gray-900">{sh.status.replace(/_/g, ' ')}</span>
                                {sh.remark && <span className="text-gray-400"> — {sh.remark}</span>}
                                <p className="text-gray-400">{new Date(sh.createdAt).toLocaleString('en-NG', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Fallback flat items list */
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  {item.foodImage ? <img src={item.foodImage} alt={item.foodName} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-lg">🍽️</div>}
                  <div className="flex-1"><p className="font-medium text-gray-900">{item.foodName}</p><p className="text-xs text-gray-500">Qty: {item.quantity} × {formatNaira(item.unitPrice)}</p></div>
                  <span className="font-semibold text-gray-900">{formatNaira(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatNaira(order.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery Fee</span><span>{order.deliveryFee === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatNaira(order.deliveryFee)}</span></div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100"><span>Total</span><span>{formatNaira(order.totalAmount)}</span></div>
        </div>
      </div>
    </div>
  );
}

export function OrdersSection() {
  const { isAuthenticated } = useAuth();
  const { setShowLogin } = useUIStore();
  const [activeTab, setActiveTab] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders', activeTab],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeTab) params.set('status', activeTab);
      return fetch(`/api/orders?${params}`).then(r => r.json()).then(d => d.data || []);
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Login to view your orders</h2>
          <button onClick={() => setShowLogin(true)} className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">Login</button>
        </div>
      </div>
    );
  }

  if (selectedOrder) return <div className="py-8 max-w-4xl mx-auto px-4"><OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} /></div>;

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>My Orders</h1>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-4 mb-6">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-lg p-4 animate-pulse"><div className="h-5 bg-gray-200 rounded w-1/3 mb-3" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-2" /><div className="h-4 bg-gray-100 rounded w-1/4" /></div>)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No orders yet</h3>
            <p className="text-gray-400 text-sm mb-4">Start ordering your favourite Nigerian meals!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => <OrderCard key={order.id} order={order} onView={setSelectedOrder} />)}
          </div>
        )}
      </div>
    </div>
  );
}
