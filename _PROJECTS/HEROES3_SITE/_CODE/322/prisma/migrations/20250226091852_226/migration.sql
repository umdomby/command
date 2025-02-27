-- AlterEnum
ALTER TYPE "BetStatus" ADD VALUE 'OPEN_TUR';

-- AlterTable
ALTER TABLE "Bet" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Bet3" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Bet4" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "GameUserBet" ADD COLUMN     "gameUserBetStatus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GlobalData" ADD COLUMN     "gameUserBetOpen" DOUBLE PRECISION DEFAULT 0;
