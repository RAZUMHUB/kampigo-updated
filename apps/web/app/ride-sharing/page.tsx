import { AuthGuard } from "@/components/auth/auth-guard";

import { RideHero } from "@/components/rides/ui/RideHero";
import { RideStats } from "@/components/rides/ui/RideStats";
import { UpcomingTrips } from "@/components/rides/ui/UpcomingTrips";
import { PickupPoints } from "@/components/rides/ui/PickupPoints";
import { PopularRoutesGrid } from "@/components/rides/ui/PopularRoutesGrid";
import { FloatingOfferRide } from "@/components/rides/ui/FloatingOfferRide";
import { FadeIn } from "@/components/rides/ui/FadeIn";

export default function RideSharingPage() {
  return (
    <AuthGuard>
      <main className="mx-auto max-w-7xl space-y-12 p-6 md:p-8">
        <FadeIn><RideHero /></FadeIn>

        <FadeIn delay={100}><RideStats /></FadeIn>

        <FadeIn delay={200}><UpcomingTrips /></FadeIn>

        <FadeIn delay={300}><PickupPoints /></FadeIn>

        <FadeIn delay={400}><PopularRoutesGrid /></FadeIn>

        <FloatingOfferRide />
      </main>
    </AuthGuard>
  );
}
