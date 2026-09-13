'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShirtIcon } from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { EmptyState } from '@/components/ui/empty-state';
import { ClothingCard } from '@/components/clothes/ClothingCard';
import { ClothingFilter, ClothingSort } from '@/components/clothes/ClothingFilter';
import { listRentals } from '@/lib/rentals-api';

export default function BrowseClothesPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ClothingSort>('newest');

  const { data: rentals, isLoading, isError } = useQuery({
    queryKey: ['rentals', 'CLOTHES'],
    queryFn: () => listRentals('CLOTHES'),
  });

  const visibleRentals = useMemo(() => {
    if (!rentals) return [];

    const filtered = search.trim()
      ? rentals.filter((rental) =>
          rental.title.toLowerCase().includes(search.trim().toLowerCase())
        )
      : rentals;

    return [...filtered].sort((a, b) => {
      if (sort === 'price-asc') return a.pricePerDay - b.pricePerDay;
      if (sort === 'price-desc') return b.pricePerDay - a.pricePerDay;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [rentals, search, sort]);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section>
          <h1 className="text-3xl font-bold sm:text-4xl">Browse Clothes</h1>

          <p className="mt-2 text-muted-foreground">
            Discover outfits shared by students across your campus.
          </p>
        </section>

        <ClothingFilter
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
        />

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading listings...
          </div>
        ) : isError ? (
          <EmptyState
            title="Unable to load listings"
            description="Please try again in a few moments."
          />
        ) : visibleRentals.length === 0 ? (
          <EmptyState
            icon={<ShirtIcon className="h-8 w-8 text-ink-300" />}
            title={search ? 'No matches found' : 'No listings yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Be the first to list something for rent on your campus.'
            }
          />
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleRentals.map((item) => (
              <ClothingCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                ownerName={item.owner.displayName}
                pricePerDay={item.pricePerDay}
                securityDeposit={item.securityDeposit}
                available={item.available}
              />
            ))}
          </section>
        )}
      </main>
    </AuthGuard>
  );
}
