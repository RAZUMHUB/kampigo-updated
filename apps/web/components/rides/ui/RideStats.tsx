'use client';

import { Car, ShieldCheck, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

type RideStatsResponse = {
  upcomingRides: number;
  completedRides: number;
  activeDrivers: number;
  completionRate: number | null;
};

export function RideStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['rides', 'stats'],
    queryFn: () => api.get<RideStatsResponse>('/rides/stats'),
  });

  const stats = [
    {
      title: 'Upcoming Rides',
      value: data?.upcomingRides ?? 0,
      icon: Car,
    },
    {
      title: 'Active Drivers',
      value: data?.activeDrivers ?? 0,
      icon: Users,
    },
    {
      title: 'Completion Rate',
      value: data?.completionRate === null || data?.completionRate === undefined
        ? '—'
        : `${data.completionRate}%`,
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="mt-10 grid gap-5 sm:grid-cols-3">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-card border border-ink-100 bg-surface-raised p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <Icon className="h-8 w-8 text-ink-500" />

            {isLoading ? (
              <Skeleton className="mt-5 h-9 w-16" />
            ) : (
              <h3 className="mt-5 font-display text-3xl font-bold text-ink-900">
                {item.value}
              </h3>
            )}

            <p className="mt-2 text-sm text-ink-400">{item.title}</p>
          </div>
        );
      })}
    </section>
  );
}
