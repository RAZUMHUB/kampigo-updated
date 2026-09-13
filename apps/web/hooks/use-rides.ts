"use client";

import { useQuery } from "@tanstack/react-query";
import { searchRides } from "@/lib/rides-api";

export function useRides(search?: string) {
  return useQuery({
    queryKey: ["rides", search],
    queryFn: () =>
      searchRides({
        q: search,
        page: 1,
        pageSize: 8,
      }),
  });
}
