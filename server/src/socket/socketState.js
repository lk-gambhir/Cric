import { getClientState, getRoom, incrementIdle, idleForfeit, resolveToss, recordTossChoice, resolveTurn, startInnings2 } from '../rooms/roomManager.js';
import { EVENTS, VALID_RUNS, TURN_TIMER, GAME_STATES } from '../utils/constants.js';

export const socketToPlayer = new Map();
export const turnTimers = new Map();

export function emitGameState(io, room) {
  room.players.forEach(player => {
    const sockets = io.sockets.sockets;
    for (const [, s] of sockets) {
      const info = socketToPlayer.get(s.id);
      if (info && info.playerId === player.id) {
        s.emit(EVENTS.GAME_STATE_UPDATE, getClientState(room, player.id));
        break;
      }
    }
  });
}

export function clearTurnTimer(roomCode) {
  const timer = turnTimers.get(roomCode);
  if (timer) {
    clearInterval(timer);
    turnTimers.delete(roomCode);
  }
}

export function startTurnTimer(io, room, type) {
  clearTurnTimer(room.code);

  let timeLeft = TURN_TIMER;

  const interval = setInterval(() => {
    timeLeft--;
    io.to(room.code).emit(EVENTS.TIMER_TICK, { timeLeft, total: TURN_TIMER });

    if (timeLeft <= 0) {
      clearInterval(interval);
      turnTimers.delete(room.code);

      if (type === 'toss') {
        // Toss: auto-pick random for missing
        room.players.forEach(p => {
          if (room.toss.choices[p.id] === undefined) {
            const randomChoice = VALID_RUNS[Math.floor(Math.random() * VALID_RUNS.length)];
            recordTossChoice(room.code, p.id, randomChoice);
          }
        });

        if (room.players.every(p => room.toss.choices[p.id] !== undefined)) {
          const tossResult = resolveToss(room);
          io.to(room.code).emit('tossResult', tossResult);
          emitGameState(io, room);
        }
      } else if (type === 'run') {
        // Identify who timed out
        const timedOutIds = room.players
          .filter(p => room.currentTurn.choices[p.id] === undefined)
          .map(p => p.id);

        if (timedOutIds.length > 0) {
          // Check for idle forfeit
          const idlePlayerId = incrementIdle(room, timedOutIds);

          if (idlePlayerId) {
            // Player hit 3 consecutive timeouts — auto-forfeit
            const result = idleForfeit(room, idlePlayerId);
            if (result) {
              io.to(room.code).emit('turnResult', result);
              emitGameState(io, room);
              return;
            }
          }

          // Reball: reset the turn and restart timer
          room.currentTurn = { choices: {}, resolved: false };

          const timedOutNames = timedOutIds.map(id =>
            room.players.find(p => p.id === id)?.name
          ).join(' & ');

          io.to(room.code).emit('reball', {
            message: `${timedOutNames} didn't choose in time. Reball!`,
            timedOutIds,
          });

          emitGameState(io, room);

          // Restart timer after brief pause
          setTimeout(() => {
            // Make sure game is still active
            const currentRoom = getRoom(room.code);
            if (currentRoom && (currentRoom.state === GAME_STATES.INNINGS_1 || currentRoom.state === GAME_STATES.INNINGS_2)) {
              startTurnTimer(io, currentRoom, 'run');
            }
          }, 1500);
        } else {
          // Both submitted (shouldn't normally get here, but safety check)
          resolveAndContinue(io, room);
        }
      }
    }
  }, 1000);

  turnTimers.set(room.code, interval);

  io.to(room.code).emit(EVENTS.TIMER_TICK, { timeLeft: TURN_TIMER, total: TURN_TIMER });
}

export function resolveAndContinue(io, room) {
  setTimeout(() => {
    const turnResult = resolveTurn(room);

    io.to(room.code).emit('turnResult', turnResult);

    if (turnResult.inningsSwitch) {
      // Broadcast INNINGS_BREAK state immediately so target updates
      emitGameState(io, room);
      
      setTimeout(() => {
        startInnings2(room.code);
        emitGameState(io, room);
        setTimeout(() => startTurnTimer(io, room, 'run'), 1500);
      }, 3000);
    } else if (turnResult.gameOver) {
      emitGameState(io, room);
    } else {
      emitGameState(io, room);
      setTimeout(() => startTurnTimer(io, room, 'run'), 1500);
    }
  }, 800);
}
