'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, MapPin, Clock, Search, Store } from 'lucide-react';
import { useState } from 'react';

interface RestaurantItem { id: string; name: string; description: string | null; image: string | null; city: string | null; address: string | null; openTime: string | null; closeTime: string | null; isActive: boolean; category: { id: string; name: string }; _count?: { foods: number }; }
interface CategoryItem { id: string; name: string; image: string | null; }

export function RestaurantsSection() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || []),
  });

  const { data: restaurants = [], isLoading } = useQuery<RestaurantItem[]>({
    queryKey: ['restaurants', selectedCategory, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      return fetch(`/api/restaurants?${params}`).then(r => r.json()).then(d => d.data || []);
    },
  });

  const goToMenu = (restaurantId: string) => {
    router.push(`/menu?restaurant=${encodeURIComponent(restaurantId)}`);
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>Restaurants</h1>
          <p className="text-gray-500 mt-1">Browse the best restaurants near you</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-4 mb-6">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${!selectedCategory ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse border border-gray-100">
                <div className="h-52 bg-gray-200" />
                <div className="p-4"><div className="h-5 bg-gray-200 rounded w-2/3 mb-2" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-2" /><div className="h-10 bg-gray-100 rounded" /></div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No restaurants found</h3>
            <p className="text-gray-400 text-sm">Try a different filter or search</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((rest) => (
              <div key={rest.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="h-52 bg-gray-100 relative overflow-hidden">
                  {rest.image ? (
                    <img src={rest.image} alt={rest.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                      <UtensilsCrossed className="w-12 h-12 text-orange-400" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">{rest.category.name}</span>
                  {!rest.isActive && <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">Closed</div>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900">{rest.name}</h3>
                  {rest.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{rest.description}</p>}
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{rest.address || rest.city || 'Nigeria'}</span>
                  </div>
                  {rest.openTime && rest.closeTime && (
                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{rest.openTime} - {rest.closeTime}</span>
                    </div>
                  )}
                  <button onClick={() => goToMenu(rest.id)} className="w-full mt-3 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm">
                    View Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
