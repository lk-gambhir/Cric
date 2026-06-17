import {
  setPlayerReady,
  setMatchConfig,
  recordTossChoice,
  resolveToss,
  recordTossDecision,
  submitRun,
  bothPlayersSubmitted,
  forfeitGame,
  resetForRematch,
  getRoom,
} from '../rooms/roomManager.js';
import { EVENTS, VALID_RUNS, GAME_STATES } from '../utils/constants.js';
import { socketToPlayer, emitGameState, startTurnTimer, clearTurnTimer, resolveAndContinue } from './socketState.js';
import { validateRun } from '../utils/validation.js';

export function registerGameHandlers(io, socket) {
  // SET MATCH CONFIG (host only)
  socket.on(EVENTS.SET_MATCH_CONFIG, ({ overs }, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) return callback?.({ error: 'Not in a room' });

      // Validating overs (must be positive integer, between 1 and 20)
      const sanitizedOvers = parseInt(overs);
      if (isNaN(sanitizedOvers) || sanitizedOvers < 1 || sanitizedOvers > 20) {
        return callback?.({ error: 'Invalid match duration' });
      }

      const room = setMatchConfig(playerInfo.roomCode, playerInfo.playerId, { overs: sanitizedOvers });
      if (!room) return callback?.({ error: 'Only the host can change settings' });

      emitGameState(io, room);
      callback?.({ success: true });
    } catch (err) {
      console.error('Set match config error:', err);
      callback?.({ error: 'Failed to update settings' });
    }
  });

  //  PLAYER READY
  socket.on(EVENTS.PLAYER_READY, (_, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) return callback?.({ error: 'Not in a room' });

      const room = setPlayerReady(playerInfo.roomCode, playerInfo.playerId);
      if (!room) return callback?.({ error: 'Failed to ready up' });

      emitGameState(io, room);

      if (room.state === GAME_STATES.TOSS) {
        startTurnTimer(io, room, 'toss');
      }

      callback?.({ success: true });
    } catch (err) {
      console.error('Ready error:', err);
      callback?.({ error: 'Failed to ready up' });
    }
  });

  //   TOSS CHOICE  
  socket.on(EVENTS.TOSS_CHOICE, ({ choice }, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) return callback?.({ error: 'Not in a room' });

      if (!validateRun(choice) || !VALID_RUNS.includes(choice)) {
        return callback?.({ error: 'Invalid choice' });
      }

      const room = recordTossChoice(playerInfo.roomCode, playerInfo.playerId, choice);
      if (!room) return callback?.({ error: 'Invalid toss choice' });

      callback?.({ success: true });

      if (room.players.every(p => room.toss.choices[p.id] !== undefined)) {
        clearTurnTimer(room.code);
        const tossResult = resolveToss(room);

        io.to(room.code).emit('tossResult', tossResult);
        emitGameState(io, room);
      }
    } catch (err) {
      console.error('Toss choice error:', err);
      callback?.({ error: 'Failed to submit toss choice' });
    }
  });

  //   TOSS DECISION           
  socket.on(EVENTS.TOSS_DECISION, ({ decision }, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) return callback?.({ error: 'Not in a room' });

      if (decision !== 'bat' && decision !== 'bowl') {
        return callback?.({ error: 'Invalid decision' });
      }

      const room = recordTossDecision(playerInfo.roomCode, playerInfo.playerId, decision);
      if (!room) return callback?.({ error: 'Invalid toss decision' });

      console.log(`Toss winner chose to ${decision}`);

      emitGameState(io, room);

      setTimeout(() => {
        startTurnTimer(io, room, 'run');
      }, 1500);

      callback?.({ success: true });
    } catch (err) {
      console.error('Toss decision error:', err);
      callback?.({ error: 'Failed to submit toss decision' });
    }
  });

  //   SUBMIT RUN 
  socket.on(EVENTS.SUBMIT_RUN, ({ run }, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) return callback?.({ error: 'Not in a room' });

      if (!validateRun(run) || !VALID_RUNS.includes(run)) {
        return callback?.({ error: 'Invalid run choice' });
      }

      const room = submitRun(playerInfo.roomCode, playerInfo.playerId, run);
      if (!room) return callback?.({ success: false, ignored: true });

      callback?.({ success: true });

      socket.to(room.code).emit('opponentSubmitted');

      if (bothPlayersSubmitted(room)) {
        clearTurnTimer(room.code);
        resolveAndContinue(io, room);
      }
    } catch (err) {
      console.error('Submit run error:', err);
      callback?.({ error: 'Failed to submit run' });
    }
  });

  //   FORFEIT  
  socket.on(EVENTS.FORFEIT, (_, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) return callback?.({ error: 'Not in a room' });

      const result = forfeitGame(playerInfo.roomCode, playerInfo.playerId);
      if (!result) return callback?.({ error: 'Cannot forfeit' });

      clearTurnTimer(playerInfo.roomCode);

      io.to(playerInfo.roomCode).emit('turnResult', result);

      const room = getRoom(playerInfo.roomCode);
      if (room) {
        emitGameState(io, room);
      }

      callback?.({ success: true });
    } catch (err) {
      console.error('Forfeit error:', err);
      callback?.({ error: 'Failed to forfeit' });
    }
  });

  //   REMATCH  
  socket.on(EVENTS.REMATCH, (_, callback) => {
    try {
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) return callback?.({ error: 'Not in a room' });

      const room = getRoom(playerInfo.roomCode);
      if (!room) return callback?.({ error: 'Room not found' });

      room.rematchRequests.add(playerInfo.playerId);

      if (room.rematchRequests.size >= 2) {
        resetForRematch(playerInfo.roomCode);
        emitGameState(io, room);
        io.to(room.code).emit('rematchAccepted');
      } else {
        socket.to(room.code).emit(EVENTS.REMATCH_REQUESTED, {
          playerName: room.players.find(p => p.id === playerInfo.playerId)?.name,
        });
      }

      callback?.({ success: true });
    } catch (err) {
      console.error('Rematch error:', err);
      callback?.({ error: 'Failed to request rematch' });
    }
  });
}
