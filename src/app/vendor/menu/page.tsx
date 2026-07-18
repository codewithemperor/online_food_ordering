'use client';

import { useVendorStore } from '@/stores/vendor-store';
import { RestaurantMenu } from '@/components/restaurant-owner/VendorSections';

export default function VendorMenuPage() {
  const { selectedRestaurantId } = useVendorStore();
  return <RestaurantMenu restaurantId={selectedRestaurantId} />;
}
