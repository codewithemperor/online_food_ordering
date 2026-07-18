'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CheckoutPanel as CartPanel } from '@/components/cart/CartPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useUIStore } from '@/stores/ui-store';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { showLogin, showRegister } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mt-16">
        {children}
      </main>
      <Footer />
      <CartPanel />
      {showLogin && <LoginForm />}
      {showRegister && <RegisterForm />}
    </div>
  );
}
