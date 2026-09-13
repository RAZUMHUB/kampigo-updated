import { api } from '@/lib/api-client';

export type RentalCategory =
  | 'BIKE'
  | 'CAR'
  | 'CLOTHES'
  | 'ELECTRONICS'
  | 'BOOKS'
  | 'OTHER';

export type Rental = {
  id: string;
  category: RentalCategory;
  title: string;
  description: string;
  pricePerDay: number;
  securityDeposit: number;
  available: boolean;
  createdAt: string;
  owner: {
    id: string;
    displayName: string;
  };
};

export type CreateRentalInput = {
  category: RentalCategory;
  title: string;
  description: string;
  pricePerDay: number;
  securityDeposit?: number;
  campusId?: string;
};

export function listRentals(category?: RentalCategory) {
  const query = category ? `?category=${category}` : '';
  return api.get<Rental[]>(`/rentals${query}`);
}

export function getMyRentals() {
  return api.get<Rental[]>('/rentals/mine');
}

export function getRental(id: string) {
  return api.get<Rental>(`/rentals/${id}`);
}

export function createRental(input: CreateRentalInput) {
  return api.post<Rental>('/rentals', input);
}

export function updateRental(id: string, input: Partial<CreateRentalInput> & { available?: boolean }) {
  return api.patch<Rental>(`/rentals/${id}`, input);
}

export function deleteRental(id: string) {
  return api.delete<void>(`/rentals/${id}`);
}

export type RentalBookingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type RentalBooking = {
  id: string;
  status: RentalBookingStatus;
  createdAt: string;
  returnedAt: string | null;
  rental: Rental;
};

export function bookRental(rentalId: string) {
  return api.post<RentalBooking>('/rental-bookings', { rentalId });
}

export function getMyBookings() {
  return api.get<RentalBooking[]>('/rental-bookings/mine');
}

export function returnRentalBooking(bookingId: string) {
  return api.post<RentalBooking>(`/rental-bookings/${bookingId}/return`);
}
