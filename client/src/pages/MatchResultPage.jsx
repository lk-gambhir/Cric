import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { playWinSound, playCrowdCheer } from '../utils/sounds';

export default function MatchResultPage({ gameState, matchResult, onRematch, onLeave, rematchRequested, rematchRequestedBy }) {
  const [hasSentRematch, setHasSentRematch] = useState(false);
  const isWinner = matchResult?.winner === gameState?.myPlayerId;
  const isDraw = matchResult?.matchResult === 'draw';

  useEffect(() => {
    if (isWinner) {
      playWinSound();
      playCrowdCheer();
    }
  }, [isWinner]);

  const players = gameState?.players || [];
  const scores = matchResult?.scores || gameState?.scores || [0, 0];

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.25, 0, 0, 1] }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div {...pageTransition} className="w-full max-w-4xl space-y-24 relative z-10">
        <div>
          <h2 className={`text-7xl sm:text-9xl md:text-[10rem] font-black display-title tracking-tighter-display mb-6 ${
            isDraw ? 'text-white' : isWinner ? 'text-accent' : 'text-muted-foreground'
          }`}>
            {isDraw ? 'DRAW' : isWinner ? 'WIN' : 'LOSE'}
          </h2>
          <p className="font-mono text-sm sm:text-base uppercase tracking-widest-label text-white">
            {matchResult?.message}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 border-y border-border py-12">
          {players.map((player, i) => (
            <div key={player.id} className="flex flex-col">
              <span className="font-mono text-xs sm:text-sm uppercase tracking-wide-label text-muted-foreground mb-4">
                {player.name}
                {player.id === gameState?.myPlayerId && <span className="ml-2 text-accent">[YOU]</span>}
              </span>
              <span className={`text-6xl sm:text-8xl font-black display-title ${
                player.id === matchResult?.winner ? 'text-accent' : 'text-white'
              }`}>
                {scores[i]}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
          {rematchRequested && (
            <div className="font-mono text-accent text-sm uppercase tracking-wide-label w-full sm:w-auto text-center">
              {rematchRequestedBy} requested a rematch
            </div>
          )}
          
          <button 
            onClick={() => {
              setHasSentRematch(true);
              onRematch();
            }} 
            disabled={hasSentRematch && !rematchRequested}
            className="btn-primary text-xl w-full sm:w-auto px-8 disabled:opacity-50"
          >
            {rematchRequested ? 'ACCEPT REMATCH' : (hasSentRematch ? 'REMATCH REQUEST SENT' : 'REMATCH')}
          </button>
          
          <button onClick={onLeave} className="font-mono text-sm uppercase tracking-widest-label text-muted-foreground hover:text-white transition-colors py-4">
            [ EXIT TO LOBBY ]
          </button>
        </div>

      </motion.div>
    </div>
  );
}
