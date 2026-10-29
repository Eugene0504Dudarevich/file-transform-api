-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_status_createdAt_id_idx" ON "public"."User"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "User_createdAt_id_idx" ON "public"."User"("createdAt", "id");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_id_idx" ON "public"."User"("lastLoginAt", "id");
