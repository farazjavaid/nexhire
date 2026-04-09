/*
  Warnings:

  - You are about to drop the column `name` on the `Organisation` table. All the data in the column will be lost.
  - Added the required column `legalName` to the `Organisation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organisationType` to the `Organisation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Organisation_name_key";

-- AlterTable
ALTER TABLE "Organisation" DROP COLUMN "name",
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "legalName" TEXT NOT NULL,
ADD COLUMN     "organisationType" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "tradingName" TEXT;
