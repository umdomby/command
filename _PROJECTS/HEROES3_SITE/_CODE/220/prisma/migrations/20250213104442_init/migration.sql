/*
  Warnings:

  - A unique constraint covering the columns `[telegram]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlayerChoice" ADD VALUE 'PLAYER3';
ALTER TYPE "PlayerChoice" ADD VALUE 'PLAYER4';

-- CreateTable
CREATE TABLE "Bet3" (
    "id" SERIAL NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "player3Id" INTEGER NOT NULL,
    "initBetPlayer1" DOUBLE PRECISION NOT NULL,
    "initBetPlayer2" DOUBLE PRECISION NOT NULL,
    "initBetPlayer3" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer1" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer2" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer3" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer1" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer2" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer3" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer1" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer2" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer3" DOUBLE PRECISION NOT NULL,
    "overlapPlayer1" DOUBLE PRECISION NOT NULL,
    "overlapPlayer2" DOUBLE PRECISION NOT NULL,
    "overlapPlayer3" DOUBLE PRECISION NOT NULL,
    "totalBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creatorId" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'OPEN',
    "categoryId" INTEGER,
    "productId" INTEGER,
    "productItemId" INTEGER,
    "winnerId" INTEGER,
    "margin" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bet3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetParticipant3" (
    "id" SERIAL NOT NULL,
    "betId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "player" "PlayerChoice" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "overlap" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "isCovered" "IsCovered" NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetParticipant3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetCLOSED3" (
    "id" SERIAL NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "player3Id" INTEGER NOT NULL,
    "initBetPlayer1" DOUBLE PRECISION NOT NULL,
    "initBetPlayer2" DOUBLE PRECISION NOT NULL,
    "initBetPlayer3" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer1" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer2" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer3" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer1" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer2" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer3" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer1" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer2" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer3" DOUBLE PRECISION NOT NULL,
    "overlapPlayer1" DOUBLE PRECISION NOT NULL,
    "overlapPlayer2" DOUBLE PRECISION NOT NULL,
    "overlapPlayer3" DOUBLE PRECISION NOT NULL,
    "totalBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creatorId" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'CLOSED',
    "categoryId" INTEGER,
    "productId" INTEGER,
    "productItemId" INTEGER,
    "winnerId" INTEGER,
    "margin" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetCLOSED3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetParticipantCLOSED3" (
    "id" SERIAL NOT NULL,
    "betCLOSED3Id" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "player" "PlayerChoice" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "overlap" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "isCovered" "IsCovered" NOT NULL,
    "return" DOUBLE PRECISION NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetParticipantCLOSED3_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegram_key" ON "User"("telegram");

-- AddForeignKey
ALTER TABLE "Bet3" ADD CONSTRAINT "Bet3_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet3" ADD CONSTRAINT "Bet3_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet3" ADD CONSTRAINT "Bet3_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet3" ADD CONSTRAINT "Bet3_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet3" ADD CONSTRAINT "Bet3_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet3" ADD CONSTRAINT "Bet3_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet3" ADD CONSTRAINT "Bet3_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipant3" ADD CONSTRAINT "BetParticipant3_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet3"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipant3" ADD CONSTRAINT "BetParticipant3_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED3" ADD CONSTRAINT "BetCLOSED3_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED3" ADD CONSTRAINT "BetCLOSED3_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED3" ADD CONSTRAINT "BetCLOSED3_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED3" ADD CONSTRAINT "BetCLOSED3_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED3" ADD CONSTRAINT "BetCLOSED3_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED3" ADD CONSTRAINT "BetCLOSED3_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED3" ADD CONSTRAINT "BetCLOSED3_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipantCLOSED3" ADD CONSTRAINT "BetParticipantCLOSED3_betCLOSED3Id_fkey" FOREIGN KEY ("betCLOSED3Id") REFERENCES "BetCLOSED3"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipantCLOSED3" ADD CONSTRAINT "BetParticipantCLOSED3_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
