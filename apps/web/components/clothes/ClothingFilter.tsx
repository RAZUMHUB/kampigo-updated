"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export type ClothingSort = "newest" | "price-asc" | "price-desc";

type ClothingFilterProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sort: ClothingSort;
  onSortChange: (value: ClothingSort) => void;
};

export function ClothingFilter({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: ClothingFilterProps) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <Input
            className="pl-9"
            placeholder="Search listings..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border bg-background px-3"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ClothingSort)}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
      </div>
    </div>
  );
}
