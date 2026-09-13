import { api } from "@/lib/api-client";

export type Ride = {
  id: string;
  pickup: string;
  destination: string;
  departureDateTime: string;
  availableSeats: number;
  seatsLeft: number;
  passengerCount: number;
  pricePerSeat: number;
  vehicle: string;
  status: string;
  driver: {
    id: string;
    displayName: string;
  };
};

export type RideSearchResponse = {
  rides: Ride[];
  total: number;
  page: number;
  pageSize: number;
};

export type MyRidesResponse = {
  offered: Ride[];
  booked: {
    bookingStatus: string;
    ride: Ride;
  }[];
};

export type CreateRideInput = {
  pickup: string;
  destination: string;
  departureDateTime: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicle: string;
  notes?: string;
};

export function createRide(input: CreateRideInput) {
  return api.post<Ride>('/rides', input);
}

export function getMyRides() {
  return api.get<MyRidesResponse>('/rides/mine');
}

export async function searchRides(params?: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();

  if (params?.q) query.set("q", params.q);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));

  return api.get<RideSearchResponse>(
    `/rides?${query.toString()}`
  );
}
