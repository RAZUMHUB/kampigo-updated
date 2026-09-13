"use client";

import Link from "next/link";
import { CalendarDays, Clock3, Loader2, MapPin, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRides } from "@/hooks/use-rides";

export function UpcomingTrips() {
  const { data, isLoading, error } = useRides();

  if (isLoading) {
    return (
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading rides...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-12">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">
            Unable to load rides
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Please try again in a few moments.
          </p>
        </Card>
      </section>
    );
  }

  if (!data || data.rides.length === 0) {
    return (
      <section className="mt-12">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">
            No rides available
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Be the first student to offer a ride.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Upcoming Trips
        </h2>

        <p className="text-sm text-muted-foreground">
          Live rides from the Campigo backend.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.rides.map((ride) => (
          <Card
            key={ride.id}
            className="rounded-2xl p-6 transition hover:shadow-lg"
          >
            <div className="flex items-center justify-between">

              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                ₹{ride.pricePerSeat}/seat
              </span>

              <span className="rounded-full bg-green-100 px-3 py-1 text-sm">
                {ride.availableSeats} seats
              </span>

            </div>

            <div className="mt-5 flex items-center gap-2 font-semibold">
              <MapPin className="h-5 w-5 text-green-600" />
              {ride.pickup}
            </div>

            <div className="ml-7 my-2 text-muted-foreground">
              ↓
            </div>

            <div className="flex items-center gap-2 font-semibold">
              <MapPin className="h-5 w-5 text-red-600" />
              {ride.destination}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {new Date(
                  ride.departureDateTime
                ).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {new Date(
                  ride.departureDateTime
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {ride.driver.displayName}
              </div>

            </div>

            <Button className="mt-6 w-full">
              <Link href={`/ride-sharing/${ride.id}`} className="flex w-full items-center justify-center">
                View Ride
              </Link>
            </Button>

          </Card>
        ))}
      </div>
    </section>
  );
}
