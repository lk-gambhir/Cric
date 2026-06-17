import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage({ onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default join name
  useEffect(() => {
    if (mode === 'join') setTimeout(() => setPlayerName('Player 2'),0);
    else setTimeout(() => setPlayerName(''),0);
    setTimeout(() => setError(''),0);
  }, [mode]);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await onCreateRoom('Player 1');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create room');
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('Enter your name to continue');
      return;
    }
    if (!roomCode.trim()) {
      setError('Enter room code to join');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to join room');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 w-full relative">
      <AnimatePresence>
        {mode === 'join' && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setMode(null)}
            className="absolute top-8 left-8 text-xs font-mono uppercase tracking-wide-label text-muted-foreground hover:text-red-500 transition-colors"
          >
            [ EXIT ]
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0, 0, 1] }}
        className="w-full max-w-2xl flex flex-col items-center"
      >
        <div className="mb-12 text-center cursor-pointer" onClick={() => setMode(null)}>
          <h1 className="text-7xl sm:text-8xl md:text-[9rem] font-black display-title mb-4 tracking-tighter-display text-white transition-colors hover:text-accent">
            CRIC
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base uppercase tracking-widest-label font-medium">
            Multiplayer Hand Cricket
          </p>
        </div>

        <div className="w-full max-w-md">
          {error && (
            <p className="text-red-500 font-mono text-xs uppercase tracking-wide-label text-center mb-4">
              {error}
            </p>
          )}

          {!mode ? (
            <div className="flex gap-4 w-full">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="btn-primary flex-1 py-4 text-sm sm:text-base"
              >
                {loading ? 'CONNECTING...' : 'CREATE ROOM'}
              </button>
              <button
                onClick={() => setMode('join')}
                disabled={loading}
                className="btn-primary flex-1 py-4 text-sm sm:text-base"
              >
                JOIN ROOM
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6 w-full"
            >
              <div>
                <label className="block text-xs uppercase tracking-wide-label text-muted-foreground mb-2 text-center">Player Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={15}
                  className="input-minimal w-full text-center font-mono text-xl py-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') document.getElementById('code-input').focus();
                  }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide-label text-muted-foreground mb-2 text-center">Room Code</label>
                <input
                  id="code-input"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="6 CHAR CODE"
                  maxLength={6}
                  autoFocus
                  className="input-minimal w-full text-center uppercase tracking-[0.2em] font-mono text-2xl py-4 text-accent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoin();
                  }}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-primary w-full py-4 mt-4 text-lg"
              >
                {loading ? 'CONNECTING...' : 'JOIN ROOM'}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
