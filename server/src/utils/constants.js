export const VALID_RUNS = [1, 2, 3, 4, 5, 6];

export const TURN_TIMER = 5;

export const RECONNECT_TIMEOUT = 30000;

export const MAX_IDLE_BALLS = 3;

export const GAME_STATES = {
  LOBBY: 'lobby',
  WAITING: 'waiting',
  TOSS: 'toss',
  TOSS_RESULT: 'toss_result',
  INNINGS_1: 'innings_1',
  INNINGS_BREAK: 'innings_break',
  INNINGS_2: 'innings_2',
  MATCH_RESULT: 'match_result',
};

export const EVENTS = {
  CREATE_ROOM: 'createRoom',
  JOIN_ROOM: 'joinRoom',
  PLAYER_READY: 'playerReady',
  TOSS_CHOICE: 'tossChoice',
  TOSS_DECISION: 'tossDecision',
  SUBMIT_RUN: 'submitRun',
  GAME_STATE_UPDATE: 'gameStateUpdate',
  ROOM_CREATED: 'roomCreated',
  PLAYER_JOINED: 'playerJoined',
  ERROR: 'gameError',
  PLAYER_DISCONNECTED: 'playerDisconnected',
  PLAYER_RECONNECTED: 'playerReconnected',
  REMATCH: 'rematch',
  REMATCH_REQUESTED: 'rematchRequested',
  ROOM_DESTROYED: 'roomDestroyed',
  TIMER_TICK: 'timerTick',
  FORFEIT: 'forfeit',
  SET_MATCH_CONFIG: 'setMatchConfig',
  UPDATE_NAME: 'updateName',
};
