'use client';

import { useMemo, useState } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { RideSearchForm } from '@/components/rides/RideSearchForm';
import { RideCard } from '@/components/rides/RideCard';
import { RideFilters, RideFilter } from '@/components/rides/ui/RideFilters';
import { RideCardSkeleton } from '@/components/rides/ui/RideCardSkeleton';
import { EmptyRides } from '@/components/rides/ui/EmptyRides';
import { useRides } from '@/hooks/use-rides';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function RideSearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RideFilter>(null);
  const { data, isLoading, error } = useRides(query);

  const visibleRides = useMemo(() => {
    const rides = data?.rides ?? [];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);

    let filtered = rides;

    if (filter === 'today') {
      filtered = rides.filter((r) => isSameDay(new Date(r.departureDateTime), now));
    } else if (filter === 'tomorrow') {
      filtered = rides.filter((r) => isSameDay(new Date(r.departureDateTime), tomorrow));
    } else if (filter === 'week') {
      filtered = rides.filter((r) => {
        const d = new Date(r.departureDateTime);
        return d >= now && d <= weekFromNow;
      });
    }

    if (filter === 'price') {
      filtered = [...filtered].sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    } else if (filter === 'seats') {
      filtered = [...filtered].sort((a, b) => b.seatsLeft - a.seatsLeft);
    }

    return filtered;
  }, [data, filter]);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <RideSearchForm onSearch={setQuery} />

        <RideFilters active={filter} onChange={setFilter} />

        {isLoading && (
          <div className="space-y-6">
            <RideCardSkeleton />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </div>
        )}

        {!isLoading && error && (
          <EmptyRides
            title="Unable to load rides"
            description="Please try again in a few moments."
          />
        )}

        {!isLoading && !error && visibleRides.length === 0 && <EmptyRides />}

        {!isLoading &&
          !error &&
          visibleRides.map((ride) => (
            <RideCard
              key={ride.id}
              id={ride.id}
              driverName={ride.driver.displayName}
              pickup={ride.pickup}
              destination={ride.destination}
              date={new Date(ride.departureDateTime).toLocaleDateString()}
              time={new Date(ride.departureDateTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
              seatsLeft={ride.seatsLeft}
              price={ride.pricePerSeat}
              vehicle={ride.vehicle}
            />
          ))}
      </main>
    </AuthGuard>
  );
}
