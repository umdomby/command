-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('OPEN', 'OPEN_USER', 'CLOSED', 'PENDING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'BANED');

-- CreateEnum
CREATE TYPE "IsCovered" AS ENUM ('OPEN', 'CLOSED', 'PENDING');

-- CreateEnum
CREATE TYPE "BuySell" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderP2PStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED', 'RETURN', 'CONTROL');

-- CreateEnum
CREATE TYPE "PlayerChoice" AS ENUM ('PLAYER1', 'PLAYER2', 'PLAYER3', 'PLAYER4');

-- CreateEnum
CREATE TYPE "GameUserBetStatus" AS ENUM ('REGISTRATION', 'OPEN', 'CLOSED');

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
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p2pPlus" INTEGER DEFAULT 0,
    "p2pMinus" INTEGER DEFAULT 0,
    "contact" JSONB,
    "loginHistory" JSONB,
    "bankDetails" JSONB,
    "telegram" TEXT,
    "telegramView" BOOLEAN NOT NULL DEFAULT false,
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
    "orderP2PPrice" DOUBLE PRECISION,
    "orderP2PPart" BOOLEAN NOT NULL DEFAULT false,
    "orderBankDetails" JSONB NOT NULL,
    "orderP2PStatus" "OrderP2PStatus" NOT NULL DEFAULT 'OPEN',
    "orderP2PCheckUser1" BOOLEAN,
    "orderP2PCheckUser2" BOOLEAN,
    "orderBankPay" JSONB,
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
CREATE TABLE "ChatUsers" (
    "id" SERIAL NOT NULL,
    "chatUserId" INTEGER NOT NULL,
    "chatText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regPoints" (
    "id" SERIAL NOT NULL,
    "regPointsUserId" INTEGER NOT NULL,
    "regPointsPoints" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regPoints_pkey" PRIMARY KEY ("id")
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
    "twitch" TEXT,
    "userId" INTEGER,

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

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProductItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalData" (
    "id" SERIAL NOT NULL,
    "users" INTEGER NOT NULL DEFAULT 0,
    "betFund" DOUBLE PRECISION DEFAULT 1000000,
    "reg" DOUBLE PRECISION DEFAULT 0,
    "ref" DOUBLE PRECISION DEFAULT 0,
    "usersPoints" DOUBLE PRECISION DEFAULT 0,
    "margin" DOUBLE PRECISION DEFAULT 0,
    "openBetsPoints" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameUserBet" (
    "id" SERIAL NOT NULL,
    "gameUserBet1Id" INTEGER NOT NULL,
    "betUser1" DOUBLE PRECISION NOT NULL,
    "betUser2" DOUBLE PRECISION,
    "gameUserBetDetails" TEXT NOT NULL DEFAULT '',
    "gameUserBetOpen" BOOLEAN NOT NULL DEFAULT false,
    "checkWinUser1" BOOLEAN,
    "checkWinUser2" BOOLEAN,
    "gameUserBet2Id" INTEGER,
    "gameUserBetDataUsers2" JSONB,
    "categoryId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productItemId" INTEGER NOT NULL,
    "statusUserBet" "GameUserBetStatus" NOT NULL DEFAULT 'REGISTRATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameUserBet_pkey" PRIMARY KEY ("id")
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
    "margin" DOUBLE PRECISION,
    "totalBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creatorId" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'OPEN',
    "categoryId" INTEGER,
    "productId" INTEGER,
    "productItemId" INTEGER,
    "winnerId" INTEGER,
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
    "totalBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "globalDataBetFund" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
    "margin" DOUBLE PRECISION,
    "creatorId" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'CLOSED',
    "categoryId" INTEGER,
    "productId" INTEGER,
    "productItemId" INTEGER,
    "winnerId" INTEGER,
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
    "return" DOUBLE PRECISION NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "isCovered" "IsCovered" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetParticipantCLOSED_pkey" PRIMARY KEY ("id")
);

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
    "margin" DOUBLE PRECISION,
    "totalBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creatorId" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'OPEN',
    "categoryId" INTEGER,
    "productId" INTEGER,
    "productItemId" INTEGER,
    "winnerId" INTEGER,
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
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "isCovered" "IsCovered" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetParticipant3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetCLOSED3" (
    "id" SERIAL NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "player3Id" INTEGER NOT NULL,
    "totalBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "globalDataBetFund" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
    "margin" DOUBLE PRECISION,
    "creatorId" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'CLOSED',
    "categoryId" INTEGER,
    "productId" INTEGER,
    "productItemId" INTEGER,
    "winnerId" INTEGER,
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
    "return" DOUBLE PRECISION NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "isCovered" "IsCovered" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetParticipantCLOSED3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet4" (
    "id" SERIAL NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "player3Id" INTEGER NOT NULL,
    "player4Id" INTEGER NOT NULL,
    "initBetPlayer1" DOUBLE PRECISION NOT NULL,
    "initBetPlayer2" DOUBLE PRECISION NOT NULL,
    "initBetPlayer3" DOUBLE PRECISION NOT NULL,
    "initBetPlayer4" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer1" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer2" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer3" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer4" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer1" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer2" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer3" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer4" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer1" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer2" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer3" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer4" DOUBLE PRECISION NOT NULL,
    "overlapPlayer1" DOUBLE PRECISION NOT NULL,
    "overlapPlayer2" DOUBLE PRECISION NOT NULL,
    "overlapPlayer3" DOUBLE PRECISION NOT NULL,
    "overlapPlayer4" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION,
    "totalBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creatorId" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'OPEN',
    "categoryId" INTEGER,
    "productId" INTEGER,
    "productItemId" INTEGER,
    "winnerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bet4_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetParticipant4" (
    "id" SERIAL NOT NULL,
    "betId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "player" "PlayerChoice" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "overlap" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "isCovered" "IsCovered" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetParticipant4_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetCLOSED4" (
    "id" SERIAL NOT NULL,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "player3Id" INTEGER NOT NULL,
    "player4Id" INTEGER NOT NULL,
    "totalBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnBetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "globalDataBetFund" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initBetPlayer1" DOUBLE PRECISION NOT NULL,
    "initBetPlayer2" DOUBLE PRECISION NOT NULL,
    "initBetPlayer3" DOUBLE PRECISION NOT NULL,
    "initBetPlayer4" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer1" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer2" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer3" DOUBLE PRECISION NOT NULL,
    "totalBetPlayer4" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer1" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer2" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer3" DOUBLE PRECISION NOT NULL,
    "oddsBetPlayer4" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer1" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer2" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer3" DOUBLE PRECISION NOT NULL,
    "maxBetPlayer4" DOUBLE PRECISION NOT NULL,
    "overlapPlayer1" DOUBLE PRECISION NOT NULL,
    "overlapPlayer2" DOUBLE PRECISION NOT NULL,
    "overlapPlayer3" DOUBLE PRECISION NOT NULL,
    "overlapPlayer4" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION,
    "creatorId" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'CLOSED',
    "categoryId" INTEGER,
    "productId" INTEGER,
    "productItemId" INTEGER,
    "winnerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetCLOSED4_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetParticipantCLOSED4" (
    "id" SERIAL NOT NULL,
    "betCLOSED4Id" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "player" "PlayerChoice" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "overlap" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "return" DOUBLE PRECISION NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "isCovered" "IsCovered" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetParticipantCLOSED4_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cardId_key" ON "User"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegram_key" ON "User"("telegram");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");

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
ALTER TABLE "ChatUsers" ADD CONSTRAINT "ChatUsers_chatUserId_fkey" FOREIGN KEY ("chatUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regPoints" ADD CONSTRAINT "regPoints_regPointsUserId_fkey" FOREIGN KEY ("regPointsUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUserIpAddress" ADD CONSTRAINT "ReferralUserIpAddress_referralUserId_fkey" FOREIGN KEY ("referralUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameUserBet" ADD CONSTRAINT "GameUserBet_gameUserBet1Id_fkey" FOREIGN KEY ("gameUserBet1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameUserBet" ADD CONSTRAINT "GameUserBet_gameUserBet2Id_fkey" FOREIGN KEY ("gameUserBet2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameUserBet" ADD CONSTRAINT "GameUserBet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameUserBet" ADD CONSTRAINT "GameUserBet_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameUserBet" ADD CONSTRAINT "GameUserBet_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "Bet4" ADD CONSTRAINT "Bet4_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet4" ADD CONSTRAINT "Bet4_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet4" ADD CONSTRAINT "Bet4_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet4" ADD CONSTRAINT "Bet4_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet4" ADD CONSTRAINT "Bet4_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet4" ADD CONSTRAINT "Bet4_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet4" ADD CONSTRAINT "Bet4_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet4" ADD CONSTRAINT "Bet4_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipant4" ADD CONSTRAINT "BetParticipant4_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet4"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipant4" ADD CONSTRAINT "BetParticipant4_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED4" ADD CONSTRAINT "BetCLOSED4_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED4" ADD CONSTRAINT "BetCLOSED4_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED4" ADD CONSTRAINT "BetCLOSED4_player3Id_fkey" FOREIGN KEY ("player3Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED4" ADD CONSTRAINT "BetCLOSED4_player4Id_fkey" FOREIGN KEY ("player4Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED4" ADD CONSTRAINT "BetCLOSED4_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED4" ADD CONSTRAINT "BetCLOSED4_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED4" ADD CONSTRAINT "BetCLOSED4_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetCLOSED4" ADD CONSTRAINT "BetCLOSED4_productItemId_fkey" FOREIGN KEY ("productItemId") REFERENCES "ProductItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipantCLOSED4" ADD CONSTRAINT "BetParticipantCLOSED4_betCLOSED4Id_fkey" FOREIGN KEY ("betCLOSED4Id") REFERENCES "BetCLOSED4"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetParticipantCLOSED4" ADD CONSTRAINT "BetParticipantCLOSED4_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
