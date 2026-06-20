-- Remove the Programme Admin, Trainer, and Reviewer roles. Their programme-staff
-- capabilities are folded into Super Admin (see src/lib/auth/roles.ts).
--
-- Steps:
--   1. Reassign existing role grants for the removed roles to Super Admin.
--   2. Delete the obsolete Role rows.
--   3. Neutralise enum references on invites / form definitions.
--   4. Recreate the RoleName enum without the three removed values.

-- 1. Reassign user_role grants for removed roles → Super Admin, skipping any that
--    would duplicate an existing grant (same user + cohort).
UPDATE "user_roles" ur
SET "role_id" = (SELECT id FROM "roles" WHERE "name" = 'SUPER_ADMIN' LIMIT 1)
WHERE ur."role_id" IN (SELECT id FROM "roles" WHERE "name" IN ('PROGRAMME_ADMIN', 'TRAINER', 'REVIEWER'))
  AND NOT EXISTS (
    SELECT 1 FROM "user_roles" e
    WHERE e."user_id" = ur."user_id"
      AND e."role_id" = (SELECT id FROM "roles" WHERE "name" = 'SUPER_ADMIN' LIMIT 1)
      AND e."cohort_id" IS NOT DISTINCT FROM ur."cohort_id"
  );

-- Remove any grants that collided above (the Super Admin grant already exists).
DELETE FROM "user_roles"
WHERE "role_id" IN (SELECT id FROM "roles" WHERE "name" IN ('PROGRAMME_ADMIN', 'TRAINER', 'REVIEWER'));

-- 2. Delete the obsolete Role catalogue rows.
DELETE FROM "roles" WHERE "name" IN ('PROGRAMME_ADMIN', 'TRAINER', 'REVIEWER');

-- 3a. Pending invites for removed roles become Super Admin invites.
UPDATE "invites" SET "role_name" = 'SUPER_ADMIN'
WHERE "role_name" IN ('PROGRAMME_ADMIN', 'TRAINER', 'REVIEWER');

-- 3b. Form definitions that targeted a removed role become role-agnostic.
UPDATE "form_definitions" SET "role_name" = NULL
WHERE "role_name" IN ('PROGRAMME_ADMIN', 'TRAINER', 'REVIEWER');

-- 4. Recreate the enum without the removed values.
ALTER TABLE "roles" ALTER COLUMN "name" TYPE TEXT;
ALTER TABLE "invites" ALTER COLUMN "role_name" TYPE TEXT;
ALTER TABLE "imports" ALTER COLUMN "target_role" TYPE TEXT;
ALTER TABLE "form_definitions" ALTER COLUMN "role_name" TYPE TEXT;

DROP TYPE "RoleName";
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'MENTOR', 'MENTEE');

ALTER TABLE "roles" ALTER COLUMN "name" TYPE "RoleName" USING ("name"::"RoleName");
ALTER TABLE "invites" ALTER COLUMN "role_name" TYPE "RoleName" USING ("role_name"::"RoleName");
ALTER TABLE "imports" ALTER COLUMN "target_role" TYPE "RoleName" USING ("target_role"::"RoleName");
ALTER TABLE "form_definitions" ALTER COLUMN "role_name" TYPE "RoleName" USING ("role_name"::"RoleName");
