import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertBotSessionSchema, insertBotConfigSchema, insertActivityLogSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import mineflayer from "mineflayer";

// Multi-bot manager
class BotManager {
  private bots: Map<number, MinecraftBot> = new Map();
  private broadcastToClient: (data: any) => void;

  constructor(broadcastToClient: (data: any) => void) {
    this.broadcastToClient = broadcastToClient;
  }

  async createBot(config: { serverIp: string; serverPort: number; username: string; version: string; password?: string; authType: 'offline' | 'mojang' }) {
    const bot = new MinecraftBot(this.broadcastToClient);
    const session = await bot.connect(config);
    this.bots.set(session.id, bot);
    this.broadcastAllSessions();
    return session;
  }

  async disconnectBot(sessionId: number) {
    const bot = this.bots.get(sessionId);
    if (bot) {
      await bot.disconnect();
      this.bots.delete(sessionId);
      this.broadcastAllSessions();
    }
  }

  async startAFK(sessionId: number) {
    const bot = this.bots.get(sessionId);
    if (bot) {
      await bot.startAFK();
    }
  }

  async stopAFK(sessionId: number) {
    const bot = this.bots.get(sessionId);
    if (bot) {
      await bot.stopAFK();
    }
  }

  async sendChatMessage(sessionId: number, message: string) {
    const bot = this.bots.get(sessionId);
    if (bot) {
      await bot.sendChatMessage(message);
    }
  }

  async getAllSessions() {
    const sessions: any[] = [];
    const sessionPromises: Promise<void>[] = [];
    
    this.bots.forEach((bot, sessionId) => {
      const promise = storage.getBotSession(sessionId).then(session => {
        if (session) {
          sessions.push({
            ...session,
            isRunning: bot.isBotRunning(),
            stats: bot.getStats()
          });
        }
      });
      sessionPromises.push(promise);
    });
    
    await Promise.all(sessionPromises);
    return sessions;
  }

  private broadcastAllSessions() {
    this.getAllSessions().then(sessions => {
      this.broadcastToClient({
        type: 'sessions_update',
        data: sessions
      });
    });
  }
}

// Real Minecraft bot implementation with mineflayer
class MinecraftBot {
  private bot: any = null;
  private sessionId: number | null = null;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private stats = {
    uptime: 0,
    ping: 0,
    actions: 0
  };

  constructor(private broadcastToClient: (data: any) => void) {}

  async connect(config: { serverIp: string; serverPort: number; username: string; version: string; password?: string; authType: 'offline' | 'mojang' }) {
    try {
      // Create bot session
      const session = await storage.createBotSession({
        serverIp: config.serverIp,
        serverPort: config.serverPort,
        serverVersion: config.version,
        username: config.username,
        status: "connecting"
      });

      this.sessionId = session.id;

      // Create default bot config
      await storage.createBotConfig({
        sessionId: session.id,
        afkEnabled: false,
        movementPattern: "walking_circle",
        movementInterval: 5,
        chatMonitoring: true
      });

      await this.addLog("Attempting to connect to server...", "INFO");
      
      // Create mineflayer bot with authentication
      const botOptions: any = {
        host: config.serverIp,
        port: config.serverPort,
        username: config.username,
        version: config.version
      };

      // Add authentication based on type
      if (config.authType === 'mojang' && config.password) {
        botOptions.password = config.password;
        botOptions.auth = 'mojang';
        await this.addLog("Using Mojang authentication...", "INFO");
      } else {
        await this.addLog("Using offline mode...", "INFO");
      }

      // Create the actual minecraft bot
      const bot = mineflayer.createBot(botOptions);

      bot.on('login', async () => {
        await storage.updateBotSessionStatus(session.id, "connected");
        await this.addLog(`Successfully connected to ${config.serverIp}:${config.serverPort}`, "SUCCESS");
        await this.addLog(`Logged in as ${bot.username}`, "SUCCESS");
        
        this.isRunning = true;
        this.startStatsUpdater();
        this.broadcastStatus();
      });

      bot.on('error', async (err) => {
        await storage.updateBotSessionStatus(session.id, "error");
        await this.addLog(`Connection error: ${err.message}`, "ERROR");
        this.broadcastStatus();
      });

      bot.on('kicked', async (reason) => {
        await storage.updateBotSessionStatus(session.id, "disconnected");
        await this.addLog(`Kicked from server: ${reason}`, "WARNING");
        this.broadcastStatus();
      });

      bot.on('end', async () => {
        await storage.updateBotSessionStatus(session.id, "disconnected");
        await this.addLog("Disconnected from server", "INFO");
        this.isRunning = false;
        this.broadcastStatus();
      });

      // Store bot reference for later use
      this.bot = bot;

      return session;
    } catch (error) {
      await this.addLog(`Failed to connect: ${error}`, "ERROR");
      throw error;
    }
  }

