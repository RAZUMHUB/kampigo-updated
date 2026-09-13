"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FloatingOfferRide() {
  return (
    <Link
      href="/ride-sharing/offer"
      className="fixed bottom-[5.75rem] right-4 z-40 sm:bottom-6 sm:right-6"
    >
      <Button
        size="lg"
        className="h-11 rounded-full px-5 shadow-2xl sm:h-14 sm:px-6"
      >
        <Plus className="mr-2 h-5 w-5" />
        Offer Ride
      </Button>
    </Link>
  );
}
