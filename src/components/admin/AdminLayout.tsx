'use client';

import { useAuth } from '@/hooks/useAuth';
import { useNavigationStore } from '@/stores/navigation-store';
import { useUIStore } from '@/stores/ui-store';
import { LayoutDashboard, Store, Tag, UtensilsCrossed, ShoppingCart, Users, DollarSign, LogOut, ArrowLeft, Plus, Edit, Trash2, Search, Upload, X, CheckCircle, XCircle, Clock, ChefHat, Truck, Eye, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatNaira, getStatusColor } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';

type AdminSection = 'dashboard' | 'restaurants' | 'categories' | 'foods' | 'orders' | 'customers' | 'earnings' | 'owners';

const adminNav = [
  { key: 'dashboard' as AdminSection, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'restaurants' as AdminSection, label: 'Restaurants', icon: Store },
  { key: 'categories' as AdminSection, label: 'Categories', icon: Tag },
  { key: 'foods' as AdminSection, label: 'Food Menu', icon: UtensilsCrossed },
  { key: 'orders' as AdminSection, label: 'Orders', icon: ShoppingCart },
  { key: 'customers' as AdminSection, label: 'Customers', icon: Users },
  { key: 'earnings' as AdminSection, label: 'Earnings', icon: DollarSign },
  { key: 'owners' as AdminSection, label: 'Owners', icon: UserCheck },
];

function StatusBadge({ status }: { status: string }) {
  const colors = getStatusColor(status);
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>{status.replace(/_/g, ' ')}</span>;
}

