-- Phase 2: Recruitment Portal (Vacancies, Job Applications, Application Status History)

-- Create Enums
CREATE TYPE "VacancyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'CASUAL');
CREATE TYPE "WorkArrangement" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE');
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- Create Table: Vacancy
CREATE TABLE "Vacancy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Accra, Ghana',
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "workArrangement" "WorkArrangement" NOT NULL DEFAULT 'ON_SITE',
    "description" TEXT NOT NULL,
    "responsibilities" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "skills" TEXT,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "deadline" TIMESTAMP(3),
    "status" "VacancyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vacancy_pkey" PRIMARY KEY ("id")
);

-- Create Table: JobApplication
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "applicationReference" TEXT NOT NULL,
    "vacancyId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coverLetter" TEXT,
    "cvStoragePath" TEXT NOT NULL,
    "cvFileName" TEXT NOT NULL,
    "cvMimeType" TEXT NOT NULL,
    "cvFileSize" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "adminNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- Create Table: ApplicationStatusHistory
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "previousStatus" "ApplicationStatus",
    "newStatus" "ApplicationStatus" NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- Unique & Normal Indexes for Vacancy
CREATE UNIQUE INDEX "Vacancy_slug_key" ON "Vacancy"("slug");
CREATE INDEX "Vacancy_status_idx" ON "Vacancy"("status");
CREATE INDEX "Vacancy_slug_idx" ON "Vacancy"("slug");
CREATE INDEX "Vacancy_department_idx" ON "Vacancy"("department");
CREATE INDEX "Vacancy_deadline_idx" ON "Vacancy"("deadline");
CREATE INDEX "Vacancy_createdAt_idx" ON "Vacancy"("createdAt");

-- Unique & Normal Indexes for JobApplication
CREATE UNIQUE INDEX "JobApplication_applicationReference_key" ON "JobApplication"("applicationReference");
CREATE INDEX "JobApplication_applicationReference_idx" ON "JobApplication"("applicationReference");
CREATE INDEX "JobApplication_email_idx" ON "JobApplication"("email");
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");
CREATE INDEX "JobApplication_vacancyId_idx" ON "JobApplication"("vacancyId");
CREATE INDEX "JobApplication_submittedAt_idx" ON "JobApplication"("submittedAt");
CREATE INDEX "JobApplication_createdAt_idx" ON "JobApplication"("createdAt");

-- Indexes for ApplicationStatusHistory
CREATE INDEX "ApplicationStatusHistory_applicationId_createdAt_idx" ON "ApplicationStatusHistory"("applicationId", "createdAt");
CREATE INDEX "ApplicationStatusHistory_actorId_idx" ON "ApplicationStatusHistory"("actorId");

-- Foreign Key Constraints
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
