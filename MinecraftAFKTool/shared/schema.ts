import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botSessions = pgTable("bot_sessions", {
  id: serial("id").primaryKey(),
  serverIp: text("server_ip").notNull(),
  serverPort: integer("server_port").notNull().default(25565),
  serverVersion: text("server_version").notNull().default("1.20.1"),
  username: text("username").notNull(),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, error
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const botConfigs = pgTable("bot_configs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => botSessions.id),
  afkEnabled: boolean("afk_enabled").default(false),
  movementPattern: text("movement_pattern").default("walking_circle"),
  movementInterval: integer("movement_interval").default(5),
  chatMonitoring: boolean("chat_monitoring").default(true),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => botSessions.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // SUCCESS, INFO, ERROR, WARNING
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => botSessions.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  sender: text("sender").notNull(),
  message: text("message").notNull(),
});

export const insertBotSessionSchema = createInsertSchema(botSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfigs).omit({
  id: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type BotSession = typeof botSessions.$inferSelect;
export type InsertBotSession = z.infer<typeof insertBotSessionSchema>;
export type BotConfig = typeof botConfigs.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
