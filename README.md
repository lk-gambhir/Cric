# Cric

A real time multiplayer implementation of the classic Hand Cricket game, built with React, Node.js, and Socket.io. This project features bidirectional event driven communication, stateful room management, and robust reconnection logic.

## Architecture

The application is structured as a monorepo containing two distinct packages:
* **Client**: A React Single Page Application (SPA) styled with TailwindCSS and animated using Framer Motion. It manages local game state via Zustand.
* **Server**: A Node.js and Express backend that orchestrates real time game logic and room state management using Socket.io.

### Key Technical Features

* **Real time Synchronization**: Instantaneous bidirectional communication for rapid gameplay using Socket.io.
* **Stateful Room Management**: In memory management of complex game states including lobbies, coin tosses, innings progression, and match results.
* **Robust Reconnection**: Utilizes local storage to allow players to recover their session if they accidentally close their browser or experience a temporary network drop, adhering to a strict timeout grace period.
* **Input Sanitization**: Backend validation and sanitization of player names, room codes, and gameplay inputs to prevent injection attacks and ensure application stability.
* **Modular Codebase**: Clean separation of concerns between room management logic, socket event handlers, and core game rules.

### Scalability Roadmap (For High Traffic)
Currently, the server is optimized for single node deployment with inmemory state. To scale to thousands of concurrent users across multiple instances, the following architecture is planned:
1. **Redis Adapter**: Integrate `@socket.io/redis-adapter` to allow cross server event broadcasting.
2. **Stateless Node Instances**: Move the in memory `rooms` map and timers to a centralized Redis cluster (Redis JSON/Hashes).
3. **Load Balancing**: Deploy behind a Load Balancer (e.g., NGINX, AWS ALB) with Sticky Sessions enabled.
4. **Lazy Timer Evaluation**: Offload `setInterval` ticks to timestamp based lazy evaluations or a dedicated worker queue to prevent event loop blocking.

## Local Development

### Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)

### Setup Instructions

1. Clone the repository and navigate to the root directory.
2. Install dependencies for both the client and server:
   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```
3. Start the backend server (runs on port 3001 by default):
   ```bash
   cd server
   npm run dev
   ```
4. Start the frontend client (runs on port 5173 by default):
   ```bash
   cd client
   npm run dev
   ```
5. Open `http://localhost:5173` in two separate browser windows to test multiplayer functionality locally.

## License
MIT License
