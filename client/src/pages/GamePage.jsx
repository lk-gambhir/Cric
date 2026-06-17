import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Scoreboard from '../components/Scoreboard';
import NumberSelector from '../components/NumberSelector';
import CircularTimer from '../components/CircularTimer';
import TurnResultOverlay from '../components/TurnResultOverlay';
import useGameStore from '../store/gameStore';

export default function GamePage({ gameState, onSubmitRun, onForfeit }) {
  const { hasSubmitted, selectedRun, opponentSubmitted, timeLeft, timerTotal, lastTurnResult, reballMessage } = useGameStore();
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  if (!gameState || !gameState.players || gameState.players.length < 2) return null;

  const myIndex = gameState.myPlayerIndex;
  const isBatting = myIndex === gameState.batting;

  const handleSelect = (num) => {
    if (hasSubmitted) return;
    onSubmitRun(num);
  };

  const handleForfeit = () => {
    setShowForfeitConfirm(false);
    onForfeit();
  };

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.25, 0, 0, 1] }
  };

  return (
    <div className="h-[100dvh] flex flex-col p-4 sm:p-6 max-w-4xl mx-auto overflow-hidden">
      <TurnResultOverlay result={lastTurnResult} />
      <div className="flex items-start justify-between mb-12">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className={`font-mono text-xs uppercase tracking-widest-label px-3 py-1 border ${
              isBatting ? 'border-accent text-accent' : 'border-foreground text-foreground'
            }`}>
              {isBatting ? 'BATTING' : 'BOWLING'}
            </span>
            <button
              onClick={() => setShowForfeitConfirm(true)}
              className="text-xs font-mono uppercase tracking-wide-label text-muted-foreground hover:text-red-500 transition-colors"
            >
              [ EXIT / FORFEIT ]
            </button>
          </div>
          
          <AnimatePresence>
            {reballMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="font-mono text-sm uppercase tracking-wide-label text-accent"
              >
                {reballMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <CircularTimer timeLeft={timeLeft} total={timerTotal} />
      </div>
      <motion.div {...pageTransition}>
        <Scoreboard gameState={gameState} />
      </motion.div>
      <motion.div {...pageTransition} className="flex-1 flex flex-col items-center justify-center py-4">
        {!hasSubmitted ? (
          <div className="w-full">
            <p className="font-mono text-muted-foreground text-sm uppercase tracking-wide-label text-center mb-8">
              {isBatting ? 'Choose your runs' : 'Pick a delivery'}
            </p>
            <NumberSelector onSelect={handleSelect} disabled={false} selectedRun={selectedRun} />
          </div>
        ) : (
          <div className="text-center w-full max-w-lg border border-border py-20 px-6 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-accent"></div>
            
            <div className="text-8xl font-black display-title text-accent mb-6">
              {selectedRun}
            </div>
            {opponentSubmitted ? (
              <p className="font-mono uppercase tracking-widest-label text-white text-sm">Revealing...</p>
            ) : (
              <p className="font-mono uppercase tracking-widest-label text-muted-foreground text-sm animate-pulse">Waiting...</p>
            )}
          </div>
        )}
      </motion.div>
      {gameState.ballHistory && gameState.ballHistory.length > 0 && (
        <motion.div {...pageTransition} className="mt-auto pt-4 border-t border-border">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide-label mb-4">Recent Deliveries</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {gameState.ballHistory.slice(-10).map((ball, i) => (
              <div key={i} className={`flex-shrink-0 w-10 h-10 flex items-center justify-center font-mono text-sm font-bold border ${
                ball.isOut
                  ? 'border-foreground text-foreground bg-foreground/10'
                  : 'border-accent text-accent'
              }`}>
                {ball.isOut ? 'W' : ball.runs}
              </div>
            ))}
          </div>
        </motion.div>
      )}
      <AnimatePresence>
        {showForfeitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md border border-border bg-background p-8 text-center space-y-8"
            >
              <div>
                <h3 className="text-3xl font-black display-title text-white mb-2">FORFEIT?</h3>
                <p className="font-mono text-muted-foreground text-sm">This action cannot be undone.</p>
              </div>
              <div className="flex flex-col gap-4">
                <button onClick={handleForfeit} className="btn-secondary text-red-500 border-red-500 hover:bg-red-500 hover:text-white w-full py-4">
                  Confirm Forfeit
                </button>
                <button onClick={() => setShowForfeitConfirm(false)} className="font-mono text-muted-foreground hover:text-white text-sm uppercase tracking-wide-label py-2">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
