-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "icebreaker_generated_at" TIMESTAMP(3),
ADD COLUMN     "icebreaker_json" JSONB;
