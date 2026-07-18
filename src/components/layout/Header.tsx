'use client';

import { useCartStore } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/hooks/useAuth';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, User, Menu, X, UtensilsCrossed, LogOut, LayoutDashboard, Package, Home, Store, Utensils, StoreIcon, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { key: 'home' as const, label: 'Home', icon: Home, path: '/' },
  { key: 'restaurants' as const, label: 'Restaurants', icon: Store, path: '/restaurants' },
  { key: 'menu' as const, label: 'Menu', icon: Utensils, path: '/menu' },
];

export function Header() {
  const { toggleCart, getItemCount } = useCartStore();
  const { setShowLogin, setShowRegister } = useUIStore();
  const { isAuthenticated, isAdmin, isRestaurantOwner, user } = useAuth();
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const itemCount = getItemCount();

  const isInPortal = pathname.startsWith('/admin') || pathname.startsWith('/vendor');

  const handleNav = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handlePortalNav = (section: 'admin' | 'vendor') => {
    router.push(section === 'vendor' ? '/vendor' : '/admin');
    setMobileOpen(false);
  };

  const getPortalLabel = () => {
    if (isRestaurantOwner) return 'My Restaurant';
    if (isAdmin) return 'Admin Panel';
    return '';
  };

  const getPortalSection = (): 'admin' | 'vendor' => {
    if (isRestaurantOwner) return 'vendor';
    return 'admin';
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => handleNav('/')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>NaijaBites</span>
          </button>

          {/* Desktop Nav - hide in portal views */}
          <nav className={`hidden md:flex items-center gap-6 ${isInPortal ? 'opacity-50' : ''}`}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.path
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            {isAuthenticated && !isInPortal && (
              <button
                onClick={() => handleNav('/orders')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/orders'
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <Package className="w-4 h-4" />
                My Orders
              </button>
            )}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Portal Switcher — for Admin and Restaurant Owner */}
            {(isAdmin || isRestaurantOwner) && (
              <div className="hidden md:flex items-center">
                {isInPortal ? (
                  <button
                    onClick={() => handleNav('/')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Switch to Store
                  </button>
                ) : (
                  <button
                    onClick={() => handlePortalNav(getPortalSection())}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isRestaurantOwner
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                    }`}
                  >
                    {isRestaurantOwner ? <StoreIcon className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                    {getPortalLabel()}
                  </button>
                )}
              </div>
            )}

            {/* Cart — hide in portal views */}
            {!isInPortal && (
              <button onClick={toggleCart} className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </button>
            )}

            {/* User */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isRestaurantOwner ? 'bg-emerald-100' : isAdmin ? 'bg-orange-100' : 'bg-primary/10'
                  }`}>
                    <User className={`w-4 h-4 ${
                      isRestaurantOwner ? 'text-emerald-700' : isAdmin ? 'text-orange-600' : 'text-primary'
                    }`} />
                  </div>
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          isRestaurantOwner ? 'bg-emerald-100 text-emerald-700' : isAdmin ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isRestaurantOwner ? 'Restaurant Owner' : isAdmin ? 'Admin' : 'Customer'}
                        </span>
                      </div>
                      <button onClick={() => { handleNav('/profile'); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4" /> Profile
                      </button>
                      <button onClick={() => { handleNav('/orders'); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Package className="w-4 h-4" /> My Orders
                      </button>
                      {isAdmin && (
                        <button onClick={() => { handlePortalNav('admin'); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50">
                          <LayoutDashboard className="w-4 h-4" /> Admin Panel
                        </button>
                      )}
                      {isRestaurantOwner && (
                        <button onClick={() => { handlePortalNav('vendor'); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
                          <StoreIcon className="w-4 h-4" /> My Restaurant
                        </button>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={() => { signOut({ redirect: false }); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => setShowLogin(true)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                  Login
                </button>
                <button onClick={() => setShowRegister(true)} className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                  Register
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.path ? 'text-primary bg-primary/10' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" /> {item.label}
                </button>
              ))}
              {isAuthenticated ? (
                <>
                  <button onClick={() => handleNav('/orders')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <Package className="w-5 h-5" /> My Orders
                  </button>
                  <button onClick={() => handleNav('/profile')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <User className="w-5 h-5" /> Profile
                  </button>
                  {(isAdmin || isRestaurantOwner) && (
                    <button onClick={() => handlePortalNav(getPortalSection())} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isRestaurantOwner ? 'text-emerald-700 hover:bg-emerald-50' : 'text-orange-600 hover:bg-orange-50'
                    }`}>
                      {isRestaurantOwner ? <StoreIcon className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
                      {getPortalLabel()}
                    </button>
                  )}
                  <button onClick={() => { signOut({ redirect: false }); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setShowLogin(true); setMobileOpen(false); }} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50">Login</button>
                  <button onClick={() => { setShowRegister(true); setMobileOpen(false); }} className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-orange-600">Register</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
