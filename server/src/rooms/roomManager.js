import { GAME_STATES, MAX_IDLE_BALLS } from '../utils/constants.js';
import { generateUniqueRoomCode } from '../utils/roomCode.js';

const rooms = new Map();

export function createRoom(playerName) {
  const roomCode = generateUniqueRoomCode(rooms);
  const room = {
    code: roomCode,
    players: [],
    host: null,           // playerId of room creator
    state: GAME_STATES.LOBBY,
    // Match config
    matchConfig: {
      overs: 1,           // default 1 over
    },
    toss: {
      choices: {},
      winner: null,
      decision: null,
    },
    innings: 1,
    batting: null,
    bowling: null,
    scores: [0, 0],
    target: null,
    ballsPlayed: [0, 0],  // balls faced per innings [innings1, innings2]
    maxBalls: 6,           // derived from overs
    currentTurn: {
      choices: {},
      resolved: false,
    },
    ballHistory: [],
    isOut: [false, false],
    // Idle tracking: consecutive timeouts per player
    idleCount: {},         // { playerId: number }
    rematchRequests: new Set(),
    turnTimer: null,
    disconnectTimers: {},
    createdAt: Date.now(),
  };
  rooms.set(roomCode, room);
  return room;
}

export function getRoom(code) {
  return rooms.get(code) || null;
}

export function addPlayer(roomCode, playerId, playerName, socketId) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.players.length >= 2) return null;

  room.players.push({
    id: playerId,
    name: playerName,
    socketId,
    ready: false,
    connected: true,
  });

  // First player is the host
  if (room.players.length === 1) {
    room.host = playerId;
  }

  if (room.players.length === 2) {
    room.state = GAME_STATES.WAITING;
  }

  return room;
}

export function setMatchConfig(roomCode, playerId, config) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.host !== playerId) return null;
  if (room.state !== GAME_STATES.LOBBY && room.state !== GAME_STATES.WAITING) return null;

  const overs = Math.max(1, Math.min(20, parseInt(config.overs) || 1));
  room.matchConfig.overs = overs;
  room.maxBalls = overs * 6;

  return room;
}

export function updatePlayerName(roomCode, playerId, newName) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.state !== GAME_STATES.LOBBY && room.state !== GAME_STATES.WAITING) return null;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  player.name = newName.substring(0, 15);
  return room;
}

export function setPlayerReady(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  player.ready = true;

  // Check if both players are ready
  if (room.players.length === 2 && room.players.every(p => p.ready)) {
    // Lock in match config
    room.maxBalls = room.matchConfig.overs * 6;
    room.state = GAME_STATES.TOSS;
  }

  return room;
}

export function recordTossChoice(roomCode, playerId, choice) {
  const room = rooms.get(roomCode);
  if (!room || room.state !== GAME_STATES.TOSS) return null;

  if (choice < 1 || choice > 6) return null;
  if (room.toss.choices[playerId] !== undefined) return null;

  room.toss.choices[playerId] = choice;
  return room;
}

export function resolveToss(room) {
  const playerIds = room.players.map(p => p.id);
  const sum = room.toss.choices[playerIds[0]] + room.toss.choices[playerIds[1]];
  const isOdd = sum % 2 !== 0;

  // Player 0 is always Odd, Player 1 is always Even
  const winnerIndex = isOdd ? 0 : 1;
  room.toss.winner = room.players[winnerIndex].id;
  room.toss.sum = sum;
  room.toss.isOdd = isOdd;
  room.state = GAME_STATES.TOSS_RESULT;

  return {
    choices: { ...room.toss.choices },
    sum,
    isOdd,
    winnerId: room.toss.winner,
    winnerName: room.players[winnerIndex].name,
  };
}

export function recordTossDecision(roomCode, playerId, decision) {
  const room = rooms.get(roomCode);
  if (!room || room.state !== GAME_STATES.TOSS_RESULT) return null;
  if (room.toss.winner !== playerId) return null;
  if (decision !== 'bat' && decision !== 'bowl') return null;

  room.toss.decision = decision;
  const winnerIndex = room.players.findIndex(p => p.id === playerId);

  if (decision === 'bat') {
    room.batting = winnerIndex;
    room.bowling = winnerIndex === 0 ? 1 : 0;
  } else {
    room.bowling = winnerIndex;
    room.batting = winnerIndex === 0 ? 1 : 0;
  }

  room.innings = 1;
  room.ballsPlayed = [0, 0];
  // Initialize idle counts
  room.idleCount = {};
  room.players.forEach(p => { room.idleCount[p.id] = 0; });
  room.state = GAME_STATES.INNINGS_1;
  return room;
}

