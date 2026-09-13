-- CreateEnum
CREATE TYPE "RidePassengerStatus" AS ENUM ('JOINED', 'BOARDED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ride_passengers" ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RidePassengerStatus" NOT NULL DEFAULT 'JOINED';
