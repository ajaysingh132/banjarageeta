import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  AIChatMessage,
  AIChatSession,
  Chapter,
  InsertAIChatMessage,
  InsertAIChatSession,
  InsertChapter,
  InsertScene,
  InsertShloka,
  Scene,
  Shloka,
  aiChatMessages,
  aiChatSessions,
  chapters,
  scenes,
  shlokas,
} from "../drizzle/schema";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Chapters ──────────────────────────────────────────────

export async function listChapters() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(chapters).orderBy(asc(chapters.chapterNumber));
}

export async function getChapter(id: number): Promise<Chapter | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
  return rows[0];
}

export async function createChapter(data: InsertChapter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chapters).values(data);
  return result[0].insertId;
}

export async function updateChapter(id: number, data: Partial<InsertChapter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chapters).set(data).where(eq(chapters.id, id));
}

export async function deleteChapter(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const shlokaList = await listShlokasByChapter(id);
  const shlokaIds = shlokaList.map((s) => s.id);
  if (shlokaIds.length > 0) {
    await db.delete(scenes).where(inArray(scenes.shlokaId, shlokaIds));
  }
  await db.delete(shlokas).where(eq(shlokas.chapterId, id));
  await db.delete(chapters).where(eq(chapters.id, id));
}

// ── Shlokas ───────────────────────────────────────────────

export async function listShlokasByChapter(chapterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(shlokas).where(eq(shlokas.chapterId, chapterId)).orderBy(asc(shlokas.shlokaNumber));
}

export async function listShlokasWithScenes(chapterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const shlokaList = await db
    .select()
    .from(shlokas)
    .where(eq(shlokas.chapterId, chapterId))
    .orderBy(asc(shlokas.shlokaNumber));
  const shlokaIds = shlokaList.map((s) => s.id);
  if (shlokaIds.length === 0) return [];
  const sceneList = await db.select().from(scenes).where(inArray(scenes.shlokaId, shlokaIds));
  const sceneMap = new Map<number, Scene>();
  for (const sc of sceneList) {
    sceneMap.set(sc.shlokaId, sc);
  }
  return shlokaList.map((s) => ({ shlokas: s, scenes: sceneMap.get(s.id) ?? null }));
}

export async function getShloka(id: number): Promise<Shloka | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(shlokas).where(eq(shlokas.id, id)).limit(1);
  return rows[0];
}

export async function createShloka(data: InsertShloka) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(shlokas).values(data);
  return result[0].insertId;
}

export async function updateShloka(id: number, data: Partial<InsertShloka>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(shlokas).set(data).where(eq(shlokas.id, id));
}

export async function deleteShloka(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scenes).where(eq(scenes.shlokaId, id));
  await db.delete(shlokas).where(eq(shlokas.id, id));
}

// ── Scenes ────────────────────────────────────────────────

export async function getScene(id: number): Promise<Scene | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(scenes).where(eq(scenes.id, id)).limit(1);
  return rows[0];
}

export async function getSceneByShloka(shlokaId: number): Promise<Scene | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(scenes).where(eq(scenes.shlokaId, shlokaId)).limit(1);
  return rows[0];
}

export async function createScene(data: InsertScene) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scenes).values(data);
  return result[0].insertId;
}

export async function updateScene(id: number, data: Partial<InsertScene>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scenes).set(data).where(eq(scenes.id, id));
}

export async function deleteScene(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Find the related shloka before deleting the scene so we can clear its scene flags
  const existing = await getScene(id);
  if (existing) {
    await db.update(shlokas).set({ hasScene: 0, sceneStatus: "not-started" }).where(eq(shlokas.id, existing.shlokaId));
  }
  await db.delete(scenes).where(eq(scenes.id, id));
  if (existing) {
    await updateChapterShlokaCountsFromShloka(db, existing.shlokaId);
  }
}

async function updateChapterShlokaCountsFromShloka(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, shlokaId: number) {
  const shlokaRows = await db.select().from(shlokas).where(eq(shlokas.id, shlokaId)).limit(1);
  const shloka = shlokaRows[0];
  if (shloka) {
    await updateChapterShlokaCounts(shloka.chapterId);
  }
}

// ── AI Chat ───────────────────────────────────────────────

export async function listAISessions(userId: number): Promise<AIChatSession[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(aiChatSessions)
    .where(eq(aiChatSessions.userId, userId))
    .orderBy(desc(aiChatSessions.updatedAt));
}

export async function createAISession(data: InsertAIChatSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiChatSessions).values(data);
  return result[0].insertId;
}

export async function deleteAISession(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verify ownership before deleting anything
  const owned = await db
    .select({ id: aiChatSessions.id })
    .from(aiChatSessions)
    .where(and(eq(aiChatSessions.id, id), eq(aiChatSessions.userId, userId)))
    .limit(1);
  if (owned.length === 0) return false;
  await db.delete(aiChatMessages).where(eq(aiChatMessages.sessionId, id));
  await db.delete(aiChatSessions).where(eq(aiChatSessions.id, id));
  return true;
}

export async function listAIMessages(sessionId: number): Promise<AIChatMessage[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(aiChatMessages)
    .where(eq(aiChatMessages.sessionId, sessionId))
    .orderBy(asc(aiChatMessages.createdAt));
}

export async function addAIMessage(data: InsertAIChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiChatMessages).values(data);
  // Touch session updatedAt for ordering
  await db.update(aiChatSessions).set({ updatedAt: new Date() }).where(eq(aiChatSessions.id, data.sessionId));
}

// ── Progress ──────────────────────────────────────────────

export async function getOverallProgress() {
  const chapterList = await listChapters();
  const totalChapters = chapterList.length;
  const completedChapters = chapterList.filter((c) => c.status === "complete").length;
  const totalShlokas = chapterList.reduce((sum, c) => sum + c.totalShlokas, 0);
  const completedShlokas = chapterList.reduce((sum, c) => sum + c.completedShlokas, 0);
  return { totalChapters, completedChapters, totalShlokas, completedShlokas };
}

export async function updateChapterShlokaCounts(chapterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const shlokaList = await listShlokasByChapter(chapterId);
  const totalShlokas = shlokaList.length;
  const completedShlokas = shlokaList.filter((s) => s.sceneStatus === "complete").length;
  const status =
    completedShlokas === 0
      ? "draft"
      : completedShlokas === totalShlokas && totalShlokas > 0
        ? "complete"
        : "in-progress";
  await db
    .update(chapters)
    .set({ totalShlokas, completedShlokas, status })
    .where(eq(chapters.id, chapterId));
}