export function submitRun(roomCode, playerId, run) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  if (room.state !== GAME_STATES.INNINGS_1 && room.state !== GAME_STATES.INNINGS_2) return null;
  if (run < 1 || run > 6) return null;
  if (room.currentTurn.choices[playerId] !== undefined) return null;
  if (room.currentTurn.resolved) return null;

  room.currentTurn.choices[playerId] = run;

  // Player actively chose — reset their idle counter
  if (room.idleCount[playerId] !== undefined) {
    room.idleCount[playerId] = 0;
  }

  return room;
}

export function bothPlayersSubmitted(room) {
  return room.players.every(p => room.currentTurn.choices[p.id] !== undefined);
}

export function incrementIdle(room, timedOutPlayerIds) {
  for (const pid of timedOutPlayerIds) {
    if (room.idleCount[pid] !== undefined) {
      room.idleCount[pid]++;
      if (room.idleCount[pid] >= MAX_IDLE_BALLS) {
        return pid; // this player is auto-forfeited
      }
    }
  }
  return null;
}

export function resolveTurn(room) {
  const batterPlayer = room.players[room.batting];
  const bowlerPlayer = room.players[room.bowling];
  const batterChoice = room.currentTurn.choices[batterPlayer.id];
  const bowlerChoice = room.currentTurn.choices[bowlerPlayer.id];

  room.currentTurn.resolved = true;

  const isOut = batterChoice === bowlerChoice;
  const runs = isOut ? 0 : batterChoice;

  // Update score
  if (!isOut) {
    room.scores[room.batting] += runs;
  }

  // Increment balls played for current innings
  const inningsIdx = room.innings - 1;
  room.ballsPlayed[inningsIdx]++;

  // Record ball
  const ball = {
    innings: room.innings,
    batter: batterPlayer.name,
    bowler: bowlerPlayer.name,
    batterChoice,
    bowlerChoice,
    runs,
    isOut,
    scoreAfter: [...room.scores],
    ballNumber: room.ballsPlayed[inningsIdx],
  };
  room.ballHistory.push(ball);

  let result = {
    batterChoice,
    bowlerChoice,
    runs,
    isOut,
    scores: [...room.scores],
    ball,
    gameOver: false,
    inningsSwitch: false,
    winner: null,
    message: '',
    matchResult: null,
    ballsPlayed: [...room.ballsPlayed],
    maxBalls: room.maxBalls,
  };

  const oversComplete = room.ballsPlayed[inningsIdx] >= room.maxBalls;

  if (room.state === GAME_STATES.INNINGS_1) {
    if (isOut || oversComplete) {
      // Innings 1 over
      room.target = room.scores[room.batting] + 1;
      result.inningsSwitch = true;

      if (isOut) {
        result.message = `${batterPlayer.name} is OUT! Score: ${room.scores[room.batting]}. Target: ${room.target}`;
      } else {
        result.message = `Innings over! ${batterPlayer.name} scored ${room.scores[room.batting]}. Target: ${room.target}`;
      }

      // Switch batting/bowling
      const temp = room.batting;
      room.batting = room.bowling;
      room.bowling = temp;
      room.innings = 2;
      room.state = GAME_STATES.INNINGS_BREAK;
    } else {
      result.message = `${batterPlayer.name} scores ${runs}!`;
    }
  } else if (room.state === GAME_STATES.INNINGS_2) {
    if (isOut) {
      const chaserScore = room.scores[room.batting];
      const defenderScore = room.scores[room.bowling];

      if (chaserScore === defenderScore) {
        result.gameOver = true;
        result.matchResult = 'draw';
        result.message = `${batterPlayer.name} is OUT! Match is a DRAW! Both scored ${chaserScore}.`;
        result.winner = null;
        room.state = GAME_STATES.MATCH_RESULT;
      } else {
        result.gameOver = true;
        result.matchResult = 'win';
        result.winner = room.players[room.bowling].id;
        const winMargin = defenderScore - chaserScore;
        result.message = `${batterPlayer.name} is OUT! ${bowlerPlayer.name} wins by ${winMargin} runs!`;
        room.state = GAME_STATES.MATCH_RESULT;
      }
    } else if (room.scores[room.batting] >= room.target) {
      // Chaser won
      result.gameOver = true;
      result.matchResult = 'win';
      result.winner = room.players[room.batting].id;
      result.message = `${batterPlayer.name} wins! Chased down ${room.target}!`;
      room.state = GAME_STATES.MATCH_RESULT;
    } else if (oversComplete) {
      // Overs complete in 2nd innings
      const chaserScore = room.scores[room.batting];
      const defenderScore = room.scores[room.bowling];

      if (chaserScore === defenderScore) {
        result.gameOver = true;
        result.matchResult = 'draw';
        result.message = `Overs complete! Match is a DRAW! Both scored ${chaserScore}.`;
        result.winner = null;
        room.state = GAME_STATES.MATCH_RESULT;
      } else {
        result.gameOver = true;
        result.matchResult = 'win';
        result.winner = room.players[room.bowling].id;
        const winMargin = defenderScore - chaserScore;
        result.message = `Overs complete! ${bowlerPlayer.name} wins by ${winMargin} runs!`;
        room.state = GAME_STATES.MATCH_RESULT;
      }
    } else {
      const needed = room.target - room.scores[room.batting];
      result.message = `${batterPlayer.name} scores ${runs}! Need ${needed} more to win.`;
    }
  }

  // Reset current turn
  room.currentTurn = { choices: {}, resolved: false };

  return result;
}

