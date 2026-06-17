import { useEffect, useCallback, useRef } from 'react';
import { getSocket, connectSocket } from '../socket/socket';
import useGameStore from '../store/gameStore';
import { GAME_STATES } from '../utils/constants';
import { toast } from 'react-hot-toast';

export function useSocket() {
  const socketRef = useRef(null);

  const {
    setConnected,
    setGameState,
    setTimer,
    setLastTurnResult,
    setTossResult,
    setOpponentSubmitted,
    setOpponentDisconnected,
    setRematchRequested,
    setReballMessage,
    setScreen,
    setError,
    resetTurn,
    resetAll,
  } = useGameStore();

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);

      const savedRoom = localStorage.getItem('hc_roomCode');
      const savedPlayer = localStorage.getItem('hc_playerId');
      if (savedRoom && savedPlayer) {
        socket.emit('reconnectToRoom', {
          roomCode: savedRoom,
          playerId: savedPlayer,
        }, (response) => {
          if (response?.gameState) {
            setGameState(response.gameState);
            useGameStore.setState({
              playerId: savedPlayer,
              roomCode: savedRoom,
            });
            mapStateToScreen(response.gameState);
          } else {
            localStorage.removeItem('hc_roomCode');
            localStorage.removeItem('hc_playerId');
          }
        });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('gameStateUpdate', (state) => {
      setGameState(state);
      const currentScreen = useGameStore.getState().screen;
      // Delay jumping to matchResult if we were just playing,
      // so the turnResult popup can be seen.
      if (currentScreen === 'playing' && state.state === GAME_STATES.MATCH_RESULT) {
        // Let turnResult handle the delayed transition
      } else {
        mapStateToScreen(state);
      }
    });

    socket.on('playerJoined', ({ gameState }) => {
      setGameState(gameState);
      mapStateToScreen(gameState);
    });

    socket.on('timerTick', ({ timeLeft, total }) => {
      setTimer(timeLeft, total);
    });

    socket.on('tossResult', (result) => {
      setTossResult(result);
      setScreen('tossResult');
    });

    socket.on('turnResult', (result) => {
      setLastTurnResult(result);
      resetTurn();
      useGameStore.setState({ lastTurnResult: result });

      if (result.gameOver) {
        useGameStore.setState({ matchResult: result });
        setTimeout(() => setScreen('matchResult'), 1500);
      } else if (result.inningsSwitch) {
        setScreen('inningsBreak');
      }
    });

    socket.on('reball', ({ message }) => {
      resetTurn();
      setReballMessage(message);
      setTimeout(() => setReballMessage(null), 3000);
    });

    socket.on('opponentSubmitted', () => {
      setOpponentSubmitted(true);
    });

    socket.on('playerDisconnected', ({ playerName }) => {
      setOpponentDisconnected(true, playerName);
    });

    socket.on('playerReconnected', () => {
      setOpponentDisconnected(false, null);
    });

    socket.on('rematchRequested', ({ playerName }) => {
      setRematchRequested(true, playerName);
    });

    socket.on('rematchAccepted', () => {
      setRematchRequested(false, null);
      useGameStore.setState({
        matchResult: null,
        tossResult: null,
        lastTurnResult: null,
        hasSubmitted: false,
        selectedRun: null,
        opponentSubmitted: false,
        reballMessage: null,
      });
      setScreen('waiting');
    });

    socket.on('opponentLeft', () => {
      const { screen } = useGameStore.getState();
      if (screen === 'matchResult') {
        toast.error('Rematch request declined. Exiting to lobby.', { duration: 3000 });
        setTimeout(() => {
          const s = getSocket();
          s.emit('leaveRoom');
          localStorage.removeItem('hc_roomCode');
          localStorage.removeItem('hc_playerId');
          useGameStore.getState().resetAll();
        }, 2000);
      } else {
        toast.error('Opponent left the match.', { duration: 3000 });
        const s = getSocket();
        s.emit('leaveRoom');
        localStorage.removeItem('hc_roomCode');
        localStorage.removeItem('hc_playerId');
        useGameStore.getState().resetAll();
      }
    });

    socket.on('gameError', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameStateUpdate');
      socket.off('playerJoined');
      socket.off('timerTick');
      socket.off('tossResult');
      socket.off('turnResult');
      socket.off('reball');
      socket.off('opponentSubmitted');
      socket.off('playerDisconnected');
      socket.off('playerReconnected');
      socket.off('rematchRequested');
      socket.off('rematchAccepted');
      socket.off('opponentLeft');
      socket.off('gameError');
    };
  }, []);

  function mapStateToScreen(state) {
    if (!state) return;
    switch (state.state) {
      case GAME_STATES.LOBBY:
        setScreen('lobby');
        break;
      case GAME_STATES.WAITING:
        setScreen('waiting');
        break;
      case GAME_STATES.TOSS:
        setScreen('toss');
        break;
      case GAME_STATES.TOSS_RESULT:
        setScreen('tossResult');
        break;
      case GAME_STATES.INNINGS_1:
      case GAME_STATES.INNINGS_2:
        resetTurn();
        setScreen('playing');
        break;
      case GAME_STATES.INNINGS_BREAK:
        setScreen('inningsBreak');
        break;
      case GAME_STATES.MATCH_RESULT:
        setScreen('matchResult');
        break;
    }
  }

  const createRoom = useCallback((playerName) => {
    const socket = getSocket();
    return new Promise((resolve, reject) => {
      socket.emit('createRoom', { playerName }, (response) => {
        if (response?.error) {
          reject(response.error);
        } else {
          useGameStore.setState({
            roomCode: response.roomCode,
            playerId: response.playerId,
          });
          setGameState(response.gameState);
          localStorage.setItem('hc_roomCode', response.roomCode);
          localStorage.setItem('hc_playerId', response.playerId);
          setScreen('lobby');
          resolve(response);
        }
      });
    });
  }, []);

  const joinRoom = useCallback((roomCode, playerName) => {
    const socket = getSocket();
    return new Promise((resolve, reject) => {
      socket.emit('joinRoom', { roomCode, playerName }, (response) => {
        if (response?.error) {
          reject(response.error);
        } else {
          useGameStore.setState({
            roomCode: response.roomCode,
            playerId: response.playerId,
          });
          setGameState(response.gameState);
          localStorage.setItem('hc_roomCode', response.roomCode);
          localStorage.setItem('hc_playerId', response.playerId);
          mapStateToScreen(response.gameState);
          resolve(response);
        }
      });
    });
  }, []);

  const setMatchConfig = useCallback((overs) => {
    const socket = getSocket();
    socket.emit('setMatchConfig', { overs }, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  }, []);

  const updateName = useCallback((newName) => {
    const socket = getSocket();
    socket.emit('updateName', { newName }, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  }, []);

  const playerReady = useCallback(() => {
    const socket = getSocket();
    socket.emit('playerReady', null, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  }, []);

  const submitTossChoice = useCallback((choice) => {
    const socket = getSocket();
    socket.emit('tossChoice', { choice }, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  }, []);

  const submitTossDecision = useCallback((decision) => {
    const socket = getSocket();
    socket.emit('tossDecision', { decision }, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  }, []);

  const submitRun = useCallback((run) => {
    const socket = getSocket();
    socket.emit('submitRun', { run }, (response) => {
      if (response?.error) {
        setError(response.error);
      } else {
        useGameStore.setState({ hasSubmitted: true, selectedRun: run });
      }
    });
  }, []);

  const forfeit = useCallback(() => {
    const socket = getSocket();
    socket.emit('forfeit', null, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  }, []);

  const requestRematch = useCallback(() => {
    const socket = getSocket();
    socket.emit('rematch', null, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  }, []);

  const leaveGame = useCallback(() => {
    const socket = getSocket();
    socket.emit('leaveRoom');
    localStorage.removeItem('hc_roomCode');
    localStorage.removeItem('hc_playerId');
    useGameStore.getState().resetAll();
  }, []);

  return {
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
  };
}
