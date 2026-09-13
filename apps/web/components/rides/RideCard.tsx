import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Car,
  Clock3,
  Heart,
  MapPin,
  Share2,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RideStatus =
  | "UPCOMING"
  | "OFFERED"
  | "COMPLETED"
  | "CANCELLED";

type RideCardProps = {
  id: string;
  driverName: string;
  rating?: number;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  seatsLeft: number;
  price: number;
  vehicle: string;
  verified?: boolean;
  status?: RideStatus;
};

export function RideCard({
  id,
  driverName,
  rating,
  pickup,
  destination,
  date,
  time,
  seatsLeft,
  price,
  vehicle,
  verified = true,
  status = "UPCOMING",
}: RideCardProps) {
  const badge = {
    UPCOMING: "bg-green-100 text-green-700",
    OFFERED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  }[status];

  return (
    <Card className="group overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">

      <div className="p-4 sm:p-6">

        <div className="flex items-start justify-between">

          <div className="flex min-w-0 items-center gap-3 sm:gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold">
              {driverName.charAt(0).toUpperCase()}
            </div>

            <div>

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">

                <h3 className="text-lg font-semibold">
                  {driverName}
                </h3>

                {verified && (
                  <BadgeCheck className="h-4 w-4 text-blue-600" />
                )}

              </div>

              {rating !== undefined && (
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)}
                </div>
              )}

            </div>

          </div>

          <div className="flex gap-2">

            <Button size="icon" variant="ghost">
              <Heart className="h-4 w-4" />
            </Button>

            <Button size="icon" variant="ghost">
              <Share2 className="h-4 w-4" />
            </Button>

          </div>

        </div>

        <div className="mt-6 flex items-center gap-3 sm:mt-8 sm:gap-6">

          <div className="flex-1">

            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Pickup
            </p>

            <h4 className="truncate text-base sm:text-lg font-semibold">
              {pickup}
            </h4>

          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground" />

          <div className="flex-1 text-right">

            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Destination
            </p>

            <h4 className="truncate text-base sm:text-lg font-semibold">
              {destination}
            </h4>

          </div>

        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Info icon={<Calendar className="h-4 w-4" />} text={date} />
          <Info icon={<Clock3 className="h-4 w-4" />} text={time} />
          <Info icon={<Car className="h-4 w-4" />} text={vehicle} />
          <Info icon={<Users className="h-4 w-4" />} text={`${seatsLeft} Seats`} />

        </div>

      </div>

      <div className="flex flex-col gap-4 border-t bg-muted/30 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="text-sm text-muted-foreground">
            Price Per Seat
          </div>

          <div className="mt-1 text-3xl font-bold">
            ₹{price}
          </div>

        </div>

        <div className={`rounded-full px-4 py-2 text-sm font-semibold ${badge}`}>
          {status}
        </div>

        <Link href={`/ride-sharing/${id}`}><Button className="rounded-xl px-8">
            View Ride
          </Button></Link>

      </div>

    </Card>
  );
}

function Info({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-4">
      <div className="text-primary">
        {icon}
      </div>

      <span className="text-sm font-medium">
        {text}
      </span>
    </div>
  );
}
