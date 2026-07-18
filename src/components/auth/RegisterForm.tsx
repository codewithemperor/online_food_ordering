'use client';

import { useUIStore } from '@/stores/ui-store';
import { X } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function RegisterForm() {
  const { setShowRegister, setShowLogin } = useUIStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      setShowRegister(false);
    } catch { setError('Something went wrong'); }
    setLoading(false);
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={() => setShowRegister(false)}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Account</h2>
          <button onClick={() => setShowRegister(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+234..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label><textarea value={form.address} onChange={(e) => update('address', e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 transition-all">{loading ? 'Creating account...' : 'Create Account'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <button onClick={() => setShowLogin(true)} className="text-primary font-semibold hover:underline">Sign In</button></p>
      </div>
    </div>
  );
}
