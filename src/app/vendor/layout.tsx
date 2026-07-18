'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useVendorStore } from '@/stores/vendor-store';
import {
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  Banknote,
  Settings,
  ArrowLeft,
  RefreshCw,
  Store,
  XCircle,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import type { Restaurant } from '@/types';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Navigation Config ──────────────────────────────────────────
const vendorNav: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; key: string }[] = [
  { href: '/vendor', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/vendor/orders', label: 'Orders', icon: ShoppingCart, key: 'orders' },
  { href: '/vendor/menu', label: 'Menu', icon: Utensils, key: 'menu' },
  { href: '/vendor/earnings', label: 'Earnings', icon: Banknote, key: 'earnings' },
  { href: '/vendor/settings', label: 'Settings', icon: Settings, key: 'settings' },
];

// ─── Login Form ─────────────────────────────────────────────────
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
        <CardContent className="pt-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-700 flex items-center justify-center mb-2">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1">NaijaBites Restaurant Portal</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to manage your restaurant</p>
        </CardContent>
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

// ─── MAIN VENDOR LAYOUT ────────────────────────────────────────
export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedRestaurantId, setSelectedRestaurantId } = useVendorStore();

  // @ts-expect-error - role is added by our custom session
  const role = session?.user?.role;
  // @ts-expect-error - ownedRestaurantIds added by custom session
  const ownedRestaurantIds: string[] = session?.user?.ownedRestaurantIds || [];

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  }, [role, selectedRestaurantId, setSelectedRestaurantId]);

  // For RESTAURANT_OWNER, auto-select their first restaurant
  useEffect(() => {
    if (role === 'RESTAURANT_OWNER' && ownedRestaurantIds.length > 0 && !selectedRestaurantId) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setSelectedRestaurantId(ownedRestaurantIds[0]));
    }
  }, [role, ownedRestaurantIds, selectedRestaurantId, setSelectedRestaurantId]);

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

  // Pending count for orders badge (only when authenticated)
  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchPending = () => {
      const params = new URLSearchParams({ status: 'PENDING', pageSize: '1' });
      if (selectedRestaurantId) params.set('restaurantId', selectedRestaurantId);
      fetch(`/api/restaurant-owner/orders?${params.toString()}`)
        .then((r) => { if (r.ok) return r.json(); return null; })
        .then((r) => {
          if (r?.pagination) setPendingCount(r.pagination.total);
        })
        .catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [selectedRestaurantId, status]);

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
    if (pathname === '/vendor') return 'Dashboard';
    if (pathname === '/vendor/orders') return 'Orders';
    if (pathname === '/vendor/menu') return 'Menu';
    if (pathname === '/vendor/earnings') return 'Earnings';
    if (pathname === '/vendor/settings') return 'Settings';
    return 'Dashboard';
  };

  // Determine which nav key is active
  const isActive = (href: string) => {
    if (href === '/vendor') return pathname === '/vendor';
    return pathname.startsWith(href);
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
          {vendorNav.map(({ href, label, icon: Icon, key }) => (
            <button
              key={key}
              onClick={() => router.push(href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive(href)
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
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-2 px-3 py-2 text-emerald-200 hover:text-white hover:bg-emerald-800/50 rounded-md text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Back to Store</span>}
          </button>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-emerald-200 hover:text-red-300 hover:bg-emerald-800/50 rounded-md text-sm transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
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

        {/* Content Body — render child page */}
        <div className="p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
