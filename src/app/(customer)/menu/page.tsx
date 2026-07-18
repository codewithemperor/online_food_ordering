import { MenuSection } from '@/components/foods/MenuSection';
import { Suspense } from 'react';

export default function MenuPage() {
  return (
    <Suspense>
      <MenuSection />
    </Suspense>
  );
}
