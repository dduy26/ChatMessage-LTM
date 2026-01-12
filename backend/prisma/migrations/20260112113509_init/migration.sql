/*
  Warnings:

  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT '#94a3b8';

-- DropEnum
DROP TYPE "UserStatus";
