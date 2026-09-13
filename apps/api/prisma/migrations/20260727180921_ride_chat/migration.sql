-- AlterEnum
ALTER TYPE "RideStatus" ADD VALUE 'IN_PROGRESS';

-- CreateTable
CREATE TABLE "ride_messages" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ride_messages_rideId_idx" ON "ride_messages"("rideId");

-- CreateIndex
CREATE INDEX "ride_messages_senderId_idx" ON "ride_messages"("senderId");

-- AddForeignKey
ALTER TABLE "ride_messages" ADD CONSTRAINT "ride_messages_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_messages" ADD CONSTRAINT "ride_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
