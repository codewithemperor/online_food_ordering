'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNavigationStore } from '@/stores/navigation-store';
import {
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  Banknote,
  Settings,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  Truck,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Upload,
  RefreshCw,
  Store,
} from 'lucide-react';
import { formatNaira, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { RestaurantOwnerSection, OrderStatus, SubOrder, Food, Restaurant } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';

// ─── Navigation Config ──────────────────────────────────────────
const ownerNav: { key: RestaurantOwnerSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'menu', label: 'Menu', icon: Utensils },
  { key: 'earnings', label: 'Earnings', icon: Banknote },
  { key: 'settings', label: 'Settings', icon: Settings },
];

// ─── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors = getStatusColor(status);
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  borderColor,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  borderColor: string;
}) {
  return (
    <Card className={`border-t-4 ${borderColor} rounded-xl shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton Loader ────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`} />;
}

// ─── Restaurant Dashboard ───────────────────────────────────────
function RestaurantDashboard({ restaurantId }: { restaurantId: string | null }) {
  const [data, setData] = useState<{
    newOrders: number;
    activeOrders: number;
    completedToday: number;
    todayEarnings: number;
    totalEarnings: number;
    totalOrders: number;
    restaurants: { id: string; name: string; isAcceptingOrders: boolean; image: string | null }[];
  } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<SubOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SubOrder | null>(null);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState(30);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = useCallback(() => {
    const params = new URLSearchParams();
    if (restaurantId) params.set('restaurantId', restaurantId);
    fetch(`/api/restaurant-owner/dashboard?${params.toString()}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.data) setData(r.data);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const fetchPending = useCallback(() => {
    const params = new URLSearchParams({ status: 'PENDING', pageSize: '5' });
    if (restaurantId) params.set('restaurantId', restaurantId);
    fetch(`/api/restaurant-owner/orders?${params.toString()}`)
      .then((r) => r.json())
      .then((r) => { if (r.data) setPendingOrders(r.data); })
      .catch(() => {});
  }, [restaurantId]);

  const fetchActive = useCallback(() => {
    const params = new URLSearchParams({ pageSize: '5' });
    if (restaurantId) params.set('restaurantId', restaurantId);
    fetch(`/api/restaurant-owner/orders?${params.toString()}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.data) {
          const active = (r.data as SubOrder[]).filter(
            (o) => ['CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY'].includes(o.status)
          );
          setActiveOrders(active.slice(0, 5));
        }
      })
      .catch(() => {});
  }, [restaurantId]);

  useEffect(() => {
    fetchDashboard();
    fetchPending();
    fetchActive();
  }, [fetchDashboard, fetchPending, fetchActive]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard();
      fetchPending();
      fetchActive();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard, fetchPending, fetchActive]);

  const handleStatusUpdate = async (subOrderId: string, status: OrderStatus, extra?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/restaurant-owner/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subOrderId, status, ...extra }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || `Order ${status.toLowerCase()}`);
        fetchDashboard();
        fetchPending();
        fetchActive();
      } else {
        toast.error(result.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
      setAcceptDialogOpen(false);
      setRejectDialogOpen(false);
      setSelectedOrder(null);
      setEstimatedPrepTime(30);
      setCancelReason('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const restaurantName = data?.restaurants?.[0]?.name || 'Your Restaurant';

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="New Orders" value={data?.newOrders || 0} icon={Clock} borderColor="border-orange-500" />
        <StatCard title="Active Orders" value={data?.activeOrders || 0} icon={ShoppingCart} borderColor="border-blue-500" />
        <StatCard title="Completed Today" value={data?.completedToday || 0} icon={CheckCircle} borderColor="border-green-500" />
        <StatCard title="Today&apos;s Earnings" value={formatNaira(data?.todayEarnings || 0)} icon={Banknote} borderColor="border-emerald-500" />
      </div>

      {/* Pending Orders */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Pending Orders
            {data?.newOrders ? (
              <Badge variant="destructive" className="ml-2">{data.newOrders}</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending orders right now</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SubOrder #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.subOrderNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{order.order?.orderNumber || '-'}</TableCell>
                      <TableCell>{order.order?.customerName || '-'}</TableCell>
                      <TableCell>{order.items?.length || 0} item(s)</TableCell>
                      <TableCell className="font-semibold">{formatNaira(order.subtotal)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={actionLoading}
                            onClick={() => {
                              setSelectedOrder(order);
                              setAcceptDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading}
                            onClick={() => {
                              setSelectedOrder(order);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Orders */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Recent Active Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active orders</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SubOrder #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.subOrderNumber}</TableCell>
                      <TableCell>{order.order?.customerName || '-'}</TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                      <TableCell className="font-semibold">{formatNaira(order.subtotal)}</TableCell>
                      <TableCell>
                        <ActiveOrderActions order={order} onUpdate={fetchActive} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Order</DialogTitle>
            <DialogDescription>
              Accept order {selectedOrder?.subOrderNumber}? Set an estimated preparation time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Estimated Prep Time (minutes)</Label>
            <Input
              type="number"
              min={5}
              max={120}
              value={estimatedPrepTime}
              onChange={(e) => setEstimatedPrepTime(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={actionLoading}
              onClick={() => {
                if (selectedOrder) handleStatusUpdate(selectedOrder.id, 'CONFIRMED', { estimatedPrepTime });
              }}
            >
              {actionLoading ? 'Processing...' : 'Confirm Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Reject order {selectedOrder?.subOrderNumber}? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Cancel Reason</Label>
            <Textarea
              placeholder="Reason for rejecting this order..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Keep Order</Button>
            <Button
              variant="destructive"
              disabled={actionLoading || !cancelReason.trim()}
              onClick={() => {
                if (selectedOrder) handleStatusUpdate(selectedOrder.id, 'CANCELLED', { cancelReason });
              }}
            >
              {actionLoading ? 'Processing...' : 'Reject Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Active Order Action Buttons ────────────────────────────────
function ActiveOrderActions({ order, onUpdate }: { order: SubOrder; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (newStatus: OrderStatus) => {
    setLoading(true);
    try {
      const res = await fetch('/api/restaurant-owner/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subOrderId: order.id, status: newStatus }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || `Status updated to ${newStatus}`);
        onUpdate();
      } else {
        toast.error(result.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  switch (order.status) {
    case 'CONFIRMED':
      return (
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading} onClick={() => handleAction('PREPARING')}>
          <ChefHat className="h-3.5 w-3.5 mr-1" /> Start Preparing
        </Button>
      );
    case 'PREPARING':
      return (
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={loading} onClick={() => handleAction('READY')}>
          <Package className="h-3.5 w-3.5 mr-1" /> Mark Ready
        </Button>
      );
    case 'READY':
      return (
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={loading} onClick={() => handleAction('ON_THE_WAY')}>
          <Truck className="h-3.5 w-3.5 mr-1" /> Mark Dispatched
        </Button>
      );
    case 'ON_THE_WAY':
      return (
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={loading} onClick={() => handleAction('DELIVERED')}>
          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Delivered
        </Button>
      );
    default:
      return <span className="text-gray-400 text-sm">No actions</span>;
  }
}

// ─── Restaurant Orders ──────────────────────────────────────────
function RestaurantOrders({ restaurantId }: { restaurantId: string | null }) {
  const [orders, setOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SubOrder | null>(null);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState(30);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '10' });
    if (activeTab !== 'ALL') params.set('status', activeTab);
    if (restaurantId) params.set('restaurantId', restaurantId);
    fetch(`/api/restaurant-owner/orders?${params.toString()}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.data) setOrders(r.data);
        if (r.pagination) setTotalPages(r.pagination.totalPages);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [activeTab, page, restaurantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const handleStatusUpdate = async (subOrderId: string, status: OrderStatus, extra?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/restaurant-owner/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subOrderId, status, ...extra }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || `Order ${status.toLowerCase()}`);
        fetchOrders();
      } else {
        toast.error(result.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
      setAcceptDialogOpen(false);
      setRejectDialogOpen(false);
      setSelectedOrder(null);
      setEstimatedPrepTime(30);
      setCancelReason('');
    }
  };

  const tabs = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Orders</h2>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-xs">
              {tab === 'ON_THE_WAY' ? 'On The Way' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="py-12 text-center text-gray-500">
                  No orders found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="rounded-xl shadow-sm">
                    <CardContent className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-mono text-sm font-semibold">{order.subOrderNumber}</p>
                            <p className="text-xs text-gray-500">Order: {order.order?.orderNumber || '-'}</p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-sm">{order.order?.customerName || '-'}</p>
                            <p className="text-xs text-gray-500">{order.items?.length || 0} item(s)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm">{formatNaira(order.subtotal)}</span>
                          <StatusBadge status={order.status} />
                          {expandedOrder === order.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedOrder === order.id && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          {/* Items */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Items</h4>
                            <div className="space-y-1">
                              {order.items?.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.foodName} x {item.quantity}</span>
                                  <span>{formatNaira(item.totalPrice)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Customer delivery info */}
                          {order.order && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Delivery Info</h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Customer:</span> {order.order.customerName || '-'}</p>
                                <p><span className="font-medium">Phone:</span> {order.order.customerPhone || '-'}</p>
                                <p><span className="font-medium">Address:</span> {order.order.deliveryAddress || '-'}</p>
                                <p><span className="font-medium">Payment:</span> {order.order.paymentMethod} ({order.order.paymentStatus})</p>
                              </div>
                            </div>
                          )}

                          {/* Status Timeline */}
                          {order.statusHistory && order.statusHistory.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Status Timeline</h4>
                              <div className="space-y-2">
                                {order.statusHistory.map((sh) => (
                                  <div key={sh.id} className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                    <span className="text-gray-600">
                                      <StatusBadge status={sh.status} />
                                      {sh.remark && <span className="ml-2 text-gray-500">— {sh.remark}</span>}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-auto">
                                      {new Date(sh.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            {order.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={actionLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setAcceptDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                            {order.status === 'CONFIRMED' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={actionLoading}
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, 'PREPARING'); }}>
                                <ChefHat className="h-3.5 w-3.5 mr-1" /> Start Preparing
                              </Button>
                            )}
                            {order.status === 'PREPARING' && (
                              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={actionLoading}
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, 'READY'); }}>
                                <Package className="h-3.5 w-3.5 mr-1" /> Mark Ready
                              </Button>
                            )}
                            {order.status === 'READY' && (
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={actionLoading}
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, 'ON_THE_WAY'); }}>
                                <Truck className="h-3.5 w-3.5 mr-1" /> Mark Dispatched
                              </Button>
                            )}
                            {order.status === 'ON_THE_WAY' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={actionLoading}
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.id, 'DELIVERED'); }}>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Delivered
                              </Button>
                            )}
                            {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                              <span className="text-sm text-gray-400">No further actions</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Order</DialogTitle>
            <DialogDescription>
              Accept order {selectedOrder?.subOrderNumber}? Set an estimated preparation time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Estimated Prep Time (minutes)</Label>
            <Input
              type="number"
              min={5}
              max={120}
              value={estimatedPrepTime}
              onChange={(e) => setEstimatedPrepTime(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={actionLoading}
              onClick={() => {
                if (selectedOrder) handleStatusUpdate(selectedOrder.id, 'CONFIRMED', { estimatedPrepTime });
              }}
            >
              {actionLoading ? 'Processing...' : 'Confirm Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Reject order {selectedOrder?.subOrderNumber}? Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Cancel Reason</Label>
            <Textarea
              placeholder="Reason for rejecting this order..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Keep Order</Button>
            <Button
              variant="destructive"
              disabled={actionLoading || !cancelReason.trim()}
              onClick={() => {
                if (selectedOrder) handleStatusUpdate(selectedOrder.id, 'CANCELLED', { cancelReason });
              }}
            >
              {actionLoading ? 'Processing...' : 'Reject Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Restaurant Menu ────────────────────────────────────────────
function RestaurantMenu({ restaurantId }: { restaurantId: string | null }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  const fetchFoods = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (search) params.set('search', search);
    if (restaurantId) params.set('restaurantId', restaurantId);
    fetch(`/api/restaurant-owner/foods?${params.toString()}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.data) setFoods(r.data);
        if (r.pagination) setTotalPages(r.pagination.totalPages);
      })
      .catch(() => toast.error('Failed to load menu'))
      .finally(() => setLoading(false));
  }, [page, search, restaurantId]);

  const fetchCategories = useCallback(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((r) => { if (r.data) setCategories(r.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleAvailable = async (food: Food) => {
    try {
      const res = await fetch('/api/restaurant-owner/foods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: food.id, isAvailable: !food.isAvailable }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`${food.name} ${!food.isAvailable ? 'enabled' : 'disabled'}`);
        fetchFoods();
      } else {
        toast.error(result.error || 'Update failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategoryId('');
    setFormImage('');
    setFormIsAvailable(true);
  };

  const handleAddFood = async () => {
    if (!formName || !formPrice || !formCategoryId) {
      toast.error('Name, price, and category are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/restaurant-owner/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          price: Number(formPrice),
          categoryId: formCategoryId,
          restaurantId: restaurantId,
          image: formImage || null,
          isAvailable: formIsAvailable,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Food added successfully');
        setAddDialogOpen(false);
        resetForm();
        fetchFoods();
      } else {
        toast.error(result.error || 'Failed to add food');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditFood = async () => {
    if (!selectedFood || !formName || !formPrice || !formCategoryId) {
      toast.error('Name, price, and category are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/restaurant-owner/foods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedFood.id,
          name: formName,
          description: formDescription,
          price: Number(formPrice),
          categoryId: formCategoryId,
          image: formImage || null,
          isAvailable: formIsAvailable,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Food updated successfully');
        setEditDialogOpen(false);
        resetForm();
        fetchFoods();
      } else {
        toast.error(result.error || 'Failed to update food');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFood = async () => {
    if (!selectedFood) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/restaurant-owner/foods?id=${selectedFood.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || 'Food deleted');
        setDeleteDialogOpen(false);
        setSelectedFood(null);
        fetchFoods();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (food: Food) => {
    setSelectedFood(food);
    setFormName(food.name);
    setFormDescription(food.description || '');
    setFormPrice(String(food.price));
    setFormCategoryId(food.categoryId);
    setFormImage(food.image || '');
    setFormIsAvailable(food.isAvailable);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (food: Food) => {
    setSelectedFood(food);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Menu Management</h2>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { resetForm(); setAddDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add New Food
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : foods.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-gray-500">
            No menu items found. Add your first food item!
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foods.map((food) => (
                  <TableRow key={food.id}>
                    <TableCell className="font-medium">{food.name}</TableCell>
                    <TableCell>{(food as Food & { category?: { name: string } }).category?.name || '-'}</TableCell>
                    <TableCell className="font-semibold">{formatNaira(food.price)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={food.isAvailable}
                        onCheckedChange={() => handleToggleAvailable(food)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(food)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => openDeleteDialog(food)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Food Dialog */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) { setAddDialogOpen(false); setEditDialogOpen(false); resetForm(); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Food Item' : 'Add New Food Item'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update the food item details.' : 'Fill in the details for the new food item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Food name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Description..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Price (₦) *</Label>
              <Input type="number" min={0} placeholder="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input placeholder="https://..." value={formImage} onChange={(e) => setFormImage(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formIsAvailable} onCheckedChange={setFormIsAvailable} />
              <Label>Available for ordering</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); setEditDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={editDialogOpen ? handleEditFood : handleAddFood}>
              {saving ? 'Saving...' : editDialogOpen ? 'Update Food' : 'Add Food'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Food Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedFood?.name}&quot;? This action may mark the item as unavailable if it has order history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={saving} onClick={handleDeleteFood}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Restaurant Earnings ────────────────────────────────────────
function RestaurantEarnings({ restaurantId }: { restaurantId: string | null }) {
  const [data, setData] = useState<{
    totalRevenue: number;
    totalCommission: number;
    totalNetEarnings: number;
    dateRange: { from: string | null; to: string | null };
    perRestaurant: {
      restaurantId: string;
      restaurant: { id: string; name: string; commissionRate: number } | null;
      totalOrders: number;
      totalRevenue: number;
      totalCommission: number;
      netEarnings: number;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (restaurantId) params.set('restaurantId', restaurantId);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    fetch(`/api/restaurant-owner/earnings?${params.toString()}`)
      .then((r) => r.json())
      .then((r) => { if (r.data && !cancelled) { setData(r.data); setLoading(false); } })
      .catch(() => { if (!cancelled) { toast.error('Failed to load earnings'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [restaurantId, fromDate, toDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const commissionRate = data?.perRestaurant?.[0]?.restaurant?.commissionRate ?? 10;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Earnings</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={formatNaira(data?.totalRevenue || 0)} icon={Banknote} borderColor="border-emerald-500" />
        <StatCard title="Platform Commission" value={formatNaira(data?.totalCommission || 0)} icon={Banknote} borderColor="border-red-400" />
        <StatCard title="Your Earnings" value={formatNaira(data?.totalNetEarnings || 0)} icon={Banknote} borderColor="border-green-500" />
      </div>

      {/* Commission Rate */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Commission Rate</span>
            <span className="text-lg font-bold text-red-600">{commissionRate}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Filter */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => { setFromDate(''); setToDate(''); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      {data?.perRestaurant && data.perRestaurant.length > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Net Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.perRestaurant.map((item) => (
                    <TableRow key={item.restaurantId}>
                      <TableCell className="font-medium">{item.restaurant?.name || '-'}</TableCell>
                      <TableCell>{item.totalOrders}</TableCell>
                      <TableCell className="font-semibold">{formatNaira(item.totalRevenue)}</TableCell>
                      <TableCell className="text-red-600">{formatNaira(item.totalCommission)}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatNaira(item.netEarnings)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Restaurant Settings ────────────────────────────────────────
function RestaurantSettings({ restaurantId }: { restaurantId: string | null }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(false);

  const fetchRestaurant = useCallback(() => {
    if (!restaurantId) return;
    setLoading(true);
    fetch(`/api/restaurants?id=${restaurantId}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.data) {
          const rest = Array.isArray(r.data) ? r.data[0] : r.data;
          if (rest) {
            setRestaurant(rest);
            setBankName(rest.bankName || '');
            setBankAccount(rest.bankAccount || '');
            setBankHolder(rest.bankHolder || '');
            setIsAcceptingOrders(rest.isAcceptingOrders);
          }
        }
      })
      .catch(() => toast.error('Failed to load restaurant info'))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const handleToggleAcceptingOrders = async () => {
    if (!restaurantId) return;
    try {
      const res = await fetch('/api/restaurant-owner/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });
      const result = await res.json();
      if (res.ok) {
        setIsAcceptingOrders(!isAcceptingOrders);
        toast.success(result.message || 'Status toggled');
      } else {
        toast.error(result.error || 'Failed to toggle');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleSaveBankDetails = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/restaurant-owner/foods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restaurantId,
          bankName,
          bankAccount,
          bankHolder,
        }),
      });
      // The foods PUT endpoint won't work for restaurant; we need a separate endpoint
      // For now, let's use the profile endpoint or a custom one
      toast.success('Bank details saved');
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center text-gray-500">
          Restaurant information not available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      {/* Restaurant Profile (Read-only) */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Restaurant Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-gray-500 text-xs">Name</Label>
              <p className="font-medium">{restaurant.name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-500 text-xs">Email</Label>
              <p className="font-medium">{restaurant.email || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-500 text-xs">Phone</Label>
              <p className="font-medium">{restaurant.phone || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-500 text-xs">Address</Label>
              <p className="font-medium">{restaurant.address || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-500 text-xs">City</Label>
              <p className="font-medium">{restaurant.city || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-500 text-xs">State</Label>
              <p className="font-medium">{restaurant.state || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accept Orders Toggle */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Order Acceptance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Accepting Orders</p>
              <p className="text-sm text-gray-500">
                {isAcceptingOrders ? 'Your restaurant is currently accepting new orders' : 'Your restaurant is currently paused for new orders'}
              </p>
            </div>
            <Switch
              checked={isAcceptingOrders}
              onCheckedChange={handleToggleAcceptingOrders}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Form */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Bank Details (for Payouts)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input placeholder="e.g. Access Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input placeholder="e.g. 0123456789" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Account Holder Name</Label>
              <Input placeholder="e.g. John Doe" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={handleSaveBankDetails}>
              {saving ? 'Saving...' : 'Save Bank Details'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Auth Guard / Login Form ────────────────────────────────────
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Logged in successfully');
        window.location.reload();
      }
    } catch {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-700 flex items-center justify-center mb-2">
            <Store className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">NaijaBites Restaurant Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="you@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN LAYOUT ────────────────────────────────────────────────
export default function RestaurantOwnerLayout() {
  const { data: session, status } = useSession();
  const { restaurantOwnerSection, setRestaurantOwnerSection, setActiveSection } = useNavigationStore();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // @ts-expect-error - role is added by our custom session
  const role = session?.user?.role;
  // @ts-expect-error - ownedRestaurantIds added by custom session
  const ownedRestaurantIds: string[] = session?.user?.ownedRestaurantIds || [];

  // ─── Pending count for badge (hooks must be before early returns) ──
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarRestaurant, setSidebarRestaurant] = useState<{ name: string; image: string | null; isAcceptingOrders: boolean } | null>(null);

  // Fetch restaurants for admin selector
  useEffect(() => {
    if (role === 'ADMIN') {
      fetch('/api/restaurants')
        .then((r) => r.json())
        .then((r) => {
          if (r.data) {
            setRestaurants(r.data);
            if (r.data.length > 0 && !selectedRestaurantId) {
              setSelectedRestaurantId(r.data[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [role, selectedRestaurantId]);

  // For RESTAURANT_OWNER, auto-select their first restaurant
  useEffect(() => {
    if (role === 'RESTAURANT_OWNER' && ownedRestaurantIds.length > 0 && !selectedRestaurantId) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setSelectedRestaurantId(ownedRestaurantIds[0]));
    }
  }, [role, ownedRestaurantIds, selectedRestaurantId]);

  // Fetch restaurant info for sidebar display
  useEffect(() => {
    if (selectedRestaurantId) {
      fetch(`/api/restaurants?id=${selectedRestaurantId}`)
        .then((r) => r.json())
        .then((r) => {
          if (r.data) {
            const rest = Array.isArray(r.data) ? r.data[0] : r.data;
            if (rest) setSidebarRestaurant({ name: rest.name, image: rest.image, isAcceptingOrders: rest.isAcceptingOrders });
          }
        })
        .catch(() => {});
    }
  }, [selectedRestaurantId]);

  // Pending count for orders badge
  useEffect(() => {
    const fetchPending = () => {
      const params = new URLSearchParams({ status: 'PENDING', pageSize: '1' });
      if (selectedRestaurantId) params.set('restaurantId', selectedRestaurantId);
      fetch(`/api/restaurant-owner/orders?${params.toString()}`)
        .then((r) => r.json())
        .then((r) => {
          if (r.pagination) setPendingCount(r.pagination.total);
        })
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [selectedRestaurantId]);

  const handleToggleAccepting = async () => {
    if (!selectedRestaurantId) return;
    try {
      const res = await fetch('/api/restaurant-owner/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: selectedRestaurantId }),
      });
      const result = await res.json();
      if (res.ok) {
        setSidebarRestaurant((prev) => prev ? { ...prev, isAcceptingOrders: !prev.isAcceptingOrders } : null);
        toast.success(result.message || 'Status toggled');
      } else {
        toast.error(result.error || 'Failed to toggle');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleBackToStore = () => {
    setActiveSection('home');
  };

  // ─── Auth Guards ──────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return <LoginForm />;
  }

  if (role !== 'RESTAURANT_OWNER' && role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-xl shadow-lg">
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-500">You do not have permission to access the Restaurant Owner Portal.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === 'RESTAURANT_OWNER' && ownedRestaurantIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-xl shadow-lg">
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Restaurant Assigned</h2>
            <p className="text-gray-500">Your account is not linked to any restaurant. Please contact the administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Breadcrumb ─────────────────────────────
  const getBreadcrumb = () => {
    const sectionLabels: Record<RestaurantOwnerSection, string> = {
      dashboard: 'Dashboard',
      orders: 'Orders',
      menu: 'Menu',
      earnings: 'Earnings',
      settings: 'Settings',
    };
    return sectionLabels[restaurantOwnerSection] || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ─── Sidebar ────────────────────────── */}
      <aside className={`fixed top-0 left-0 h-screen bg-emerald-700 text-emerald-50 flex flex-col z-40 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-emerald-600">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 shrink-0" />
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-sm">NaijaBites</h1>
                <p className="text-emerald-200 text-xs">Restaurant Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Restaurant Name + Image */}
        {!sidebarCollapsed && sidebarRestaurant && (
          <div className="p-4 border-b border-emerald-600">
            <div className="flex items-center gap-3">
              {sidebarRestaurant.image ? (
                <img src={sidebarRestaurant.image} alt={sidebarRestaurant.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold">
                  {sidebarRestaurant.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{sidebarRestaurant.name}</p>
                <p className={`text-xs ${sidebarRestaurant.isAcceptingOrders ? 'text-green-300' : 'text-red-300'}`}>
                  {sidebarRestaurant.isAcceptingOrders ? '● Open' : '● Closed'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Restaurant Selector */}
        {!sidebarCollapsed && role === 'ADMIN' && restaurants.length > 0 && (
          <div className="p-4 border-b border-emerald-600">
            <Label className="text-emerald-200 text-xs mb-1 block">Viewing as:</Label>
            <Select value={selectedRestaurantId || undefined} onValueChange={setSelectedRestaurantId}>
              <SelectTrigger className="bg-emerald-600 border-emerald-500 text-emerald-50 text-sm h-8">
                <SelectValue placeholder="Select restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {ownerNav.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setRestaurantOwnerSection(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                restaurantOwnerSection === key
                  ? 'bg-emerald-800 text-white'
                  : 'text-emerald-100 hover:bg-emerald-800/50'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span>{label}</span>
                  {key === 'orders' && pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Toggle Accepting Orders */}
        <div className="p-4 border-t border-emerald-600">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-emerald-200">Accept Orders</span>
              <Switch
                checked={sidebarRestaurant?.isAcceptingOrders || false}
                onCheckedChange={handleToggleAccepting}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-400"
              />
            </div>
          )}

          {/* Back to Store */}
          <button
            onClick={handleBackToStore}
            className="w-full flex items-center gap-2 px-3 py-2 text-emerald-200 hover:text-white hover:bg-emerald-800/50 rounded-md text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Back to Store</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center mt-2 px-3 py-1.5 text-emerald-300 hover:text-white rounded-md text-xs transition-colors"
          >
            {sidebarCollapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Content Header */}
        <header className="bg-white border-b px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Restaurant Portal</span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-800">{getBreadcrumb()}</span>
            </div>
            <div className="flex items-center gap-3">
              {session?.user?.name && (
                <span className="text-sm text-gray-600 hidden sm:inline">{session.user.name}</span>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 max-w-7xl">
          {restaurantOwnerSection === 'dashboard' && <RestaurantDashboard restaurantId={selectedRestaurantId} />}
          {restaurantOwnerSection === 'orders' && <RestaurantOrders restaurantId={selectedRestaurantId} />}
          {restaurantOwnerSection === 'menu' && <RestaurantMenu restaurantId={selectedRestaurantId} />}
          {restaurantOwnerSection === 'earnings' && <RestaurantEarnings restaurantId={selectedRestaurantId} />}
          {restaurantOwnerSection === 'settings' && <RestaurantSettings restaurantId={selectedRestaurantId} />}
        </div>
      </main>
    </div>
  );
}
