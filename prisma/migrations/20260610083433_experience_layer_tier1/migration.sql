-- CreateEnum
CREATE TYPE "GoalStage" AS ENUM ('DRAFTED', 'MENTOR_REVIEWED', 'APPROVED', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'ACHIEVED');

-- CreateEnum
CREATE TYPE "NoShowReason" AS ENUM ('MENTOR_CANCELLED', 'MENTEE_CANCELLED', 'FORGOT', 'RESCHEDULED', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportRequestReason" AS ENUM ('CANNOT_REACH_PARTNER', 'NEED_GOAL_HELP', 'UNCOMFORTABLE_WITH_MATCH', 'NEED_ADMIN_INTERVENTION', 'COMMUNICATION_ISSUE', 'LANGUAGE_SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "SupportRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- AlterTable
ALTER TABLE "goal_reviews" ADD COLUMN     "stage" "GoalStage";

-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "stage" "GoalStage" NOT NULL DEFAULT 'DRAFTED';

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "did_happen" BOOLEAN,
ADD COLUMN     "no_show_reason" "NoShowReason",
ADD COLUMN     "no_show_reported_at" TIMESTAMP(3),
ADD COLUMN     "no_show_reported_by_id" TEXT;

-- CreateTable
CREATE TABLE "goal_evidence" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "stage" "GoalStage",
    "file_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT,
    "size" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "goal_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "reason" "SupportRequestReason" NOT NULL,
    "message" TEXT,
    "status" "SupportRequestStatus" NOT NULL DEFAULT 'OPEN',
    "handled_by_id" TEXT,
    "admin_response" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflection_journal_entries" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "session_log_id" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "body_lang" "Language" NOT NULL DEFAULT 'EN',
    "is_shared_with_mentor" BOOLEAN NOT NULL DEFAULT false,
    "shared_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reflection_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_private_notes" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "mentee_id" TEXT NOT NULL,
    "kind" TEXT,
    "body" TEXT NOT NULL,
    "body_lang" "Language" NOT NULL DEFAULT 'EN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "mentor_private_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_drafts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cohort_id" TEXT,
    "form_key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "form_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goal_evidence_goal_id_idx" ON "goal_evidence"("goal_id");

-- CreateIndex
CREATE INDEX "goal_evidence_cohort_id_idx" ON "goal_evidence"("cohort_id");

-- CreateIndex
CREATE INDEX "support_requests_cohort_id_idx" ON "support_requests"("cohort_id");

-- CreateIndex
CREATE INDEX "support_requests_requester_id_idx" ON "support_requests"("requester_id");

-- CreateIndex
CREATE INDEX "reflection_journal_entries_cohort_id_idx" ON "reflection_journal_entries"("cohort_id");

-- CreateIndex
CREATE INDEX "reflection_journal_entries_author_id_idx" ON "reflection_journal_entries"("author_id");

-- CreateIndex
CREATE INDEX "mentor_private_notes_cohort_id_idx" ON "mentor_private_notes"("cohort_id");

-- CreateIndex
CREATE INDEX "mentor_private_notes_mentor_id_idx" ON "mentor_private_notes"("mentor_id");

-- CreateIndex
CREATE INDEX "form_drafts_user_id_idx" ON "form_drafts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_drafts_user_id_form_key_key" ON "form_drafts"("user_id", "form_key");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_no_show_reported_by_id_fkey" FOREIGN KEY ("no_show_reported_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_evidence" ADD CONSTRAINT "goal_evidence_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_evidence" ADD CONSTRAINT "goal_evidence_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_evidence" ADD CONSTRAINT "goal_evidence_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_journal_entries" ADD CONSTRAINT "reflection_journal_entries_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_journal_entries" ADD CONSTRAINT "reflection_journal_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_journal_entries" ADD CONSTRAINT "reflection_journal_entries_session_log_id_fkey" FOREIGN KEY ("session_log_id") REFERENCES "session_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_private_notes" ADD CONSTRAINT "mentor_private_notes_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_private_notes" ADD CONSTRAINT "mentor_private_notes_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_private_notes" ADD CONSTRAINT "mentor_private_notes_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_drafts" ADD CONSTRAINT "form_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_drafts" ADD CONSTRAINT "form_drafts_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
