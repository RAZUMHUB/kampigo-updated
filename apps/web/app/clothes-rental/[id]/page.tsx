'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Calendar, Loader2, ShieldCheck, Tag } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth/auth-guard';
import { EmptyState } from '@/components/ui/empty-state';
import { bookRental, getRental } from '@/lib/rentals-api';

export default function ClothingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: rental, isLoading, isError } = useQuery({
    queryKey: ['rentals', id],
    queryFn: () => getRental(id),
  });

  const bookMutation = useMutation({
    mutationFn: () => bookRental(id),
    onSuccess: () => {
      router.push('/clothes-rental/my-rentals');
    },
  });

  if (isLoading) {
    return (
      <AuthGuard>
        <main className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading listing...
        </main>
      </AuthGuard>
    );
  }

  if (isError || !rental) {
    return (
      <AuthGuard>
        <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <EmptyState title="Listing not found" description="It may have been removed." />
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <Card className="flex min-h-[280px] items-center justify-center rounded-2xl sm:min-h-[360px] lg:min-h-[520px]">
            <span className="text-lg text-muted-foreground">
              Photo not provided
            </span>
          </Card>

          <div className="space-y-6">
            <div>
              <Badge variant={rental.available ? 'default' : 'secondary'}>
                {rental.available ? 'Available' : 'Currently Rented'}
              </Badge>

              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{rental.title}</h1>

              <p className="mt-3 text-muted-foreground">{rental.description}</p>
            </div>

            <div className="grid gap-4 rounded-xl border p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Listed by {rental.owner.displayName}
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />₹{rental.pricePerDay} / Day
              </div>

              {rental.securityDeposit > 0 && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Security Deposit ₹{rental.securityDeposit}
                </div>
              )}
            </div>

            {bookMutation.isError && (
              <p className="text-sm text-red-600">
                {(bookMutation.error as Error).message}
              </p>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!rental.available || bookMutation.isPending}
              onClick={() => bookMutation.mutate()}
            >
              {!rental.available
                ? 'Currently Unavailable'
                : bookMutation.isPending
                  ? 'Requesting...'
                  : 'Rent Now'}
            </Button>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
