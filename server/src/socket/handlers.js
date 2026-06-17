import { registerRoomHandlers } from './roomHandlers.js';
import { registerGameHandlers } from './gameHandlers.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);

    // Register modular handlers
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
  });
}
