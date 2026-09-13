"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Ride } from "@/lib/rides-api";

export function useRide(id: string) {
  return useQuery({
    queryKey: ["ride", id],
    queryFn: () => api.get<Ride>(`/rides/${id}`),
    enabled: !!id,
  });
}

export function useJoinRide(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(`/rides/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride", id] });
    },
  });
}
