import { useState } from 'react';
import { motion } from 'framer-motion';
import NumberSelector from '../components/NumberSelector';
import CircularTimer from '../components/CircularTimer';

export default function TossPage({ gameState, tossResult, timeLeft, timerTotal, onTossChoice, onTossDecision }) {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const isTossWinner = tossResult && tossResult.winnerId === gameState?.myPlayerId;
  const showDecision = tossResult && isTossWinner && gameState?.state === 'toss_result';
  const waitingForDecision = tossResult && !isTossWinner && gameState?.state === 'toss_result';
  const myIndex = gameState?.myPlayerIndex;
  const myLabel = myIndex === 0 ? 'ODD' : 'EVEN';

  const handleTossSelect = (num) => {
    if (submitted) return;
    setSelectedChoice(num);
    setSubmitted(true);
    onTossChoice(num);
  };

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.25, 0, 0, 1] }
  };

  if (showDecision) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div {...pageTransition} className="w-full max-w-2xl text-center space-y-16">
          <div>
            <h2 className="text-6xl sm:text-7xl font-black display-title mb-4 text-accent">TOSS WON</h2>
            <p className="text-muted-foreground font-mono uppercase tracking-wide-label">
              Sum: {tossResult.sum} ({tossResult.isOdd ? 'Odd' : 'Even'})
            </p>
          </div>
          
          <div className="space-y-8">
            <p className="text-xl font-bold">Your Decision?</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button onClick={() => onTossDecision('bat')} className="btn-secondary text-xl py-6 px-12 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                BAT
              </button>
              <button onClick={() => onTossDecision('bowl')} className="btn-secondary text-xl py-6 px-12">
                BOWL
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (waitingForDecision) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div {...pageTransition} className="w-full max-w-2xl text-center space-y-12">
          <div>
            <h2 className="text-6xl sm:text-7xl font-black display-title mb-4 text-muted-foreground">TOSS LOST</h2>
            <p className="text-muted-foreground font-mono uppercase tracking-wide-label">
              Sum: {tossResult.sum} ({tossResult.isOdd ? 'Odd' : 'Even'})
            </p>
          </div>
          
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="font-mono text-accent text-sm uppercase tracking-wide-label">
            {tossResult.winnerName} is choosing...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div {...pageTransition} className="w-full max-w-2xl flex flex-col items-center">
        
        <div className="w-full flex justify-between items-start mb-16">
          <div>
            <h2 className="text-5xl sm:text-6xl font-black display-title text-white mb-2">TOSS</h2>
            <p className="font-mono text-muted-foreground text-sm uppercase tracking-wide-label">
              You are <span className={`border-b-2 ${myIndex === 0 ? 'border-accent text-accent' : 'border-foreground text-foreground'}`}>{myLabel}</span>
            </p>
          </div>
          <CircularTimer timeLeft={timeLeft} total={timerTotal} />
        </div>

        {!submitted ? (
          <div className="w-full">
            <NumberSelector onSelect={handleTossSelect} disabled={false} selectedRun={selectedChoice} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-8xl font-black display-title text-accent mb-6">
              {selectedChoice}
            </div>
            <p className="font-mono uppercase tracking-wide-label text-muted-foreground text-sm">Waiting for opponent</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
