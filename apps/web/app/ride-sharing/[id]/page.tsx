'use client';

import { useParams } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  Car,
  Clock3,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useJoinRide, useRide } from '@/hooks/use-ride';

export default function RideDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: ride, isLoading, isError } = useRide(id);
  const joinMutation = useJoinRide(id);

  if (isLoading) {
    return (
      <AuthGuard>
        <main className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading ride...
        </main>
      </AuthGuard>
    );
  }

  if (isError || !ride) {
    return (
      <AuthGuard>
        <main className="mx-auto max-w-3xl p-8">
          <EmptyState title="Ride not found" description="It may have been cancelled or removed." />
        </main>
      </AuthGuard>
    );
  }

  const departure = new Date(ride.departureDateTime);
  const canJoin = ride.status === 'UPCOMING' && ride.seatsLeft > 0;

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <Card className="rounded-3xl p-8">
              <div className="flex items-center gap-3 text-sm font-medium text-primary">
                <ShieldCheck className="h-5 w-5" />
                Verified Student Ride
              </div>

              <div className="mt-8 flex items-center gap-5">
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <h2 className="text-2xl font-bold">{ride.pickup}</h2>
                </div>

                <ArrowRight className="h-7 w-7 text-muted-foreground" />

                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <h2 className="text-2xl font-bold">{ride.destination}</h2>
                </div>
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <Info
                  icon={<Calendar className="h-5 w-5" />}
                  title="Travel Date"
                  value={departure.toLocaleDateString()}
                />

                <Info
                  icon={<Clock3 className="h-5 w-5" />}
                  title="Departure"
                  value={departure.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />

                <Info
                  icon={<Car className="h-5 w-5" />}
                  title="Vehicle"
                  value={ride.vehicle}
                />

                <Info
                  icon={<Users className="h-5 w-5" />}
                  title="Seats Left"
                  value={String(ride.seatsLeft)}
                />
              </div>
            </Card>

            <Card className="rounded-3xl p-8">
              <h2 className="text-xl font-semibold">Driver</h2>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold">
                    {ride.driver.displayName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      {ride.driver.displayName}
                    </h3>
                  </div>
                </div>

                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24 rounded-3xl p-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Price Per Seat</p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">₹{ride.pricePerSeat}</h2>
              </div>

              <div className="my-8 border-t" />

              <div className="space-y-4">
                <Row icon={<Wallet className="h-5 w-5" />} text="Cash / UPI Accepted" />
                <Row
                  icon={<MapPin className="h-5 w-5" />}
                  text="Exact pickup shared after booking"
                />
                <Row
                  icon={<ShieldCheck className="h-5 w-5" />}
                  text="Campus verified driver"
                />
              </div>

              {joinMutation.isError && (
                <p className="mt-4 text-sm text-red-600">
                  {(joinMutation.error as Error).message}
                </p>
              )}

              <Button
                className="mt-8 w-full"
                size="lg"
                disabled={!canJoin || joinMutation.isPending}
                onClick={() => joinMutation.mutate()}
              >
                {!canJoin
                  ? 'Seats Full'
                  : joinMutation.isPending
                    ? 'Booking...'
                    : joinMutation.isSuccess
                      ? 'Seat Booked'
                      : 'Book Seat'}
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

function Info({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-center gap-3 text-primary">{icon}</div>
      <p className="mt-3 text-sm text-muted-foreground">{title}</p>
      <h3 className="mt-1 font-semibold">{value}</h3>
    </div>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-primary">{icon}</div>
      <span>{text}</span>
    </div>
  );
}
