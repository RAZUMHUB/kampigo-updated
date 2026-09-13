import Link from "next/link";
import { ArrowRight, Calendar, ShieldCheck, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ClothingCardProps = {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  pricePerDay: number;
  securityDeposit: number;
  available: boolean;
};

export function ClothingCard({
  id,
  title,
  description,
  ownerName,
  pricePerDay,
  securityDeposit,
  available,
}: ClothingCardProps) {
  return (
    <Card className="overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex h-40 items-center justify-center bg-muted">
        <span className="text-sm text-muted-foreground">
          Photo not provided
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-base font-semibold sm:text-lg">{title}</h3>

          <Badge variant={available ? "default" : "secondary"}>
            {available ? "Available" : "Rented"}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>

        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Listed by {ownerName}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <div className="flex items-center gap-1 font-bold">
              <Tag className="h-4 w-4" />
              ₹{pricePerDay}/day
            </div>

            {securityDeposit > 0 && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Deposit ₹{securityDeposit}
              </div>
            )}
          </div>

          <Button className="w-full sm:w-auto">
            <Link href={`/clothes-rental/${id}`}>
              View
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
