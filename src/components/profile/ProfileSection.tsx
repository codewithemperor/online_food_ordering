'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/ui-store';
import { User, Phone, MapPin, Save, Camera } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Profile { id: string; name: string; email: string; phone: string | null; address: string | null; city: string | null; state: string | null; avatar: string | null; role: string; }

function ProfileForm({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone || '',
    address: profile.address || '',
    city: profile.city || '',
    state: profile.state || '',
  });

  const update = useMutation({
    mutationFn: (data: typeof form) => fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { toast.success('Profile updated!'); queryClient.invalidateQueries({ queryKey: ['profile'] }); },
    onError: () => toast.error('Failed to update profile'),
  });

  const setField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const nigerianStates = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
  const nigerianCities = ['Lagos','Ikeja','Lekki','Victoria Island','Ikoyi','Surulere','Abuja','Wuse','Garki','Maitama','Port Harcourt','Benin City','Ibadan','Kano','Kaduna','Enugu','Aba','Onitsha','Calabar','Uyo','Warri','Jos','Ilorin','Abeokuta','Akure','Owerri','Maiduguri','Sokoto','Yola'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-3 relative">
          {profile.avatar ? <img src={profile.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" /> : <User className="w-10 h-10 text-primary" />}
        </div>
        <h2 className="font-semibold text-lg">{profile.name}</h2>
        <p className="text-sm text-gray-500">{profile.email}</p>
        {profile.role === 'ADMIN' && <span className="mt-1 px-3 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Admin</span>}
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); update.mutate(form); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" /></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={profile.email || ''} disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+234..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" /></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
          <textarea value={form.address} onChange={(e) => setField('address', e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select value={form.city} onChange={(e) => setField('city', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none">
              <option value="">Select city</option>
              {nigerianCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select value={form.state} onChange={(e) => setField('state', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none">
              <option value="">Select state</option>
              {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={update.isPending} className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 transition-all">
          <Save className="w-4 h-4 inline mr-2" />{update.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

export function ProfileSection() {
  const { isAuthenticated } = useAuth();
  const { setShowLogin } = useUIStore();

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => fetch('/api/profile').then(r => { if (!r.ok) throw new Error('Not authenticated'); return r.json(); }).then(d => d.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Login to view your profile</h2>
          <button onClick={() => setShowLogin(true)} className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">Login</button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="py-8 max-w-2xl mx-auto px-4"><div className="bg-white rounded-xl p-6 animate-pulse space-y-4"><div className="h-20 w-20 bg-gray-200 rounded-full mx-auto" /><div className="h-5 bg-gray-200 rounded w-1/2 mx-auto" /><div className="h-10 bg-gray-100 rounded" /><div className="h-10 bg-gray-100 rounded" /><div className="h-10 bg-gray-100 rounded" /></div></div>;

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>My Profile</h1>
        {profile && <ProfileForm key={profile.id} profile={profile} />}
      </div>
    </div>
  );
}
