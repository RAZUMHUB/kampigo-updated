'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Car,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  PlusCircle,
  Wallet,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getMyRides } from '@/lib/rides-api';

type Tab = 'offered' | 'booked';

export default function MyRidesPage() {
  const [tab, setTab] = useState<Tab>('offered');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: getMyRides,
  });

  const offered = data?.offered ?? [];
  const booked = data?.booked.map((b) => b.ride) ?? [];

  const upcomingOffered = offered.filter((r) => r.status === 'UPCOMING').length;
  const completedOffered = offered.filter((r) => r.status === 'COMPLETED').length;
  const earned = offered
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.pricePerSeat * r.passengerCount, 0);

  const visibleRides = tab === 'offered' ? offered : booked;

  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">My Rides</h1>

            <p className="mt-2 text-muted-foreground">
              Manage all your published and booked rides.
            </p>
          </div>

          <Button>
            <Link href="/ride-sharing/offer" className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Offer New Ride
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          <StatCard
            icon={<Car className="h-6 w-6" />}
            title="Rides Offered"
            value={String(offered.length)}
          />

          <StatCard
            icon={<Calendar className="h-6 w-6" />}
            title="Upcoming"
            value={String(upcomingOffered)}
          />

          <StatCard
            icon={<Wallet className="h-6 w-6" />}
            title="Earned"
            value={`₹${earned}`}
          />

          <StatCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="Completed"
            value={String(completedOffered)}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            variant={tab === 'offered' ? 'default' : 'outline'}
            onClick={() => setTab('offered')}
          >
            Rides I&apos;m Offering
          </Button>

          <Button
            variant={tab === 'booked' ? 'default' : 'outline'}
            onClick={() => setTab('booked')}
          >
            Rides I&apos;ve Booked
          </Button>
        </div>

        <div className="mt-8 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your rides...
            </div>
          ) : isError ? (
            <EmptyState
              title="Unable to load your rides"
              description="Please try again in a few moments."
            />
          ) : visibleRides.length === 0 ? (
            <EmptyState
              title={tab === 'offered' ? 'No rides offered yet' : 'No rides booked yet'}
              description={
                tab === 'offered'
                  ? 'Offer a ride to share your empty seats.'
                  : 'Book a seat on a ride to see it here.'
              }
            />
          ) : (
            visibleRides.map((ride) => (
              <Card key={ride.id} className="rounded-3xl p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-primary" />

                    <div>
                      <h2 className="text-xl font-semibold">{ride.pickup}</h2>
                      <p className="text-muted-foreground">↓</p>
                      <h2 className="text-xl font-semibold">{ride.destination}</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <Info
                      icon={<Calendar className="h-5 w-5" />}
                      value={new Date(ride.departureDateTime).toLocaleDateString()}
                    />

                    <Info
                      icon={<Clock3 className="h-5 w-5" />}
                      value={new Date(ride.departureDateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    />

                    <Info icon={<Wallet className="h-5 w-5" />} value={`₹${ride.pricePerSeat}`} />
                  </div>

                  <Button>
                    <Link href={`/ride-sharing/${ride.id}`}>View</Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </AuthGuard>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-3xl p-6">
      <div className="text-primary">{icon}</div>
      <p className="mt-4 text-sm text-muted-foreground">{title}</p>
      <h2 className="mt-1 text-3xl font-bold">{value}</h2>
    </Card>
  );
}

function Info({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{value}</span>
    </div>
  );
}
