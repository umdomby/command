```
.width-5 { width: 5%; }
.width-10 { width: 10%; }
.width-15 { width: 15%; }
```
```tsx
<div className="flex flex-wrap flex-1 gap-5 w-full">
        <span className={`${playerColors[PlayerChoice.PLAYER1]} text-center width-15`}>{bet.player1.name}: {bet.totalBetPlayer1}</span>
        <span>vs</span>
        <span className={`${playerColors[PlayerChoice.PLAYER2]} text-center width-15`}>{bet.player2.name}: {bet.totalBetPlayer2}</span>
        <span>|</span>
        <span className={`${playerColors[PlayerChoice.PLAYER1]} text-center width-5`}>{bet.currentOdds1.toFixed(2)}</span>
        <span>-</span>
        <span className={`${playerColors[PlayerChoice.PLAYER2]} text-center width-5`}>{bet.currentOdds2.toFixed(2)}</span>
        <span>|</span>
        <span className="text-center width-5">{bet.totalBetAmount}</span>
    </div>
```