'use client';

import { useUIStore } from '@/stores/ui-store';
import { X } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function LoginForm() {
  const { setShowLogin } = useUIStore();
  const { setShowRegister } = useUIStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError(result.error);
    } else {
      setShowLogin(false);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={() => setShowLogin(false)}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <button onClick={() => setShowLogin(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 transition-all">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{' '}
          <button onClick={() => setShowRegister(true)} className="text-primary font-semibold hover:underline">Register</button>
        </p>
      </div>
    </div>
  );
}
