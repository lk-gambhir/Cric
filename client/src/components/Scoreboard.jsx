export default function Scoreboard({ gameState }) {
  if (!gameState) return null;

  const { players, scores, innings, batting, bowling, target, ballsPlayed, maxBalls } = gameState;
  const inningsIdx = innings - 1;
  const currentBalls = ballsPlayed ? ballsPlayed[inningsIdx] : 0;
  const totalBalls = maxBalls || 6;
  const oversStr = `${Math.floor(currentBalls / 6)}.${currentBalls % 6}`;
  const totalOversStr = `${Math.floor(totalBalls / 6)}`;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border gap-4">
        <div className="flex items-baseline gap-4">
          <span className="text-xl sm:text-2xl font-bold display-title text-white">
            INNINGS {innings}
          </span>
          <span className="font-mono text-muted-foreground text-sm tracking-wide-label">
            {oversStr}/{totalOversStr} OV
          </span>
        </div>
        {target && (
          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="font-mono text-accent text-sm border border-accent px-3 py-1 uppercase tracking-wide-label">
              Target {target}
            </div>
            {innings === 2 && (
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest-label">
                Need <span className="text-accent font-bold">{Math.max(0, target - scores[batting])}</span> to win
              </span>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-8 sm:gap-16">
        {players.map((player, index) => {
          const isBatting = index === batting;
          const isBowling = index === bowling;

          return (
            <div key={player.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-mono text-sm uppercase tracking-wide-label truncate max-w-[120px] ${
                  !player.connected ? 'text-red-500 line-through' : 'text-muted-foreground'
                }`}>
                  {player.name}
                </span>
                <div className="flex gap-2">
                  {isBatting && <span className="font-mono text-[10px] text-accent border-b border-accent uppercase">Bat</span>}
                  {isBowling && <span className="font-mono text-[10px] text-foreground border-b border-foreground uppercase">Bowl</span>}
                </div>
              </div>

              <div className={`text-6xl sm:text-8xl font-black display-title score-display ${isBatting ? 'text-white' : 'text-muted-foreground'}`}>
                {scores[index]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
