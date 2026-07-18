'use client';

import { useVendorStore } from '@/stores/vendor-store';
import { RestaurantDashboard } from '@/components/restaurant-owner/VendorSections';

export default function VendorDashboardPage() {
  const { selectedRestaurantId } = useVendorStore();
  return <RestaurantDashboard restaurantId={selectedRestaurantId} />;
}
