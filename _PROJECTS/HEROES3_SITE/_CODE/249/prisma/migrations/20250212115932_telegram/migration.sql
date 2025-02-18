/*
  Warnings:

  - You are about to drop the column `orderP2PChat` on the `OrderP2P` table. All the data in the column will be lost.
  - You are about to drop the column `orderP2PMoney` on the `OrderP2P` table. All the data in the column will be lost.
  - Added the required column `orderBankDetails` to the `OrderP2P` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderP2PStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "OrderP2P" DROP COLUMN "orderP2PChat",
DROP COLUMN "orderP2PMoney",
ADD COLUMN     "orderBankDetails" JSONB NOT NULL,
ADD COLUMN     "orderBankPay" JSONB,
ADD COLUMN     "orderP2PCheckUser1" BOOLEAN,
ADD COLUMN     "orderP2PCheckUser2" BOOLEAN,
ADD COLUMN     "orderP2PPart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orderP2PPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegram" TEXT,
ADD COLUMN     "telegramView" BOOLEAN NOT NULL DEFAULT false;
