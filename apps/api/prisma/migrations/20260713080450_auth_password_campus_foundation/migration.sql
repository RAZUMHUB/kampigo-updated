-- AlterTable
ALTER TABLE "universities" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "campusId" TEXT,
ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE INDEX "users_campusId_idx" ON "users"("campusId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
