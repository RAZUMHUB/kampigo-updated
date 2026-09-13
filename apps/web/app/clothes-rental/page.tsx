'use client';

import Link from 'next/link';
import { ArrowRight, Loader2, PlusCircle, ShirtIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth/auth-guard';
import { EmptyState } from '@/components/ui/empty-state';
import { ClothingCard } from '@/components/clothes/ClothingCard';
import { listRentals } from '@/lib/rentals-api';

export default function ClothesRentalPage() {
  const { data: rentals, isLoading, isError } = useQuery({
    queryKey: ['rentals', 'CLOTHES'],
    queryFn: () => listRentals('CLOTHES'),
  });

  const recent = (rentals ?? []).slice(0, 4);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-10 rounded-3xl border p-8">
          <h1 className="text-3xl font-bold sm:text-4xl">Campus Clothes Rental</h1>

          <p className="mt-3 text-muted-foreground">
            Rent clothes from fellow students for interviews, parties, festivals and special occasions.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button>
              <Link href="/clothes-rental/browse" className="flex items-center">
                Browse
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline">
              <Link href="/clothes-rental/list-item" className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                List Item
              </Link>
            </Button>
          </div>
        </div>

        <h2 className="mb-6 text-2xl font-semibold">Recently Listed</h2>

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
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<ShirtIcon className="h-8 w-8 text-ink-300" />}
            title="No listings yet"
            description="Be the first to list something for rent on your campus."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recent.map((item) => (
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
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
