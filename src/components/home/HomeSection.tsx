'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { motion } from 'framer-motion';
import { Search, Truck, UtensilsCrossed, Plus, ChevronRight, Flame, Clock, MapPin } from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { useState } from 'react';

interface FoodItem { id: string; name: string; description: string | null; price: number; image: string | null; isAvailable: boolean; category: { id: string; name: string }; restaurant: { id: string; name: string }; }
interface RestaurantItem { id: string; name: string; description: string | null; image: string | null; city: string | null; address: string | null; openTime: string | null; closeTime: string | null; isActive: boolean; category: { id: string; name: string }; _count?: { foods: number }; }
interface CategoryItem { id: string; name: string; image: string | null; }

export function HomeSection() {
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: foods = [], isLoading: foodsLoading } = useQuery<FoodItem[]>({
    queryKey: ['foods', 'popular'],
    queryFn: () => fetch('/api/foods?limit=8').then(r => r.json()).then(d => d.data || []),
  });

  const { data: restaurants = [], isLoading: restLoading } = useQuery<RestaurantItem[]>({
    queryKey: ['restaurants', 'featured'],
    queryFn: () => fetch('/api/restaurants?limit=6').then(r => r.json()).then(d => d.data || []),
  });

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || []),
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

  const goToRestaurantMenu = (restaurantId: string) => {
    router.push(`/menu?restaurant=${encodeURIComponent(restaurantId)}`);
  };

  const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
  const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                <Truck className="w-4 h-4" />
                <span className="text-sm font-medium">Free delivery on orders over ₦5,000</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Order Delicious <span style={{ fontFamily: 'var(--font-accent)' }}>Nigerian</span> Meals
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-lg">From the best restaurants in Lagos, Abuja & beyond. Jollof, Suya, Pounded Yam — all your favourites!</p>
              <div className="flex gap-3 max-w-lg">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for food or restaurants..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-white/50 outline-none"
                  />
                </div>
                <button onClick={handleSearch} className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                  Search
                </button>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => router.push('/menu')} className="px-6 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl font-medium hover:bg-white/30 transition-colors">
                  Order Now
                </button>
                <button onClick={() => router.push('/restaurants')} className="px-6 py-2.5 border-2 border-white/40 rounded-xl font-medium hover:bg-white/10 transition-colors">
                  Browse Restaurants
                </button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="hidden md:block">
              <div className="relative">
                <div className="w-full h-80 bg-white/10 rounded-3xl backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <Flame className="w-20 h-20 mx-auto mb-4 text-yellow-300" />
                    <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>Naija Flavours</p>
                    <p className="text-white/60 text-sm">Delivered to your door</p>
                  </div>
                </div>
                {/* Floating cards */}
                {foods.slice(0, 2).map((food, i) => (
                  <motion.div
                    key={food.id}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    className={`absolute ${i === 0 ? '-bottom-4 -left-4' : '-top-4 -right-4'} bg-white rounded-xl shadow-lg p-3 flex items-center gap-2`}
                  >
                    {food.image ? <img src={food.image} alt={food.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">🍽️</div>}
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{food.name}</p>
                      <p className="text-xs text-red-600 font-bold">{formatNaira(food.price)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>How It Works</h2>
            <p className="text-gray-500 mt-2">Get your food in 3 easy steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: UtensilsCrossed, title: 'Choose Restaurant', desc: 'Browse our curated list of the best Nigerian restaurants', step: '1' },
              { icon: Search, title: 'Select Your Meals', desc: 'Pick from their delicious menu options', step: '2' },
              { icon: Truck, title: 'Fast Delivery', desc: 'Pay securely & get food delivered to your door', step: '3' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                  <item.icon className="w-8 h-8 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR FOODS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>Popular Dishes</h2>
              <p className="text-gray-500 mt-1">Most ordered this week</p>
            </div>
            <button onClick={() => router.push('/menu')} className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {foodsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4"><div className="h-5 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-3" /><div className="flex justify-between"><div className="h-5 bg-gray-200 rounded w-1/4" /><div className="h-10 w-10 bg-gray-200 rounded-full" /></div></div>
                </div>
              ))
            ) : foods.map((food) => (
              <motion.div key={food.id} variants={fadeUp} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100 group">
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {food.image ? (
                    <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                  )}
                  {!food.isAvailable && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">Unavailable</span></div>}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (food.isAvailable) handleAddToCart(food); }}
                    disabled={!food.isAvailable}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{food.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{food.restaurant.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1">{food.description || ''}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="font-bold text-lg text-gray-900"><span className="naira-symbol text-sm">₦</span>{food.price.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURED RESTAURANTS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>Featured Restaurants</h2>
              <p className="text-gray-500 mt-1">Top-rated spots near you</p>
            </div>
            <button onClick={() => router.push('/restaurants')} className="flex items-center gap-1 text-primary font-semibold text-sm hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hidden pb-4 mb-6">
            <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0">All</button>
            {categories.map((cat) => (
              <button key={cat.id} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 hover:bg-primary/20 transition-colors">
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse border border-gray-100">
                  <div className="h-52 bg-gray-200" />
                  <div className="p-4"><div className="h-5 bg-gray-200 rounded w-2/3 mb-2" /><div className="h-4 bg-gray-100 rounded w-1/2 mb-2" /><div className="h-10 bg-gray-100 rounded" /></div>
                </div>
              ))
            ) : restaurants.map((rest) => (
              <motion.div key={rest.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
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
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{rest.address || rest.city || 'Nigeria'}</span>
                  </div>
                  {rest.openTime && rest.closeTime && (
                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{rest.openTime} - {rest.closeTime}</span>
                    </div>
                  )}
                  <button onClick={() => goToRestaurantMenu(rest.id)} className="w-full mt-3 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm">
                    View Menu
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Hungry? Order Now!</h2>
          <p className="text-white/80 mb-8">Browse our menu and get your favourite Nigerian meals delivered fast</p>
          <button onClick={() => router.push('/menu')} className="px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors text-lg">
            Browse Menu
          </button>
        </div>
      </section>
    </div>
  );
}
