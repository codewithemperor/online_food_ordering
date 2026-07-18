'use client';

import { useVendorStore } from '@/stores/vendor-store';
import { RestaurantSettings } from '@/components/restaurant-owner/VendorSections';

export default function VendorSettingsPage() {
  const { selectedRestaurantId } = useVendorStore();
  return <RestaurantSettings restaurantId={selectedRestaurantId} />;
}
