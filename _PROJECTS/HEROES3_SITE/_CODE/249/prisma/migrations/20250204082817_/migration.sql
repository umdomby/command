-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('OPEN', 'CLOSED', 'PENDING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'BANED');

-- CreateEnum
CREATE TYPE "IsCovered" AS ENUM ('OPEN', 'CLOSED', 'PENDING', 'CP');

-- CreateEnum
CREATE TYPE "BuySell" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderP2PStatus" AS ENUM ('OPEN', 'CLOSED', 'RETURN', 'CONTROL');

-- CreateEnum
CREATE TYPE "PlayerChoice" AS ENUM ('PLAYER1', 'PLAYER2');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "provider" TEXT,
    "providerId" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "img" TEXT,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "p2pPlus" INTEGER DEFAULT 0,
    "p2pMinus" INTEGER DEFAULT 0,
    "contact" JSONB,
    "loginHistory" JSONB,
    "bankDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderP2P" (
    "id" SERIAL NOT NULL,
    "orderP2PUser1Id" INTEGER NOT NULL,
    "orderP2PUser2Id" INTEGER,
    "orderP2PBuySell" "BuySell" NOT NULL,
    "orderP2PPoints" DOUBLE PRECISION NOT NULL,
    "orderP2PMoney" JSONB NOT NULL,
    "orderP2PChat" JSONB,
    "orderP2PStatus" "OrderP2PStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderP2P_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "transferUser1Id" INTEGER NOT NULL,
    "transferUser2Id" INTEGER,
    "transferPoints" DOUBLE PRECISION NOT NULL,
    "transferStatus" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" SERIAL NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "initBetPlayer1" DOUBLE PRECISION NOT NULL,
    "initBetPlayer2" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer1" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer2" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer1" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer2" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer1" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer2" DOUBLE PRECISION NOT NULL,
    "overlapPlayer1" DOUBLE PRECISION NOT NULL,
    "overlapPlayer2" DOUBLE PRECISION NOT NULL,
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

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetParticipant" (
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

    CONSTRAINT "BetParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetCLOSED" (
    "id" SERIAL NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "initBetPlayer1" DOUBLE PRECISION NOT NULL,
    "initBetPlayer2" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer1" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer2" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer1" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer2" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer1" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer2" DOUBLE PRECISION NOT NULL,
    "overlapPlayer1" DOUBLE PRECISION NOT NULL,
    "overlapPlayer2" DOUBLE PRECISION NOT NULL,
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

    CONSTRAINT "BetCLOSED_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetParticipantCLOSED" (
    "id" SERIAL NOT NULL,
    "betCLOSEDId" INTEGER NOT NULL,
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

    CONSTRAINT "BetParticipantCLOSED_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalData" (
    "id" SERIAL NOT NULL,
    "usersPlay" INTEGER NOT NULL,
    "pointsBet" DOUBLE PRECISION NOT NULL,
    "users" INTEGER NOT NULL,
    "pointsStart" DOUBLE PRECISION NOT NULL,
    "pointsAllUsers" DOUBLE PRECISION NOT NULL,
    "pointsAllStart" DOUBLE PRECISION DEFAULT 1000000,
    "pointsPay" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralUserIpAddress" (
    "id" SERIAL NOT NULL,
    "referralUserId" INTEGER NOT NULL,
    "referralIpAddress" TEXT NOT NULL,
    "referralStatus" BOOLEAN NOT NULL DEFAULT false,
    "referralPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralUserIpAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "ProductItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cardId_key" ON "User"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductItem_name_key" ON "ProductItem"("name");

-- AddForeignKey
ALTER TABLE "OrderP2P" ADD CONSTRAINT "OrderP2P_orderP2PUser1Id_fkey" FOREIGN KEY ("orderP2PUser1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderP2P" ADD CONSTRAINT "OrderP2P_orderP2PUser2Id_fkey" FOREIGN KEY ("orderP2PUser2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_transferUser1Id_fkey" FOREIGN KEY ("transferUser1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_transferUser2Id_fkey" FOREIGN KEY ("transferUser2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipant" ADD CONSTRAINT "BetParticipant_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipant" ADD CONSTRAINT "BetParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED" ADD CONSTRAINT "BetCLOSED_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED" ADD CONSTRAINT "BetCLOSED_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED" ADD CONSTRAINT "BetCLOSED_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED" ADD CONSTRAINT "BetCLOSED_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED" ADD CONSTRAINT "BetCLOSED_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED" ADD CONSTRAINT "BetCLOSED_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipantCLOSED" ADD CONSTRAINT "BetParticipantCLOSED_betCLOSEDId_fkey" FOREIGN KEY ("betCLOSEDId") REFERENCES "BetCLOSED"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipantCLOSED" ADD CONSTRAINT "BetParticipantCLOSED_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUserIpAddress" ADD CONSTRAINT "ReferralUserIpAddress_referralUserId_fkey" FOREIGN KEY ("referralUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductItem" ADD CONSTRAINT "ProductItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
