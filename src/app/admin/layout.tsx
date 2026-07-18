'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Tag, UtensilsCrossed, ShoppingCart, Users, DollarSign, UserCheck, ArrowLeft, LogOut, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/foods', label: 'Food Menu', icon: UtensilsCrossed },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/admin/owners', label: 'Owners', icon: UserCheck },
];

// ─── Admin Login Form ─────────────────────────────────────────
function AdminLoginForm() {
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
          <div className="mx-auto h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1">NaijaBites Admin</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to manage the platform</p>
        </CardContent>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="admin@naijabites.ng" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            Admin access only. <button onClick={() => window.location.href = '/'} className="text-orange-500 hover:underline">Back to Store</button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient());

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return <AdminLoginForm />;
  }

  // Authenticated but not ADMIN
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm mb-6">You need admin access to view this page</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => signOut({ callbackUrl: '/' })} className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
              Sign Out
            </button>
            <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-gray-100 flex-shrink-0 fixed h-full overflow-y-auto flex flex-col">
          <div className="p-6 flex-1">
            {/* Logo */}
            <button onClick={() => router.push('/')} className="flex items-center gap-2 mb-8 group">
              <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">NaijaBites</span>
                <span className="block text-[10px] uppercase tracking-widest text-orange-400 font-semibold">Admin Panel</span>
              </div>
            </button>

            {/* Navigation */}
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom section */}
          <div className="p-6 border-t border-gray-800 space-y-2">
            {/* Admin user info */}
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {session.user.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
            </div>

            {/* Back to Store */}
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Store
            </button>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 bg-gray-50 min-h-screen">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {adminNav.find(n => isActive(n.href, n.exact))?.label || 'Admin'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">ADMIN</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
