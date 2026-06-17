import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionStatus({ connected, opponentDisconnected, disconnectedPlayerName }) {
  return (
    <AnimatePresence>
      {!connected && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2 px-4 text-xs font-mono uppercase tracking-widest-label border-b border-white/20"
        >
          [ CONNECTION LOST. RECONNECTING... ]
        </motion.div>
      )}

      {connected && opponentDisconnected && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A] border-b border-[#262626] text-[#FAFAFA] text-center py-2 px-4 text-xs font-mono uppercase tracking-widest-label"
        >
          [ {disconnectedPlayerName || 'OPPONENT'} DISCONNECTED. WAITING... ]
        </motion.div>
      )}
    </AnimatePresence>
  );
}
