if (player === PlayerChoice.PLAYER1) {
    oddsPlayer = bet.oddsBetPlayer1;
} else if (player === PlayerChoice.PLAYER2) {
    oddsPlayer = bet.oddsBetPlayer2;
}

if (!oddsPlayer) {
    throw new Error("Коэффициент ставки не найден");
}


const currentOdds = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 : bet.oddsBetPlayer2;

yarn cache clean


при нажатие на кнопку BET, нужно чтобы коэффициент выбранной ставки записывался сразу, и когда передавался на сервер , сравнивался в handlePlaceBet и если коэффициент не изменился, отправлялся на сервер в
placeBet3 , если изменился то выводим сообщение                         setPlaceBetErrors((prev) => ({
    ...prev,
    [bet.id]: null,
}));

const oddsPlayerBet = player === PlayerChoice.PLAYER1 ? bet.oddsBetPlayer1 : bet.oddsBetPlayer2; сделай на 4 игрока


console.log("currentOdds " + currentOdds);
console.log("initialOddsForPlayer " + initialOddsForPlayer);

опиши своими словами как считаешь нужным, можешь изменять текст как угодно
Мы организуем турнир по Heroes3 Hota, который понравится всем участникаv, игрокам и зрителям.
    Многие зрители не смотрят ТОП игроков, им интересен сам человек, наша цель, найти 16 игроков для наших будущих турниров и помочь им
стать популярными, и тем самым мы так же станем популярыми для будущего сотрудничества.
