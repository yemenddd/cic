-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "surveyClosedNote" TEXT,
ADD COLUMN     "surveyOpen" BOOLEAN NOT NULL DEFAULT false;