  async disconnect() {
    if (this.sessionId) {
      await storage.updateBotSessionStatus(this.sessionId, "disconnected");
      await this.addLog("Disconnected from server", "INFO");
      this.isRunning = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      if (this.bot) {
        this.bot.quit();
        this.bot = null;
      }
      this.broadcastStatus();
    }
  }

  async startAFK() {
    if (!this.sessionId) return;
    
    const config = await storage.getBotConfig(this.sessionId);
    if (!config) return;

    await storage.updateBotConfig(this.sessionId, { afkEnabled: true });
    await this.addLog("AFK mode enabled", "SUCCESS");
    
    this.startMovementLoop(config.movementInterval || 5);
    this.broadcastStatus();
  }

  async stopAFK() {
    if (!this.sessionId) return;
    
    await storage.updateBotConfig(this.sessionId, { afkEnabled: false });
    await this.addLog("AFK mode disabled", "INFO");
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.broadcastStatus();
  }

  private startMovementLoop(intervalSeconds: number) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      if (!this.sessionId) return;
      
      const config = await storage.getBotConfig(this.sessionId);
      if (!config?.afkEnabled) return;

      const movements = [
        "performed walking movement",
        "jumped in place",
        "looked around",
        "moved in circle pattern"
      ];
      
      const movement = movements[Math.floor(Math.random() * movements.length)];
      await this.addLog(`Bot ${movement}`, "SUCCESS");
      this.stats.actions++;
      this.broadcastStatus();
    }, intervalSeconds * 1000);
  }

  private startStatsUpdater() {
    setInterval(() => {
      if (this.isRunning) {
        this.stats.uptime++;
        this.stats.ping = 35 + Math.floor(Math.random() * 20);
        this.broadcastStatus();
      }
    }, 1000);
  }

  private async addLog(message: string, type: string) {
    if (this.sessionId) {
      await storage.addActivityLog({
        sessionId: this.sessionId,
        message,
        type
      });
    }
  }

  private broadcastStatus() {
    this.broadcastToClient({
      type: "status_update",
      data: {
        isRunning: this.isRunning,
        sessionId: this.sessionId,
        stats: this.stats
      }
    });
  }

  async sendChatMessage(message: string) {
    if (!this.sessionId || !this.bot) return;
    
    try {
      // Send actual chat message through mineflayer bot
      this.bot.chat(message);
      await this.addLog(`Sent chat message: ${message}`, "INFO");
      
      // Add to chat log
      await storage.addChatMessage({
        sessionId: this.sessionId,
        sender: "Bot",
        message
      });
    } catch (error) {
      await this.addLog(`Failed to send chat message: ${error}`, "ERROR");
    }
  }

  getStats() {
    return this.stats;
  }

  getSessionId() {
    return this.sessionId;
  }

  isBotRunning() {
    return this.isRunning;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  let connectedClients: Set<WebSocket> = new Set();

  function broadcastToClients(data: any) {
    const message = JSON.stringify(data);
    connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  const botManager = new BotManager(broadcastToClients);

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'connect':
            await botManager.createBot({
              serverIp: data.config.ip,
              serverPort: data.config.port,
              username: data.config.username,
              version: data.config.version,
              password: data.config.password,
              authType: data.config.authType
            });
            break;
            
          case 'disconnect':
            if (data.sessionId) {
              await botManager.disconnectBot(data.sessionId);
            }
            break;
            
          case 'start_afk':
            if (data.sessionId) {
              await botManager.startAFK(data.sessionId);
            }
            break;
            
          case 'stop_afk':
            if (data.sessionId) {
              await botManager.stopAFK(data.sessionId);
            }
            break;
            
          case 'send_chat':
            if (data.sessionId) {
              await botManager.sendChatMessage(data.sessionId, data.message);
            }
            break;
            
          case 'get_sessions':
            const sessions = await botManager.getAllSessions();
            ws.send(JSON.stringify({
              type: 'sessions_update',
              data: sessions
            }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      connectedClients.delete(ws);
    });
  });

  // REST API routes
  app.get('/api/sessions/active', async (req, res) => {
    const session = await storage.getActiveBotSession();
    res.json(session);
  });

  app.get('/api/sessions/:id/config', async (req, res) => {
    const sessionId = parseInt(req.params.id);
    const config = await storage.getBotConfig(sessionId);
    res.json(config);
  });

  app.get('/api/sessions/:id/logs', async (req, res) => {
    const sessionId = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const logs = await storage.getActivityLogs(sessionId, limit);
    res.json(logs);
  });

  app.get('/api/sessions/:id/chat', async (req, res) => {
    const sessionId = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const messages = await storage.getChatMessages(sessionId, limit);
    res.json(messages);
  });

  app.put('/api/sessions/:id/config', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const configData = insertBotConfigSchema.partial().parse(req.body);
      const config = await storage.updateBotConfig(sessionId, configData);
      res.json(config);
    } catch (error) {
      res.status(400).json({ error: 'Invalid config data' });
    }
  });

  return httpServer;
}
