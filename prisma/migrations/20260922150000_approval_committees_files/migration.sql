-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "committee" TEXT,
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "statusChangedAt" TIMESTAMP(3),
ADD COLUMN     "statusNote" TEXT;

-- Everyone who already has an account keeps it.
--
-- The column defaults to PENDING, which is the right default for a row created
-- from now on and the wrong one for the 186 accounts that already exist: the
-- door they have been using every day would shut behind them, organizers
-- included. Approval applies to people who register after this migration.
UPDATE "User" SET "status" = 'APPROVED', "statusChangedAt" = NOW();

-- AlterTable
-- Empty table at the time of writing, so the free-text team column is dropped
-- rather than migrated: a committee is now one of six named values.
ALTER TABLE "VolunteerShift" DROP COLUMN "teamAr",
ADD COLUMN     "committee" TEXT NOT NULL;

-- The four tracks become the two paths.
--
-- The track is printed on certificates and filtered on in the admin panel, so
-- leaving both vocabularies alive would mean six values where the form offers
-- two, and a participant who could never re-select their own stored value.
-- Research keeps its own path; invention, AI/robotics and entrepreneurship all
-- describe making something, and become the invention path.
UPDATE "User" SET "track" = 'مسار البحث العلمي'
  WHERE "track" = 'البحث العلمي';
UPDATE "User" SET "track" = 'مسار الاختراع والابتكار'
  WHERE "track" IN ('الابتكار والتقنية', 'الذكاء الاصطناعي والروبوتات', 'ريادة الأعمال');

UPDATE "ProjectSubmission" SET "track" = 'مسار البحث العلمي'
  WHERE "track" = 'البحث العلمي';
UPDATE "ProjectSubmission" SET "track" = 'مسار الاختراع والابتكار'
  WHERE "track" IN ('الابتكار والتقنية', 'الذكاء الاصطناعي والروبوتات', 'ريادة الأعمال');

-- The same for the registration records, which are what the CSV export and the
-- "بلا حساب" reconciliation read.
UPDATE "Registration" SET "track" = 'مسار البحث العلمي'
  WHERE "track" = 'البحث العلمي';
UPDATE "Registration" SET "track" = 'مسار الاختراع والابتكار'
  WHERE "track" IN ('الابتكار والتقنية', 'الذكاء الاصطناعي والروبوتات', 'ريادة الأعمال');

-- CreateTable
CREATE TABLE "SubmissionFile" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionFile_submissionId_idx" ON "SubmissionFile"("submissionId");

-- AddForeignKey
ALTER TABLE "SubmissionFile" ADD CONSTRAINT "SubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProjectSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
