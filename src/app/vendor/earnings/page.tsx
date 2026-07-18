'use client';

import { useVendorStore } from '@/stores/vendor-store';
import { RestaurantEarnings } from '@/components/restaurant-owner/VendorSections';

export default function VendorEarningsPage() {
  const { selectedRestaurantId } = useVendorStore();
  return <RestaurantEarnings restaurantId={selectedRestaurantId} />;
}
