'use client';

import { MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api-client';

type PickupPoint = {
  pickup: string;
  rideCount: number;
};

export function PickupPoints() {
  const { data: points, isLoading } = useQuery({
    queryKey: ['rides', 'popular-pickup-points'],
    queryFn: () => api.get<PickupPoint[]>('/rides/popular-pickup-points'),
  });

  if (isLoading) return null;

  return (
    <section className="mt-12">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink-900">
          Popular Pickup Points
        </h2>

        <p className="text-sm text-ink-400">
          Frequently used pickup locations by students at your campus.
        </p>
      </div>

      {!points || points.length === 0 ? (
        <EmptyState title="No pickup points yet" description="These will appear once rides are posted." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {points.map((point) => (
            <Card
              key={point.pickup}
              className="rounded-card border-ink-100 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>

              <h3 className="mt-4 font-semibold text-ink-900">{point.pickup}</h3>

              <div className="mt-2 text-sm text-ink-400">
                {point.rideCount} ride{point.rideCount === 1 ? '' : 's'} from here
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
