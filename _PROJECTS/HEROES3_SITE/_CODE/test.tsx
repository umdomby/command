

{statusUserBetState === GameUserBetStatus.START && (
    <div>
        <div className="flex items-center">
            <input
                type="checkbox"
                checked={checkWinUser1 === true}
                onChange={() => setCheckWinUser1(true)}
            />
            <label className="ml-2">User1 Wins</label>
        </div>
        <div className="flex items-center">
            <input
                type="checkbox"
                checked={checkWinUser1 === false}
                onChange={() => setCheckWinUser1(false)}
            />
            <label className="ml-2">User1 Loses</label>
        </div>
        <div className="flex items-center">
            <input
                type="checkbox"
                checked={checkWinUser2 === true}
                onChange={() => setCheckWinUser2(true)}
            />
            <label className="ml-2">User2 Wins</label>
        </div>
        <div className="flex items-center">
            <input
                type="checkbox"
                checked={checkWinUser2 === false}
                onChange={() => setCheckWinUser2(false)}
            />
            <label className="ml-2">User2 Loses</label>
        </div>
        <Button
            onClick={() => handleGameEnd(bet.id)}
            className="mt-4 bg-blue-500 text-white"
        >
            Confirm Result
        </Button>
    </div>
)}
{statusUserBetState === GameUserBetStatus.CLOSED && (
    <div>
        <div className={`text-center ${checkWinUser1 ? 'text-green-500' : 'text-red-500'}`}>
            {bet.gameUser1Bet.telegram}
        </div>
        <div className={`text-center ${checkWinUser2 ? 'text-green-500' : 'text-red-500'}`}>
            {bet.gameUser2Bet?.telegram || "No Telegram"}
        </div>
        <div className="text-center">
            {new Date(bet.updatedAt).toLocaleString()}
        </div>
    </div>
)}
