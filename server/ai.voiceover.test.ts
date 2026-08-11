import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockGenerateScene = vi.fn();
const mockInvokeLLM = vi.fn().mockResolvedValue({
  choices: [{ message: { content: JSON.stringify({
    narrationBanjara: "सुणो सुणो भक्तनो!",
    narrationHindi: "भक्तों, सुनो!",
    openingLine: "जय गीता!",
    closingLine: "शान्ति!",
    estimatedDurationSeconds: 12,
    toneNotes: "धीरे बोलें",
    soundCues: "बांसुरी",
  }) } }],
});

vi.mock("./_core/llm", () => ({ invokeLLM: (...args: unknown[]) => mockInvokeLLM(...args) }));

// Mock db helpers used by the voiceover mutation
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getShloka: vi.fn().mockResolvedValue({
      id: 1,
      chapterId: 1,
      shlokaNumber: 1,
      verseNumber: "1.1",
      sanskrit: "संस्कृत",
      banjara: "बंजारा",
      hindi: "हिंदी",
      speaker: "धृतराष्ट्र",
      hasScene: 0,
      sceneStatus: null,
    }),
    getChapter: vi.fn().mockResolvedValue({
      id: 1,
      chapterNumber: 1,
      titleBanjara: "अध्यायू एकु",
      titleHindi: "पहला अध्याय",
      totalShlokas: 47,
      completedShlokas: 0,
      status: "draft",
    }),
    getSceneByShloka: vi.fn().mockResolvedValue(null),
    updateShloka: vi.fn().mockResolvedValue(undefined),
    updateChapterShlokaCounts: vi.fn().mockResolvedValue(undefined),
    createScene: vi.fn().mockResolvedValue(1),
    updateScene: vi.fn().mockResolvedValue(undefined),
  };
});

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("ai.voiceoverScript", () => {
  it("generates a Banjara voiceover script for a shloka", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(createAuthContext());

    const result = await caller.ai.voiceoverScript({ shlokaId: 1 });

    expect(result.success).toBe(true);
    expect(result.shlokaVerse).toBe("1.1");
    expect(result.script.narrationBanjara).toContain("भक्तनो");
    expect(result.script.estimatedDurationSeconds).toBe(12);
    expect(result.script.toneNotes).toBe("धीरे बोलें");
    expect(mockInvokeLLM).toHaveBeenCalledOnce();
  });

  it("throws NOT_FOUND for a missing shloka", async () => {
    const db = await import("./db");
    (db.getShloka as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller(createAuthContext());

    await expect(caller.ai.voiceoverScript({ shlokaId: 9999 })).rejects.toThrow();
  });
});
