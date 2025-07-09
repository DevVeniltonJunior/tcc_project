/*
  Warnings:

  - You are about to drop the column `objective` on the `Planing` table. All the data in the column will be lost.
  - You are about to drop the column `objectiveValue` on the `Planing` table. All the data in the column will be lost.
  - Added the required column `goal` to the `Planing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goalValue` to the `Planing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Planing" DROP COLUMN "objective",
DROP COLUMN "objectiveValue",
ADD COLUMN     "goal" TEXT NOT NULL,
ADD COLUMN     "goalValue" DOUBLE PRECISION NOT NULL;
