"use client";

import { Button } from "@/components/ui/button";

export type RideFilter = "today" | "tomorrow" | "week" | "price" | "seats" | null;

const filters: { key: RideFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
  { key: "price", label: "Lowest Price" },
  { key: "seats", label: "Most Seats" },
];

type RideFiltersProps = {
  active: RideFilter;
  onChange: (filter: RideFilter) => void;
};

export function RideFilters({ active, onChange }: RideFiltersProps) {
  return (
    <div className="sticky top-20 z-20 mb-6 overflow-x-auto rounded-2xl border bg-background/80 p-2.5 sm:mb-8 sm:p-3 backdrop-blur">
      <div className="flex gap-3">
        {filters.map((filter) => (
          <Button
            key={filter.key}
            variant={active === filter.key ? "default" : "outline"}
            className="whitespace-nowrap rounded-full"
            onClick={() => onChange(active === filter.key ? null : filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
