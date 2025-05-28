export interface BotStats {
  uptime: number;
  ping: number;
  actions: number;
}

export interface BotSession {
  id: number;
  username: string;
  serverIp: string;
  serverPort: number;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  isRunning: boolean;
  stats: BotStats;
  createdAt: Date;
}

export interface BotStatus {
  isRunning: boolean;
  sessionId: number | null;
  stats: BotStats;
}

export interface ServerConfig {
  ip: string;
  port: number;
  version: string;
  username: string;
  password?: string;
  authType: 'offline' | 'mojang';
}

export interface BotConfig {
  afkEnabled: boolean;
  movementPattern: string;
  movementInterval: number;
  chatMonitoring: boolean;
}

export interface ActivityLogEntry {
  id: number;
  timestamp: Date;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'ERROR' | 'WARNING';
}

export interface ChatMessage {
  id: number;
  timestamp: Date;
  sender: string;
  message: string;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  config?: ServerConfig;
  message?: string;
  sessionId?: number;
}
