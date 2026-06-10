/*
  Warnings:

  - Added the required column `mentee_id` to the `meetings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mentor_id` to the `meetings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "external_id" TEXT,
ADD COLUMN     "mentee_id" TEXT NOT NULL,
ADD COLUMN     "mentor_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "meetings_mentor_id_idx" ON "meetings"("mentor_id");

-- CreateIndex
CREATE INDEX "meetings_mentee_id_idx" ON "meetings"("mentee_id");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
