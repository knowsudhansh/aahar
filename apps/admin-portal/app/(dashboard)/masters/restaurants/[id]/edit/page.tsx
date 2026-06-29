import { RestaurantEditPageClient } from '@/components/organization/organization-pages';

interface EditRestaurantPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRestaurantPage({ params }: EditRestaurantPageProps) {
  const { id } = await params;

  return <RestaurantEditPageClient restaurantId={id} />;
}
