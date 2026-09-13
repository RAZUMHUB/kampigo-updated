-- CreateEnum
CREATE TYPE "RentalCategory" AS ENUM ('BIKE', 'CAR', 'CLOTHES', 'ELECTRONICS', 'BOOKS', 'OTHER');

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "campusId" TEXT,
    "category" "RentalCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerDay" INTEGER NOT NULL,
    "securityDeposit" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rentals_universityId_idx" ON "rentals"("universityId");

-- CreateIndex
CREATE INDEX "rentals_ownerId_idx" ON "rentals"("ownerId");

-- CreateIndex
CREATE INDEX "rentals_category_idx" ON "rentals"("category");

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
