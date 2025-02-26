className="text-red-500 hover:text-blue-300 bg-grey-500 font-bold h-5"
className="text-red-500 hover:text-blue-300 bg-grey-500 hover:bg-grey-500 font-bold h-5"


className={`${bet.gameUser2Rating === RatingUserEnum.MINUS ? 'bg-red-500' : 'bg-gray-500'} h-6`}

className={`${selectedWinUser1[bet.id] === WinGameUserBet.LOSS ? 'bg-red-500' : bet.checkWinUser1 === WinGameUserBet.LOSS ? 'bg-red-500' : 'bg-gray-500'} mr-2`}
