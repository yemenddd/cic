-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "contactEmail" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "xUrl" TEXT,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "registrationClosedNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
