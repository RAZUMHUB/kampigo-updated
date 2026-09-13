-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ONBOARDING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'STAFF', 'CAMPUS_AUTHORITY', 'UNIVERSITY_ADMIN', 'PLATFORM_SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'LOGIN', 'EMAIL_CHANGE');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'MATCHED', 'CLAIMED', 'RECOVERED', 'CLOSED', 'REMOVED');

-- CreateEnum
CREATE TYPE "CustodyStatus" AS ENUM ('WITH_FINDER', 'SUBMITTED_TO_SECURITY', 'SUBMITTED_TO_OFFICE', 'SECURED_BY_AUTHORITY', 'HANDED_OVER');

-- CreateEnum
CREATE TYPE "ItemKind" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "MatchTier" AS ENUM ('HIGHLY_LIKELY', 'POSSIBLE', 'WEAK');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'CONFIRMED_STALE', 'DISMISSED', 'ACTIVE');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'VERIFICATION_REQUIRED', 'APPROVED', 'REJECTED', 'CANCELLED', 'HANDED_OVER', 'RECOVERY_CONFIRMED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "LedgerEntryReason" AS ENUM ('TOPUP', 'ALERT_PURCHASE', 'REFUND', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerEntryStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POSSIBLE_MATCH', 'HIGH_CONFIDENCE_MATCH', 'CLAIM_RECEIVED', 'CLAIM_UPDATED', 'VERIFICATION_REQUIRED', 'NEW_CHAT_MESSAGE', 'ITEM_RECOVERED', 'UNIVERSITY_LOST_ITEM_ALERT');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "PushTokenStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'INVALID', 'REVOKED');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('LOST_ITEM', 'FOUND_ITEM', 'USER', 'CHAT_MESSAGE');

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" TEXT NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approved_email_domains" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approved_email_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_categories" (
    "id" TEXT NOT NULL,
    "universityId" TEXT,
    "name" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "item_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "institutionalEmail" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'REGISTRATION',
    "attemptsMade" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "requestIp" TEXT,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lost_items" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "campusId" TEXT,
    "buildingId" TEXT,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "distinctiveMarks" TEXT,
    "floorOrZone" TEXT,
    "nearbyLandmark" TEXT,
    "lostDate" TIMESTAMP(3) NOT NULL,
    "lostTimeApprox" TEXT,
    "privateDetails" JSONB,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lost_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "found_items" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "finderId" TEXT NOT NULL,
    "campusId" TEXT,
    "buildingId" TEXT,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "distinctiveMarks" TEXT,
    "floorOrZone" TEXT,
    "nearbyLandmark" TEXT,
    "foundDate" TIMESTAMP(3) NOT NULL,
    "foundTimeApprox" TEXT,
    "custodyStatus" "CustodyStatus" NOT NULL DEFAULT 'WITH_FINDER',
    "authorityOffice" TEXT,
    "storageLocation" TEXT,
    "recoveryRefNumber" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "found_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_images" (
    "id" TEXT NOT NULL,
    "lostItemId" TEXT,
    "foundItemId" TEXT,
    "storageKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "exifStripped" BOOLEAN NOT NULL DEFAULT false,
    "ocrText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_embeddings" (
    "id" TEXT NOT NULL,
    "itemImageId" TEXT NOT NULL,
    "vector" vector(768) NOT NULL,
    "modelName" TEXT NOT NULL,
    "processingVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "text_embeddings" (
    "id" TEXT NOT NULL,
    "itemType" "ItemKind" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemRevision" INTEGER NOT NULL,
    "vector" vector(384) NOT NULL,
    "modelName" TEXT NOT NULL,
    "processingVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "text_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_matches" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "lostItemId" TEXT NOT NULL,
    "foundItemId" TEXT NOT NULL,
    "lostItemRevision" INTEGER NOT NULL,
    "foundItemRevision" INTEGER NOT NULL,
    "processingVersion" INTEGER NOT NULL,
    "tier" "MatchTier" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "visualScore" DOUBLE PRECISION,
    "textScore" DOUBLE PRECISION,
    "attributeScore" DOUBLE PRECISION,
    "ocrScore" DOUBLE PRECISION,
    "locationScore" DOUBLE PRECISION,
    "timeScore" DOUBLE PRECISION,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "foundItemId" TEXT NOT NULL,
    "lostItemId" TEXT,
    "claimantId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_verification_questions" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_verification_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "claimId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readBy" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "cachedBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger_entries" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "reason" "LedgerEntryReason" NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" "LedgerEntryStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "paymentReference" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "razorpay_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "razorpay_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_alerts" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "lostItemId" TEXT NOT NULL,
    "purchasedById" TEXT NOT NULL,
    "priceInPaise" INTEGER NOT NULL DEFAULT 2900,
    "ledgerEntryId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "messagePreview" TEXT NOT NULL,
    "eligibleDeviceCount" INTEGER,
    "sentCount" INTEGER,
    "failedCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "university_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chatAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "universityAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "pushToken" TEXT NOT NULL,
    "tokenStatus" "PushTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "universityId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universities_slug_key" ON "universities"("slug");

-- CreateIndex
CREATE INDEX "approved_email_domains_domain_idx" ON "approved_email_domains"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "approved_email_domains_universityId_domain_key" ON "approved_email_domains"("universityId", "domain");

-- CreateIndex
CREATE INDEX "campuses_universityId_idx" ON "campuses"("universityId");

-- CreateIndex
CREATE INDEX "buildings_campusId_idx" ON "buildings"("campusId");

-- CreateIndex
CREATE INDEX "item_categories_universityId_idx" ON "item_categories"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "users_institutionalEmail_key" ON "users"("institutionalEmail");

-- CreateIndex
CREATE INDEX "users_universityId_idx" ON "users"("universityId");

-- CreateIndex
CREATE INDEX "otp_challenges_email_universityId_idx" ON "otp_challenges"("email", "universityId");

-- CreateIndex
CREATE INDEX "lost_items_universityId_status_idx" ON "lost_items"("universityId", "status");

-- CreateIndex
CREATE INDEX "lost_items_universityId_categoryId_idx" ON "lost_items"("universityId", "categoryId");

-- CreateIndex
CREATE INDEX "found_items_universityId_status_idx" ON "found_items"("universityId", "status");

-- CreateIndex
CREATE INDEX "found_items_universityId_categoryId_idx" ON "found_items"("universityId", "categoryId");

-- CreateIndex
CREATE INDEX "item_images_lostItemId_idx" ON "item_images"("lostItemId");

-- CreateIndex
CREATE INDEX "item_images_foundItemId_idx" ON "item_images"("foundItemId");

-- CreateIndex
CREATE UNIQUE INDEX "image_embeddings_itemImageId_key" ON "image_embeddings"("itemImageId");

-- CreateIndex
CREATE UNIQUE INDEX "text_embeddings_itemType_itemId_itemRevision_key" ON "text_embeddings"("itemType", "itemId", "itemRevision");

-- CreateIndex
CREATE INDEX "item_matches_universityId_status_idx" ON "item_matches"("universityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "item_matches_lostItemId_foundItemId_lostItemRevision_foundI_key" ON "item_matches"("lostItemId", "foundItemId", "lostItemRevision", "foundItemRevision");

-- CreateIndex
CREATE INDEX "claims_foundItemId_status_idx" ON "claims"("foundItemId", "status");

-- CreateIndex
CREATE INDEX "claims_claimantId_idx" ON "claims"("claimantId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_claimId_key" ON "conversations"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_ledger_entries_idempotencyKey_key" ON "wallet_ledger_entries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "wallet_ledger_entries_walletId_idx" ON "wallet_ledger_entries"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_webhook_events_eventId_key" ON "razorpay_webhook_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "university_alerts_ledgerEntryId_key" ON "university_alerts"("ledgerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "university_alerts_idempotencyKey_key" ON "university_alerts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "university_alerts_universityId_idx" ON "university_alerts"("universityId");

-- CreateIndex
CREATE INDEX "university_alerts_lostItemId_idx" ON "university_alerts"("lostItemId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_dedupeKey_key" ON "notifications"("userId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_pushToken_key" ON "devices"("pushToken");

-- CreateIndex
CREATE INDEX "devices_universityId_tokenStatus_idx" ON "devices"("universityId", "tokenStatus");

-- CreateIndex
CREATE INDEX "audit_logs_universityId_createdAt_idx" ON "audit_logs"("universityId", "createdAt");

-- AddForeignKey
ALTER TABLE "approved_email_domains" ADD CONSTRAINT "approved_email_domains_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_items" ADD CONSTRAINT "lost_items_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_items" ADD CONSTRAINT "lost_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_items" ADD CONSTRAINT "lost_items_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_items" ADD CONSTRAINT "found_items_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_items" ADD CONSTRAINT "found_items_finderId_fkey" FOREIGN KEY ("finderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_items" ADD CONSTRAINT "found_items_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_lostItemId_fkey" FOREIGN KEY ("lostItemId") REFERENCES "lost_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "found_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_embeddings" ADD CONSTRAINT "image_embeddings_itemImageId_fkey" FOREIGN KEY ("itemImageId") REFERENCES "item_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_matches" ADD CONSTRAINT "item_matches_lostItemId_fkey" FOREIGN KEY ("lostItemId") REFERENCES "lost_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_matches" ADD CONSTRAINT "item_matches_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "found_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "found_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_lostItemId_fkey" FOREIGN KEY ("lostItemId") REFERENCES "lost_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_verification_questions" ADD CONSTRAINT "claim_verification_questions_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_alerts" ADD CONSTRAINT "university_alerts_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_alerts" ADD CONSTRAINT "university_alerts_lostItemId_fkey" FOREIGN KEY ("lostItemId") REFERENCES "lost_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_alerts" ADD CONSTRAINT "university_alerts_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

