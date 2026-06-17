import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from './hooks/useSocket';
import useGameStore from './store/gameStore';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import TossPage from './pages/TossPage';
import GamePage from './pages/GamePage';
import InningsBreakPage from './pages/InningsBreakPage';
import MatchResultPage from './pages/MatchResultPage';
import ConnectionStatus from './components/ConnectionStatus';
import BackgroundAnimation from './components/BackgroundAnimation';

export default function App() {
  const {
    createRoom,
    joinRoom,
    setMatchConfig,
    playerReady,
    submitTossChoice,
    submitTossDecision,
    submitRun,
    forfeit,
    requestRematch,
    leaveGame,
    updateName,
  } = useSocket();

  const {
    screen,
    connected,
    gameState,
    roomCode,
    timeLeft,
    timerTotal,
    tossResult,
    matchResult,
    error,
    opponentDisconnected,
    disconnectedPlayerName,
    rematchRequested,
    rematchRequestedBy,
    setError,
  } = useGameStore();

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error, setError]);

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const renderScreen = () => {
    switch (screen) {
      case 'landing':
        return (
          <motion.div key="landing" {...pageVariants}>
            <LandingPage onCreateRoom={createRoom} onJoinRoom={joinRoom} onSetMatchConfig={setMatchConfig} />
          </motion.div>
        );
      case 'lobby':
      case 'waiting':
        return (
          <motion.div key="lobby" {...pageVariants}>
            <LobbyPage
              roomCode={roomCode}
              gameState={gameState}
              onReady={playerReady}
              onSetMatchConfig={setMatchConfig}
              onLeave={leaveGame}
              onUpdateName={updateName}
            />
          </motion.div>
        );
      case 'toss':
      case 'tossResult':
        return (
          <motion.div key="toss" {...pageVariants}>
            <TossPage
              gameState={gameState}
              tossResult={tossResult}
              timeLeft={timeLeft}
              timerTotal={timerTotal}
              onTossChoice={submitTossChoice}
              onTossDecision={submitTossDecision}
            />
          </motion.div>
        );
      case 'playing':
        return (
          <motion.div key="playing" {...pageVariants}>
            <GamePage
              gameState={gameState}
              onSubmitRun={submitRun}
              onForfeit={forfeit}
            />
          </motion.div>
        );
      case 'inningsBreak':
        return (
          <motion.div key="break" {...pageVariants}>
            <InningsBreakPage gameState={gameState} />
          </motion.div>
        );
      case 'matchResult':
        return (
          <motion.div key="result" {...pageVariants}>
            <MatchResultPage
              gameState={gameState}
              matchResult={matchResult}
              onRematch={requestRematch}
              onLeave={leaveGame}
              rematchRequested={rematchRequested}
              rematchRequestedBy={rematchRequestedBy}
            />
          </motion.div>
        );
      default:
        return (
          <motion.div key="landing-default" {...pageVariants}>
            <LandingPage onCreateRoom={createRoom} onJoinRoom={joinRoom} onSetMatchConfig={setMatchConfig} />
          </motion.div>
        );
    }
  };

  return (
    <>
      <BackgroundAnimation screen={screen} />
      <ConnectionStatus
        connected={connected}
        opponentDisconnected={opponentDisconnected}
        disconnectedPlayerName={disconnectedPlayerName}
      />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '12px',
          },
        }}
      />
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
    </>
  );
}
