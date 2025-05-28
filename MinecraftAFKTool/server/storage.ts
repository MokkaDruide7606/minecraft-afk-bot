import { 
  botSessions, 
  botConfigs, 
  activityLogs, 
  chatMessages,
  type BotSession, 
  type InsertBotSession,
  type BotConfig,
  type InsertBotConfig,
  type ActivityLog,
  type InsertActivityLog,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  // Bot Sessions
  createBotSession(session: InsertBotSession): Promise<BotSession>;
  getBotSession(id: number): Promise<BotSession | undefined>;
  updateBotSessionStatus(id: number, status: string): Promise<BotSession | undefined>;
  getActiveBotSession(): Promise<BotSession | undefined>;
  
  // Bot Configs
  createBotConfig(config: InsertBotConfig): Promise<BotConfig>;
  getBotConfig(sessionId: number): Promise<BotConfig | undefined>;
  updateBotConfig(sessionId: number, config: Partial<InsertBotConfig>): Promise<BotConfig | undefined>;
  
  // Activity Logs
  addActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(sessionId: number, limit?: number): Promise<ActivityLog[]>;
  
  // Chat Messages
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: number, limit?: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private sessions: Map<number, BotSession>;
  private configs: Map<number, BotConfig>;
  private logs: Map<number, ActivityLog>;
  private messages: Map<number, ChatMessage>;
  private currentSessionId: number;
  private currentConfigId: number;
  private currentLogId: number;
  private currentMessageId: number;

  constructor() {
    this.sessions = new Map();
    this.configs = new Map();
    this.logs = new Map();
    this.messages = new Map();
    this.currentSessionId = 1;
    this.currentConfigId = 1;
    this.currentLogId = 1;
    this.currentMessageId = 1;
  }

  async createBotSession(insertSession: InsertBotSession): Promise<BotSession> {
    const id = this.currentSessionId++;
    const now = new Date();
    const session: BotSession = { 
      ...insertSession, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.sessions.set(id, session);
    return session;
  }

  async getBotSession(id: number): Promise<BotSession | undefined> {
    return this.sessions.get(id);
  }

  async updateBotSessionStatus(id: number, status: string): Promise<BotSession | undefined> {
    const session = this.sessions.get(id);
    if (session) {
      const updatedSession = { ...session, status, updatedAt: new Date() };
      this.sessions.set(id, updatedSession);
      return updatedSession;
    }
    return undefined;
  }

  async getActiveBotSession(): Promise<BotSession | undefined> {
    return Array.from(this.sessions.values()).find(session => session.status === "connected");
  }

  async createBotConfig(insertConfig: InsertBotConfig): Promise<BotConfig> {
    const id = this.currentConfigId++;
    const config: BotConfig = { ...insertConfig, id };
    this.configs.set(id, config);
    return config;
  }

  async getBotConfig(sessionId: number): Promise<BotConfig | undefined> {
    return Array.from(this.configs.values()).find(config => config.sessionId === sessionId);
  }

  async updateBotConfig(sessionId: number, configUpdate: Partial<InsertBotConfig>): Promise<BotConfig | undefined> {
    const config = Array.from(this.configs.values()).find(c => c.sessionId === sessionId);
    if (config) {
      const updatedConfig = { ...config, ...configUpdate };
      this.configs.set(config.id, updatedConfig);
      return updatedConfig;
    }
    return undefined;
  }

  async addActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentLogId++;
    const log: ActivityLog = { ...insertLog, id, timestamp: new Date() };
    this.logs.set(id, log);
    return log;
  }

  async getActivityLogs(sessionId: number, limit: number = 50): Promise<ActivityLog[]> {
    return Array.from(this.logs.values())
      .filter(log => log.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = { ...insertMessage, id, timestamp: new Date() };
    this.messages.set(id, message);
    return message;
  }

  async getChatMessages(sessionId: number, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
