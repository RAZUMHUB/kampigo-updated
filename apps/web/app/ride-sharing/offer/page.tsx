'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Car,
  Clock3,
  CreditCard,
  FileText,
  MapPin,
  Navigation,
  Users,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { SectionTitle } from '@/components/rides/ui/SectionTitle';
import { FeatureBadge } from '@/components/rides/ui/FeatureBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createRide } from '@/lib/rides-api';

export default function OfferRidePage() {
  const router = useRouter();

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createRide({
        pickup: pickup.trim(),
        destination: destination.trim(),
        departureDateTime: new Date(`${date}T${time}`).toISOString(),
        availableSeats: Number(seats),
        pricePerSeat: Number(price),
        vehicle: vehicle.trim(),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      router.push('/ride-sharing/my-rides');
    },
  });

  const isValid =
    pickup.trim().length > 0 &&
    destination.trim().length > 0 &&
    date.length > 0 &&
    time.length > 0 &&
    vehicle.trim().length > 0 &&
    Number(seats) > 0 &&
    Number.isFinite(Number(price)) &&
    Number(price) >= 0;

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Offer a Ride</h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Publish your journey and help fellow students travel safely,
            affordably and together.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <FeatureBadge>Verified Students</FeatureBadge>
            <FeatureBadge>Campus Safe</FeatureBadge>
            <FeatureBadge>Instant Booking</FeatureBadge>
            <FeatureBadge>Cash / UPI</FeatureBadge>
          </div>
        </div>

        <Card className="rounded-3xl p-8">
          <SectionTitle
            icon={<Navigation className="h-5 w-5" />}
            title="Route"
            description="Where are you travelling?"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                Pickup
              </label>

              <Input
                placeholder="Main Campus Gate"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                maxLength={150}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Navigation className="h-4 w-4" />
                Destination
              </label>

              <Input
                placeholder="Railway Station"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                maxLength={150}
              />
            </div>
          </div>

          <div className="my-10 border-t" />

          <SectionTitle
            icon={<Calendar className="h-5 w-5" />}
            title="Journey"
            description="Departure schedule"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Travel Date
              </label>

              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Clock3 className="h-4 w-4" />
                Departure Time
              </label>

              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="my-10 border-t" />

          <SectionTitle
            icon={<Car className="h-5 w-5" />}
            title="Vehicle"
            description="Tell passengers about your ride."
          />

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Seats
              </label>

              <Input
                type="number"
                min="1"
                placeholder="3"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4" />
                Price
              </label>

              <Input
                type="number"
                min="0"
                placeholder="120"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Car className="h-4 w-4" />
                Vehicle
              </label>

              <Input
                placeholder="Swift Dzire"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>

          <div className="my-10 border-t" />

          <SectionTitle
            icon={<FileText className="h-5 w-5" />}
            title="Additional Notes"
            description="Optional instructions for passengers."
          />

          <Textarea
            className="min-h-[140px]"
            placeholder="Pickup point, luggage information, contact instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
          />

          {createMutation.isError && (
            <p className="mt-4 text-sm text-red-600">
              {(createMutation.error as Error).message}
            </p>
          )}

          <div className="mt-10 flex flex-col gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Ready to publish?</p>
              <p className="text-sm text-muted-foreground">
                You can edit this ride later.
              </p>
            </div>

            <Button
              size="lg"
              className="rounded-xl px-10"
              disabled={!isValid || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Publishing...' : 'Publish Ride'}
            </Button>
          </div>
        </Card>
      </main>
    </AuthGuard>
  );
}
