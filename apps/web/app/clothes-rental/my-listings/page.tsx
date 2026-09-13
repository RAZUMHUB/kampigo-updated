'use client';

import Link from 'next/link';
import { Loader2, PlusCircle, ShirtIcon, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AuthGuard } from '@/components/auth/auth-guard';
import { deleteRental, getMyRentals, updateRental } from '@/lib/rentals-api';

export default function MyListingsPage() {
  const queryClient = useQueryClient();

  const { data: rentals, isLoading, isError } = useQuery({
    queryKey: ['rentals', 'mine'],
    queryFn: getMyRentals,
  });

  const clothingListings = (rentals ?? []).filter(
    (rental) => rental.category === 'CLOTHES'
  );

  const toggleMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      updateRental(id, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals', 'mine'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRental(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals', 'mine'] });
    },
  });

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">My Listings</h1>

            <p className="mt-2 text-muted-foreground">
              Manage all the clothes you&apos;ve listed for rent.
            </p>
          </div>

          <Button size="lg">
            <Link href="/clothes-rental/list-item" className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Listing
            </Link>
          </Button>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your listings...
          </div>
        ) : isError ? (
          <EmptyState
            title="Unable to load your listings"
            description="Please try again in a few moments."
          />
        ) : clothingListings.length === 0 ? (
          <EmptyState
            icon={<ShirtIcon className="h-8 w-8 text-ink-300" />}
            title="No listings yet"
            description="Add your first item to start renting it out."
          />
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {clothingListings.map((item) => (
              <Card key={item.id} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.title}</h3>

                  <Badge variant={item.available ? 'default' : 'secondary'}>
                    {item.available ? 'Available' : 'Rented'}
                  </Badge>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>

                <p className="font-bold">₹{item.pricePerDay}/day</p>

                <div className="flex items-center gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={toggleMutation.isPending}
                    onClick={() =>
                      toggleMutation.mutate({
                        id: item.id,
                        available: !item.available,
                      })
                    }
                  >
                    Mark as {item.available ? 'rented' : 'available'}
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Delete this listing?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </section>
        )}
      </main>
    </AuthGuard>
  );
}
