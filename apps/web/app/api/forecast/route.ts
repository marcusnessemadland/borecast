import { NextResponse } from 'next/server';
import { getForecast } from '@/lib/forecast';

export const dynamic = 'force-dynamic';

export async function GET() {
  const forecast = await getForecast();
  return NextResponse.json(forecast, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800' },
  });
}
