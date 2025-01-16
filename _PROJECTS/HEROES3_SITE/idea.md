1. Закрытие ставки создателем, и 50% игроков сделавших ставку на победителя 
2. биржа обмена баллов между игроками
3. сделать страницу с историей ставок с датами и результатами
4. нельзя ставить больше чем поставлено на игрока максимальная ставка
нужно добавить поле с максимальной ставкой, нельзя ставить больше чем разность коэффициента будет достигать 0.3 от изменений коэффициента
5. разность коэффициента выведи в отдельное поле useRef
6. 
7. 

   \wsl.localhost\Ubuntu-24.04\home\pi\Projects\heroes\app\actions.ts 
7. // Проверка, не превышает ли ставка сумму другого игрока на 100% сделай не на 100% , а на 30% , сделай проверку на сервере

Проверка, не превышает ли ставка сумму другого игрока на 100% сделай не на 100% , а на 30% , сделай проверку на сервере


измени проверку на сервере сделай, чтобы при ставке прибыль не превышала 30% от поставленных ставок на другого игрока
// Проверка, не превышает ли ставка сумму другого игрока на 30%
if (player === PlayerChoice.PLAYER1 && amount > totalPlayer2 * 1.3) {
throw new Error('Ставка превышает сумму другого игрока на 30%');
}

if (player === PlayerChoice.PLAYER2 && amount > totalPlayer1 * 1.3) {
throw new Error('Ставка превышает сумму другого игрока на 30%');
}

// Проверка, чтобы прибыль не превышала 30% от суммы ставок на другого игрока


В таблицу model BetParticipant amount ставки записываются корректно, а вот в 
дальнейшем model Bet totalBetPlayer1 и totalBetPlayer2 не корректно, надо исправить


// \\wsl.localhost\Ubuntu-24.04\home\pi\Projects\heroes\app\actions.ts Обновляем коэффициенты и общую сумму ставок await prisma.bet.update({ where: { id: betId }, data: { currentOdds1: updatedOddsPlayer1, currentOdds2: updatedOddsPlayer2, totalBetPlayer1: updatedTotalPlayer1, totalBetPlayer2: updatedTotalPlayer2, }, }); идет не правильное обновление
Коэффициенты:{' '} <span className={playerColors[PlayerChoice.PLAYER1]}>{currentOdds1.toFixed(2)} -{' '} <span className={playerColors[PlayerChoice.PLAYER2]}>{currentOdds2.toFixed(2)} |{' '} Ставки на <span className={playerColors[PlayerChoice.PLAYER1]}>{bet.player1.name}:{' '} <span className={playerColors[PlayerChoice.PLAYER1]}>{totalBetPlayer1} |{' '} Ставки на <span className={playerColors[PlayerChoice.PLAYER2]}>{bet.player2.name}:{' '} <span className={playerColors[PlayerChoice.PLAYER2]}>{totalBetPlayer2} так же тут не правильное отображение
