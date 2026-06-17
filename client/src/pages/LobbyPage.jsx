import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const OVER_PRESETS = [
  { label: '1 Over', value: 1 },
  { label: '2 Overs', value: 2 },
  { label: '3 Overs', value: 3 },
  { label: '5 Overs', value: 5 },
];

export default function LobbyPage({ roomCode, gameState, onReady, onSetMatchConfig, onLeave, onUpdateName }) {
  const [copied, setCopied] = useState(false);
  const [localName, setLocalName] = useState('');
  const [customOvers, setCustomOvers] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const initializedName = useRef(false);

  const isWaiting = gameState?.players?.length < 2;
  const players = gameState?.players || [];
  const myPlayer = players.find(p => p.id === gameState?.myPlayerId);
  const isReady = myPlayer?.ready;
  const isHost = gameState?.isHost;
  const currentOvers = gameState?.matchConfig?.overs || 1;

  // Initialize local name exactly once when myPlayer data is available
  useEffect(() => {
    if (myPlayer?.name && !initializedName.current) {
      setLocalName(myPlayer.name);
      initializedName.current = true;
    }
  }, [myPlayer?.name]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNameChange = (e) => {
    const newName = e.target.value.substring(0, 15);
    setLocalName(newName);
  };

  const handleNameBlur = () => {
    const defaultName = isHost ? 'Player 1' : 'Player 2';
    const finalName = localName.trim() || defaultName;
    if (finalName !== myPlayer?.name) {
      onUpdateName(finalName);
    }
  };

  const handleOverSelect = (overs) => {
    setShowCustom(false);
    onSetMatchConfig(overs);
  };

  const handleCustomSubmit = () => {
    const val = parseInt(customOvers);
    if (val >= 1 && val <= 20) {
      onSetMatchConfig(val);
      setShowCustom(false);
    }
  };

  const defaultName = isHost ? 'Player 1' : 'Player 2';

  return (
    <div className="min-h-[100dvh] flex flex-col justify-start px-4 sm:px-6 pt-2 pb-6 w-full relative">
      <button
        onClick={onLeave}
        className="absolute top-4 left-4 sm:left-6 text-xs font-mono uppercase tracking-wide-label text-muted-foreground hover:text-red-500 transition-colors z-10"
      >
        [ EXIT ]
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <h1 
            onClick={onLeave} 
            className="text-4xl md:text-5xl font-black display-title mb-0 text-white cursor-pointer hover:text-accent transition-colors inline-block leading-none"
            title="Go back to home screen"
          >
            Lobby
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest-label text-xs mt-1">Match Setup</p>
        </div>

        <div className="space-y-12">
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-wide-label text-muted-foreground mb-2">Your Name</p>
              <div className="pb-3 border-b border-border">
                <input
                  type="text"
                  value={localName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNameBlur(); }}
                  disabled={isReady}
                  className={`input-minimal w-full font-mono text-xl py-2 ${isReady ? 'opacity-50 cursor-not-allowed' : 'text-white border-transparent focus:border-accent border-b'}`}
                  placeholder="Enter your name"
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide-label text-muted-foreground mb-2">Room Code</p>
              <div className="flex items-end justify-between gap-4 pb-3 border-b border-border h-24">
                <span className="font-mono text-5xl sm:text-[4rem] leading-none font-bold tracking-[0.2em] text-accent mt-auto">
                  {roomCode}
                </span>
                <button
                  onClick={copyCode}
                  className="text-xs font-mono uppercase tracking-wide-label text-muted-foreground hover:text-foreground transition-colors pb-1"
                >
                  {copied ? '[ Copied ]' : '[ Copy ]'}
                </button>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
              <p className="text-[10px] uppercase tracking-wide-label text-muted-foreground">Match Duration</p>
              <span className="text-lg font-bold font-mono text-accent">
                {currentOvers} Over{currentOvers > 1 ? 's' : ''} <span className="text-muted-foreground text-xs ml-2">({currentOvers * 6} Balls)</span>
              </span>
            </div>

            {isHost ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {OVER_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleOverSelect(preset.value)}
                      className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wide-label border transition-colors ${
                        currentOvers === preset.value && !showCustom
                          ? 'border-accent text-accent bg-accent/10'
                          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  
                  {!showCustom ? (
                    <button
                      onClick={() => setShowCustom(true)}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wide-label text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + Custom
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={customOvers}
                        onChange={(e) => setCustomOvers(e.target.value)}
                        placeholder="1-20"
                        className="input-minimal w-20 text-center font-mono py-1 px-2 h-auto text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit(); }}
                      />
                      <button
                        onClick={handleCustomSubmit}
                        className="btn-secondary py-1 px-3 text-[10px]"
                      >
                        Set
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-mono">Waiting for host to configure match...</p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide-label text-muted-foreground mb-2">Players Waiting</p>
            <div className="space-y-0 border-t border-border">
              {[0, 1].map((idx) => {
                const player = players[idx];
                const isMe = player?.id === gameState?.myPlayerId;
                const displayName = isMe ? (localName.trim() || defaultName) : (player ? player.name : 'Waiting...');

                return (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-mono text-muted-foreground text-xs">0{idx + 1}</span>
                      
                      <div className="flex items-center">
                        <span className={`text-base font-bold ${player ? 'text-white' : 'text-muted-foreground'}`}>
                          {displayName}
                        </span>
                      </div>

                      {isMe && (
                        <span className="text-[9px] font-mono border border-accent text-accent px-2 py-0.5 ml-2">YOU</span>
                      )}
                      {player?.id === gameState?.host && (
                        <span className="text-[9px] font-mono border border-foreground text-foreground px-2 py-0.5 ml-2">HOST</span>
                      )}
                    </div>
                    {player && (
                      <span className={`text-[10px] font-mono uppercase tracking-wide-label ${
                        player.ready ? 'text-accent' : 'text-muted-foreground'
                      }`}>
                        {player.ready ? 'Ready' : 'Not Ready'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            {isWaiting ? (
              <span className="font-mono text-muted-foreground text-xs animate-pulse">Waiting for opponent...</span>
            ) : !isReady ? (
              <button onClick={onReady} className="btn-primary text-base py-2 px-6">
                Ready Up
              </button>
            ) : (
              <span className="font-mono text-accent text-xs animate-pulse">Waiting for opponent to ready up...</span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
