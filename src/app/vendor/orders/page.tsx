'use client';

import { useVendorStore } from '@/stores/vendor-store';
import { RestaurantOrders } from '@/components/restaurant-owner/VendorSections';

export default function VendorOrdersPage() {
  const { selectedRestaurantId } = useVendorStore();
  return <RestaurantOrders restaurantId={selectedRestaurantId} />;
}
