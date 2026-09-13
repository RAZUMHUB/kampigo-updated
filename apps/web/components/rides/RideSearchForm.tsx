"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RideSearchFormProps = {
  onSearch?: (query: string) => void;
};

export function RideSearchForm({ onSearch }: RideSearchFormProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const query = [from, to]
      .filter(Boolean)
      .join(" ")
      .trim();

    onSearch?.(query);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">
        Find Your Ride
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Search rides posted by verified students.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4"
      >
        <Input
          placeholder="Pickup"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <Input
          placeholder="Destination"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <Button className="w-full" type="submit">
          <Search className="mr-2 h-4 w-4" />
          Search Rides
        </Button>
      </form>
    </Card>
  );
}
