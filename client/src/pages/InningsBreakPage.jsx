import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';

export default function InningsBreakPage({ gameState }) {
  const lastTurn = useGameStore(state => state.lastTurnResult);

  if (!gameState) return null;

  const { players, scores, batting, bowling, target, maxBalls } = gameState;
  const firstBatter = players[bowling];
  const firstScore = scores[bowling];
  const totalOvers = maxBalls ? Math.floor(maxBalls / 6) : 1;

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.25, 0, 0, 1] }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div {...pageTransition} className="w-full max-w-3xl space-y-24">
        
        <div>
          <p className="font-mono text-muted-foreground uppercase tracking-widest-label mb-6">Innings Break</p>
          <h2 className="text-8xl sm:text-9xl font-black display-title text-white tracking-tighter-display mb-4">
            TARGET
          </h2>
          <div className="text-9xl sm:text-[12rem] font-black display-title text-accent leading-none">
            {target}
          </div>
          {lastTurn?.isOut && (
            <p className="font-mono text-sm sm:text-lg text-accent mt-6 uppercase tracking-widest-label bg-white/10 py-2 px-4 rounded-full inline-block">
              {firstBatter?.name} was OUT! (Both picked {lastTurn.batterChoice})
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-12 sm:gap-24 border-t border-border pt-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide-label text-muted-foreground mb-2">First Innings</p>
            <p className="text-3xl font-black display-title text-white">{firstScore}</p>
            <p className="font-mono text-sm text-muted-foreground mt-1">by {firstBatter?.name}</p>
          </div>
          
          <div className="hidden sm:block w-px h-16 bg-border"></div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wide-label text-muted-foreground mb-2">To Win</p>
            <p className="text-3xl font-black display-title text-white">{players[batting]?.name}</p>
            <p className="font-mono text-sm text-accent mt-1">needs {target} in {totalOvers} ov</p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
