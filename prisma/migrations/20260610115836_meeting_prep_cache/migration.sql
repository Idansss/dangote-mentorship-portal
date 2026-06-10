-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "prep_generated_at" TIMESTAMP(3),
ADD COLUMN     "prep_json" JSONB;
