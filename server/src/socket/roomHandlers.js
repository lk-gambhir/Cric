import { v4 as uuidv4 } from 'uuid';
import {
  createRoom,
  getRoom,
  addPlayer,
  updatePlayerName,
  playerDisconnect,
  playerReconnect,
  destroyRoom,
  allPlayersDisconnected,
  getClientState,
} from '../rooms/roomManager.js';
import { EVENTS, RECONNECT_TIMEOUT, GAME_STATES } from '../utils/constants.js';
import { socketToPlayer, emitGameState, clearTurnTimer } from './socketState.js';
import { sanitizeName, validateRoomCode } from '../utils/validation.js';

export function registerRoomHandlers(io, socket) {
  // CREATE ROOM 
  socket.on(EVENTS.CREATE_ROOM, ({ playerName }, callback) => {
    try {
      const sanitizedName = sanitizeName(playerName);
      if (sanitizedName === 'Player' && (!playerName || playerName.trim().length === 0)) {
        return callback?.({ error: 'Player name is required' });
      }

      const room = createRoom(sanitizedName);
      const playerId = uuidv4();

      addPlayer(room.code, playerId, sanitizedName, socket.id);
      socketToPlayer.set(socket.id, { roomCode: room.code, playerId });
      socket.join(room.code);

      console.log(`Room ${room.code} created by ${sanitizedName}`);

      callback?.({
        roomCode: room.code,
        playerId,
        gameState: getClientState(room, playerId),
      });
    } catch (err) {
      console.error('Create room error:', err);
      callback?.({ error: 'Failed to create room' });
    }
  });

  // JOIN ROOM
  socket.on(EVENTS.JOIN_ROOM, ({ roomCode, playerName }, callback) => {
    try {
      const sanitizedName = sanitizeName(playerName);
      if (sanitizedName === 'Player' && (!playerName || playerName.trim().length === 0)) {
        return callback?.({ error: 'Player name is required' });
      }
      
      const code = (roomCode || '').toUpperCase().trim();
      if (!validateRoomCode(code)) {
        return callback?.({ error: 'Invalid room code format' });
      }

      const room = getRoom(code);
      if (!room) {
        return callback?.({ error: 'Room not found' });
      }
      if (room.players.length >= 2) {
        return callback?.({ error: 'Room is full' });
      }

      const playerId = uuidv4();
      addPlayer(code, playerId, sanitizedName, socket.id);
      socketToPlayer.set(socket.id, { roomCode: code, playerId });
      socket.join(code);

      console.log(`${sanitizedName} joined room ${code}`);

      // Notify the other player
      socket.to(code).emit(EVENTS.PLAYER_JOINED, {
        gameState: getClientState(room, room.players[0].id),
      });

      callback?.({
        roomCode: code,
        playerId,
        gameState: getClientState(room, playerId),
      });
    } catch (err) {
      console.error('Join room error:', err);
      callback?.({ error: 'Failed to join room' });
    }
  });

  // UPDATE PLAYER NAME
  socket.on(EVENTS.UPDATE_NAME, ({ newName }, callback) => {
    try {
      const sanitizedName = sanitizeName(newName);
      if (sanitizedName === 'Player' && (!newName || newName.trim().length === 0)) {
        return callback?.({ error: 'Name cannot be empty' });
      }
      
      const playerInfo = socketToPlayer.get(socket.id);
      if (!playerInfo) return callback?.({ error: 'Not in a room' });

      const room = updatePlayerName(playerInfo.roomCode, playerInfo.playerId, sanitizedName);
      if (!room) return callback?.({ error: 'Cannot update name at this time' });

      emitGameState(io, room);
      callback?.({ success: true });
    } catch (err) {
      console.error('Update name error:', err);
      callback?.({ error: 'Failed to update name' });
    }
  });

  // RECONNECT
  socket.on('reconnectToRoom', ({ roomCode, playerId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room) return callback?.({ error: 'Room not found' });

      const player = room.players.find(p => p.id === playerId);
      if (!player) return callback?.({ error: 'Player not found in room' });

      if (room.disconnectTimers?.[playerId]) {
        clearTimeout(room.disconnectTimers[playerId]);
        delete room.disconnectTimers[playerId];
      }

      playerReconnect(roomCode, playerId, socket.id);
      socketToPlayer.set(socket.id, { roomCode, playerId });
      socket.join(roomCode);

      console.log(`${player.name} reconnected to room ${roomCode}`);

      socket.to(roomCode).emit(EVENTS.PLAYER_RECONNECTED, {
        playerName: player.name,
        playerId,
      });

      callback?.({
        gameState: getClientState(room, playerId),
      });
    } catch (err) {
      console.error('Reconnect error:', err);
      callback?.({ error: 'Failed to reconnect' });
    }
  });

  // LEAVE ROOM
  socket.on('leaveRoom', () => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) return;

    console.log(`${socket.id} explicitly left room ${playerInfo.roomCode}`);
    
    // Tell the other player the room is disbanded
    socket.to(playerInfo.roomCode).emit('opponentLeft');
    
    destroyRoom(playerInfo.roomCode);
    socketToPlayer.delete(socket.id);
    socket.leave(playerInfo.roomCode);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const playerInfo = socketToPlayer.get(socket.id);
    if (!playerInfo) return;

    console.log(`Disconnected: ${socket.id}`);

    const room = getRoom(playerInfo.roomCode);
    if (!room) {
      socketToPlayer.delete(socket.id);
      return;
    }

    playerDisconnect(playerInfo.roomCode, playerInfo.playerId);

    const player = room.players.find(p => p.id === playerInfo.playerId);

    socket.to(room.code).emit(EVENTS.PLAYER_DISCONNECTED, {
      playerName: player?.name,
      playerId: playerInfo.playerId,
    });

    const timer = setTimeout(() => {
      const currentRoom = getRoom(playerInfo.roomCode);
      if (!currentRoom) return;

      const p = currentRoom.players.find(pl => pl.id === playerInfo.playerId);
      if (p && !p.connected) {
        const otherPlayer = currentRoom.players.find(pl => pl.id !== playerInfo.playerId);
        if (otherPlayer && otherPlayer.connected) {
          currentRoom.state = GAME_STATES.MATCH_RESULT;
          io.to(currentRoom.code).emit('turnResult', {
            gameOver: true,
            matchResult: 'disconnect',
            winner: otherPlayer.id,
            message: `${p.name} failed to reconnect. ${otherPlayer.name} wins!`,
            scores: currentRoom.scores,
          });
          emitGameState(io, currentRoom);
        }

        if (allPlayersDisconnected(playerInfo.roomCode)) {
          clearTurnTimer(playerInfo.roomCode);
          destroyRoom(playerInfo.roomCode);
          console.log(`Room ${playerInfo.roomCode} destroyed due to abandonment`);
        }
      }
    }, RECONNECT_TIMEOUT);

    if (!room.disconnectTimers) room.disconnectTimers = {};
    room.disconnectTimers[playerInfo.playerId] = timer;

    socketToPlayer.delete(socket.id);
  });
}
