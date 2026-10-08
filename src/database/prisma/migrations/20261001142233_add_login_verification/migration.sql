-- AlterTable
ALTER TABLE "public"."AuthSettings" ADD COLUMN     "loginVerificationEnabled" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "registrationVerificationEnabled" SET DEFAULT false;