// ─── DASHBOARD ──────────────────────────
function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch('/api/dashboard/stats').then(r => r.json()).then(d => d.data),
  });

  const statCards = [
    { label: 'Restaurants', value: stats?.totalRestaurants || 0, icon: Store, color: 'text-orange-500 bg-orange-50', border: 'border-l-orange-500' },
    { label: 'Food Items', value: stats?.totalFoods || 0, icon: UtensilsCrossed, color: 'text-blue-500 bg-blue-50', border: 'border-l-blue-500' },
    { label: 'Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'text-green-500 bg-green-50', border: 'border-l-green-500' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'text-purple-500 bg-purple-50', border: 'border-l-purple-500' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Clock, color: 'text-yellow-500 bg-yellow-50', border: 'border-l-yellow-500' },
    { label: "Today's Orders", value: stats?.todayOrders || 0, icon: LayoutDashboard, color: 'text-indigo-500 bg-indigo-50', border: 'border-l-indigo-500' },
    { label: 'Total Earnings', value: formatNaira(stats?.totalEarnings || 0), icon: DollarSign, color: 'text-emerald-500 bg-emerald-50', border: 'border-l-emerald-500' },
    { label: 'Cancelled', value: stats?.cancelledOrders || 0, icon: XCircle, color: 'text-red-500 bg-red-50', border: 'border-l-red-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-xl p-6 animate-pulse border-l-4 border-gray-200"><div className="h-10 bg-gray-100 rounded mb-2" /><div className="h-4 bg-gray-100 rounded w-1/2" /></div>)
        : statCards.map((card, i) => (
          <div key={i} className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${card.border}`}>
            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-3`}><card.icon className="w-6 h-6" /></div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CATEGORIES ──────────────────────────
function AdminCategories() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', image: '' });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || []) });

  const saveMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/categories', { method: editItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem ? { ...data, id: editItem.id } : data) }).then(r => r.json()),
    onSuccess: () => { toast.success(editItem ? 'Category updated' : 'Category created'); setShowForm(false); setEditItem(null); setForm({ name: '', description: '', image: '' }); qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: () => toast.error('Failed to save category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/categories?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries({ queryKey: ['categories'] }); },
    onError: () => toast.error('Failed to delete'),
  });

  const handleEdit = (cat: any) => { setEditItem(cat); setForm({ name: cat.name, description: cat.description || '', image: cat.image || '' }); setShowForm(true); };
  const handleUpload = async (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.data?.url) setForm(p => ({ ...p, image: data.data.url }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <button onClick={() => { setEditItem(null); setForm({ name: '', description: '', image: '' }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"><Plus className="w-4 h-4" /> Add Category</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">{editItem ? 'Edit Category' : 'New Category'}</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Image</label><input type="file" accept="image/*" onChange={handleUpload} className="w-full" />{form.image && <img src={form.image} alt="Preview" className="w-20 h-20 rounded-lg mt-2 object-cover" />}</div>
            <div className="flex gap-3"><button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saveMutation.isPending ? 'Saving...' : 'Save'}</button><button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button></div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat: any) => (
          <div key={cat.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="h-32 bg-gray-100 relative">{cat.image ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Tag className="w-8 h-8 text-gray-400" /></div>}</div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => handleEdit(cat)} className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Edit className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => confirm('Delete this category?') && deleteMutation.mutate(cat.id)} className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RESTAURANTS ──────────────────────────
function AdminRestaurants() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', email: '', phone: '', address: '', city: '', state: '', openTime: '', closeTime: '', openDays: '', image: '', categoryId: '', isActive: true });

  const { data: restaurants = [] } = useQuery({ queryKey: ['restaurants-admin'], queryFn: () => fetch('/api/restaurants').then(r => r.json()).then(d => d.data || []) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || []) });

  const saveMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/restaurants', { method: editItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem ? { ...data, id: editItem.id } : data) }).then(r => r.json()),
    onSuccess: () => { toast.success(editItem ? 'Restaurant updated' : 'Restaurant created'); setShowForm(false); setEditItem(null); qc.invalidateQueries({ queryKey: ['restaurants-admin'] }); },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/restaurants?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { toast.success('Restaurant deleted'); qc.invalidateQueries({ queryKey: ['restaurants-admin'] }); },
  });

  const handleEdit = (r: any) => { setEditItem(r); setForm({ name: r.name, description: r.description || '', email: r.email || '', phone: r.phone || '', address: r.address || '', city: r.city || '', state: r.state || '', openTime: r.openTime || '', closeTime: r.closeTime || '', openDays: r.openDays || '', image: r.image || '', categoryId: r.categoryId || r.category?.id || '', isActive: r.isActive }); setShowForm(true); };
  const handleUpload = async (e: any) => { const file = e.target.files[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); const res = await fetch('/api/upload', { method: 'POST', body: fd }); const data = await res.json(); if (data.data?.url) setForm(p => ({ ...p, image: data.data.url })); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Restaurants</h2>
        <button onClick={() => { setEditItem(null); setForm({ name: '', description: '', email: '', phone: '', address: '', city: '', state: '', openTime: '', closeTime: '', openDays: '', image: '', categoryId: '', isActive: true }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600"><Plus className="w-4 h-4" /> Add Restaurant</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">{editItem ? 'Edit Restaurant' : 'New Restaurant'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"><option value="">Select category</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input type="text" value={form.state} onChange={(e) => setForm(p => ({ ...p, state: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Open / Close Time</label><div className="flex gap-2"><input type="text" value={form.openTime} onChange={(e) => setForm(p => ({ ...p, openTime: e.target.value }))} placeholder="08:00" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /><input type="text" value={form.closeTime} onChange={(e) => setForm(p => ({ ...p, closeTime: e.target.value }))} placeholder="22:00" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Open Days</label><input type="text" value={form.openDays} onChange={(e) => setForm(p => ({ ...p, openDays: e.target.value }))} placeholder="Mon-Sat" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Image</label><input type="file" accept="image/*" onChange={handleUpload} className="w-full" />{form.image && <img src={form.image} alt="" className="w-20 h-20 rounded-lg mt-2 object-cover" />}</div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-primary" /><label className="text-sm font-medium text-gray-700">Active</label></div>
          </div>
          <div className="flex gap-3 mt-4"><button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saveMutation.isPending ? 'Saving...' : 'Save'}</button><button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button></div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Image</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">City</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {restaurants.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.image ? <img src={r.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Store className="w-5 h-5 text-orange-400" /></div>}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.category?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.city || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Edit className="w-4 h-4" /></button><button onClick={() => confirm('Delete?') && deleteMutation.mutate(r.id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── FOODS ──────────────────────────
function AdminFoods() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', restaurantId: '', image: '', isAvailable: true });

  const { data: foods = [] } = useQuery({ queryKey: ['foods-admin', search], queryFn: () => fetch(`/api/foods${search ? `?search=${search}` : ''}`).then(r => r.json()).then(d => d.data || []) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || []) });
  const { data: restaurants = [] } = useQuery({ queryKey: ['restaurants-list'], queryFn: () => fetch('/api/restaurants').then(r => r.json()).then(d => d.data || []) });

  const saveMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/foods', { method: editItem ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem ? { ...data, id: editItem.id } : data) }).then(r => r.json()),
    onSuccess: () => { toast.success(editItem ? 'Food updated' : 'Food created'); setShowForm(false); setEditItem(null); qc.invalidateQueries({ queryKey: ['foods-admin'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/foods?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { toast.success('Food deleted'); qc.invalidateQueries({ queryKey: ['foods-admin'] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => fetch('/api/foods', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isAvailable }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods-admin'] }),
  });

  const handleEdit = (f: any) => { setEditItem(f); setForm({ name: f.name, description: f.description || '', price: String(f.price), categoryId: f.categoryId || f.category?.id || '', restaurantId: f.restaurantId || f.restaurant?.id || '', image: f.image || '', isAvailable: f.isAvailable }); setShowForm(true); };
  const handleUpload = async (e: any) => { const file = e.target.files[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); const res = await fetch('/api/upload', { method: 'POST', body: fd }); const data = await res.json(); if (data.data?.url) setForm(p => ({ ...p, image: data.data.url })); };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Food Menu</h2>
        <button onClick={() => { setEditItem(null); setForm({ name: '', description: '', price: '', categoryId: '', restaurantId: '', image: '', isAvailable: true }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600"><Plus className="w-4 h-4" /> Add Food</button>
      </div>

      <div className="relative mb-4 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">{editItem ? 'Edit Food' : 'New Food'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label><input type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"><option value="">Select</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Restaurant *</label><select value={form.restaurantId} onChange={(e) => setForm(p => ({ ...p, restaurantId: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none"><option value="">Select</option>{restaurants.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Image</label><input type="file" accept="image/*" onChange={handleUpload} className="w-full" />{form.image && <img src={form.image} alt="" className="w-20 h-20 rounded-lg mt-2 object-cover" />}</div>
            <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="w-4 h-4 accent-primary" /><label className="text-sm font-medium text-gray-700">Available</label></div>
          </div>
          <div className="flex gap-3 mt-4"><button onClick={() => saveMutation.mutate({ ...form, price: Number(form.price) })} disabled={saveMutation.isPending} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saveMutation.isPending ? 'Saving...' : 'Save'}</button><button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button></div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Image</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Restaurant</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Available</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {foods.map((f: any) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{f.image ? <img src={f.image} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">🍽️</div>}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{f.category?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{f.restaurant?.name}</td>
                  <td className="px-4 py-3 font-semibold">{formatNaira(f.price)}</td>
                  <td className="px-4 py-3"><button onClick={() => toggleMutation.mutate({ id: f.id, isAvailable: !f.isAvailable })} className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{f.isAvailable ? 'Yes' : 'No'}</button></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(f)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Edit className="w-4 h-4" /></button><button onClick={() => confirm('Delete?') && deleteMutation.mutate(f.id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS ──────────────────────────
function AdminOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<any>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-admin', statusFilter],
    queryFn: () => fetch(`/api/orders${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.json()).then(d => d.data || []),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, remark }: { id: string; status: string; remark?: string }) => fetch('/api/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, remark }) }).then(r => r.json()),
    onSuccess: () => { toast.success('Order status updated'); qc.invalidateQueries({ queryKey: ['orders-admin'] }); setViewOrder(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/orders?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => { toast.success('Order deleted'); qc.invalidateQueries({ queryKey: ['orders-admin'] }); },
  });

  if (viewOrder) {
    return (
      <div>
        <button onClick={() => setViewOrder(null)} className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div><h2 className="text-xl font-bold">{viewOrder.orderNumber}</h2><p className="text-gray-500 text-sm">{new Date(viewOrder.createdAt).toLocaleString()}</p></div>
            <StatusBadge status={viewOrder.status} />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3"><h4 className="font-semibold text-sm mb-1">Customer</h4><p className="text-sm">{viewOrder.customerName}</p><p className="text-sm text-gray-500">{viewOrder.customerPhone}</p><p className="text-sm text-gray-500">{viewOrder.deliveryAddress}, {viewOrder.deliveryCity}</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><h4 className="font-semibold text-sm mb-1">Payment</h4><p className="text-sm">{viewOrder.paymentMethod === 'PAYSTACK' ? 'Paystack' : 'Cash on Delivery'}</p><p className="text-sm"><span className={viewOrder.paymentStatus === 'PAID' ? 'text-green-600 font-semibold' : 'text-yellow-600'}>{viewOrder.paymentStatus}</span></p><p className="text-lg font-bold mt-1">{formatNaira(viewOrder.totalAmount)}</p></div>
          </div>
          <h4 className="font-semibold text-sm mb-2">Items</h4>
          <div className="space-y-1 mb-4">
            {viewOrder.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded"><span>{item.foodName} × {item.quantity}</span><span className="font-medium">{formatNaira(item.totalPrice)}</span></div>
            ))}
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Update Status</h4>
            <div className="flex gap-2 flex-wrap">
              {['CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'].map(s => (
                <button key={s} onClick={() => updateStatus.mutate({ id: viewOrder.id, status: s })} disabled={updateStatus.isPending} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${s === 'CANCELLED' ? 'bg-red-50 text-red-600 hover:bg-red-100' : s === 'DELIVERED' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders</h2>
      <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-4 mb-4">
        {['', 'PENDING', 'CONFIRMED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s || 'All'}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order #</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              : orders.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>
              : orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-sm">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-sm">{o.customerName || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-sm">{formatNaira(o.totalAmount)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.paymentStatus}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => setViewOrder(o)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"><Eye className="w-4 h-4" /></button><button onClick={() => confirm('Delete?') && deleteMutation.mutate(o.id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOMERS ──────────────────────────
function AdminCustomers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()).then(d => d.data || []),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }).then(r => r.json()),
    onSuccess: (_, vars) => { toast.success(`User ${vars.status === 'BLOCKED' ? 'blocked' : 'unblocked'}`); },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customers</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              : users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-sm">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.phone || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{u.role !== 'ADMIN' && <button onClick={() => blockMutation.mutate({ id: u.id, status: u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' })} className={`px-3 py-1 rounded text-xs font-medium ${u.status === 'ACTIVE' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}>{u.status === 'ACTIVE' ? 'Block' : 'Unblock'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── EARNINGS ──────────────────────────
function AdminEarnings() {
  const { data, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => fetch('/api/dashboard/earnings?period=all').then(r => r.json()).then(d => d.data),
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Earnings</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-emerald-500">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-2xl font-bold text-gray-900">{formatNaira(data?.totalEarnings || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500">Paystack</p>
          <p className="text-2xl font-bold text-gray-900">{formatNaira(data?.paystackEarnings || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-orange-500">
          <p className="text-sm text-gray-500">Cash on Delivery</p>
          <p className="text-2xl font-bold text-gray-900">{formatNaira(data?.codEarnings || 0)}</p>
        </div>
      </div>
      {data?.topRestaurants?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-semibold">Top Restaurants</h3></div>
          <table className="w-full"><thead className="bg-gray-50"><tr><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Restaurant</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Orders</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Revenue</th></tr></thead>
          <tbody className="divide-y">{data.topRestaurants.map((r: any, i: number) => <tr key={i} className="hover:bg-gray-50"><td className="px-4 py-2 text-sm font-medium">{r.name}</td><td className="px-4 py-2 text-sm text-gray-500">{r.orderCount}</td><td className="px-4 py-2 text-sm font-semibold">{formatNaira(r.earnings)}</td></tr>)}</tbody></table>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN LAYOUT ──────────────────────────
// ─── RESTAURANT OWNERS ──────────────────
function AdminOwners() {
  const qc = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');

  const { data: owners = [], isLoading: loadingOwners } = useQuery({
    queryKey: ['restaurant-owners'],
    queryFn: () => fetch('/api/users?role=RESTAURANT_OWNER').then(r => r.json()).then(d => d.data || []),
  });

  const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery({
    queryKey: ['restaurants-all'],
    queryFn: () => fetch('/api/restaurants').then(r => r.json()).then(d => d.data || []),
  });

  const assignMutation = useMutation({
    mutationFn: ({ restaurantId, ownerId }: { restaurantId: string; ownerId: string }) =>
      fetch('/api/restaurants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: restaurantId, ownerId }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Owner assigned successfully');
      qc.invalidateQueries({ queryKey: ['restaurants-all'] });
      qc.invalidateQueries({ queryKey: ['restaurant-owners'] });
      setShowAssign(false);
    },
    onError: () => toast.error('Failed to assign owner'),
  });

  // Unassigned restaurants
  const unassignedRestaurants = restaurants.filter((r: any) => !r.ownerId);
  // All restaurant owners
  const ownerUsers = owners;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Restaurant Owners</h2>
        <button onClick={() => setShowAssign(!showAssign)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4" /> Assign Owner
        </button>
      </div>

      {/* Assign Owner Dialog */}
      {showAssign && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-orange-200">
          <h3 className="font-semibold text-lg mb-4">Assign Restaurant Owner</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
              <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
                <option value="">Select a restaurant</option>
                {restaurants.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name} {r.ownerId ? '(has owner)' : '(unassigned)'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner User</label>
              <select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
                <option value="">Select an owner</option>
                {ownerUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (selectedRestaurant && selectedOwner) assignMutation.mutate({ restaurantId: selectedRestaurant, ownerId: selectedOwner }); }} disabled={!selectedRestaurant || !selectedOwner || assignMutation.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">Assign</button>
              <button onClick={() => setShowAssign(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Owner List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Restaurant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingOwners ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : ownerUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No restaurant owners found. Register users with RESTAURANT_OWNER role.</td></tr>
              ) : ownerUsers.map((owner: any) => {
                const ownedRestaurants = restaurants.filter((r: any) => r.ownerId === owner.id);
                return (
                  <tr key={owner.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-emerald-700" />
                        </div>
                        <span className="font-medium text-sm">{owner.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{owner.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{owner.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {ownedRestaurants.length > 0 ? (
                        <div className="space-y-1">
                          {ownedRestaurants.map((r: any) => (
                            <span key={r.id} className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium mr-1">{r.name}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No restaurant assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${owner.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{owner.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unassigned Restaurants */}
      {unassignedRestaurants.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Unassigned Restaurants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unassignedRestaurants.map((r: any) => (
              <div key={r.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {r.image ? <img src={r.image} alt={r.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Store className="w-5 h-5 text-orange-600" /></div>}
                  <div><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-gray-500">{r.city || 'No city'}</p></div>
                </div>
                <button onClick={() => { setSelectedRestaurant(r.id); setShowAssign(true); }} className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20">Assign Owner</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminLayout() {
  const { isAdmin, isAuthenticated } = useAuth();
  const { setActiveSection } = useNavigationStore();
  const { adminSection, setAdminSection } = useNavigationStore();

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm mb-4">You need admin access to view this page</p>
          <button onClick={() => setActiveSection('home')} className="px-6 py-2.5 bg-primary text-white rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  const section = adminSection || 'dashboard';

  const renderContent = () => {
    switch (section) {
      case 'dashboard': return <AdminDashboard />;
      case 'categories': return <AdminCategories />;
      case 'restaurants': return <AdminRestaurants />;
      case 'foods': return <AdminFoods />;
      case 'orders': return <AdminOrders />;
      case 'customers': return <AdminCustomers />;
      case 'earnings': return <AdminEarnings />;
      case 'owners': return <AdminOwners />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-orange-600 text-orange-50 flex-shrink-0 fixed h-full overflow-y-auto">
        <div className="p-6">
          <button onClick={() => setActiveSection('home')} className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><UtensilsCrossed className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-bold">NaijaBites</span>
          </button>
          <nav className="space-y-1">
            {adminNav.map((item) => (
              <button
                key={item.key}
                onClick={() => setAdminSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${section === item.key ? 'bg-orange-700 text-white' : 'hover:bg-orange-700/50'}`}
              >
                <item.icon className="w-5 h-5" /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 mt-auto">
          <button onClick={() => setActiveSection('home')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-orange-200 hover:bg-orange-700/50 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Store
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-64 bg-gray-50 min-h-screen p-6">
        {renderContent()}
      </main>
    </div>
  );
}
