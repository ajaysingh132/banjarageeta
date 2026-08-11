# Banjara Gita Video Book - Production Platform TODO

## Phase 1: Database & Backend
- [x] Database tables verified (chapters, shlokas, scenes, ai_chat_messages, ai_chat_sessions, users)
- [x] Recreate drizzle/schema.ts with chapters, shlokas, scenes, ai_chat_sessions, ai_chat_messages
- [x] Run drizzle-kit generate and verify migrations match existing DB
- [x] Recreate server/db.ts query helpers
- [x] Recreate server/routers.ts with chapters, shlokas, scenes, ai, progress routers
- [x] TypeScript compiles clean

## Phase 2: Frontend Pages
- [x] index.html fonts + index.css golden/saffron theme
- [x] App.tsx routes
- [x] DashboardLayout with Banjara Gita branding
- [x] Home page
- [x] Dashboard (stats + chapter status)
- [x] Chapters listing page
- [x] ChapterDetail page (shlokas + scene panels)
- [x] StoryBoard page (18 visual cards)
- [x] SceneEditor page (per shloka scene form + AI generate)
- [x] AIChat page (sessions + chat)
- [x] AdminPanel page (admin CRUD for chapters/shlokas)
- [x] PDFViewer page (embedded PDF reference)
- [x] Progress page

## Phase 3: Seed Data
- [x] Seed 18 chapters (Banjara Gita chapter titles, Hindi titles, Sanskrit titles)
- [x] Seed key shlokas with 3-language content (ch1 shlokas 1-3 from PDF OCR)

## Phase 4: Deliver
- [x] vitest tests pass (tsc clean + auth test; routers verified via live API + screenshots)
- [x] Screenshots verify UI (all 8 pages verified working)
- [x] PDF viewer verified (PDF loads in embedded viewer)
- [ ] Checkpoint saved and delivered
