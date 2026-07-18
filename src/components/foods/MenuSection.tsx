'use client';

import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cart-store';
import { Search, Plus, Utensils, Filter } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

interface FoodItem { id: string; name: string; description: string | null; price: number; image: string | null; isAvailable: boolean; category: { id: string; name: string }; restaurant: { id: string; name: string }; }
interface CategoryItem { id: string; name: string; image: string | null; }
interface RestaurantItem { id: string; name: string; }

export function MenuSection() {
  const addItem = useCartStore(s => s.addItem);
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(searchParams.get('restaurant') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || []),
  });

  const { data: restaurantList = [] } = useQuery<RestaurantItem[]>({
    queryKey: ['restaurants-list'],
    queryFn: () => fetch('/api/restaurants').then(r => r.json()).then(d => d.data || []),
  });

  const { data: foods = [], isLoading } = useQuery<FoodItem[]>({
    queryKey: ['foods', selectedCategory, selectedRestaurant, searchQuery, showAvailableOnly],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (selectedRestaurant) params.set('restaurantId', selectedRestaurant);
      if (searchQuery) params.set('search', searchQuery);
      if (showAvailableOnly) params.set('isAvailable', 'true');
      return fetch(`/api/foods?${params}`).then(r => r.json()).then(d => d.data || []);
    },
  });

  const handleAddToCart = (food: FoodItem) => {
    addItem({
      foodId: food.id,
      foodName: food.name,
      foodImage: food.image,
      price: food.price,
      restaurantId: food.restaurant.id,
      restaurantName: food.restaurant.name,
      categoryId: food.category.id,
    });
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>Menu</h1>
          <p className="text-gray-500 mt-1">{foods.length} items available</p>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for food..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-primary outline-none text-sm"
            >
              <option value="">All Restaurants</option>
              {restaurantList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer">
              <input type="checkbox" checked={showAvailableOnly} onChange={(e) => setShowAvailableOnly(e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-gray-700">Available only</span>
            </label>
          </div>

          {/* Category pills */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-2">
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
        </div>

        {/* Food Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4"><div className="h-5 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-3" /><div className="flex justify-between"><div className="h-5 bg-gray-200 rounded w-1/4" /><div className="h-10 w-10 bg-gray-200 rounded-full" /></div></div>
              </div>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-16">
            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No food items found</h3>
            <p className="text-gray-400 text-sm">Try different filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {foods.map((food) => (
              <div key={food.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100 group">
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {food.image ? (
                    <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                  )}
                  {!food.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">Unavailable</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (food.isAvailable) handleAddToCart(food); }}
                    disabled={!food.isAvailable}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">{food.category.name}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{food.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{food.restaurant.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1 min-h-[2rem]">{food.description || ''}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="font-bold text-lg text-gray-900">
                      <span className="naira-symbol text-sm">₦</span>{food.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
