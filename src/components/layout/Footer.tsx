'use client';

import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const router = useRouter();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>NaijaBites</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Order delicious Nigerian meals from the best restaurants. Fast delivery, secure payment.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { key: 'home', label: 'Home', path: '/' },
                { key: 'restaurants', label: 'Restaurants', path: '/restaurants' },
                { key: 'menu', label: 'Menu', path: '/menu' },
              ].map((item) => (
                <li key={item.key}>
                  <button onClick={() => router.push(item.path)} className="text-sm text-gray-400 hover:text-primary transition-colors">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-primary" /> +234 801 234 5678</li>
              <li className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-primary" /> info@naijabites.ng</li>
              <li className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-primary" /> Lagos, Nigeria</li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-white font-semibold mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Mon - Sat</span><span className="text-gray-300">8AM - 10PM</span></li>
              <li className="flex justify-between"><span>Sunday</span><span className="text-gray-300">10AM - 8PM</span></li>
              <li className="flex justify-between"><span>Public Holidays</span><span className="text-gray-300">9AM - 6PM</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} NaijaBites. All rights reserved.</p>
          <p className="text-xs text-gray-500">Secured by <span className="text-primary">Paystack</span></p>
        </div>
      </div>
    </footer>
  );
}