export function startInnings2(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.state !== GAME_STATES.INNINGS_BREAK) return null;
  room.state = GAME_STATES.INNINGS_2;
  return room;
}

export function forfeitGame(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const forfeiter = room.players.find(p => p.id === playerId);
  const opponent = room.players.find(p => p.id !== playerId);
  if (!forfeiter || !opponent) return null;

  room.state = GAME_STATES.MATCH_RESULT;

  return {
    gameOver: true,
    matchResult: 'forfeit',
    winner: opponent.id,
    message: `${forfeiter.name} forfeited. ${opponent.name} wins!`,
    scores: [...room.scores],
  };
}

export function idleForfeit(room, idlePlayerId) {
  const idlePlayer = room.players.find(p => p.id === idlePlayerId);
  const opponent = room.players.find(p => p.id !== idlePlayerId);
  if (!idlePlayer || !opponent) return null;

  room.state = GAME_STATES.MATCH_RESULT;

  return {
    gameOver: true,
    matchResult: 'idle',
    winner: opponent.id,
    message: `${idlePlayer.name} went idle (3 timeouts). ${opponent.name} wins!`,
    scores: [...room.scores],
  };
}

export function resetForRematch(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.state = GAME_STATES.WAITING;
  room.toss = { choices: {}, winner: null, decision: null };
  room.innings = 1;
  room.batting = null;
  room.bowling = null;
  room.scores = [0, 0];
  room.target = null;
  room.ballsPlayed = [0, 0];
  room.currentTurn = { choices: {}, resolved: false };
  room.ballHistory = [];
  room.isOut = [false, false];
  room.idleCount = {};
  room.rematchRequests.clear();
  room.players.forEach(p => { p.ready = false; });

  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  return room;
}

export function playerDisconnect(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.connected = false;
  }

  return room;
}

export function playerReconnect(roomCode, playerId, newSocketId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.connected = true;
    player.socketId = newSocketId;
  }

  return room;
}

export function destroyRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (room && room.turnTimer) {
    clearTimeout(room.turnTimer);
  }
  rooms.delete(roomCode);
}

export function allPlayersDisconnected(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return true;
  return room.players.every(p => !p.connected);
}

export function getClientState(room, playerId = null) {
  if (!room) return null;

  const state = {
    roomCode: room.code,
    state: room.state,
    host: room.host,
    matchConfig: { ...room.matchConfig },
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      connected: p.connected,
    })),
    innings: room.innings,
    scores: room.scores,
    target: room.target,
    batting: room.batting,
    bowling: room.bowling,
    ballsPlayed: room.ballsPlayed,
    maxBalls: room.maxBalls,
    ballHistory: room.ballHistory,
    toss: {
      winner: room.toss.winner,
      decision: room.toss.decision,
      sum: room.toss.sum,
      isOdd: room.toss.isOdd,
    },
  };

  // Only include toss choices after toss is resolved
  if (room.state !== GAME_STATES.TOSS) {
    state.toss.choices = room.toss.choices;
  }

  // Include whether current player has submitted
  if (playerId) {
    state.hasSubmitted = room.currentTurn.choices[playerId] !== undefined;
    state.myPlayerId = playerId;
    state.myPlayerIndex = room.players.findIndex(p => p.id === playerId);
    state.isHost = room.host === playerId;
  }

  return state;
}

export { rooms };
