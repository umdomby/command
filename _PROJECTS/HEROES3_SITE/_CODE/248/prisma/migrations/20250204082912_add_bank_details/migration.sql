/*
  Warnings:

  - The values [CP] on the enum `IsCovered` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IsCovered_new" AS ENUM ('OPEN', 'CLOSED', 'PENDING');
ALTER TABLE "BetParticipant" ALTER COLUMN "isCovered" TYPE "IsCovered_new" USING ("isCovered"::text::"IsCovered_new");
ALTER TABLE "BetParticipantCLOSED" ALTER COLUMN "isCovered" TYPE "IsCovered_new" USING ("isCovered"::text::"IsCovered_new");
ALTER TYPE "IsCovered" RENAME TO "IsCovered_old";
ALTER TYPE "IsCovered_new" RENAME TO "IsCovered";
DROP TYPE "IsCovered_old";
COMMIT;
