'use client';

import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api-client';

type PopularRoute = {
  pickup: string;
  destination: string;
  rideCount: number;
};

export function PopularRoutesGrid() {
  const { data: routes, isLoading } = useQuery({
    queryKey: ['rides', 'popular-routes'],
    queryFn: () => api.get<PopularRoute[]>('/rides/popular-routes'),
  });

  if (isLoading) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">
            Popular Routes
          </h2>

          <p className="text-sm text-ink-400">
            Frequently travelled routes by students at your campus.
          </p>
        </div>
      </div>

      {!routes || routes.length === 0 ? (
        <EmptyState title="No routes yet" description="Popular routes will appear once rides are posted." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {routes.map((route) => (
            <Card
              key={`${route.pickup}-${route.destination}`}
              className="rounded-card border-ink-100 p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-ink-900">
                      {route.pickup}
                    </span>
                  </div>

                  <div className="ml-7 my-2 text-ink-300">↓</div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-ink-900">
                      {route.destination}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-ink-400">
                    {route.rideCount} ride{route.rideCount === 1 ? '' : 's'} posted
                  </p>
                </div>

                <Link
                  href="/ride-sharing/search"
                  className="rounded-full border border-ink-100 p-3 transition hover:bg-surface-sunken"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
