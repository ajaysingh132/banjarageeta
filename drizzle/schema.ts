import { double, int, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * The 18 chapters of the Banjara Gita, with 3-language titles.
 */
export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  chapterNumber: int("chapterNumber").notNull().unique(),
  titleBanjara: varchar("titleBanjara", { length: 255 }).notNull(),
  titleHindi: varchar("titleHindi", { length: 255 }).notNull(),
  titleSanskrit: varchar("titleSanskrit", { length: 255 }),
  descriptionBanjara: longtext("descriptionBanjara"),
  descriptionHindi: longtext("descriptionHindi"),
  totalShlokas: int("totalShlokas").default(0).notNull(),
  completedShlokas: int("completedShlokas").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "in-progress", "complete"]).default("draft").notNull(),
  coverPrompt: longtext("coverPrompt"),
  pdfPageStart: int("pdfPageStart"),
  pdfPageEnd: int("pdfPageEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;

/**
 * Shlokas (verses) within a chapter — 3 language layers preserved.
 */
export const shlokas = mysqlTable("shlokas", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: int("chapterId").notNull(),
  shlokaNumber: int("shlokaNumber").notNull(),
  verseNumber: varchar("verseNumber", { length: 20 }).notNull(),
  sanskrit: longtext("sanskrit"),
  banjara: longtext("banjara"),
  hindi: longtext("hindi"),
  speaker: varchar("speaker", { length: 50 }).default("अर्जुन"),
  speakerBanjara: varchar("speakerBanjara", { length: 50 }),
  meaning: longtext("meaning"),
  hasScene: int("hasScene").default(0).notNull(),
  sceneStatus: mysqlEnum("sceneStatus", ["not-started", "draft", "in-progress", "complete"]).default("not-started").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shloka = typeof shlokas.$inferSelect;
export type InsertShloka = typeof shlokas.$inferInsert;

/**
 * One animation scene per shloka (Krishna-serial style: one shloka = one scene).
 */
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  shlokaId: int("shlokaId").notNull().unique(),
  sceneDescription: longtext("sceneDescription"),
  characters: longtext("characters"),
  background: longtext("background"),
  dialogue: longtext("dialogue"),
  dialogueBanjara: longtext("dialogueBanjara"),
  mood: varchar("mood", { length: 100 }),
  cameraAngle: varchar("cameraAngle", { length: 100 }),
  lighting: varchar("lighting", { length: 100 }),
  audioNotes: longtext("audioNotes"),
  durationSeconds: double("durationSeconds").default(30),
  status: mysqlEnum("status", ["not-started", "draft", "in-progress", "complete"]).default("not-started").notNull(),
  aiGenerated: int("aiGenerated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

/**
 * AI chat sessions owned by a user.
 */
export const aiChatSessions = mysqlTable("ai_chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).default("नई बातचीत"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAIChatSession = typeof aiChatSessions.$inferInsert;

/**
 * Messages inside an AI chat session.
 */
export const aiChatMessages = mysqlTable("ai_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["system", "user", "assistant"]).notNull(),
  content: longtext("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAIChatMessage = typeof aiChatMessages.$inferInsert;
