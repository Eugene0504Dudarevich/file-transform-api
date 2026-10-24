-- AlterEnum
ALTER TYPE "public"."VerificationCodeType" ADD VALUE 'EMAIL_CHANGE';

-- AlterTable
ALTER TABLE "public"."VerificationCode" ADD COLUMN     "pendingEmail" TEXT;
