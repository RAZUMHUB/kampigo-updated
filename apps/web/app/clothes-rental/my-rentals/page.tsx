'use client';

import { Loader2, PackageOpen } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AuthGuard } from '@/components/auth/auth-guard';
import { getMyBookings, returnRentalBooking } from '@/lib/rentals-api';

export default function MyRentalsPage() {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['rental-bookings', 'mine'],
    queryFn: getMyBookings,
  });

  const returnMutation = useMutation({
    mutationFn: (bookingId: string) => returnRentalBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-bookings', 'mine'] });
    },
  });

  const activeBookings = (bookings ?? []).filter((b) => b.status === 'ACTIVE');
  const pastBookings = (bookings ?? []).filter((b) => b.status !== 'ACTIVE');

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section>
          <h1 className="text-3xl font-bold sm:text-4xl">My Rentals</h1>

          <p className="mt-2 text-muted-foreground">
            Track your rented clothes and rental history.
          </p>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your rentals...
          </div>
        ) : isError ? (
          <EmptyState
            title="Unable to load your rentals"
            description="Please try again in a few moments."
          />
        ) : (bookings ?? []).length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-8 w-8 text-ink-300" />}
            title="No rentals yet"
            description="Browse listings to rent something from another student."
          />
        ) : (
          <>
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Active Rentals</h2>

              {activeBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have anything rented right now.
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {activeBookings.map((booking) => (
                    <Card key={booking.id} className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold">
                          {booking.rental.title}
                        </h3>
                        <Badge>Active</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Rented from {booking.rental.owner.displayName}
                      </p>

                      <p className="font-bold">
                        ₹{booking.rental.pricePerDay}/day
                      </p>

                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={returnMutation.isPending}
                        onClick={() => returnMutation.mutate(booking.id)}
                      >
                        Mark as returned
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Rental History</h2>

              {pastBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Your completed rentals will show up here.
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {pastBookings.map((booking) => (
                    <Card key={booking.id} className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold">
                          {booking.rental.title}
                        </h3>
                        <Badge variant="secondary">
                          {booking.status === 'COMPLETED' ? 'Returned' : 'Cancelled'}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        From {booking.rental.owner.displayName}
                      </p>

                      <p className="font-bold">
                        ₹{booking.rental.pricePerDay}/day
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </AuthGuard>
  );
}
