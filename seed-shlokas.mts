import { drizzle } from "drizzle-orm/mysql2";
import { chapters, shlokas } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const db = drizzle(process.env.DATABASE_URL!);

const chap1 = await db.select().from(chapters).where(eq(chapters.chapterNumber, 1));
if (chap1.length === 0) {
  console.log("Chapter 1 missing; seed chapters first.");
  process.exit(1);
}
const ch1Id = chap1[0].id;

const existing = await db.select().from(shlokas).where(eq(shlokas.chapterId, ch1Id));
if (existing.length > 0) {
  console.log(`Chapter 1 already has ${existing.length} shlokas. Skipping.`);
  process.exit(0);
}

const shlokas1 = [
  {
    shlokaNumber: 1,
    verseNumber: "1.1",
    sanskrit:
      "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\nमामकाः पाण्डवाश्चैव किमकर्वन सञ्जय ॥1॥",
    translationBanjara:
      "केगा संजय काँयिं, कीदे वेल्लादेन केन वाछेला दुर्योधन दुरुथ तब हित्येच देक गुरुदेव, पांडवेल्ये भारि सेनान गोंखावेल्ये कुरुछेत्रेमा मार्वाँ ग्न् पांडव गोस्थावेल्ये ॥1॥",
    meaningHindi:
      "संजय! कुरुक्षेत्र युद्धभूमि में युद्ध करने के लिए एकत्र हुए मेरे पुत्र कौरवों और पांडवों के पक्ष के योद्धाओं ने क्या किया?",
  },
  {
    shlokaNumber: 2,
    verseNumber: "1.2",
    sanskrit:
      "दृष्ट्वा तु पाण्डवानीकं व्यूढं दुर्योधनस्तदा ।\nआचार्यमुपसङ्गम्य राजा वचनमब्रवीत् ॥2॥",
    translationBanjara:
      "गी.गा. संनक रणमांडे पांडवेल्ये देकन दुर्योधन संब्यायो गुरुदेव द्रोणाचार्य कननान ॥2॥",
    meaningHindi:
      "पांडवों की व्यूहरचना देखकर राजा दुर्योधन ने गुरु द्रोणाचार्य के पास जाकर ये वचन कहे।",
  },
  {
    shlokaNumber: 3,
    verseNumber: "1.3",
    sanskrit:
      "पश्यैतां पाण्डुपुत्राणामाचार्य महतीं चमूम् ।\nव्यूढां द्रुपदपुत्रेण तव शिष्येण धीमता ॥3॥",
    translationBanjara:
      "गी.गा. आचार्य महारथि, दुपदपुत्र तव शिष्य धीमता, गोंखावेल्ये पांडुपुत्रान महती चमू पश्य ॥3॥",
    meaningHindi:
      "हे आचार्य! आपके बुद्धिमान शिष्य द्रुपदपुत्र ने व्यूहरचना की पांडुपुत्रों की इस महती सेना को देखिए।",
  },
];

for (const s of shlokas1) {
  await db.insert(shlokas).values({
    chapterId: ch1Id,
    shlokaNumber: s.shlokaNumber,
    verseNumber: s.verseNumber,
    sanskrit: s.sanskrit,
    banjara: s.translationBanjara,
    hindi: s.meaningHindi,
    meaning: s.meaningHindi,
    speaker: "धृतराष्ट्र",
    sceneStatus: "not-started" as const,
  });
}
console.log(`Seeded ${shlokas1.length} shlokas for chapter 1.`);
process.exit(0);
