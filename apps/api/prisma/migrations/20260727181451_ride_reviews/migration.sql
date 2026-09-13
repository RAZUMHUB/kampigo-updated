-- CreateTable
CREATE TABLE "ride_reviews" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ride_reviews_revieweeId_idx" ON "ride_reviews"("revieweeId");

-- CreateIndex
CREATE UNIQUE INDEX "ride_reviews_rideId_reviewerId_revieweeId_key" ON "ride_reviews"("rideId", "reviewerId", "revieweeId");

-- AddForeignKey
ALTER TABLE "ride_reviews" ADD CONSTRAINT "ride_reviews_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_reviews" ADD CONSTRAINT "ride_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_reviews" ADD CONSTRAINT "ride_reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
