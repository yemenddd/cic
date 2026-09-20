-- DropIndex
DROP INDEX "User_role_idx";

-- CreateIndex
CREATE INDEX "User_role_createdAt_idx" ON "User"("role", "createdAt");
