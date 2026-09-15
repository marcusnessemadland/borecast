import { Dashboard } from '@/components/Dashboard';
import { getForecast } from '@/lib/forecast';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const forecast = await getForecast();
  return <Dashboard forecast={forecast} />;
}
