model Category {
id               Int                @id @default(autoincrement())
name             String             @unique
bets             Bet[]
betsCLOSED       BetCLOSED[]
bets3            Bet3[] // Обратная связь с Bet3
betsCLOSED3      BetCLOSED3[] // Обратная связь с BetCLOSED3
bets4            Bet4[] // Обратная связь с Bet3
betsCLOSED4      BetCLOSED4[] // Обратная связь с BetCLOSED3
gameUserBets     GameUserBet[] // Добавлено обратное отношение
playerStatistics PlayerStatistics[]
}



