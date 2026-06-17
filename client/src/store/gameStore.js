import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  // Connection state
  connected: false,
  setConnected: (connected) => set({ connected }),

  // Player info
  playerName: '',
  playerId: null,
  myPlayerIndex: null,
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerId: (id) => set({ playerId: id }),

  // Room info
  roomCode: null,
  setRoomCode: (code) => set({ roomCode: code }),

  // Game state from server
  gameState: null,
  setGameState: (state) => set({
    gameState: state,
    myPlayerIndex: state?.myPlayerIndex ?? get().myPlayerIndex,
  }),

  // Turn state
  hasSubmitted: false,
  selectedRun: null,
  opponentSubmitted: false,
  setHasSubmitted: (v) => set({ hasSubmitted: v }),
  setSelectedRun: (v) => set({ selectedRun: v }),
  setOpponentSubmitted: (v) => set({ opponentSubmitted: v }),

  // Timer
  timeLeft: 5,
  timerTotal: 5,
  setTimer: (timeLeft, total) => set({ timeLeft, timerTotal: total }),

  // Turn result
  lastTurnResult: null,
  setLastTurnResult: (result) => set({ lastTurnResult: result }),

  // Reball
  reballMessage: null,
  setReballMessage: (msg) => set({ reballMessage: msg }),

  // Toss result
  tossResult: null,
  setTossResult: (result) => set({ tossResult: result }),

  // Match result
  matchResult: null,
  setMatchResult: (result) => set({ matchResult: result }),

  // Rematch
  rematchRequested: false,
  rematchRequestedBy: null,
  setRematchRequested: (v, by) => set({ rematchRequested: v, rematchRequestedBy: by }),

  // Disconnect
  opponentDisconnected: false,
  disconnectedPlayerName: null,
  setOpponentDisconnected: (v, name) => set({ opponentDisconnected: v, disconnectedPlayerName: name }),

  // Error
  error: null,
  setError: (err) => set({ error: err }),

  // Screen
  screen: 'landing',
  setScreen: (screen) => set({ screen }),

  // Reset for new turn
  resetTurn: () => set({
    hasSubmitted: false,
    selectedRun: null,
    opponentSubmitted: false,
    lastTurnResult: null,
    reballMessage: null,
  }),

  // Full reset
  resetAll: () => set({
    roomCode: null,
    playerId: null,
    myPlayerIndex: null,
    gameState: null,
    hasSubmitted: false,
    selectedRun: null,
    opponentSubmitted: false,
    timeLeft: 5,
    timerTotal: 5,
    lastTurnResult: null,
    reballMessage: null,
    tossResult: null,
    matchResult: null,
    rematchRequested: false,
    rematchRequestedBy: null,
    opponentDisconnected: false,
    disconnectedPlayerName: null,
    error: null,
    screen: 'landing',
  }),
}));

export default useGameStore;
