-- CreateTable
CREATE TABLE "EmailBlast" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "toEmail" TEXT,
    "buttonLabel" TEXT,
    "buttonHref" TEXT,
    "attempted" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "sentById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailBlast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailBlast_createdAt_idx" ON "EmailBlast"("createdAt");

-- AddForeignKey
ALTER TABLE "EmailBlast" ADD CONSTRAINT "EmailBlast_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

