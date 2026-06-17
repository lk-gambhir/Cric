import { motion, AnimatePresence } from 'framer-motion';

export default function TurnResultOverlay({ result }) {
  return (
    <AnimatePresence>
      {result && !result.gameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0, 0, 1] }}
            className="text-center px-4"
          >
            {result.isOut ? (
              <div className="space-y-4">
                <h2 className="text-8xl sm:text-9xl font-black display-title text-white tracking-tighter-display">OUT</h2>
                <div className="font-mono text-xl text-muted-foreground uppercase tracking-widest-label flex justify-center items-center gap-8">
                  <span>{result.batsmanChoice}</span>
                  <span className="w-16 h-px bg-border"></span>
                  <span>{result.bowlerChoice}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-8xl sm:text-9xl font-black display-title text-accent">+{result.runs}</div>
                <div className="font-mono text-sm text-muted-foreground uppercase tracking-widest-label">Runs Scored</div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
