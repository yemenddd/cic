-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "announcementId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_announcementId_idx" ON "Notification"("announcementId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

