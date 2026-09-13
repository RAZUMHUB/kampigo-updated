-- Add password reset invalidation timestamp.
ALTER TABLE "users"
ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- Add password reset as an OTP purpose.
ALTER TYPE "OtpPurpose" ADD VALUE 'PASSWORD_RESET';
