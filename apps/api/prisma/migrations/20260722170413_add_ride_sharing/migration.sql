-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'BOTH');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('ANY', 'MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "rides" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusId" TEXT,
    "driverId" TEXT NOT NULL,
    "pickup" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureDateTime" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "pricePerSeat" INTEGER NOT NULL,
    "vehicle" TEXT NOT NULL,
    "notes" TEXT,
    "luggageAllowed" BOOLEAN NOT NULL DEFAULT true,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'BOTH',
    "genderPreference" "GenderPreference" NOT NULL DEFAULT 'ANY',
    "status" "RideStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_passengers" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rides_driverId_idx" ON "rides"("driverId");

-- CreateIndex
CREATE INDEX "rides_universityId_idx" ON "rides"("universityId");

-- CreateIndex
CREATE INDEX "rides_campusId_idx" ON "rides"("campusId");

-- CreateIndex
CREATE INDEX "rides_status_idx" ON "rides"("status");

-- CreateIndex
CREATE INDEX "ride_passengers_rideId_idx" ON "ride_passengers"("rideId");

-- CreateIndex
CREATE INDEX "ride_passengers_userId_idx" ON "ride_passengers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ride_passengers_rideId_userId_key" ON "ride_passengers"("rideId", "userId");

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_passengers" ADD CONSTRAINT "ride_passengers_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_passengers" ADD CONSTRAINT "ride_passengers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
