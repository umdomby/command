/*
  Warnings:

  - The `checkWinUser1` column on the `GameUserBet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `checkWinUser2` column on the `GameUserBet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `regPoints` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RatingUserEnum" AS ENUM ('PLUS', 'MINUS');

-- CreateEnum
CREATE TYPE "WinGameUserBet" AS ENUM ('WIN', 'LOSS', 'DRAW');

-- DropForeignKey
ALTER TABLE "regPoints" DROP CONSTRAINT "regPoints_regPointsUserId_fkey";

-- AlterTable
ALTER TABLE "Bet" ADD COLUMN     "suspendedBet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Bet3" ADD COLUMN     "suspendedBet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Bet4" ADD COLUMN     "suspendedBet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GameUserBet" ADD COLUMN     "gameUser1Rating" "RatingUserEnum",
ADD COLUMN     "gameUser2Rating" "RatingUserEnum",
DROP COLUMN "checkWinUser1",
ADD COLUMN     "checkWinUser1" "WinGameUserBet",
DROP COLUMN "checkWinUser2",
ADD COLUMN     "checkWinUser2" "WinGameUserBet";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT;

-- DropTable
DROP TABLE "regPoints";

-- CreateTable
CREATE TABLE "CourseValuta" (
    "id" SERIAL NOT NULL,
    "USD" DOUBLE PRECISION NOT NULL,
    "EUR" DOUBLE PRECISION NOT NULL,
    "BEL" DOUBLE PRECISION NOT NULL,
    "BTC" DOUBLE PRECISION NOT NULL,
    "USTD" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseValuta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateDateTime" (
    "id" SERIAL NOT NULL,
    "UDTvaluta" TIMESTAMP(3),
    "UDTOrderP2P" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpdateDateTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegPoints" (
    "id" SERIAL NOT NULL,
    "regPointsUserId" INTEGER NOT NULL,
    "regPointsPoints" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalUserGame" (
    "id" SERIAL NOT NULL,
    "globalUserId" INTEGER NOT NULL,
    "plus" INTEGER NOT NULL DEFAULT 0,
    "minus" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalUserGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalUserGame_globalUserId_key" ON "GlobalUserGame"("globalUserId");

-- AddForeignKey
ALTER TABLE "RegPoints" ADD CONSTRAINT "RegPoints_regPointsUserId_fkey" FOREIGN KEY ("regPointsUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalUserGame" ADD CONSTRAINT "GlobalUserGame_globalUserId_fkey" FOREIGN KEY ("globalUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
