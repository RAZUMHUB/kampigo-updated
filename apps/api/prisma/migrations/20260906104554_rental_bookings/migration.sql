-- CreateEnum
CREATE TYPE "RentalBookingStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "rental_bookings" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "status" "RentalBookingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),

    CONSTRAINT "rental_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_bookings_universityId_idx" ON "rental_bookings"("universityId");

-- CreateIndex
CREATE INDEX "rental_bookings_rentalId_idx" ON "rental_bookings"("rentalId");

-- CreateIndex
CREATE INDEX "rental_bookings_renterId_idx" ON "rental_bookings"("renterId");

-- AddForeignKey
ALTER TABLE "rental_bookings" ADD CONSTRAINT "rental_bookings_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_bookings" ADD CONSTRAINT "rental_bookings_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_bookings" ADD CONSTRAINT "rental_bookings_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
