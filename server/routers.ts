import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

const sceneInput = z.object({
  shlokaId: z.number(),
  sceneDescription: z.string().optional(),
  characters: z.string().optional(),
  background: z.string().optional(),
  dialogue: z.string().optional(),
  dialogueBanjara: z.string().optional(),
  mood: z.string().optional(),
  cameraAngle: z.string().optional(),
  lighting: z.string().optional(),
  audioNotes: z.string().optional(),
  durationSeconds: z.number().optional(),
  status: z.enum(["not-started", "draft", "in-progress", "complete"]).optional(),
});

const shlokaInput = z.object({
  chapterId: z.number(),
  shlokaNumber: z.number(),
  verseNumber: z.string(),
  sanskrit: z.string().optional(),
  banjara: z.string().optional(),
  hindi: z.string().optional(),
  speaker: z.string().optional(),
  speakerBanjara: z.string().optional(),
  meaning: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  chapters: router({
    list: publicProcedure.query(() => db.listChapters()),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const chapter = await db.getChapter(input.id);
        if (!chapter) throw new TRPCError({ code: "NOT_FOUND", message: "अध्याय नहीं मिला" });
        return chapter;
      }),

    create: adminProcedure
      .input(z.object({
        chapterNumber: z.number(),
        titleBanjara: z.string(),
        titleHindi: z.string(),
        titleSanskrit: z.string().optional(),
        descriptionBanjara: z.string().optional(),
        descriptionHindi: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createChapter({ ...input, totalShlokas: 0, completedShlokas: 0, status: "draft" });
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        chapterNumber: z.number().optional(),
        titleBanjara: z.string().optional(),
        titleHindi: z.string().optional(),
        titleSanskrit: z.string().optional(),
        descriptionBanjara: z.string().optional(),
        descriptionHindi: z.string().optional(),
        totalShlokas: z.number().optional(),
        completedShlokas: z.number().optional(),
        status: z.enum(["draft", "in-progress", "complete"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateChapter(id, data);
        return { success: true } as const;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteChapter(input.id);
        return { success: true } as const;
      }),
  }),

  shlokas: router({
    list: protectedProcedure
      .input(z.object({ chapterId: z.number() }))
      .query(({ input }) => db.listShlokasByChapter(input.chapterId)),

    listWithScenes: protectedProcedure
      .input(z.object({ chapterId: z.number() }))
      .query(({ input }) => db.listShlokasWithScenes(input.chapterId)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const shloka = await db.getShloka(input.id);
        if (!shloka) throw new TRPCError({ code: "NOT_FOUND", message: "श्लोक नहीं मिला" });
        return shloka;
      }),

    create: adminProcedure.input(shlokaInput).mutation(async ({ input }) => {
      const id = await db.createShloka(input);
      await db.updateChapterShlokaCounts(input.chapterId);
      return { id };
    }),

    update: adminProcedure
      .input(z.object({ id: z.number() }).merge(shlokaInput.partial().omit({ chapterId: true })))
      .mutation(async ({ input }) => {
        const shloka = await db.getShloka(input.id);
        const { id, ...data } = input;
        await db.updateShloka(id, data);
        if (shloka) await db.updateChapterShlokaCounts(shloka.chapterId);
        return { success: true } as const;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const shloka = await db.getShloka(input.id);
        await db.deleteShloka(input.id);
        if (shloka) await db.updateChapterShlokaCounts(shloka.chapterId);
        return { success: true } as const;
      }),
  }),

  scenes: router({
    getByShloka: protectedProcedure
      .input(z.object({ shlokaId: z.number() }))
      .query(({ input }) => db.getSceneByShloka(input.shlokaId)),

    create: adminProcedure.input(sceneInput).mutation(async ({ input }) => {
      const id = await db.createScene(input);
      const shloka = await db.getShloka(input.shlokaId);
      if (shloka) {
        await db.updateShloka(input.shlokaId, {
          hasScene: 1,
          sceneStatus: input.status ?? "draft",
        });
        await db.updateChapterShlokaCounts(shloka.chapterId);
      }
      return { id };
    }),

    update: adminProcedure
      .input(z.object({ id: z.number() }).merge(sceneInput.partial()))
      .mutation(async ({ input }) => {
        const existing = await db.getScene(input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "सीन नहीं मिला" });
        const { id, ...data } = input;
        void id;
        await db.updateScene(id, data);
        const shlokaId = data.shlokaId ?? existing.shlokaId;
        const shloka = await db.getShloka(shlokaId);
        if (shloka) {
          await db.updateShloka(shlokaId, {
            hasScene: 1,
            sceneStatus: data.status ?? "draft",
          });
          await db.updateChapterShlokaCounts(shloka.chapterId);
        }
        return { success: true } as const;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteScene(input.id);
        return { success: true } as const;
      }),

    generateScene: protectedProcedure
      .input(z.object({ shlokaId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const shloka = await db.getShloka(input.shlokaId);
        if (!shloka) throw new TRPCError({ code: "NOT_FOUND", message: "श्लोक नहीं मिला" });

        try {
          // Generate scene description using built-in LLM
          const { invokeLLM } = await import("./_core/llm");
          const prompt = `You are an assistant for a 3D animated Banjara Gita video book (Krishna-serial style). One shloka = one cinematic scene.

Shloka verse: ${shloka.verseNumber}
Sanskrit: ${shloka.sanskrit ?? ""}
Banjara translation: ${shloka.banjara ?? ""}
Hindi meaning: ${shloka.hindi ?? ""}
Speaker: ${shloka.speaker ?? ""}

Generate a cinematic scene description in Hindi for this shloka. Return a JSON object with these fields:
- sceneDescription: 2-3 sentences describing the visual scene (setting, what's happening, 3D animated film style)
- characters: which characters appear (e.g., भगवान कृष्ण, अर्जुन)
- background: setting description (e.g., कुरुक्षेत्र युद्धभूमि)
- dialogue: Hindi dialogue/narration for this scene
- dialogueBanjara: Banjara language narration for this scene (based on the Banjara translation above)
- mood: emotional tone (e.g., भक्तिपूर्ण, वीरतापूर्ण)
- cameraAngle: suggested camera shot (e.g., क्लोज-अप, वाइड शॉट, ओवर-द-शोल्डर)
- lighting: lighting description (e.g., दिव्य सुनहरा प्रकाश)
- audioNotes: background music and sound effect suggestions

Respond with ONLY the JSON object.`;

          const result = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            model: "gemini-2.5-flash",
            response_format: { type: "json_object" },
          });

          const content = result.choices[0]?.message?.content ?? "";
          const jsonStr = Array.isArray(content)
            ? content.map((p) => (p.type === "text" ? p.text : "")).join("")
            : content;
          // Try to parse JSON from the response
          let sceneData: Record<string, unknown> = {};
          try {
            const match = jsonStr.match(/\{[\s\S]*\}/);
            if (match) sceneData = JSON.parse(match[0]);
          } catch {
            sceneData = { sceneDescription: jsonStr.slice(0, 500) };
          }

          const existingScene = await db.getSceneByShloka(input.shlokaId);
          if (existingScene) {
            await db.updateScene(existingScene.id, {
              sceneDescription: (sceneData.sceneDescription as string) ?? null,
              characters: (sceneData.characters as string) ?? null,
              background: (sceneData.background as string) ?? null,
              dialogue: (sceneData.dialogue as string) ?? null,
              dialogueBanjara: (sceneData.dialogueBanjara as string) ?? null,
              mood: (sceneData.mood as string) ?? null,
              cameraAngle: (sceneData.cameraAngle as string) ?? null,
              lighting: (sceneData.lighting as string) ?? null,
              audioNotes: (sceneData.audioNotes as string) ?? null,
              aiGenerated: 1,
              status: "draft",
            });
          } else {
            await db.createScene({
              shlokaId: input.shlokaId,
              sceneDescription: (sceneData.sceneDescription as string) ?? null,
              characters: (sceneData.characters as string) ?? null,
              background: (sceneData.background as string) ?? null,
              dialogue: (sceneData.dialogue as string) ?? null,
              dialogueBanjara: (sceneData.dialogueBanjara as string) ?? null,
              mood: (sceneData.mood as string) ?? null,
              cameraAngle: (sceneData.cameraAngle as string) ?? null,
              lighting: (sceneData.lighting as string) ?? null,
              audioNotes: (sceneData.audioNotes as string) ?? null,
              aiGenerated: 1,
              status: "draft",
            });
          }

          await db.updateShloka(input.shlokaId, { hasScene: 1, sceneStatus: "draft" });
          await db.updateChapterShlokaCounts(shloka.chapterId);

          const generatedScene = await db.getSceneByShloka(input.shlokaId);
          return { success: true, scene: generatedScene ?? null };
        } catch (err) {
          console.error("[AI Scene Generation] Error:", err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI जनरेशन में त्रुटि। कृपया दोबारा प्रयास करें।",
          });
        }
      }),
  }),

  ai: router({
    sessions: protectedProcedure.query(({ ctx }) => db.listAISessions(ctx.user.id)),

    createSession: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAISession({ userId: ctx.user.id, title: input.title ?? "नई बातचीत" });
        return { id };
      }),

    deleteSession: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteAISession(input.id, ctx.user.id);
        if (!deleted) throw new TRPCError({ code: "FORBIDDEN", message: "यह सेशन आपका नहीं है" });
        return { success: true } as const;
      }),

    messages: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const sessions = await db.listAISessions(ctx.user.id);
        if (!sessions.some((s) => s.id === input.sessionId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "यह सेशन आपका नहीं है" });
        }
        return db.listAIMessages(input.sessionId);
      }),

    chat: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        message: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const sessions = await db.listAISessions(ctx.user.id);
        if (!sessions.some((s) => s.id === input.sessionId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "यह सेशन आपका नहीं है" });
        }

        const userMessage = input.message.trim();

        // Save user message
        await db.addAIMessage({ sessionId: input.sessionId, role: "user", content: userMessage });

        // Get conversation history for context
        const history = await db.listAIMessages(input.sessionId);
        const recentHistory = history.slice(-10);

        const systemPrompt = `You are the Banjara Gita AI Assistant (बंजारा गीतामृत AI सहायक). You help with creating a 3D animated video book of the Bhagavad Gita translated into Banjara (Lambadi) language by Krishna Nayak Chavan, in Krishna-serial cinematic style.

Your expertise covers:
1. Bhagavad Gita shlokas - Sanskrit verses, meanings, and context
2. Banjara (Lambadi) language - the poetic translation style used in Geetamruth
3. Video production - scene descriptions, character descriptions, camera angles, lighting, mood notes for 3D animation
4. Narrative script writing in Banjara language

The book has exactly 18 chapters covering 700 shlokas. The Banjara translation is poetic and devotional.

Always respond in Hindi (with Banjara terms when relevant) unless the user writes in English. Be concise, helpful, and focused on the video book production context. For scene descriptions, use cinematic language suitable for 3D animation.

Key character names in Banjara context: भगवान कृष्ण (Krishna), अर्जुन (Arjuna), संजय (Sanjaya), धृतराष्ट्र (Dhritarashtra), विदुर (Vidura), सेवलाल महाराज (Sevalal Maharaj - Banjara saint).`;

        try {
          const { invokeLLM } = await import("./_core/llm");
          const messages = [
            { role: "system" as const, content: systemPrompt },
            ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
          ];

          const result = await invokeLLM({ messages, model: "gemini-2.5-flash" });
          const content = result.choices[0]?.message?.content ?? "";
          const assistantMessage = Array.isArray(content)
            ? content.map((p) => (p.type === "text" ? p.text : "")).join("")
            : content;

          await db.addAIMessage({ sessionId: input.sessionId, role: "assistant", content: assistantMessage });

          return { success: true } as const;
        } catch (err) {
          console.error("[AI Chat] Error:", err);
          await db.addAIMessage({
            sessionId: input.sessionId,
            role: "assistant",
            content: "क्षमा करें, AI प्रतिक्रिया में त्रुटि हुई। कृपया दोबारा प्रयास करें।",
          });
          return { success: false } as const;
        }
      }),

    voiceoverScript: protectedProcedure
      .input(z.object({
        shlokaId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const shloka = await db.getShloka(input.shlokaId);
        if (!shloka) throw new TRPCError({ code: "NOT_FOUND", message: "श्लोक नहीं मिला" });

        // Fetch chapter context and existing scene (if any) for a cinematic, scene-aware script
        const chapter = await db.getChapter(shloka.chapterId);
        const scene = await db.getSceneByShloka(input.shlokaId);

        try {
          const { invokeLLM } = await import("./_core/llm");

          const prompt = `You are the voiceover script writer for a 3D animated Banjara Gita video book, produced like the Krishna TV serial. Each shloka gets one cinematic scene with a voiceover narration script in Banjara (Lambadi) language.

Chapter ${chapter?.chapterNumber ?? "?"}: ${chapter?.titleBanjara ?? ""} (${chapter?.titleHindi ?? ""})
Shloka: ${shloka.verseNumber} | Speaker: ${shloka.speaker ?? ""}

Sanskrit verse: ${shloka.sanskrit ?? ""}
Banjara translation: ${shloka.banjara ?? ""}
Hindi meaning: ${shloka.hindi ?? ""}

Existing scene details (if available): ${scene ? `Scene: ${scene.sceneDescription ?? ""}; Characters: ${scene.characters ?? ""}; Background: ${scene.background ?? ""}; Mood: ${scene.mood ?? ""}` : "No scene yet"}

Generate a complete VOICEOVER NARRATION SCRIPT in Banjara language for this shloka's video scene. The script will be spoken by a narrator (voice artist) in the 3D animated film. Return ONLY a JSON object with these fields:

- narrationBanjara: the main voiceover narration text in Banjara language (devanagari script), 3-6 sentences. It should poetically convey the shloka's meaning, sound natural when spoken aloud, and use the devotional Banjara style of Geetamruth.
- narrationHindi: the same narration meaning explained in Hindi (for the voice artist's understanding), 2-4 sentences.
- openingLine: a dramatic opening line the narrator speaks before the narration (in Banjara, e.g. addressing the listener).
- closingLine: a reflective closing line after the narration (in Banjara).
- estimatedDurationSeconds: estimated speaking duration in seconds (assume ~4 words/second for slow devotional pacing).
- toneNotes: instructions for the voice artist about tone, pace, and emotion (e.g., धीरा, भक्तिपूर्ण, गंभीर - in Hindi).
- soundCues: background music/sound cues suggestions (in Hindi), e.g. बांसुरी संगीत, युद्धभेरी, वायलिन।

Respond with ONLY the JSON object.`;

          const result = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            model: "gemini-2.5-flash",
            response_format: { type: "json_object" },
          });

          const content = result.choices[0]?.message?.content ?? "";
          const jsonStr = Array.isArray(content)
            ? content.map((p) => (p.type === "text" ? p.text : "")).join("")
            : content;

          let scriptData: Record<string, unknown> = {};
          try {
            const match = jsonStr.match(/\{[\s\S]*\}/);
            if (match) scriptData = JSON.parse(match[0]);
          } catch {
            scriptData = { narrationBanjara: jsonStr.slice(0, 1000) };
          }

          return {
            success: true,
            shlokaId: input.shlokaId,
            shlokaVerse: shloka.verseNumber,
            script: {
              narrationBanjara: (scriptData.narrationBanjara as string) ?? null,
              narrationHindi: (scriptData.narrationHindi as string) ?? null,
              openingLine: (scriptData.openingLine as string) ?? null,
              closingLine: (scriptData.closingLine as string) ?? null,
              estimatedDurationSeconds: (scriptData.estimatedDurationSeconds as number) ?? null,
              toneNotes: (scriptData.toneNotes as string) ?? null,
              soundCues: (scriptData.soundCues as string) ?? null,
            },
          };
        } catch (err) {
          console.error("[AI Voiceover] Error:", err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "वॉयसओवर स्क्रिप्ट जनरेशन में त्रुटि। कृपया दोबारा प्रयास करें।",
          });
        }
      }),
  }),

  progress: router({
    overall: publicProcedure.query(() => db.getOverallProgress()),
  }),
});

export type AppRouter = typeof appRouter;
